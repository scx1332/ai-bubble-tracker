# AI Bubble Simulator

An interactive, frontend-only model of money flowing through the AI ecosystem —
who pays whom, how much of it is real customer revenue vs venture capital, debt
and circular vendor financing, and what the buildout would have to earn to pay
for itself. Drag the assumptions; the ecosystem re-computes and projects to 2031.

**Open `index.html` in a browser. No build, no server, no dependencies.**
A single-file bundle lives in `dist/index.html` if you want one file to share.

## What's in it

- **Money flow map** — a Sankey diagram for any year 2024–2031: customers, VC,
  debt and big-tech treasuries in; labs, startups, hyperscalers and neoclouds in
  the middle; chips, fabs, construction out the other side; buybacks and
  dividends leaving to investors. Circular vendor financing (chip makers and
  clouds investing in their own customers) is drawn as a literal loop under the
  diagram.
- **The verdict** — at your current assumptions: does revenue ever justify the
  buildout, does the music stop (funding crunch or capex bust), or does it limp
  along as a zombie bubble? A soap-bubble gauge inflates with the imbalance and
  pops in the projected bust year.
- **Sliders** for the main estimates: AI end-revenue and its growth path, capex
  and its growth path, chip share of capex, cost per GW, depreciation life, VC,
  debt, circular financing, margins, required return, payout ratio, opex per GW.
- **Scenario presets**: Base, AI delivers, The pop, Soft landing.
- **Projections**: required vs actual revenue (the gap), capex vs the
  depreciation wall, money entering vs leaving the system boundary, and physical
  GW buildout.
- **The cast** — company tables (hyperscalers, chip makers, fabs & memory, AI
  labs, neoclouds, an "AI startups" virtual group, power & DC builders) with the
  latest reported or estimated figures that seed the defaults.

## Data

Compiled July 26, 2026 from public filings and earnings calls, Dell'Oro,
Gartner, Crunchbase/PitchBook, Goldman Sachs, Morgan Stanley, JPMorgan,
McKinsey, Bain, and press reporting on private companies (The Information,
Bloomberg, Reuters, CNBC, WSJ). Everything about private companies is an
estimate; several headline figures (Anthropic's claimed $47B run-rate, private
valuations) are unaudited tracker claims and are labeled as such in the app.

All data lives in `src/data.js` with per-figure period labels. To update the
app after the next earnings season, edit that one file.

## Model

`src/model.js` is a deliberately small, documented toy model (~1 page of
equations): growth paths with fading growth rates, straight-line depreciation
over vintages, `required = (depreciation + opex + hurdle × net fleet) × 1.2`,
a lab/startup burn vs available-funding crunch check, and a bust check (capex
down ≥25% YoY while the gap is still open). At default settings it reproduces
the magnitudes of the published bubble math (Kupperman's $320–480B break-even
on 2025 capex, Bain's ~$2T needed by 2030 with a ~$800B shortfall). The full
methodology, split assumptions and known omissions are rendered at the bottom
of the page.

## Development

```
node test/model.test.mjs   # model invariants, scenario narratives, slider extremes
python3 build.py           # regenerate dist/index.html and dist/artifact.html
```

Source layout: `src/data.js` (all numbers), `src/model.js` (pure math, no DOM),
`src/sankey.js` (hand-rolled Sankey), `src/charts.js` (SVG chart components),
`src/ui.js` (wiring), `src/styles.css` (design tokens, light + dark).

Not investment advice. It's a toy for arguing about scenarios — that's why it
has sliders.
