/* ============================================================
   AI Bubble Simulator — sankey renderer
   Hand-rolled: fixed columns, stacked ribbons, and circular
   vendor-financing links drawn as loops under the diagram.
   ============================================================ */

window.Sankey = (function () {
  const NS = "http://www.w3.org/2000/svg";
  const W = 1080, NODE_W = 12, TOP = 16, GAP = 13;
  const COL_X = [46, 372, 690, 1010];
  const PLOT_H = 470, LOOP_PAD = 78;
  const H = TOP + PLOT_H + LOOP_PAD;

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Render {nodes, links} into svg#sankey. tip = tooltip div element.
  function render(svg, tip, flows, fmt) {
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const nodes = {}, cols = [[], [], [], []];
    flows.nodes.forEach(n => {
      const node = Object.assign({ in: 0, out: 0 }, n);
      nodes[n.id] = node;
    });
    const links = flows.links.filter(l => nodes[l.source] && nodes[l.target]);
    links.forEach(l => {
      nodes[l.source].out += l.value;
      nodes[l.target].in += l.value;
    });
    flows.nodes.forEach(n => {
      const node = nodes[n.id];
      node.value = Math.max(node.in, node.out);
      if (node.value > 0.25) cols[node.col].push(node);
    });

    // vertical scale: fit the tallest column
    let k = Infinity;
    cols.forEach(c => {
      const sum = c.reduce((s, n) => s + n.value, 0);
      if (sum > 0) k = Math.min(k, (PLOT_H - GAP * (c.length - 1)) / sum);
    });
    if (!isFinite(k)) k = 1;

    // place nodes
    cols.forEach(col => {
      let y = TOP;
      col.forEach(n => {
        n.x = COL_X[n.col] - (n.col === 3 ? NODE_W : 0);
        n.y = y;
        n.h = Math.max(3, n.value * k);
        y += n.h + GAP;
        n.inOff = 0; n.outOff = 0;
      });
    });

    const regular = links.filter(l => !l.circular && nodes[l.source].value > 0.25 && nodes[l.target].value > 0.25);
    const circular = links.filter(l => l.circular && nodes[l.source].value > 0.25 && nodes[l.target].value > 0.25);

    // stack ribbons top-down, sorted by the counterpart's y to minimize crossings
    regular.sort((a, b) => (nodes[a.target].y - nodes[b.target].y) || (nodes[a.source].y - nodes[b.source].y));
    const bySource = {};
    regular.forEach(l => (bySource[l.source] = bySource[l.source] || []).push(l));
    for (const id in bySource) bySource[id].sort((a, b) => nodes[a.target].y - nodes[b.target].y);
    const byTarget = {};
    regular.forEach(l => (byTarget[l.target] = byTarget[l.target] || []).push(l));
    for (const id in byTarget) byTarget[id].sort((a, b) => nodes[a.source].y - nodes[b.source].y);

    const gLinks = el("g", { fill: "none" }, svg);
    const gCirc = el("g", { fill: "none" }, svg);
    const gNodes = el("g", {}, svg);

    const paths = [];
    for (const id in bySource) {
      bySource[id].forEach(l => {
        const s = nodes[l.source], t = nodes[l.target];
        const th = Math.max(1.5, l.value * k);
        const y0 = s.y + s.outOff + th / 2; s.outOff += th;
        l._y0 = y0; l._th = th;
      });
    }
    for (const id in byTarget) {
      byTarget[id].forEach(l => {
        const t = nodes[l.target];
        const th = l._th;
        l._y1 = t.y + t.inOff + th / 2; t.inOff += th;
      });
    }
    regular.forEach(l => {
      const s = nodes[l.source], t = nodes[l.target];
      const x0 = s.x + NODE_W, x1 = t.x;
      const mid = (x0 + x1) / 2;
      const d = `M ${x0} ${l._y0} C ${mid} ${l._y0}, ${mid} ${l._y1}, ${x1} ${l._y1}`;
      const p = el("path", {
        d, stroke: l.color || nodes[l.source].color, "stroke-width": l._th,
        "stroke-opacity": 0.32, "stroke-linecap": "butt", class: "ribbon",
      }, gLinks);
      p._link = l;
      paths.push(p);
    });

    // circular links loop under the diagram; same-column links bow out left
    // so they don't collapse into a vertical stroke
    circular.forEach((l, i) => {
      const s = nodes[l.source], t = nodes[l.target];
      const th = Math.max(2, l.value * k);
      const loopY = TOP + PLOT_H + 26 + i * 26;
      const x0 = s.x + NODE_W / 2, x1 = t.x + NODE_W / 2;
      const sy = s.y + s.h, ty = t.y + t.h;
      const bow = Math.abs(x0 - x1) < 60 ? 170 : 0;
      const d = `M ${x0} ${sy} C ${x0 - bow} ${loopY}, ${x1 - bow} ${loopY}, ${x1} ${ty + 2}`;
      const p = el("path", {
        d, stroke: l.color || "var(--c-circular)", "stroke-width": Math.min(th, 22),
        "stroke-opacity": 0.5, "stroke-linecap": "round", class: "ribbon circular",
      }, gCirc);
      p._link = l;
      paths.push(p);
      // label at the bezier's midpoint so it follows the bow
      const midX = (x0 + 3 * (x0 - bow) + 3 * (x1 - bow) + x1) / 8;
      const lbl = el("text", {
        x: midX, y: loopY + 4, "text-anchor": "middle", class: "node-value",
      }, gCirc);
      lbl.textContent = "↺ " + fmt(l.value);
    });

    // nodes + labels
    flows.nodes.forEach(nd => {
      const n = nodes[nd.id];
      if (!n || n.value <= 0.25 || n.x == null) return;
      const r = el("rect", {
        x: n.x, y: n.y, width: NODE_W, height: n.h, rx: 3,
        fill: n.color, class: "sk-node", tabindex: "0",
        role: "img", "aria-label": `${n.label}: ${fmt(n.value)}`,
      }, gNodes);
      r._node = n;
      const anchor = n.col === 3 ? "end" : "start";
      const lx = n.col === 3 ? n.x - 7 : n.x + NODE_W + 7;
      const ly = Math.min(n.y + 11, TOP + PLOT_H - 4);
      const t1 = el("text", { x: lx, y: ly, "text-anchor": anchor, class: "node-label" }, gNodes);
      t1.textContent = n.label;
      const t2 = el("text", { x: lx, y: ly + 13, "text-anchor": anchor, class: "node-value" }, gNodes);
      t2.textContent = fmt(n.value);
    });

    // ---- interaction ----
    const wrap = svg.parentElement;
    function showTip(html, evt) {
      tip.innerHTML = html;
      tip.hidden = false;
      const wr = wrap.getBoundingClientRect();
      const sl = wrap.scrollLeft || 0;
      let x = evt.clientX - wr.left + sl + 14, y = evt.clientY - wr.top + 10;
      const tw = tip.offsetWidth, thh = tip.offsetHeight;
      if (x + tw > sl + wr.width - 8) x = x - tw - 26;
      if (y + thh > wr.height - 4) y = wr.height - thh - 4;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    }
    function hideTip() { tip.hidden = true; }

    paths.forEach(p => {
      p.addEventListener("mousemove", evt => {
        paths.forEach(q => q.setAttribute("stroke-opacity", q === p ? 0.62 : 0.14));
        const l = p._link;
        showTip(
          `<div class="tip-title">${nodes[l.source].label} → ${nodes[l.target].label}</div>` +
          `<div class="tip-val">${fmt(l.value)} / yr</div>` +
          (l.note ? `<div class="tip-note">${l.note}</div>` : ""), evt);
      });
      p.addEventListener("mouseleave", () => {
        paths.forEach(q => q.setAttribute("stroke-opacity", q.classList ? (q.getAttribute("class").includes("circular") ? 0.5 : 0.32) : 0.32));
        hideTip();
      });
    });
    gNodes.querySelectorAll(".sk-node").forEach(r => {
      const show = evt => {
        const n = r._node;
        showTip(
          `<div class="tip-title">${n.label}</div>` +
          `<div class="tip-val">in ${fmt(n.in)} · out ${fmt(n.out)}</div>` +
          (n.note ? `<div class="tip-note">${n.note}</div>` : ""), evt);
      };
      r.addEventListener("mousemove", show);
      r.addEventListener("focus", evt => {
        const n = r._node;
        const fake = { clientX: wrap.getBoundingClientRect().left + (n.x * wrap.clientWidth / W), clientY: wrap.getBoundingClientRect().top + 40 };
        show(fake);
      });
      r.addEventListener("mouseleave", hideTip);
      r.addEventListener("blur", hideTip);
    });

    return { nodes, links };
  }

  // table twin: every flow, sorted by size
  function tableTwin(container, flows, fmt) {
    const rows = flows.links.slice().sort((a, b) => b.value - a.value);
    const byId = {};
    flows.nodes.forEach(n => byId[n.id] = n);
    let html = `<table class="data"><caption>All flows for the selected year, largest first</caption>
      <thead><tr><th>From</th><th>To</th><th>$B / yr</th><th style="text-align:left">What it is</th></tr></thead><tbody>`;
    rows.forEach(l => {
      html += `<tr><td>${byId[l.source].label}</td><td style="text-align:left">${byId[l.target].label}</td>
        <td>${l.value.toFixed(1)}</td><td style="text-align:left">${l.note || ""}${l.circular ? " ↺" : ""}</td></tr>`;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  }

  return { render, tableTwin };
})();
