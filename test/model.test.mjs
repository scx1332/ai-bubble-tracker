// Node smoke tests for the model engine — no DOM needed.
// Run: node test/model.test.mjs
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
global.window = {};
eval(readFileSync(join(root, "src/logos.js"), "utf8"));
eval(readFileSync(join(root, "src/data.js"), "utf8"));
eval(readFileSync(join(root, "src/model.js"), "utf8"));
const DATA = window.DATA, Model = window.Model;
const US = DATA.blocs.us;

let failures = 0;
function ok(cond, msg) {
  if (!cond) { failures++; console.error("  FAIL:", msg); }
  else console.log("  ok:", msg);
}
function finiteDeep(obj, path = "") {
  for (const k in obj) {
    const v = obj[k];
    if (typeof v === "number" && !isFinite(v)) return path + "." + k;
    if (v && typeof v === "object") { const r = finiteDeep(v, path + "." + k); if (r) return r; }
  }
  return null;
}

console.log("defaults projection");
const proj = Model.project(DATA, US.defaults);
ok(proj.years.length === 8 && proj.years[0] === 2024 && proj.years[7] === 2031, "horizon 2024–2031");
ok(finiteDeep(proj.rows) === null, "no NaN/Infinity anywhere in rows (" + finiteDeep(proj.rows) + ")");
ok(proj.rows[2024].capex === US.history[2024].aiCapex, "2024 capex pinned to history");
ok(proj.rows[2025].endRev === US.history[2025].endRev, "2025 endRev pinned to history");
ok(proj.rows[2026].capex === US.defaults.capex26, "2026 capex = slider");
ok(proj.rows[2027].endRev > proj.rows[2026].endRev, "demand grows in 2027");
const r26 = proj.rows[2026];
ok(r26.requiredRev > 350 && r26.requiredRev < 950, `required revenue 2026 plausible (${r26.requiredRev.toFixed(0)})`);
ok(r26.gap > 0, "2026 runs a revenue gap at defaults");
ok(r26.bubbleIndex > 2, `bubble index 2026 > 2 (${r26.bubbleIndex.toFixed(1)})`);
ok(r26.netPPE > 0 && r26.depreciation > 0, "PP&E and depreciation positive");
ok(r26.moneyIn > r26.endRev, "money in exceeds revenue alone");
ok(r26.treasury >= 0 && r26.neoEquity >= 0, "derived funding flows non-negative");
ok(Math.abs(r26.labRev + r26.cloudEndRev + r26.startupRev - r26.endRev) < 1e-6, "end revenue split sums to total");
ok(proj.verdict && (proj.verdict.justifiedYear || proj.verdict.crunchYear || proj.verdict.last), "verdict present");

console.log("flows for each year");
for (const y of proj.years) {
  const f = Model.flowsFor(DATA, US.defaults, proj.rows[y]);
  const ids = new Set(f.nodes.map(n => n.id));
  const bad = f.links.filter(l => !ids.has(l.source) || !ids.has(l.target) || !isFinite(l.value) || l.value <= 0);
  ok(bad.length === 0, `${y}: ${f.links.length} links, all valid`);
  const circ = f.links.filter(l => l.circular);
  if (y >= 2026) ok(circ.length >= 1, `${y}: circular financing edge present`);
}

console.log("every scenario stays finite");
for (const [key, sc] of Object.entries(DATA.scenarios)) {
  const p = Object.assign({}, US.defaults, sc.overrides.us);
  const pr = Model.project(DATA, p);
  const nan = finiteDeep(pr.rows);
  ok(nan === null, `scenario ${key} finite`);
  ok(pr.rows[2031].capex >= 0 && pr.rows[2031].endRev >= 0, `scenario ${key} non-negative tails`);
}

console.log("scenario narratives land where intended");
const vBase = Model.project(DATA, US.defaults).verdict;
ok(!vBase.justifiedYear && !vBase.crunchYear, `base = zombie (justified:${vBase.justifiedYear} pop:${vBase.crunchYear})`);
const vBoom = Model.project(DATA, Object.assign({}, US.defaults, DATA.scenarios.boom.overrides.us)).verdict;
ok(vBoom.justifiedYear != null, `boom justifies (${vBoom.justifiedYear})`);
const vPop = Model.project(DATA, Object.assign({}, US.defaults, DATA.scenarios.pop.overrides.us)).verdict;
ok(vPop.crunchYear != null && !vPop.justifiedYear, `pop pops (${vPop.crunchYear})`);
const vSoft = Model.project(DATA, Object.assign({}, US.defaults, DATA.scenarios.soft.overrides.us)).verdict;
ok(!vSoft.crunchYear, `soft landing doesn't pop (pop:${vSoft.crunchYear})`);

console.log("slider extremes stay finite");
for (const g of US.sliders) for (const it of g.items) {
  for (const v of [it.min, it.max]) {
    const p = Object.assign({}, US.defaults, { [it.id]: v });
    const pr = Model.project(DATA, p);
    const nan = finiteDeep(pr.rows);
    if (nan) { failures++; console.error(`  FAIL: ${it.id}=${v} produced ${nan}`); }
    for (const y of pr.years) {
      const f = Model.flowsFor(DATA, p, pr.rows[y]);
      if (f.links.some(l => !isFinite(l.value))) { failures++; console.error(`  FAIL: ${it.id}=${v} year ${y} non-finite link`); }
    }
  }
}
console.log("  ok: all slider extremes checked");

