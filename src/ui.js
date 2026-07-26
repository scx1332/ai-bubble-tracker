/* ============================================================
   AI Bubble Simulator — UI wiring
   Sliders, scenarios, bubble gauge, verdict, tiles, charts,
   company tables, methodology. Everything re-computes live.
   ============================================================ */

(function () {
  const D = window.DATA, Mo = window.Model;
  const $ = id => document.getElementById(id);
  const fmtB = Mo.fmtB;

  let params = Object.assign({}, D.defaults);
  let selectedYear = D.meta.presentYear;
  let proj = Mo.project(D, params);
  const widgets = {}; // id -> {range, num}

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

  // ---------- sliders ----------
  function buildControls() {
    const root = $("controlGroups");
    root.innerHTML = "";
    D.sliders.forEach(g => {
      const div = document.createElement("div");
      div.className = "ctl-group";
      div.innerHTML = `<div class="eyebrow"><span class="swatch" style="background:${g.color}"></span>${g.group}</div>`;
      g.items.forEach(it => {
        const wrap = document.createElement("div");
        wrap.className = "ctl";
        wrap.innerHTML = `
          <div class="ctl-label-row">
            <label for="sl-${it.id}">${it.label}</label>
            <input class="ctl-val" id="num-${it.id}" type="number" min="${it.min}" max="${it.max}" step="${it.step}" value="${params[it.id]}" aria-label="${it.label} value in ${it.unit}">
          </div>
          <input id="sl-${it.id}" type="range" min="${it.min}" max="${it.max}" step="${it.step}" value="${params[it.id]}">
          ${it.hint ? `<div class="ctl-hint">${it.hint} · ${it.unit}</div>` : `<div class="ctl-hint">${it.unit}</div>`}`;
        div.appendChild(wrap);
        const range = wrap.querySelector(`#sl-${it.id}`);
        const num = wrap.querySelector(`#num-${it.id}`);
        widgets[it.id] = { range, num };
        const onChange = v => {
          const val = Math.max(it.min, Math.min(it.max, parseFloat(v)));
          if (isNaN(val)) { num.value = params[it.id]; return; }
          params[it.id] = val;
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
    for (const id in widgets) {
      widgets[id].range.value = params[id];
      widgets[id].num.value = params[id];
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
        params = Object.assign({}, D.defaults, sc.overrides);
        seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        syncWidgets();
        scheduleUpdate();
      });
      seg.appendChild(b);
    });
    $("resetBtn").addEventListener("click", () => {
      params = Object.assign({}, D.defaults);
      $("scenarios").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x.dataset.key === "base" ? "true" : "false"));
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
    const r = proj.rows[selectedYear];
    const v = proj.verdict;
    const idx = r.bubbleIndex;
    const popped = v.crunchYear && selectedYear >= v.crunchYear;
    const rad = Math.max(26, Math.min(104, 26 + idx * 13));
    svg.innerHTML = "";
    const NS = "http://www.w3.org/2000/svg";
    const mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
    if (!popped) {
      const defs = document.createElementNS(NS, "defs");
      defs.innerHTML = `
        <radialGradient id="bg1" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stop-color="var(--c-demand)" stop-opacity="0.05"/>
          <stop offset="62%" stop-color="var(--c-vc)" stop-opacity="0.12"/>
          <stop offset="86%" stop-color="var(--c-compute)" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="var(--c-demand)" stop-opacity="0.55"/>
        </radialGradient>`;
      svg.appendChild(defs);
      mk("circle", { cx: 120, cy: 120, r: rad, fill: "url(#bg1)", stroke: v.crunchYear ? "var(--status-critical)" : "var(--axis)", "stroke-width": 1.5 });
      mk("ellipse", { cx: 120 - rad * 0.35, cy: 120 - rad * 0.45, rx: rad * 0.28, ry: rad * 0.16, fill: "var(--surface)", opacity: 0.75, transform: `rotate(-28 ${120 - rad * 0.35} ${120 - rad * 0.45})` });
    } else {
      // the pop: burst spikes + escaping droplets
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
      ? `popped ~${v.crunchYear}`
      : `bubble index ${idx.toFixed(1)}× <span title="cumulative buildout spend vs cumulative AI revenue">ⓘ</span>`;
  }

  // ---------- verdict ----------
  function renderVerdict() {
    const v = proj.verdict;
    const [y0, y1] = D.meta.horizon;
    const last = proj.rows[y1];
    const cumCapex = proj.years.reduce((s, y) => s + proj.rows[y].capex, 0);
    const cumRev = last.cumRev;
    const h = $("verdictHeadline"), d = $("verdictDetail");
    let head, det;
    if (v.justifiedYear) {
      head = `The math closes: revenue covers the buildout from <span class="ok-green">${v.justifiedYear}</span>.`;
    } else if (v.crunchYear) {
      head = `The music stops around <span class="pop-red">${v.crunchYear}</span> — burn outruns fresh money.`;
    } else {
      head = `Never justified by ${y1} — but the money doesn't run out either. A zombie bubble.`;
    }
    det = `Cumulative ${y0}–${y1}: ${fmtB(cumCapex)} of AI capex against ${fmtB(cumRev)} of end-customer AI revenue. `;
    det += `In ${y1}, the fleet needs ${fmtB(last.requiredRev)}/yr to pay for itself (depreciation + running costs + ${params.hurdle}% return) vs ${fmtB(last.endRev)}/yr of projected revenue — a ${last.gap > 0 ? "shortfall" : "surplus"} of ${fmtB(Math.abs(last.gap))}. `;
    if (v.crunchYear) {
      const c = proj.rows[v.crunchYear];
      if (v.isBust) {
        const pv = proj.rows[v.crunchYear - 1];
        det += `In ${v.crunchYear}, AI capex drops ${Math.round((1 - c.capex / pv.capex) * 100)}% year-over-year while the fleet is still ${fmtB(c.gap)}/yr short of paying for itself — that combination means write-downs, not buybacks.`;
      } else {
        det += `In ${v.crunchYear}, labs + startups burn ${fmtB(c.fundingNeed)} against ${fmtB(c.fundingAvail)} of available VC and circular financing.`;
      }
    } else if (!v.justifiedYear) {
      det += `VC plus circular vendor money (${fmtB(last.vc + last.vendor)}/yr in ${y1}) keeps covering the burn, so nothing forces the correction inside the horizon.`;
    } else {
      const j = proj.rows[v.justifiedYear];
      det += `Break-even arrives with ${fmtB(j.endRev)} of revenue against a required ${fmtB(j.requiredRev)}.`;
    }
    if (v.peakCapexYear > y0 && v.peakCapexYear < y1 && proj.rows[y1].capex < proj.rows[v.peakCapexYear].capex * 0.95) {
      det += ` Capex peaks in ${v.peakCapexYear} at ${fmtB(proj.rows[v.peakCapexYear].capex)}/yr, then rolls over.`;
    }
    h.innerHTML = head;
    d.innerHTML = det;
  }

  // ---------- tiles ----------
  function renderTiles() {
    const r = proj.rows[selectedYear];
    const prev = proj.rows[selectedYear - 1];
    const t = $("tiles");
    const delta = (cur, pre, upBad, fmt) => {
      if (!pre && pre !== 0) return "";
      const df = cur - pre;
      if (Math.abs(df) < 0.05) return `<div class="t-delta">— vs ${selectedYear - 1}</div>`;
      const cls = df > 0 ? (upBad ? "up-bad" : "up-good") : (upBad ? "up-good" : "up-bad");
      return `<div class="t-delta ${cls}">${df > 0 ? "▲" : "▼"} ${fmt(Math.abs(df))} vs ${selectedYear - 1}</div>`;
    };
    const tiles = [
      { label: "Money in", sw: "var(--c-demand)", val: fmtB(r.moneyIn), d: delta(r.moneyIn, prev && prev.moneyIn, false, fmtB), title: "End revenue + VC & equity + debt + big-tech subsidy" },
      { label: "of which real revenue", sw: "var(--c-demand)", val: fmtB(r.endRev), d: delta(r.endRev, prev && prev.endRev, false, fmtB), title: "Paid by actual customers" },
      { label: "Back to investors", sw: "var(--c-returns)", val: fmtB(r.returns), d: delta(r.returns, prev && prev.returns, false, fmtB), title: "Buybacks + dividends, AI-attributable" },
      { label: "Required revenue", sw: "var(--c-capex)", val: fmtB(r.requiredRev), d: delta(r.requiredRev, prev && prev.requiredRev, true, fmtB), title: "What the fleet must earn per year" },
      { label: "Cumulative gap", sw: "var(--c-capex)", val: fmtB(r.cumGap), d: delta(r.cumGap, prev && prev.cumGap, true, fmtB), title: "Buildout spend minus revenue, since 2024" },
      { label: "AI capacity online", sw: "var(--c-compute)", val: Mo.fmtGw(r.gwOnline), d: delta(r.gwOnline, prev && prev.gwOnline, false, v => v.toFixed(1) + " GW"), title: "Cumulative datacenter capacity" },
    ];
    t.innerHTML = tiles.map(x => `
      <div class="tile" title="${x.title}">
        <div class="t-label"><span class="swatch" style="background:${x.sw}"></span>${x.label} · ${selectedYear}</div>
        <div class="t-value">${x.val}</div>
        ${x.d}
      </div>`).join("");
  }

  // ---------- sankey ----------
  function renderSankey() {
    const r = proj.rows[selectedYear];
    const flows = Mo.flowsFor(D, params, r);
    Sankey.render($("sankey"), $("sankeyTip"), flows, fmtB);
    Sankey.tableTwin($("sankeyTable"), flows, fmtB);
    $("yearOut").textContent = selectedYear;
    $("flowLegend").innerHTML = [
      ["var(--c-demand)", "customer demand"],
      ["var(--c-vc)", "VC & labs"],
      ["var(--c-debt)", "debt"],
      ["var(--c-compute)", "big-tech / clouds"],
      ["var(--c-capex)", "hardware"],
      ["var(--c-returns)", "investor returns"],
      ["var(--c-leak)", "leakage to economy"],
      ["var(--c-circular)", "circular financing ↺"],
    ].map(([c, l]) => `<span class="key"><span class="swatch" style="background:${c}"></span>${l}</span>`).join("");
  }

  // ---------- charts ----------
  let gapChart, capexChart, inoutChart, capChart;
  function chartData() {
    const ys = proj.years;
    const g = k => ys.map(y => proj.rows[y][k]);
    return {
      years: ys,
      required: g("requiredRev"), endRev: g("endRev"),
      capex: g("capex"), depreciation: g("depreciation"),
      vc: ys.map(y => proj.rows[y].vc + proj.rows[y].neoEquity),
      debt: g("debt"), treasury: g("treasury"),
      returns: g("returns"), leak: g("leak"),
      gwAdded: g("gwAdded"), gwOnline: g("gwOnline"),
    };
  }
  function buildCharts() {
    const c = chartData();
    const click = { onYearClick: setYear };
    gapChart = Charts.lines($("gapCard"), Object.assign({
      eyebrow: "the gap", title: "What the fleet must earn vs what customers pay",
      sub: "Required = (depreciation + opex + hurdle return on the fleet) × 1.2 for the layers above the metal. Click a year to pin the flow map.",
      years: c.years, unit: "$B", wash: [0, 1],
      series: [
        { name: "Required revenue", short: "Required", color: "var(--c-capex)", values: c.required },
        { name: "AI end-revenue", short: "Actual", color: "var(--c-demand)", values: c.endRev },
      ],
    }, click));
    capexChart = Charts.barsLine($("capexCard"), Object.assign({
      eyebrow: "the buildout", title: "AI capex and the depreciation wall behind it",
      sub: "Every year of capex becomes a depreciation bill for the next " + params.deprYears + " years.",
      years: c.years, unit: "$B",
      series: [
        { name: "AI capex", color: "var(--c-capex)", values: c.capex },
        { name: "Depreciation", color: "var(--c-compute)", values: c.depreciation, type: "line" },
      ],
    }, click));
    inoutChart = Charts.diverging($("inoutCard"), Object.assign({
      eyebrow: "system boundary", title: "Money entering vs leaving the ecosystem",
      sub: "Up: where the cash comes from. Down: buybacks + dividends out, and leakage into the wider economy.",
      years: c.years, unit: "$B",
      up: [
        { name: "Customer revenue", color: "var(--c-demand)", values: c.endRev },
        { name: "VC &amp; equity", color: "var(--c-vc)", values: c.vc },
        { name: "Debt", color: "var(--c-debt)", values: c.debt },
        { name: "Big-tech subsidy", color: "var(--c-compute)", values: c.treasury },
      ],
      down: [
        { name: "To investors", color: "var(--c-returns)", values: c.returns },
        { name: "Leakage", color: "var(--c-leak)", values: c.leak },
      ],
    }, click));
    capChart = Charts.barsLine($("capacityCard"), Object.assign({
      eyebrow: "physical buildout", title: "AI datacenter capacity, gigawatts",
      sub: "At $" + params.costPerGw + "B per GW. McKinsey's 2030 base case is ~156 GW of AI capacity.",
      years: c.years, unit: "GW",
      series: [
        { name: "GW added", color: "var(--c-capex)", values: c.gwAdded },
        { name: "GW online", color: "var(--c-compute)", values: c.gwOnline, type: "line" },
      ],
    }, click));
  }
  function updateCharts() {
    const c = chartData();
    gapChart.update({ years: c.years, series: [
      { name: "Required revenue", short: "Required", color: "var(--c-capex)", values: c.required },
      { name: "AI end-revenue", short: "Actual", color: "var(--c-demand)", values: c.endRev },
    ]});
    capexChart.update({ years: c.years,
      sub: "Every year of capex becomes a depreciation bill for the next " + params.deprYears + " years.",
      series: [
      { name: "AI capex", color: "var(--c-capex)", values: c.capex },
      { name: "Depreciation", color: "var(--c-compute)", values: c.depreciation, type: "line" },
    ]});
    inoutChart.update({ years: c.years,
      up: [
        { name: "Customer revenue", color: "var(--c-demand)", values: c.endRev },
        { name: "VC &amp; equity", color: "var(--c-vc)", values: c.vc },
        { name: "Debt", color: "var(--c-debt)", values: c.debt },
        { name: "Big-tech subsidy", color: "var(--c-compute)", values: c.treasury },
      ],
      down: [
        { name: "To investors", color: "var(--c-returns)", values: c.returns },
        { name: "Leakage", color: "var(--c-leak)", values: c.leak },
      ]});
    capChart.update({ years: c.years,
      sub: "At $" + params.costPerGw + "B per GW. McKinsey's 2030 base case is ~156 GW of AI capacity.",
      series: [
      { name: "GW added", color: "var(--c-capex)", values: c.gwAdded },
      { name: "GW online", color: "var(--c-compute)", values: c.gwOnline, type: "line" },
    ]});
  }

  // ---------- companies ----------
  function renderCompanies() {
    const root = $("companiesRoot");
    root.innerHTML = "";
    D.groups.forEach(g => {
      const div = document.createElement("div");
      div.className = "company-group";
      const money = v => v == null ? "—" : (v < 0 ? "−" + fmtB(-v) : fmtB(v));
      let head = `<tr><th>Company</th><th style="text-align:left">Period</th>`;
      g.cols.forEach(([, label]) => head += `<th>${label}</th>`);
      head += `<th style="text-align:left">Notes</th></tr>`;
      let rows = "";
      g.companies.forEach(cp => {
        rows += `<tr><td>${cp.name}</td><td style="text-align:left"><span class="src-tag">${cp.period}</span></td>`;
        g.cols.forEach(([key]) => {
          let v = cp[key];
          if (key === "shareholder") v = (cp.buybacks != null || cp.dividends != null) ? (cp.buybacks || 0) + (cp.dividends || 0) : cp.shareholder;
          rows += `<td>${money(v)}</td>`;
        });
        rows += `<td style="text-align:left"><span class="src-tag">${cp.tag || ""}</span></td></tr>`;
      });
      div.innerHTML = `
        <div class="cg-head">
          <h3><span class="swatch" style="background:${D.GROUP_COLORS[g.id]}"></span>${g.name}</h3>
          <span class="cg-note">${g.note}</span>
        </div>
        <div class="table-scroll"><table class="data"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
      root.appendChild(div);
    });
  }

  // ---------- methodology ----------
  function renderMethod() {
    const A = D.aggregates, S = D.splits;
    $("methodRoot").innerHTML = `
    <div class="method-cols">
      <div class="method-block">
        <h3>The system boundary</h3>
        <p>The "ecosystem" is everyone who earns AI money: labs, startups, hyperscalers' AI operations, neoclouds, chip makers, fabs.
        <strong>Money in</strong> = end-customer revenue + VC + debt + the subsidy big tech pays from non-AI profits.
        <strong>Money out</strong> = buybacks and dividends back to shareholders, plus leakage — construction wages, electricity, salaries, components — into the wider economy.
        Circular financing (chip makers and clouds investing in their own customers, ~${fmtB(D.defaults.vendor26)}/yr in 2026) stays inside the loop, which is exactly why it's drawn as a loop.</p>
      </div>
      <div class="method-block">
        <h3>The gap equation</h3>
        <p>Each year the installed fleet must earn:</p>
        <p><code>required = (depreciation + opex + hurdle × net fleet) × ${S.nonInfraCostFactor}</code></p>
        <p>Straight-line depreciation over your chosen life, opex at $/GW-year, a required return on undepreciated capex, and ×${S.nonInfraCostFactor} because end revenue must also feed the model and app layers above the metal.
        For calibration: Kupperman's break-even estimate on 2025 capex alone is ~${fmtB(A.kuppermanBreakeven)}/yr; Bain says ~${fmtB(A.bainNeed2030)}/yr is needed by 2030 (with a ~${fmtB(A.bainShortfall)} shortfall); David Cahn's 2026 version of the question is ${fmtB(A.cahnQuestion)}. This model reproduces those magnitudes at default settings.</p>
      </div>
      <div class="method-block">
        <h3>Split assumptions (fixed)</h3>
        <ul>
          <li>End revenue: ${pct(S.endRevToLabs)} labs, ${pct(S.endRevToClouds)} AI cloud, ${pct(S.endRevToStartups)} app startups</li>
          <li>${pct(S.vcToLabs)} of VC goes to labs (OpenAI + Anthropic took 43% of <em>all</em> world VC in H1 2026)</li>
          <li>Labs spend $${S.labComputeRatio.toFixed(2)} on compute per $1 of revenue in 2026, gliding to $${S.matureLabCompute.toFixed(2)} by 2032 — the scale-economics bet</li>
          <li>Neoclouds carry ${pct(S.neocloudShare)} of AI compute; hyperscalers pay ${pct(S.hyperscalerCapexShare)} of capex</li>
          <li>${pct(S.fabsShare)} of chip revenue flows through to TSMC, memory and components</li>
        </ul>
      </div>
      <div class="method-block">
        <h3>What this toy ignores</h3>
        <ul>
          <li>Taxes, FX, working capital, and the difference between cash and accrual anything</li>
          <li>Model quality: a capability jump (or wall) changes demand in ways no slider captures</li>
          <li>China and export controls; sovereign AI funds</li>
          <li>Contracted-but-undelivered obligations: ~${fmtB(A.contractedBacklog)} of RPO sits across Microsoft, Oracle, Google and CoreWeave — committed future flows this model only implies</li>
          <li>Secondary effects: memory-price mean reversion, power constraints (~11 GW of announced capacity shows no construction), refinancing walls</li>
        </ul>
      </div>
      <div class="method-block" style="grid-column: 1 / -1;">
        <h3>Sources & provenance</h3>
        <ul class="sources-list">${D.sources.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
    </div>`;
    function pct(v) { return Math.round(v * 100) + "%"; }
  }

  // ---------- update orchestration ----------
  let raf = null;
  function scheduleUpdate() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = null; update(); });
  }
  function update() {
    proj = Mo.project(D, params);
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
  buildControls();
  buildScenarios();
  buildCharts();
  renderCompanies();
  renderMethod();
  renderVerdict();
  renderYearViews();
  $("footNote").innerHTML =
    `Data compiled ${D.meta.updated} from public filings, analyst reports and press coverage; private-company figures are estimates and several (Anthropic's claimed run-rate, private valuations) are unaudited. ` +
    `This is a toy model for arguing about scenarios — not a forecast, and very much not investment advice. All flows in billions of USD per year.`;
})();
