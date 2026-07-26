/* ============================================================
   AI Bubble Simulator — chart components
   Hand-rolled SVG: line charts (with gap wash), columns + line,
   diverging stacked columns. Shared: crosshair + tooltip,
   legend, table twin, keyboard navigation.
   Hover/keyboard listeners are attached ONCE per chart; draw()
   refreshes geometry via parts.geom so updates never stack
   duplicate handlers.
   ============================================================ */

window.Charts = (function () {
  const NS = "http://www.w3.org/2000/svg";
  const VW = 560, VH = 290;
  const M = { l: 48, r: 92, t: 14, b: 26 };

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function fmtAxis(v, unit) {
    if (unit === "GW") return Math.round(v) + "";
    const a = Math.abs(v);
    const s = a >= 1000 ? (a / 1000).toFixed(a >= 2000 ? 0 : 1) + "T" : Math.round(a) + "B";
    return (v < 0 ? "−" : "") + s;
  }
  function fmtVal(v, unit) {
    if (unit === "GW") return v.toFixed(v >= 20 ? 0 : 1) + " GW";
    return window.Model.fmtB(v);
  }

  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1;
    const step0 = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    let step = mag;
    for (const m of [1, 2, 2.5, 5, 10]) { if (step0 <= m * mag) { step = m * mag; break; } }
    const ticks = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
    return ticks;
  }

  // ---------- shared scaffold ----------
  function scaffold(container, cfg) {
    container.innerHTML = `
      <div class="card-head"><div>
        <div class="eyebrow">${cfg.eyebrow || ""}</div>
        <h3>${cfg.title}</h3>
        <p class="card-sub">${cfg.sub || ""}</p>
      </div></div>
      <div class="chart-legend"></div>
      <div class="chart-body">
        <svg role="img" aria-label="${cfg.title}" tabindex="0"></svg>
        <div class="viz-tip" hidden></div>
      </div>
      <details class="table-twin"><summary>View as table</summary><div class="twin-tbl"></div></details>`;
    return {
      legend: container.querySelector(".chart-legend"),
      subEl: container.querySelector(".card-sub"),
      svg: container.querySelector("svg"),
      tip: container.querySelector(".viz-tip"),
      body: container.querySelector(".chart-body"),
      tbl: container.querySelector(".twin-tbl"),
      geom: null,   // set by each draw()
      hairEl: null, // crosshair line, recreated by each draw()
    };
  }

  function renderLegend(elx, series) {
    elx.innerHTML = series.map(s =>
      `<span class="key"><span class="${s.kind === "line" || s.type === "line" ? "line-key" : "swatch"}" style="background:${s.color}"></span>${s.name}</span>`
    ).join("");
  }

  function renderTwin(tbl, years, series, unit) {
    let html = `<table class="data"><thead><tr><th>Series</th>${years.map(y => `<th>${y}</th>`).join("")}</tr></thead><tbody>`;
    series.forEach(s => {
      html += `<tr><td>${s.name}</td>${s.values.map(v => `<td>${unit === "GW" ? v.toFixed(1) : Math.round(v)}</td>`).join("")}</tr>`;
    });
    html += "</tbody></table>";
    tbl.innerHTML = html;
  }

  // crosshair + tooltip + keyboard — attached ONCE; reads parts.geom/cfg live
  function attachHover(parts, cfg) {
    const { svg, tip, body } = parts;
    let idx = -1;

    function setIdx(i, clientX, clientY) {
      idx = i;
      const hair = parts.hairEl;
      if (i < 0 || !parts.geom) {
        if (hair) hair.setAttribute("visibility", "hidden");
        tip.hidden = true;
        return;
      }
      const { xOf, years } = parts.geom;
      const x = xOf(i);
      if (hair) {
        hair.setAttribute("x1", x); hair.setAttribute("x2", x);
        hair.setAttribute("visibility", "visible");
      }
      const rows = cfg.series.map(s =>
        `<div><span class="swatch" style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${s.color};margin-right:6px"></span>${s.name}: <span class="tip-val">${fmtVal(s.values[i], cfg.unit)}</span></div>`
      ).join("");
      tip.innerHTML = `<div class="tip-title">${years[i]}</div>${rows}`;
      tip.hidden = false;
      const wr = body.getBoundingClientRect();
      const sl = body.scrollLeft || 0;
      const px = (clientX != null ? clientX - wr.left + sl : (x / VW) * wr.width) + 12;
      let lx = px, ly = clientY != null ? clientY - wr.top + 12 : 20;
      if (lx + tip.offsetWidth > sl + wr.width - 6) lx -= tip.offsetWidth + 22;
      if (ly + tip.offsetHeight > wr.height - 4) ly = wr.height - tip.offsetHeight - 4;
      tip.style.left = Math.max(0, lx) + "px";
      tip.style.top = Math.max(0, ly) + "px";
    }
    parts.resetHover = () => setIdx(-1);

    svg.addEventListener("mousemove", evt => {
      if (!parts.geom) return;
      const { xOf, years } = parts.geom;
      const r = svg.getBoundingClientRect();
      const vx = (evt.clientX - r.left) / r.width * VW;
      let best = 0, bd = Infinity;
      years.forEach((y, i) => { const d = Math.abs(xOf(i) - vx); if (d < bd) { bd = d; best = i; } });
      setIdx(best, evt.clientX, evt.clientY);
    });
    svg.addEventListener("mouseleave", () => setIdx(-1));
    svg.addEventListener("keydown", evt => {
      if (!parts.geom) return;
      const n = parts.geom.years.length;
      if (evt.key === "ArrowRight") { setIdx(Math.min(n - 1, (idx < 0 ? 0 : idx + 1))); evt.preventDefault(); }
      else if (evt.key === "ArrowLeft") { setIdx(Math.max(0, (idx < 0 ? n - 1 : idx - 1))); evt.preventDefault(); }
      else if (evt.key === "Escape") setIdx(-1);
      else if (evt.key === "Enter" && idx >= 0 && cfg.onYearClick) cfg.onYearClick(parts.geom.years[idx]);
    });
    if (cfg.onYearClick) {
      svg.style.cursor = "pointer";
      svg.addEventListener("click", () => { if (idx >= 0 && parts.geom) cfg.onYearClick(parts.geom.years[idx]); });
    }
  }

  function beginDraw(parts) {
    parts.svg.innerHTML = "";
    parts.svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
    parts.tip.hidden = true;
  }
  function endDraw(parts, xOf, years) {
    parts.hairEl = el("line", { class: "axis-line", y1: M.t, y2: VH - M.b, visibility: "hidden" }, parts.svg);
    parts.geom = { xOf, years };
  }
  function applyUpdate(parts, cfg, newCfg) {
    Object.assign(cfg, newCfg);
    if (parts.subEl && cfg.sub != null) parts.subEl.textContent = cfg.sub;
  }

  function axes(svg, ticks, yOf, unit) {
    ticks.forEach(tv => {
      const y = yOf(tv);
      el("line", { x1: M.l, x2: VW - M.r, y1: y, y2: y, class: tv === 0 ? "axis-line" : "grid-line" }, svg);
      const t = el("text", { x: M.l - 6, y: y + 3.5, "text-anchor": "end", class: "axis-text" }, svg);
      t.textContent = fmtAxis(tv, unit);
    });
  }
  function xAxis(svg, years, xOf) {
    years.forEach((yr, i) => {
      const t = el("text", { x: xOf(i), y: VH - M.b + 16, "text-anchor": "middle", class: "axis-text" }, svg);
      t.textContent = "’" + String(yr).slice(2);
    });
  }

  // ---------- line chart (optionally with wash between series 0 and 1) ----------
  function lines(container, cfg) {
    const parts = scaffold(container, cfg);
    function draw() {
      beginDraw(parts);
      const svg = parts.svg;
      const years = cfg.years;
      const all = cfg.series.flatMap(s => s.values);
      const hi = Math.max(...all) * 1.06 || 1, lo = 0;
      const xOf = i => M.l + (i / (years.length - 1)) * (VW - M.l - M.r);
      const yOf = v => VH - M.b - ((v - lo) / (hi - lo)) * (VH - M.t - M.b);
      axes(svg, niceTicks(lo, hi, 5), yOf, cfg.unit);
      xAxis(svg, years, xOf);

      if (cfg.wash) {
        const [a, b] = cfg.wash;
        const sa = cfg.series[a].values, sb = cfg.series[b].values;
        let d = "M " + years.map((_, i) => `${xOf(i)} ${yOf(sa[i])}`).join(" L ");
        d += " L " + years.map((_, i) => `${xOf(years.length - 1 - i)} ${yOf(sb[years.length - 1 - i])}`).join(" L ") + " Z";
        el("path", { d, fill: cfg.series[a].color, opacity: 0.10 }, svg);
      }

      cfg.series.forEach(s => {
        const d = "M " + years.map((_, i) => `${xOf(i)} ${yOf(s.values[i])}`).join(" L ");
        el("path", { d, stroke: s.color, "stroke-width": 2, fill: "none", "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
        const li = years.length - 1;
        el("circle", { cx: xOf(li), cy: yOf(s.values[li]), r: 4.5, fill: s.color, stroke: "var(--surface)", "stroke-width": 2 }, svg);
      });

      // direct end labels with simple collision avoidance
      const li = years.length - 1;
      const placed = [];
      cfg.series.map(s => ({ s, y: yOf(s.values[li]) }))
        .sort((a, b) => a.y - b.y)
        .forEach(o => {
          let y = o.y + 3.5;
          while (placed.some(p => Math.abs(p - y) < 12)) y += 12;
          placed.push(y);
          const t = el("text", { x: xOf(li) + 9, y, class: "direct-label" }, svg);
          t.textContent = o.s.short || o.s.name;
        });

      endDraw(parts, xOf, years);
    }
    renderLegend(parts.legend, cfg.series.map(s => Object.assign({ kind: "line" }, s)));
    draw();
    renderTwin(parts.tbl, cfg.years, cfg.series, cfg.unit);
    attachHover(parts, cfg);
    return {
      update(newCfg) {
        applyUpdate(parts, cfg, newCfg);
        renderLegend(parts.legend, cfg.series.map(s => Object.assign({ kind: "line" }, s)));
        draw();
        renderTwin(parts.tbl, cfg.years, cfg.series, cfg.unit);
      },
    };
  }

  // rounded-top column path (square baseline)
  function colPath(x, y, w, h, r, down) {
    if (h <= 0.5) return null;
    r = Math.min(r, w / 2, h);
    if (!down) return `M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} Z`;
  }

  // stacked-segment height: keep the 2px surface gap, but never let a real
  // value vanish — segments with a visible raw height get at least 1px of ink
  function segH(raw, gap) {
    if (raw <= 0.5) return 0;
    return Math.max(1, raw - gap);
  }

  // ---------- columns + line, one shared axis ----------
  function barsLine(container, cfg) {
    const parts = scaffold(container, cfg);
    function draw() {
      beginDraw(parts);
      const svg = parts.svg;
      const years = cfg.years;
      const hi = Math.max(...cfg.series.flatMap(s => s.values)) * 1.06 || 1;
      const xOf = i => M.l + (i + 0.5) / years.length * (VW - M.l - M.r);
      const yOf = v => VH - M.b - (v / hi) * (VH - M.t - M.b);
      axes(svg, niceTicks(0, hi, 5), yOf, cfg.unit);
      xAxis(svg, years, xOf);
      const band = (VW - M.l - M.r) / years.length;
      const bw = Math.min(24, band * 0.55);

      cfg.series.filter(s => s.type !== "line").forEach(s => {
        years.forEach((_, i) => {
          const d = colPath(xOf(i) - bw / 2, yOf(s.values[i]), bw, VH - M.b - yOf(s.values[i]), 4, false);
          if (d) el("path", { d, fill: s.color }, svg);
        });
      });
      cfg.series.filter(s => s.type === "line").forEach(s => {
        const d = "M " + years.map((_, i) => `${xOf(i)} ${yOf(s.values[i])}`).join(" L ");
        el("path", { d, stroke: s.color, "stroke-width": 2, fill: "none", "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
        years.forEach((_, i) => el("circle", { cx: xOf(i), cy: yOf(s.values[i]), r: 4, fill: s.color, stroke: "var(--surface)", "stroke-width": 2 }, svg));
      });

      endDraw(parts, xOf, years);
    }
    renderLegend(parts.legend, cfg.series);
    draw();
    renderTwin(parts.tbl, cfg.years, cfg.series, cfg.unit);
    attachHover(parts, cfg);
    return {
      update(newCfg) {
        applyUpdate(parts, cfg, newCfg);
        renderLegend(parts.legend, cfg.series);
        draw();
        renderTwin(parts.tbl, cfg.years, cfg.series, cfg.unit);
      },
    };
  }

  // ---------- diverging stacked columns (in up, out down) ----------
  function diverging(container, cfg) {
    const parts = scaffold(container, cfg);
    cfg.series = cfg.up.concat(cfg.down); // for tooltip/table
    function draw() {
      beginDraw(parts);
      const svg = parts.svg;
      const years = cfg.years;
      const upMax = Math.max(...years.map((_, i) => cfg.up.reduce((s, se) => s + se.values[i], 0)));
      const dnMax = Math.max(...years.map((_, i) => cfg.down.reduce((s, se) => s + se.values[i], 0)));
      const hi = upMax * 1.06 || 1, lo = -(dnMax * 1.06) || -1;
      const xOf = i => M.l + (i + 0.5) / years.length * (VW - M.l - M.r);
      const yOf = v => VH - M.b - ((v - lo) / (hi - lo)) * (VH - M.t - M.b);
      axes(svg, niceTicks(lo, hi, 6), yOf, cfg.unit);
      years.forEach((yr, i) => {
        const t = el("text", { x: xOf(i), y: VH - M.b + 16, "text-anchor": "middle", class: "axis-text" }, svg);
        t.textContent = "’" + String(yr).slice(2);
      });
      const band = (VW - M.l - M.r) / years.length;
      const bw = Math.min(24, band * 0.55);
      const zero = yOf(0);

      years.forEach((_, i) => {
        let acc = 0;
        cfg.up.forEach((s, si) => {
          const v = s.values[i];
          const y1 = yOf(acc + v), y0 = yOf(acc);
          const isTop = si === cfg.up.length - 1 || cfg.up.slice(si + 1).every(ss => ss.values[i] < 0.5);
          const h = segH(y0 - y1, 2);
          const d = colPath(xOf(i) - bw / 2, y0 - h, bw, h, isTop ? 4 : 0.01, false);
          if (d) el("path", { d, fill: s.color }, svg);
          acc += v;
        });
        acc = 0;
        cfg.down.forEach((s, si) => {
          const v = s.values[i];
          const y0 = yOf(-acc), y1 = yOf(-(acc + v));
          const isBot = si === cfg.down.length - 1 || cfg.down.slice(si + 1).every(ss => ss.values[i] < 0.5);
          const h = segH(y1 - y0, 2);
          const d = colPath(xOf(i) - bw / 2, y0 + 2, bw, h, isBot ? 4 : 0.01, true);
          if (d) el("path", { d, fill: s.color }, svg);
          acc += v;
        });
      });
      el("line", { x1: M.l, x2: VW - M.r, y1: zero, y2: zero, class: "axis-line" }, svg);

      endDraw(parts, xOf, years);
    }
    renderLegend(parts.legend, cfg.series);
    draw();
    renderTwin(parts.tbl, cfg.years, cfg.series, cfg.unit);
    attachHover(parts, cfg);
    return {
      update(newCfg) {
        applyUpdate(parts, cfg, newCfg);
        cfg.series = cfg.up.concat(cfg.down);
        renderLegend(parts.legend, cfg.series);
        draw();
        renderTwin(parts.tbl, cfg.years, cfg.series, cfg.unit);
      },
    };
  }

  return { lines, barsLine, diverging };
})();
