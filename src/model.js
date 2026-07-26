/* ============================================================
   AI Bubble Simulator — model engine
   Pure functions: DATA + slider params in, yearly rows + flows out.
   All values in $B. Deliberately a toy — but an honest one:
   every equation is documented in the methodology section.
   ============================================================ */

window.Model = (function () {

  // ---------- formatting ----------
  function fmtB(v) {
    const sign = v < 0 ? "−" : "";
    const a = Math.abs(v);
    if (a >= 995) return sign + "$" + (a / 1000).toFixed(2) + "T";
    if (a >= 99.5) return sign + "$" + Math.round(a) + "B";
    if (a >= 10) return sign + "$" + a.toFixed(0) + "B";
    if (a >= 1) return sign + "$" + a.toFixed(1) + "B";
    return sign + "$" + a.toFixed(1) + "B";
  }
  function fmtSigned(v) { return (v >= 0 ? "+" : "−") + fmtB(Math.abs(v)).slice(0); }
  function fmtPct(v) { return (v >= 0 ? "" : "−") + Math.abs(v).toFixed(0) + "%"; }
  function fmtGw(v) { return v.toFixed(v >= 20 ? 0 : 1) + " GW"; }

  // ---------- growth path helper ----------
  // start value at y0, growth g% in y0+1, growth fades by `fade` pp each
  // following year (floored at -60%).
  function path(years, y0, v0, g, fade, hist, histKey) {
    const out = {};
    let v = v0, growth = g;
    for (const y of years) {
      if (hist[y] && hist[y][histKey] != null) { out[y] = hist[y][histKey]; continue; }
      if (y === y0) { out[y] = v0; continue; }
      if (y > y0) {
        v = v * (1 + Math.max(growth, -60) / 100);
        out[y] = Math.max(v, 0);
        growth -= fade;
      }
    }
    return out;
  }

  // ---------- the projection ----------
  function project(data, p) {
    const [startY, endY] = data.meta.horizon;
    const y0 = data.meta.presentYear; // 2026
    const years = [];
    for (let y = startY; y <= endY; y++) years.push(y);
    const S = data.splits;
    const hist = data.history;

    // pre-history capex so depreciation of the 2023 fleet is counted
    const PRE = { 2023: { aiCapex: 150, endRev: 25 } };

    const capex = path(years, y0, p.capex26, p.capexGrowth, p.capexFade, hist, "aiCapex");
    const endRev = path(years, y0, p.endRev26, p.demandGrowth, p.demandFade, hist, "endRev");
    const vc = path(years, y0, p.vc26, p.vcGrowth, 0, hist, "vc");
    const debt = path(years, y0, p.debt26, p.debtGrowth, 0, hist, "debt");
    const vendorHist = { 2024: 10, 2025: 40 };
    const vendor = {};
    for (const y of years) vendor[y] = y < y0 ? (vendorHist[y] || 0) : p.vendor26;

    const capexAll = Object.assign({}, PRE_map(PRE, "aiCapex"), capex);

    const rows = {};
    let gwOnline = 3; // rough installed AI base entering 2024
    let cumSpend = 0, cumRev = 0, cumIn = 0, cumOut = 0;

    for (const y of years) {
      const r = { year: y };
      r.capex = capex[y];
      r.endRev = endRev[y];
      r.vc = vc[y];
      r.debt = debt[y];
      r.vendor = vendor[y];

      // --- capacity ---
      r.gwAdded = (hist[y] && hist[y].gwAdded != null) ? hist[y].gwAdded : r.capex / p.costPerGw;
      gwOnline += r.gwAdded;
      r.gwOnline = gwOnline;
      r.opex = gwOnline * p.opexPerGw;

      // --- depreciation & net PP&E over vintages (straight line, in-service same year) ---
      let dep = 0, ppe = 0;
      for (let v = 2023; v <= y; v++) {
        const cv = capexAll[v] != null ? capexAll[v] : 0;
        const age = y - v + 1; // years of depreciation taken through year y
        if (age <= p.deprYears) dep += cv / p.deprYears;
        ppe += cv * Math.max(0, 1 - age / p.deprYears);
      }
      r.depreciation = dep;
      r.netPPE = ppe;

      // --- what the buildout must earn ---
      // infra must cover depreciation + running cost + a return on the fleet;
      // end revenue must additionally cover the model/app layer above infra.
      r.requiredRev = (dep + r.opex + (p.hurdle / 100) * ppe) * S.nonInfraCostFactor;
      r.gap = r.requiredRev - r.endRev;

      // --- revenue split across layers ---
      r.labRev = r.endRev * S.endRevToLabs;
      r.cloudEndRev = r.endRev * S.endRevToClouds;
      r.startupRev = r.endRev * S.endRevToStartups;

      // --- funding split ---
      r.vcLabs = r.vc * S.vcToLabs;
      r.vcStartups = r.vc - r.vcLabs;

      // --- internal spending ---
      // Lab cost ratios glide from today's burn levels toward "mature"
      // levels by 2032 — the scale-economics bet the whole trade rests on.
      const t = Math.min(1, Math.max(0, (y - y0) / 6));
      const computeRatio = S.labComputeRatio + (S.matureLabCompute - S.labComputeRatio) * t;
      const otherRatio = S.labOtherRatio + (S.matureLabOther - S.labOtherRatio) * t;
      const startupOtherRatio = 0.80 + (0.50 - 0.80) * t;
      r.labComputeSpend = r.labRev * computeRatio;
      r.labOther = r.labRev * otherRatio;
      r.startupApiSpend = r.startupRev * S.startupApiShare + r.vcStartups * 0.05;
      r.startupCloudSpend = r.startupRev * 0.15 + r.vcStartups * 0.08;
      r.startupOther = r.startupRev * startupOtherRatio + r.vcStartups * 0.20;

      // --- compute layer ---
      r.computeRev = r.cloudEndRev + r.labComputeSpend + r.startupCloudSpend;
      r.neoRev = r.computeRev * S.neocloudShare;
      r.hyperRev = r.computeRev - r.neoRev;

      // --- capex by payer ---
      r.hyperCapex = r.capex * S.hyperscalerCapexShare;
      r.neoCapex = r.capex - r.hyperCapex;
      r.debtToNeo = Math.min(r.debt, r.neoCapex * 0.85);
      r.debtToHyper = r.debt - r.debtToNeo;
      r.neoEquity = Math.max(0, r.neoCapex - r.neoRev * 0.5 - r.debtToNeo);

      // --- hardware layer ---
      r.hardwareSpend = r.capex * (p.gpuShare / 100);
      r.dcBuildSpend = r.capex - r.hardwareSpend;
      r.chipRev = r.hardwareSpend;
      r.chipProfit = r.chipRev * (p.chipMargin / 100);
      r.fabsRev = r.chipRev * S.fabsShare;
      r.chipOpexShare = Math.max(0, 1 - p.chipMargin / 100 - S.fabsShare);
      r.fabProfit = r.fabsRev * 0.35;

      // --- profits & returns to investors ---
      r.cloudProfit = r.computeRev * (p.cloudMargin / 100);
      r.labProfit = r.labRev - r.labComputeSpend - r.labOther;
      r.startupProfit = r.startupRev - r.startupApiSpend - r.startupCloudSpend - r.startupOther;
      const profitPool = r.chipProfit + r.fabProfit + r.cloudProfit
        + Math.max(0, r.labProfit) + Math.max(0, r.startupProfit);
      r.profitPool = profitPool;
      r.returns = (hist[y] && hist[y].returns != null)
        ? hist[y].returns
        : profitPool * (p.payout / 100);

      // --- big-tech treasury subsidy: capex not covered by AI cash flow or debt ---
      const hyperAiOpCash = r.hyperRev * 0.55; // EBITDA-ish cash from AI ops
      r.treasury = Math.max(0, r.hyperCapex - hyperAiOpCash - r.debtToHyper);

      // --- burn & funding crunch ---
      r.labBurn = Math.max(0, -(r.labProfit));
      r.startupBurn = Math.max(0, -(r.startupProfit));
      r.fundingNeed = r.labBurn + r.startupBurn;
      r.fundingAvail = r.vc + r.vendor;
      r.crunch = y >= y0 && r.fundingNeed > r.fundingAvail;

      // --- system boundary totals ---
      r.moneyIn = r.endRev + r.vc + r.debt + r.treasury + r.neoEquity;
      r.leak = r.dcBuildSpend + r.opex * 0.9 + r.fabsRev * 0.5
        + r.chipRev * r.chipOpexShare
        + r.labOther * 0.6 + r.startupOther * 0.6;
      r.moneyOut = r.returns + r.leak;

      cumSpend += r.capex + r.opex;
      cumRev += r.endRev;
      cumIn += r.moneyIn;
      cumOut += r.returns;
      r.cumSpend = cumSpend;
      r.cumRev = cumRev;
      r.cumGap = cumSpend - cumRev;
      r.bubbleIndex = cumSpend / Math.max(1, cumRev);

      rows[y] = r;
    }

    // ---------- verdict ----------
    // Two ways the music stops: labs' burn outruns fresh money (crunch),
    // or the buildout goes into hard reverse while the fleet still isn't
    // paying for itself (bust — capex down ≥25% YoY with the gap open).
    let justifiedYear = null, labCrunchYear = null, bustYear = null, peakCapexYear = years[0];
    for (const y of years) {
      if (justifiedYear == null && rows[y].endRev >= rows[y].requiredRev) justifiedYear = y;
      if (labCrunchYear == null && rows[y].crunch) labCrunchYear = y;
      if (bustYear == null && y > y0 && rows[y - 1].capex > 0
        && rows[y].capex <= rows[y - 1].capex * 0.75 + 1e-9 && rows[y].gap > 0) bustYear = y;
      if (rows[y].capex > rows[peakCapexYear].capex) peakCapexYear = y;
    }
    const popCandidates = [labCrunchYear, bustYear].filter(v => v != null);
    let popYear = popCandidates.length ? Math.min.apply(null, popCandidates) : null;
    // whichever comes first defines the story: break-even before the pop makes
    // the slowdown digestion; a pop before break-even voids the break-even
    if (popYear != null && justifiedYear != null) {
      if (justifiedYear <= popYear) popYear = null;
      else justifiedYear = null;
    }
    const last = rows[endY];
    const verdict = {
      justifiedYear,
      crunchYear: popYear,
      isBust: popYear != null && bustYear === popYear,
      peakCapexYear, last, years,
    };

    return { years, rows, verdict };
  }

  function PRE_map(pre, key) {
    const o = {};
    for (const y in pre) o[y] = pre[y][key];
    return o;
  }

  // ---------- sankey flows for one year ----------
  function flowsFor(data, p, r) {
    const S = data.splits;
    const C = {
      demand: "var(--c-demand)", funding: "var(--c-debt)", labs: "var(--c-vc)",
      compute: "var(--c-compute)", hw: "var(--c-capex)", ret: "var(--c-returns)",
      leak: "var(--c-leak)", circ: "var(--c-circular)",
    };
    const nodes = [
      { id: "ent", label: "Enterprise customers", col: 0, color: C.demand, note: "Businesses paying for AI seats, APIs and AI cloud" },
      { id: "con", label: "Consumers", col: 0, color: C.demand, note: "Subscriptions like ChatGPT Plus and AI apps" },
      { id: "vcf", label: "Venture capital", col: 0, color: C.labs, note: "Equity into labs and startups — money in, hoping for money out later" },
      { id: "dbt", label: "Debt markets", col: 0, color: C.funding, note: "Bonds and GPU-backed loans financing datacenters" },
      { id: "tre", label: "Big-tech treasuries", col: 0, color: C.compute, note: "Capex not covered by AI cash flow or debt — subsidized by search/ads/Windows profits" },
      { id: "lab", label: "AI labs", col: 1, color: C.labs, note: "OpenAI, Anthropic, xAI, Mistral…" },
      { id: "stp", label: "AI startups", col: 1, color: C.labs, note: "The application layer (virtual group)" },
      { id: "hyp", label: "Hyperscalers", col: 1, color: C.compute, note: "Microsoft, Google, Amazon, Meta, Oracle" },
      { id: "neo", label: "Neoclouds", col: 1, color: C.compute, note: "CoreWeave, Nebius, Lambda, Crusoe…" },
      { id: "chp", label: "NVIDIA & chip makers", col: 2, color: C.hw, note: "Accelerators, networking, AI servers" },
      { id: "dcb", label: "DC construction & power", col: 2, color: C.leak, note: "Shells, cooling, turbines, grid hookups" },
      { id: "fab", label: "TSMC, memory & parts", col: 3, color: C.hw, note: "Wafers, HBM, components" },
      { id: "inv", label: "Investors (buybacks + divs)", col: 3, color: C.ret, note: "Money leaving the ecosystem back to shareholders" },
      { id: "eco", label: "Wider economy", col: 3, color: C.leak, note: "Construction wages, electricity, salaries — real economy leakage" },
      { id: "rtn", label: "Retained & war chests", col: 3, color: C.leak, note: "Cash kept inside companies for the next round" },
    ];

    const L = [];
    const add = (a, b, v, note, color, circular) => {
      if (v > 0.5) L.push({ source: a, target: b, value: v, note, color, circular: !!circular });
    };

    // demand → operators
    add("ent", "lab", r.labRev * 0.55, "Enterprise API & seat revenue billed by labs");
    add("con", "lab", r.labRev * 0.45, "Consumer subscriptions billed by labs");
    add("ent", "hyp", r.cloudEndRev * (1 - S.neocloudShare), "AI cloud consumed by outside customers");
    add("ent", "neo", r.cloudEndRev * S.neocloudShare, "AI cloud consumed by outside customers, served from neoclouds");
    add("ent", "stp", r.startupRev * 0.7, "Enterprise spend on AI applications");
    add("con", "stp", r.startupRev * 0.3, "Consumer spend on AI applications");

    // funding → operators
    add("vcf", "lab", r.vcLabs, "VC/PE equity into frontier labs");
    add("vcf", "stp", r.vcStartups, "VC equity into the application layer");
    add("vcf", "neo", r.neoEquity, "Equity raised by neoclouds (IPO/secondary)");
    add("dbt", "neo", r.debtToNeo, "GPU-backed loans and bonds");
    add("dbt", "hyp", r.debtToHyper, "Investment-grade bonds funding capex");
    add("tre", "hyp", r.treasury, "Capex subsidized from non-AI profits");

    // operators ↔ operators
    add("stp", "lab", r.startupApiSpend, "Startups' model API bills");
    add("lab", "hyp", r.labComputeSpend * (1 - S.neocloudShare), "Labs renting hyperscaler compute");
    add("lab", "neo", r.labComputeSpend * S.neocloudShare, "Labs renting neocloud compute");
    add("stp", "hyp", r.startupCloudSpend * (1 - S.neocloudShare), "Startups' hosting bills");
    add("stp", "neo", r.startupCloudSpend * S.neocloudShare, "Startups on neoclouds");

    // capex → hardware & construction
    const gpuShare = p.gpuShare / 100;
    add("hyp", "chp", r.hyperCapex * gpuShare, "Hyperscaler chip & server orders");
    add("hyp", "dcb", r.hyperCapex * (1 - gpuShare), "Hyperscaler datacenter construction");
    add("neo", "chp", r.neoCapex * gpuShare, "Neocloud GPU purchases");
    add("neo", "dcb", r.neoCapex * (1 - gpuShare), "Neocloud datacenter construction");

    // hardware layer outflows
    add("chp", "fab", r.fabsRev, "Wafers, HBM and components (COGS)");
    const chipRet = Math.min(r.returns * 0.5, r.chipProfit * 0.9);
    add("chp", "inv", chipRet, "Chip-maker buybacks and dividends");
    const vendorChips = r.vendor * 0.4, vendorHyper = r.vendor * 0.6;
    add("chp", "lab", vendorChips, "Circular: NVIDIA & co investing in the labs that buy their chips", C.circ, true);
    const chipOpexEco = r.chipRev * (r.chipOpexShare != null ? r.chipOpexShare : 0.15);
    const chipKeep = Math.max(0, r.chipRev - r.fabsRev - chipRet - vendorChips - chipOpexEco);
    add("chp", "rtn", chipKeep, "Chip-maker retained cash");
    add("chp", "eco", chipOpexEco, "Chip-maker opex — salaries, R&D outside the loop");

    // compute layer outflows
    const hyperRet = Math.max(0, r.returns - chipRet);
    add("hyp", "inv", hyperRet, "Hyperscaler buybacks and dividends (AI-attributable share)");
    add("hyp", "lab", vendorHyper, "Circular: hyperscalers investing in the labs that rent their clouds", C.circ, true);
    add("hyp", "eco", r.opex * 0.75, "Power and operations");
    add("neo", "eco", r.opex * 0.15, "Neocloud power and operations");
    const hypIn = r.cloudEndRev * (1 - S.neocloudShare) + r.labComputeSpend * (1 - S.neocloudShare) + r.startupCloudSpend * (1 - S.neocloudShare) + r.debtToHyper + r.treasury;
    const hypOut = r.hyperCapex + hyperRet + vendorHyper + r.opex * 0.75;
    add("hyp", "rtn", Math.max(0, hypIn - hypOut), "Hyperscaler retained cash");

    // labs & startups outflows
    add("lab", "eco", r.labOther, "Lab salaries and other costs");
    const labIn = r.labRev + r.vcLabs + r.vendor + r.startupApiSpend;
    add("lab", "rtn", Math.max(0, labIn - r.labComputeSpend - r.labOther), "Lab war chests (unspent raises)");
    add("stp", "eco", r.startupOther, "Startup salaries and other costs");
    const stpIn = r.startupRev + r.vcStartups;
    add("stp", "rtn", Math.max(0, stpIn - r.startupApiSpend - r.startupCloudSpend - r.startupOther), "Startup runway kept in the bank");

    // construction is pure leakage
    add("dcb", "eco", r.dcBuildSpend, "Construction, cooling, turbines, grid");

    return { nodes, links: L };
  }

  const api = { project, flowsFor, fmtB, fmtSigned, fmtPct, fmtGw };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  return api;
})();