console.log("verdict consistency");
const vX = Model.project(DATA, Object.assign({}, US.defaults, { capexGrowth: -50 })).verdict;
ok(!(vX.justifiedYear && vX.crunchYear), `justified and pop never coexist (justified:${vX.justifiedYear} pop:${vX.crunchYear})`);
ok(vX.crunchYear != null, `hard capex collapse pops (${vX.crunchYear})`);
const vY = Model.project(DATA, Object.assign({}, US.defaults, { capexGrowth: -25, capexFade: 0 })).verdict;
ok(vY.crunchYear != null, `exactly -25%/yr decline registers as bust (${vY.crunchYear})`);
const fx = Model.flowsFor(DATA, US.defaults, proj.rows[2026]);
const neoIn = fx.links.filter(l => l.target === "neo").reduce((s, l) => s + l.value, 0);
const neoOut = fx.links.filter(l => l.source === "neo").reduce((s, l) => s + l.value, 0);
ok(neoIn >= neoOut - 1, `neocloud node roughly balances (in ${neoIn.toFixed(1)} vs out ${neoOut.toFixed(1)})`);

console.log("every bloc projects cleanly");
for (const blocId of Object.keys(DATA.blocs)) {
  const B = DATA.blocs[blocId];
  const pr = Model.project(DATA, B.defaults, blocId);
  ok(finiteDeep(pr.rows) === null, `${blocId}: no NaN/Infinity`);
  ok(pr.rows[2026].capex === B.defaults.capex26, `${blocId}: 2026 capex = slider`);
  ok(pr.rows[2026].requiredRev > 0, `${blocId}: required revenue positive`);
  // every slider id must exist in that bloc's defaults, or the UI renders "undefined"
  for (const g of B.sliders) for (const it of g.items) {
    ok(B.defaults[it.id] != null, `${blocId}: default exists for slider ${it.id}`);
    ok(B.defaults[it.id] >= it.min && B.defaults[it.id] <= it.max,
      `${blocId}: default ${it.id}=${B.defaults[it.id]} within [${it.min}, ${it.max}]`);
  }
  for (const y of pr.years) {
    const f = Model.flowsFor(DATA, B.defaults, pr.rows[y], blocId);
    const ids = new Set(f.nodes.map(n => n.id));
    const bad = f.links.filter(l => !ids.has(l.source) || !ids.has(l.target) || !(l.value > 0));
    if (bad.length) { failures++; console.error(`  FAIL: ${blocId} ${y} bad links`, bad); }
  }
  // slider extremes, per bloc
  for (const g of B.sliders) for (const it of g.items) {
    for (const v of [it.min, it.max]) {
      const p2 = Object.assign({}, B.defaults, { [it.id]: v });
      const pr2 = Model.project(DATA, p2, blocId);
      const nan = finiteDeep(pr2.rows);
      if (nan) { failures++; console.error(`  FAIL: ${blocId} ${it.id}=${v} -> ${nan}`); }
      for (const y of pr2.years) {
        const f = Model.flowsFor(DATA, p2, pr2.rows[y], blocId);
        if (f.links.some(l => !isFinite(l.value))) { failures++; console.error(`  FAIL: ${blocId} ${it.id}=${v} y${y} non-finite link`); }
      }
    }
  }
  console.log(`  ok: ${blocId} slider extremes and flows checked`);
}

console.log("scenario overrides name real sliders");
for (const [key, sc] of Object.entries(DATA.scenarios)) {
  for (const blocId of Object.keys(sc.overrides || {})) {
    ok(DATA.blocs[blocId] != null, `scenario ${key}: bloc ${blocId} exists`);
    for (const id of Object.keys(sc.overrides[blocId])) {
      ok(DATA.blocs[blocId].defaults[id] != null, `scenario ${key}.${blocId}: ${id} is a real parameter`);
    }
  }
}

console.log("company tables are well formed");
for (const g of DATA.groups) {
  ok(DATA.blocs[g.bloc] != null, `group ${g.id}: bloc "${g.bloc}" exists`);
  for (const cp of g.companies) {
    ok(!cp.logo || window.LOGOS[cp.logo] != null, `group ${g.id}: logo "${cp.logo}" defined for ${cp.name}`);
  }
}

console.log("calibration against analyst math");
const dep3 = Model.project(DATA, Object.assign({}, US.defaults, { deprYears: 3 }));
ok(dep3.rows[2026].requiredRev > proj.rows[2026].requiredRev, "shorter GPU life raises required revenue");
ok(proj.rows[2031].requiredRev > 1200 && proj.rows[2031].requiredRev < 2600,
  `2031 required revenue in Bain's neighborhood of $2T (${proj.rows[2031].requiredRev.toFixed(0)})`);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log("\nall model tests passed");
