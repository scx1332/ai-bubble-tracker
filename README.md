# AI Bubble Simulator

An interactive model of money flowing through the AI ecosystem — who pays whom,
how much of it is real customer revenue versus venture capital, debt and
circular vendor financing, and what the buildout would have to earn to pay for
itself. Adjust the assumptions and the model re-projects to 2031.

It is a tool for reasoning about a serious question, not a prediction. Both
answers it can give have consequences for people: a written-down buildout means
canceled projects and lost jobs well outside technology, and revenue large
enough to justify the buildout is revenue paid for work that used to be done by
people. The point of the sliders is to show which assumptions the answer
actually turns on.

**Live at https://bubble.arkiv-globe.net** — or open `index.html` in a browser.
No build, no server, no dependencies. A single-file bundle lives in
`dist/index.html` if you want one file to share; `./deploy.sh` rebuilds, tests
and publishes it to the server's nginx webroot.

## Two blocs

Export controls have split the AI buildout into two largely separate money
loops, so the model runs them separately rather than averaging them together:

- **US-led** — NVIDIA silicon, TSMC wafers, venture capital, public-market
  buybacks.
- **China** — Huawei and Cambricon silicon, SMIC wafers, state and platform
  money, far cheaper model pricing and a much thinner venture layer.

They meet in one place in the model: the share of accelerator spending that
leaves a bloc to buy foreign parts. Switch blocs in the header; the flow map,
verdict, tiles and charts all follow, and one chart always compares the two.

## What's in it

- **Money flow map** — a Sankey diagram for any year 2024–2031: customers,
  investment, debt and platform treasuries in; labs, startups, cloud platforms
  and specialist clouds in the middle; chips, fabs and construction out the
  other side; buybacks and dividends leaving to shareholders. Circular vendor
  financing is drawn as a literal loop under the diagram.
- **The verdict** — at your current assumptions: does revenue ever cover the
  buildout, does funding run short, does capex reverse with the gap still open,
  or does the imbalance simply persist?
- **Sliders** for the main estimates: end revenue and its growth path, capex and
  its growth path, chip share of capex, cost per GW, depreciation life,
  investment, debt, circular financing, margins, required return, payout ratio,
  and opex per GW — per bloc.
- **Scenario presets**: Base, AI delivers, The pop, Soft landing.
- **Projections**: required vs actual revenue, capex vs the depreciation wall,
  money entering vs leaving the system boundary, physical GW buildout, and the
  two blocs side by side.
- **The cast** — company tables by bloc and by role, with the latest reported or
  estimated figures that seed the defaults.

## Data

Compiled July 2026 from public filings and earnings calls, Dell'Oro, Gartner,
Crunchbase/PitchBook, Goldman Sachs, Morgan Stanley, JPMorgan, McKinsey, Bain,
IDC, TrendForce, and press reporting on private companies. Everything about
private companies is an estimate; several widely quoted figures (Anthropic's
claimed run-rate, private valuations, Chinese production volumes) are unaudited
and labeled as such in the app.

All data lives in `src/data.js` with per-figure period labels. To update the app
after the next earnings season, edit that one file.

## Model

`src/model.js` is a small, documented engine — about a page of equations —
shared by both blocs with different parameters: growth paths with fading growth
rates, straight-line depreciation over vintages,
`required = (depreciation + opex + hurdle × net fleet) × 1.2`, a burn-versus-
available-funding check, and a bust check (capex down ≥25% year over year while
the gap is still open). At default settings it reproduces the magnitudes of the
published analyses — Kupperman's $320–480B break-even on 2025 capex, Bain's ~$2T
needed by 2030 with a ~$800B shortfall. The full methodology, split assumptions
and known omissions are rendered at the bottom of the page.

## Development

```
node test/model.test.mjs   # model invariants, scenario narratives, slider extremes
python3 build.py           # regenerate dist/index.html and dist/artifact.html
./deploy.sh                # test, build, publish to the nginx webroot
```

Source layout: `src/data.js` (all numbers and bloc configuration),
`src/model.js` (pure math, no DOM), `src/sankey.js` (hand-rolled Sankey),
`src/charts.js` (SVG chart components), `src/ui.js` (wiring),
`src/logos.js` (company marks), `src/styles.css` (design tokens, light + dark).

Company brand marks are used nominatively to identify the companies whose
public figures the page reports; glyph paths come from
[simple-icons](https://simpleicons.org) (CC0).

Not investment advice.
