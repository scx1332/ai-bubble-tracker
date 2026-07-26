/* ============================================================
   AI Bubble Simulator — UI wiring
   Sliders, bloc switch, scenarios, gauge, verdict, tiles, charts,
   company tables, methodology. Everything re-computes live.
   ============================================================ */

(function () {
  const D = window.DATA, Mo = window.Model;
  const $ = id => document.getElementById(id);
  const fmtB = Mo.fmtB;
  const BLOC_IDS = Object.keys(D.blocs);

  // params are per bloc; both blocs are always projected so the
  // comparison chart can show them side by side
  let params = {};
  BLOC_IDS.forEach(b => { params[b] = Object.assign({}, D.blocs[b].defaults); });
  let activeBloc = "us";
  let selectedYear = D.meta.presentYear;
  let proj = {};
  const widgets = {}; // id -> {range, num}

  function projectAll() {
    BLOC_IDS.forEach(b => { proj[b] = Mo.project(D, params[b], b); });
  }
  projectAll();
  const P = () => proj[activeBloc];
  const PA = () => params[activeBloc];

  // ---------- theme ----------
  // localStorage can throw in sandboxed iframes — never let that kill the app
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* no-op */ } },
  };
  (function themeInit() {
    const stored = store.get("aibubble-theme");
    if (stored) document.documentElement.dataset.theme = stored;
    $("themeToggle").addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      store.set("aibubble-theme", next);
    });
  })();

  // ---------- bloc switch ----------
  function buildBlocToggle() {
    const seg = $("blocs");
    seg.innerHTML = "";
    BLOC_IDS.forEach(b => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = D.blocs[b].label;
      btn.dataset.bloc = b;
      btn.setAttribute("aria-pressed", b === activeBloc ? "true" : "false");
      btn.addEventListener("click", () => setBloc(b));
      seg.appendChild(btn);
    });
  }
  function setBloc(b) {
    if (b === activeBloc) return;
    activeBloc = b;
    $("blocs").querySelectorAll("button").forEach(x =>
      x.setAttribute("aria-pressed", x.dataset.bloc === b ? "true" : "false"));
    $("controlsBloc").textContent = D.blocs[b].label;
    buildControls();
    renderVerdict();
    renderYearViews();
    updateCharts();
  }

  // ---------- sliders ----------
  function buildControls() {
    const root = $("controlGroups");
    root.innerHTML = "";
    for (const k in widgets) delete widgets[k];
    const p = PA();
    D.blocs[activeBloc].sliders.forEach(g => {
      const div = document.createElement("div");
      div.className = "ctl-group";
      div.innerHTML = `<div class="eyebrow"><span class="swatch" style="background:${g.color}"></span>${g.group}</div>`;
      g.items.forEach(it => {
        const wrap = document.createElement("div");
        wrap.className = "ctl";
        wrap.innerHTML = `
          <div class="ctl-label-row">
            <label for="sl-${it.id}">${it.label}</label>
            <input class="ctl-val" id="num-${it.id}" type="number" min="${it.min}" max="${it.max}" step="${it.step}" value="${p[it.id]}" aria-label="${it.label} value in ${it.unit}">
          </div>
          <input id="sl-${it.id}" type="range" min="${it.min}" max="${it.max}" step="${it.step}" value="${p[it.id]}">
          ${it.hint ? `<div class="ctl-hint">${it.hint} · ${it.unit}</div>` : `<div class="ctl-hint">${it.unit}</div>`}`;
        div.appendChild(wrap);
        const range = wrap.querySelector(`#sl-${it.id}`);
        const num = wrap.querySelector(`#num-${it.id}`);
        widgets[it.id] = { range, num };
        const onChange = v => {
          const val = Math.max(it.min, Math.min(it.max, parseFloat(v)));
          if (isNaN(val)) { num.value = PA()[it.id]; return; }
          PA()[it.id] = val;
          range.value = val; num.value = val;
          clearScenario();
          scheduleUpdate();
        };
        range.addEventListener("input", e => onChange(e.target.value));
        num.addEventListener("change", e => onChange(e.target.value));
      });
      root.appendChild(div);
    });
  }
  function syncWidgets() {
    const p = PA();
    for (const id in widgets) {
      if (p[id] == null) continue;
      widgets[id].range.value = p[id];
      widgets[id].num.value = p[id];
    }
  }

  // ---------- scenarios ----------
  function buildScenarios() {
    const seg = $("scenarios");
    seg.innerHTML = "";
    Object.entries(D.scenarios).forEach(([key, sc]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = sc.label;
      b.dataset.key = key;
      b.setAttribute("aria-pressed", key === "base" ? "true" : "false");
      b.addEventListener("click", () => {
        BLOC_IDS.forEach(id => {
          params[id] = Object.assign({}, D.blocs[id].defaults, (sc.overrides && sc.overrides[id]) || {});
        });
        seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        syncWidgets();
        scheduleUpdate();
      });
      seg.appendChild(b);
    });
    $("resetBtn").addEventListener("click", () => {
      BLOC_IDS.forEach(id => { params[id] = Object.assign({}, D.blocs[id].defaults); });
      $("scenarios").querySelectorAll("button").forEach(x =>
        x.setAttribute("aria-pressed", x.dataset.key === "base" ? "true" : "false"));
      syncWidgets();
      scheduleUpdate();
    });
  }
  function clearScenario() {
    $("scenarios").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false"));
  }

  // ---------- year scrubber ----------
  (function scrubInit() {
    const [y0, y1] = D.meta.horizon;
    const s = $("yearScrub");
    s.min = y0; s.max = y1; s.value = selectedYear;
    $("scrubMin").textContent = y0; $("scrubMax").textContent = y1;
    s.addEventListener("input", () => {
      selectedYear = +s.value;
      renderYearViews();
    });
  })();
  function setYear(y) {
    selectedYear = y;
    $("yearScrub").value = y;
    renderYearViews();
  }

  // ---------- bubble gauge ----------
  function renderBubble() {
    const svg = $("bubbleGauge");
    const r = P().rows[selectedYear];
    const v = P().verdict;
    const idx = r.bubbleIndex;
    const popped = v.crunchYear && selectedYear >= v.crunchYear;
    const rad = Math.max(26, Math.min(104, 26 + idx * 13));
    svg.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const uid = "bg-" + activeBloc;
    const mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
    if (!popped) {
      const defs = document.createElementNS(NS, "defs");
      defs.innerHTML = `
        <radialGradient id="${uid}" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stop-color="var(--c-demand)" stop-opacity="0.05"/>
          <stop offset="62%" stop-color="var(--c-vc)" stop-opacity="0.12"/>
          <stop offset="86%" stop-color="var(--c-compute)" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="var(--c-demand)" stop-opacity="0.55"/>
        </radialGradient>`;
      svg.appendChild(defs);
      mk("circle", { cx: 120, cy: 120, r: rad, fill: `url(#${uid})`, stroke: v.crunchYear ? "var(--status-critical)" : "var(--axis)", "stroke-width": 1.5 });
      mk("ellipse", { cx: 120 - rad * 0.35, cy: 120 - rad * 0.45, rx: rad * 0.28, ry: rad * 0.16, fill: "var(--surface)", opacity: 0.75, transform: `rotate(-28 ${120 - rad * 0.35} ${120 - rad * 0.45})` });
    } else {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r1 = 22, r2 = 42 + (i % 3) * 12;
        mk("line", {
          x1: 120 + Math.cos(a) * r1, y1: 120 + Math.sin(a) * r1,
          x2: 120 + Math.cos(a) * r2, y2: 120 + Math.sin(a) * r2,
          stroke: "var(--status-critical)", "stroke-width": 2.5, "stroke-linecap": "round",
        });
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        mk("circle", { cx: 120 + Math.cos(a) * 62, cy: 120 + Math.sin(a) * 62, r: 3.5 + (i % 2) * 2, fill: "var(--c-demand)", opacity: 0.6 });
      }
    }
    $("bubbleCaption").innerHTML = popped
      ? `correction ~${v.crunchYear}`
      : `spend-to-revenue ${idx.toFixed(1)}×`;
  }

  // ---------- verdict ----------
  function renderVerdict() {
    const v = P().verdict;
    const [y0, y1] = D.meta.horizon;
    const rows = P().rows;
    const last = rows[y1];
    const cumCapex = P().years.reduce((s, y) => s + rows[y].capex, 0);
    const blocName = D.blocs[activeBloc].long;
    let head, det;
    if (v.justifiedYear) {
      head = `Revenue covers the buildout from <span class="ok-green">${v.justifiedYear}</span>.`;
    } else if (v.crunchYear) {
      head = v.isBust
        ? `The buildout reverses in <span class="pop-red">${v.crunchYear}</span>, with the gap still open.`
        : `Funding runs short in <span class="pop-red">${v.crunchYear}</span>: burn outruns the money coming in.`;
    } else {
      head = `The gap never closes by ${y1} — and nothing forces a reckoning either.`;
    }
    det = `Across ${y0}–${y1} in ${blocName}: ${fmtB(cumCapex)} of AI capex against ${fmtB(last.cumRev)} of end-customer AI revenue. `;
    det += `By ${y1} the installed fleet needs ${fmtB(last.requiredRev)} a year to pay for itself — depreciation, running costs, and a ${PA().hurdle}% return on the undepreciated base — against ${fmtB(last.endRev)} of projected revenue, `;
    det += last.gap > 0 ? `a shortfall of ${fmtB(last.gap)}. ` : `a surplus of ${fmtB(-last.gap)}. `;
    if (v.crunchYear) {
      const c = rows[v.crunchYear];
      if (v.isBust) {
        const pv = rows[v.crunchYear - 1];
        det += `In ${v.crunchYear} capex falls ${Math.round((1 - c.capex / pv.capex) * 100)}% in a single year while the fleet is still ${fmtB(c.gap)} short of covering itself. A reversal that fast is written off, not digested: idle capacity, impairments, and layoffs in construction, power and hardware long before it reaches the model labs.`;
      } else {
        det += `In ${v.crunchYear}, labs and startups need ${fmtB(c.fundingNeed)} to cover their losses and only ${fmtB(c.fundingAvail)} of new investment is available to them.`;
      }
    } else if (!v.justifiedYear) {
      det += `Fresh investment (${fmtB(last.vc + last.vendor)} a year by ${y1}) keeps covering the losses, so the imbalance persists without resolving.`;
    } else {
      const j = rows[v.justifiedYear];
      det += `Break-even arrives with ${fmtB(j.endRev)} of revenue against ${fmtB(j.requiredRev)} required.`;
    }
    if (v.peakCapexYear > y0 && v.peakCapexYear < y1 && rows[y1].capex < rows[v.peakCapexYear].capex * 0.95) {
      det += ` Capex peaks in ${v.peakCapexYear} at ${fmtB(rows[v.peakCapexYear].capex)} a year, then declines.`;
    }
    $("verdictHeadline").innerHTML = head;
    $("verdictDetail").innerHTML = det;
  }

  // ---------- tiles ----------
  function renderTiles() {
    const r = P().rows[selectedYear];
    const prev = P().rows[selectedYear - 1];
    const delta = (cur, pre, upBad, fmt) => {
      if (pre == null) return "";
      const df = cur - pre;
      if (Math.abs(df) < 0.05) return `<div class="t-delta">— vs ${selectedYear - 1}</div>`;
      const cls = df > 0 ? (upBad ? "up-bad" : "up-good") : (upBad ? "up-good" : "up-bad");
      return `<div class="t-delta ${cls}">${df > 0 ? "▲" : "▼"} ${fmt(Math.abs(df))} vs ${selectedYear - 1}</div>`;
    };
    const tiles = [
      { label: "Money in", sw: "var(--c-demand)", val: fmtB(r.moneyIn), d: delta(r.moneyIn, prev && prev.moneyIn, false, fmtB), title: "End revenue + investment + debt + treasury subsidy" },
      { label: "of which real revenue", sw: "var(--c-demand)", val: fmtB(r.endRev), d: delta(r.endRev, prev && prev.endRev, false, fmtB), title: "Paid by actual customers" },
      { label: "Back to investors", sw: "var(--c-returns)", val: fmtB(r.returns), d: delta(r.returns, prev && prev.returns, false, fmtB), title: "Buybacks + dividends, AI-attributable" },
      { label: "Required revenue", sw: "var(--c-capex)", val: fmtB(r.requiredRev), d: delta(r.requiredRev, prev && prev.requiredRev, true, fmtB), title: "What the fleet must earn per year" },
      { label: "Cumulative gap", sw: "var(--c-capex)", val: fmtB(r.cumGap), d: delta(r.cumGap, prev && prev.cumGap, true, fmtB), title: "Buildout spend minus revenue, since 2024" },
      { label: "AI capacity online", sw: "var(--c-compute)", val: Mo.fmtGw(r.gwOnline), d: delta(r.gwOnline, prev && prev.gwOnline, false, v => v.toFixed(1) + " GW"), title: "Cumulative datacenter capacity" },
    ];
    $("tiles").innerHTML = tiles.map(x => `
      <div class="tile" title="${x.title}">
        <div class="t-label"><span class="swatch" style="background:${x.sw}"></span>${x.label} · ${selectedYear}</div>
        <div class="t-value">${x.val}</div>
        ${x.d}
      </div>`).join("");
  }

  // ---------- sankey ----------
  function renderSankey() {
    const r = P().rows[selectedYear];
    const flows = Mo.flowsFor(D, PA(), r, activeBloc);
    Sankey.render($("sankey"), $("sankeyTip"), flows, fmtB);
    Sankey.tableTwin($("sankeyTable"), flows, fmtB);
    $("yearOut").textContent = selectedYear;
    const keys = [
      ["var(--c-demand)", "customer demand"],
      ["var(--c-vc)", activeBloc === "cn" ? "state & VC funding" : "VC & labs"],
      ["var(--c-debt)", "debt"],
      ["var(--c-compute)", "platforms & clouds"],
      ["var(--c-capex)", "hardware"],
      ["var(--c-returns)", "investor returns"],
      ["var(--c-leak)", "leakage to economy"],
      ["var(--c-circular)", "circular financing ↺"],
    ];
    $("flowLegend").innerHTML = keys.map(([c, l]) =>
      `<span class="key"><span class="swatch" style="background:${c}"></span>${l}</span>`).join("");
  }

  // ---------- charts ----------
  let gapChart, capexChart, inoutChart, capChart, blocChart;
  function chartData(blocId) {
    const pr = proj[blocId || activeBloc];
    const ys = pr.years;
    const g = k => ys.map(y => pr.rows[y][k]);
    return {
      years: ys,
      required: g("requiredRev"), endRev: g("endRev"),
      capex: g("capex"), depreciation: g("depreciation"),
      vc: ys.map(y => pr.rows[y].vc + pr.rows[y].neoEquity),
      debt: g("debt"), treasury: g("treasury"),
      returns: g("returns"), leak: g("leak"),
      gwAdded: g("gwAdded"), gwOnline: g("gwOnline"),
    };
  }
  const gapSeries = c => [
    { name: "Required revenue", short: "Required", color: "var(--c-capex)", values: c.required },
    { name: "AI end-revenue", short: "Actual", color: "var(--c-demand)", values: c.endRev },
  ];
  const capexSeries = c => [
    { name: "AI capex", color: "var(--c-capex)", values: c.capex },
    { name: "Depreciation", color: "var(--c-compute)", values: c.depreciation, type: "line" },
  ];
  const inoutUp = c => [
    { name: "Customer revenue", color: "var(--c-demand)", values: c.endRev },
    { name: "Investment & equity", color: "var(--c-vc)", values: c.vc },
    { name: "Debt", color: "var(--c-debt)", values: c.debt },
    { name: "Treasury subsidy", color: "var(--c-compute)", values: c.treasury },
  ];
  const inoutDown = c => [
    { name: "To investors", color: "var(--c-returns)", values: c.returns },
    { name: "Leakage", color: "var(--c-leak)", values: c.leak },
  ];
  const capSeries = c => [
    { name: "GW added", color: "var(--c-capex)", values: c.gwAdded },
    { name: "GW online", color: "var(--c-compute)", values: c.gwOnline, type: "line" },
  ];
  function blocSeries() {
    return BLOC_IDS.map((b, i) => ({
      name: D.blocs[b].label,
      color: i === 0 ? "var(--c-demand)" : "var(--c-circular)",
      values: proj[b].years.map(y => proj[b].rows[y].capex),
    }));
  }
  function capexSub() { return "Every year of capex becomes a depreciation bill for the next " + PA().deprYears + " years."; }
  function capSub() { return "At $" + PA().costPerGw + "B per GW. McKinsey's 2030 base case is ~156 GW of AI capacity worldwide."; }
  function blocSub() {
    const y = D.meta.presentYear;
    const parts = BLOC_IDS.map(b => `${D.blocs[b].label} ${fmtB(proj[b].rows[y].capex)} capex on ${fmtB(proj[b].rows[y].endRev)} of revenue`);
    return `In ${y}: ` + parts.join("; ") + ". Export controls keep these two buildouts on separate silicon.";
  }

  function buildCharts() {
    const c = chartData();
    const click = { onYearClick: setYear };
    gapChart = Charts.lines($("gapCard"), Object.assign({
      eyebrow: "the gap", title: "What the fleet must earn vs what customers pay",
      sub: "Required = (depreciation + opex + hurdle return on the fleet) × 1.2 for the layers above the metal. Click a year to pin the flow map.",
      years: c.years, unit: "$B", wash: [0, 1], series: gapSeries(c),
    }, click));
    capexChart = Charts.barsLine($("capexCard"), Object.assign({
      eyebrow: "the buildout", title: "AI capex and the depreciation wall behind it",
      sub: capexSub(), years: c.years, unit: "$B", series: capexSeries(c),
    }, click));
    inoutChart = Charts.diverging($("inoutCard"), Object.assign({
      eyebrow: "system boundary", title: "Money entering vs leaving the ecosystem",
      sub: "Up: where the cash comes from. Down: returns to shareholders, and money spent into the wider economy.",
      years: c.years, unit: "$B", up: inoutUp(c), down: inoutDown(c),
    }, click));
    capChart = Charts.barsLine($("capacityCard"), Object.assign({
      eyebrow: "physical buildout", title: "AI datacenter capacity, gigawatts",
      sub: capSub(), years: c.years, unit: "GW", series: capSeries(c),
    }, click));
    blocChart = Charts.lines($("blocCard"), Object.assign({
      eyebrow: "the two blocs", title: "AI capex, US-led vs China",
      sub: blocSub(), years: c.years, unit: "$B", series: blocSeries(),
    }, click));
  }
  function updateCharts() {
    const c = chartData();
    gapChart.update({ years: c.years, series: gapSeries(c) });
    capexChart.update({ years: c.years, sub: capexSub(), series: capexSeries(c) });
    inoutChart.update({ years: c.years, up: inoutUp(c), down: inoutDown(c) });
    capChart.update({ years: c.years, sub: capSub(), series: capSeries(c) });
    blocChart.update({ years: c.years, sub: blocSub(), series: blocSeries() });
  }

  // ---------- companies ----------
  function renderCompanies() {
    const root = $("companiesRoot");
    root.innerHTML = "";
    BLOC_IDS.forEach(blocId => {
      const gs = D.groups.filter(g => g.bloc === blocId);
      if (!gs.length) return;
      const head = document.createElement("div");
      head.className = "bloc-head";
      head.innerHTML = `<h3>${D.blocs[blocId].label}</h3><span>${D.blocs[blocId].castNote || ""}</span>`;
      root.appendChild(head);
      gs.forEach(g => root.appendChild(companyGroup(g)));
    });
  }
  function companyGroup(g) {
    const div = document.createElement("div");
    div.className = "company-group";
    const money = v => v == null ? "—" : (v < 0 ? "−" + fmtB(-v) : fmtB(v));
    let head = `<tr><th>Company</th><th style="text-align:left">Period</th>`;
    g.cols.forEach(([, label]) => head += `<th>${label}</th>`);
    head += `<th style="text-align:left">Notes</th></tr>`;
    let rows = "";
    g.companies.forEach(cp => {
      const mark = window.logoHTML(cp.logo, cp.name);
      rows += `<tr><td><span class="co-cell">${mark}<span class="co-name">${cp.name}</span></span></td>` +
        `<td style="text-align:left"><span class="src-tag">${cp.period}</span></td>`;
      g.cols.forEach(([key]) => { rows += `<td>${money(cp[key])}</td>`; });
      rows += `<td style="text-align:left"><span class="src-tag">${cp.tag || ""}</span></td></tr>`;
    });
    div.innerHTML = `
      <div class="cg-head">
        <h3><span class="swatch" style="background:${D.GROUP_COLORS[g.id]}"></span>${g.name}</h3>
        <span class="cg-note">${g.note}</span>
      </div>
      <div class="table-scroll"><table class="data"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
    return div;
  }

  // ---------- methodology ----------
  function renderMethod() {
    const A = D.aggregates, S = D.blocs.us.splits, C = D.blocs.cn;
    const pct = v => Math.round(v * 100) + "%";
    $("methodRoot").innerHTML = `
    <div class="method-cols">
      <div class="method-block">
        <h3>The system boundary</h3>
        <p>The "ecosystem" is everyone who earns AI money: labs, startups, cloud platforms' AI operations, specialist clouds, chip makers, fabs.
        <strong>Money in</strong> = end-customer revenue + investment + debt + the subsidy platforms pay out of non-AI profits.
        <strong>Money out</strong> = returns to shareholders, plus spending into the wider economy — construction wages, electricity, salaries, components.
        Circular financing — chip makers and clouds investing in their own customers — stays inside the loop, which is why it is drawn as a loop.</p>
      </div>
      <div class="method-block">
        <h3>Two blocs, two loops</h3>
        <p>Export controls have split the buildout in two, so each bloc is modelled separately rather than averaged together. They meet in one place here: the share of accelerator spending that leaves a bloc to buy foreign parts.</p>
        <p>Three differences do most of the work. <strong>The money is a different kind of money</strong> — government guidance funds supply roughly 55% of all limited-partner capital in Chinese venture and 60–70% of deep-tech investment, so China's funding line is counter-cyclical and does not price-discover; it held flat through the years private Chinese venture fell to a decade low.
        <strong>The revenue is priced differently</strong> — Chinese models serve a majority of the tokens US firms consume, at a tenth to a thirtieth of US prices, so China wins volume share while its revenue share stays in single digits.
        <strong>And the ceiling is memory, not logic</strong> — domestic advanced-node wafer capacity comfortably exceeds what the Ascend line needs, but domestic HBM covers only about half of it, and China's leading DRAM maker has publicly chosen high-margin commodity memory over it.</p>
      </div>
      <div class="method-block">
        <h3>The gap equation</h3>
        <p>Each year the installed fleet must earn:</p>
        <p><code>required = (depreciation + opex + hurdle × net fleet) × ${S.nonInfraCostFactor}</code></p>
        <p>Straight-line depreciation over your chosen life, opex per GW-year, a required return on undepreciated capex, and ×${S.nonInfraCostFactor} because end revenue must also feed the model and application layers above the metal.
        For calibration: Kupperman's break-even estimate on 2025 capex alone is about ${fmtB(A.kuppermanBreakeven)} a year; Bain puts the 2030 requirement near ${fmtB(A.bainNeed2030)} a year with a ${fmtB(A.bainShortfall)} shortfall; David Cahn's 2026 version of the question is ${fmtB(A.cahnQuestion)}. This model reproduces those magnitudes at default settings.</p>
      </div>
      <div class="method-block">
        <h3>Split assumptions (US-led bloc)</h3>
        <ul>
          <li>End revenue: ${pct(S.endRevToLabs)} labs, ${pct(S.endRevToClouds)} AI cloud, ${pct(S.endRevToStartups)} application startups</li>
          <li>${pct(S.vcToLabs)} of venture money goes to labs (OpenAI and Anthropic alone took 43% of <em>all</em> world VC in H1 2026)</li>
          <li>Labs spend $${S.labComputeRatio.toFixed(2)} on compute per $1 of revenue in 2026, gliding to $${S.matureLabCompute.toFixed(2)} by 2032 — the scale-economics bet the whole trade rests on</li>
          <li>Specialist clouds carry ${pct(S.neocloudShare)} of AI compute; the big platforms pay ${pct(S.hyperscalerCapexShare)} of capex</li>
          <li>${pct(S.fabsShare)} of chip revenue flows through to wafers, memory and components</li>
        </ul>
        ${C ? `<p>China's bloc uses its own splits: ${pct(C.splits.endRevToClouds)} of end revenue billed as cloud, ${pct(C.splits.hyperscalerCapexShare)} of capex from the platforms with the rest from state and telco projects, and ${pct(C.splits.fabsShare)} passed through to domestic fabs and memory.</p>` : ""}
      </div>
      <div class="method-block">
        <h3>What this model leaves out</h3>
        <ul>
          <li>Taxes, currency, working capital, and the gap between cash and accrual accounting</li>
          <li>Model capability itself: a real jump — or a wall — moves demand in ways no slider here captures</li>
          <li>Contracted-but-undelivered obligations: about ${fmtB(A.contractedBacklog)} of remaining performance obligations sit across Microsoft, Oracle, Google and CoreWeave — committed future flows this model only implies</li>
          <li>Second-order effects: memory prices reverting to the mean, power and grid limits, debt refinancing walls, and the possibility that one bloc's silicon breakthrough resets the other's economics</li>
        </ul>
      </div>
      <div class="method-block">
        <h3>What is actually at stake</h3>
        <p>Both branches of this model describe real consequences for people, and neither is a punchline.</p>
        <p>If the buildout is written down, the losses do not stay inside the companies on this page. Datacenter construction, electrical trades, turbine and equipment manufacturing, and semiconductor fabs have hired against these order books; pension funds, index investors and retail shareholders hold the equity, and a growing share of the financing is debt held by insurers and credit funds. A capex reversal of the size this model can produce means canceled projects, idled plants and lost jobs well outside technology.</p>
        <p>If instead the revenue arrives, that revenue is largely paid <em>for work</em> — it is the measure of tasks moving from people to systems. The scenarios where the economics work most cleanly are the scenarios with the largest displacement, concentrated in specific occupations and regions rather than spread evenly.</p>
        <p>The purpose of this page is to make those trade-offs concrete enough to reason about, and to show which assumptions the answer actually turns on. It is not a forecast, and it is not investment advice.</p>
      </div>
      <div class="method-block" style="grid-column: 1 / -1;">
        <h3>Sources &amp; provenance</h3>
        <ul class="sources-list">${D.sources.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
    </div>`;
  }

  // ---------- update orchestration ----------
  let raf = null;
  function scheduleUpdate() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; update(); });
  }
  function update() {
    projectAll();
    renderVerdict();
    renderYearViews();
    updateCharts();
  }
  function renderYearViews() {
    renderSankey();
    renderTiles();
    renderBubble();
  }

  // ---------- boot ----------
  buildBlocToggle();
  buildControls();
  buildScenarios();
  buildCharts();
  renderCompanies();
  renderMethod();
  renderVerdict();
  renderYearViews();
  $("footNote").innerHTML =
    `Data compiled ${D.meta.updated} from public filings, analyst reports and press coverage. Private-company figures are estimates, and several widely quoted numbers — Anthropic's claimed run-rate, private valuations, Chinese production volumes — are unaudited. ` +
    `Every default here is an assumption you can and should change. All flows in billions of US dollars per year.`;
})();
