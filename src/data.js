/* ============================================================
   AI Bubble Simulator — dataset (compiled late July 2026)
   All money figures in billions of USD unless noted.
   "period" tells you what window each figure covers.
   Sources: company filings & earnings calls, Dell'Oro, Gartner,
   Crunchbase/PitchBook, Morgan Stanley, JPMorgan, McKinsey,
   Bain, Goldman Sachs, press reporting on private companies.
   Everything about private companies is an estimate.
   ============================================================ */

window.DATA = (function () {

  const GROUP_COLORS = {
    hyperscalers: "var(--c-compute)",
    chips: "var(--c-capex)",
    fabs: "var(--c-capex)",
    labs: "var(--c-vc)",
    neoclouds: "var(--c-compute)",
    startups: "var(--c-vc)",
    power: "var(--c-leak)",
  };

  // Column sets differ by group: public companies report earnings,
  // private ones leak run-rates and funding rounds.
  const COLS_PUBLIC = [
    ["revenue", "Revenue"], ["netIncome", "Net income"], ["capex", "Capex"],
    ["capexGuide", "Capex guide ’26/27"], ["shareholder", "Buybacks + divs"], ["aiRev", "AI / cloud rev"],
  ];
  const COLS_PRIVATE = [
    ["runRate", "Rev run-rate"], ["revenue", "2025 revenue"], ["netIncome", "Est. profit/loss"],
    ["funding", "Raised to date"], ["valuation", "Valuation"], ["computeSpend", "Compute spend/yr"],
  ];
  const COLS_NEO = [
    ["runRate", "Rev run-rate"], ["netIncome", "Net income"], ["capexGuide", "2026 capex"],
    ["debt", "Debt raised"], ["backlog", "Contracted backlog"], ["valuation", "Valuation"],
  ];

  const groups = [
    {
      id: "hyperscalers", name: "Hyperscalers", cols: COLS_PUBLIC,
      note: "Rent AI compute and fund most of the buildout — increasingly with debt and cut buybacks. 2026 capex guides total ~$800B.",
      companies: [
        { name: "Microsoft", period: "TTM Mar 2026", revenue: 318.3, netIncome: 125.2, capex: 135, capexGuide: 190, shareholder: 42.5, aiRev: 37, tag: "AI run-rate $37B; RPO $627B incl. OpenAI" },
        { name: "Alphabet", period: "FY2025 + TTM", revenue: 445.9, netIncome: 132.2, capex: 132.4, capexGuide: 200, shareholder: 55.7, aiRev: 58.7, tag: "buybacks halted 2026; raised $49.6B equity + $74B debt for capex" },
        { name: "Amazon", period: "TTM Mar 2026", revenue: 742.7, netIncome: 90.9, capex: 150, capexGuide: 200, shareholder: 0, aiRev: 128.7, tag: "AWS FY25; AI run-rate >$15B; TTM FCF ~$1B" },
        { name: "Meta", period: "TTM Mar 2026", revenue: 215, netIncome: 70.6, capex: 78.4, capexGuide: 135, shareholder: 31.6, aiRev: null, tag: "$55B bonds + $27B SPV debt; no AI segment disclosed" },
        { name: "Oracle", period: "FY2026 (May)", revenue: 67.4, netIncome: 17.0, capex: 55.7, capexGuide: 92.5, shareholder: 5.9, aiRev: 18.1, tag: "RPO $638B (OpenAI $300B); FCF −$23.7B" },
      ],
    },
    {
      id: "chips", name: "Chip designers & AI hardware", cols: COLS_PUBLIC,
      note: "Where most capex lands, at extraordinary margins. NVIDIA alone: ~$330B run-rate, and >$40B invested back into its own customers in 2026.",
      companies: [
        { name: "NVIDIA", period: "FY2026 (Jan)", revenue: 215.9, netIncome: 120, capex: 5, capexGuide: null, shareholder: 41.1, aiRev: 193.7, tag: "Q1 FY27 run-rate ~$326B; $119B supply commitments; $42B equity into AI labs/neoclouds" },
        { name: "AMD", period: "Q1 2026 ann.", revenue: 41, netIncome: 5.6, capex: 1.5, capexGuide: null, shareholder: 0.9, aiRev: 23.2, tag: "OpenAI 6 GW deal + warrant for ~10% of AMD" },
        { name: "Broadcom", period: "Q2 FY26 ann.", revenue: 88.8, netIncome: 37.2, capex: 1, capexGuide: null, shareholder: 15.5, aiRev: 56, tag: "FY26 AI rev guide ~$56B; >$100B line of sight FY27" },
        { name: "Dell + Supermicro", period: "FY2026", revenue: 153.5, netIncome: 8, capex: 3, capexGuide: null, shareholder: 6, aiRev: 65, tag: "AI servers: thin margins, $51B Dell backlog" },
      ],
    },
    {
      id: "fabs", name: "Fabs & memory", cols: COLS_PUBLIC,
      note: "The chokepoint. Memory margins (85% on commodity DRAM) are the clearest mean-reversion risk in the whole stack.",
      companies: [
        { name: "TSMC", period: "CY2026E", revenue: 172, netIncome: 75, capex: 62, capexGuide: 62, shareholder: 15, aiRev: 106, tag: "HPC ~2/3 of revenue; record 67.7% gross margin" },
        { name: "SK Hynix", period: "Q1 2026 ann.", revenue: 144, netIncome: 110, capex: 20, capexGuide: null, shareholder: 1.5, aiRev: 84, tag: "~58% HBM share; 72–77% operating margin" },
        { name: "Micron", period: "FQ3 2026 ann.", revenue: 166, netIncome: 113, capex: 27, capexGuide: 27, shareholder: 1, aiRev: 90, tag: "quarterly revenue 4.5× YoY; 85% gross margin" },
      ],
    },
    {
      id: "labs", name: "AI labs", cols: COLS_PRIVATE,
      note: "Frontier model builders. Revenue is exploding but every dollar of it costs more than a dollar to serve — the gap is filled by VC and vendors.",
      companies: [
        { name: "OpenAI", period: "mid-2026", runRate: 29, revenue: 13, netIncome: -14, funding: 180, valuation: 852, computeSpend: 50, tag: "~$600B compute committed through 2030 (reset from $1.4T); S-1 filed" },
        { name: "Anthropic", period: "mid-2026", runRate: 47, revenue: 10, netIncome: -6, funding: 128, valuation: 965, computeSpend: 20, tag: "claimed run-rate, unaudited; ~$275B compute commitments; S-1 submitted" },
        { name: "xAI (SpaceX)", period: "mid-2026", runRate: 26.5, revenue: 0.5, netIncome: -10, funding: 42, valuation: 250, computeSpend: 12, tag: "now mostly a compute seller: Anthropic $15B/yr + Google $11B/yr rent Colossus" },
        { name: "Mistral, SSI, Thinking Machines, Cohere", period: "mid-2026", runRate: 1.2, revenue: 0.7, netIncome: -3, funding: 12, valuation: 71, computeSpend: 3, tag: "second tier: 40–50× ARR valuations; Thinking Machines' $50B round collapsed" },
      ],
    },
    {
      id: "neoclouds", name: "Neoclouds", cols: COLS_NEO,
      note: "GPU landlords. Loss-making at 100–700% growth, capex at multiples of revenue, financed by GPU-backed debt with an NVIDIA backstop.",
      companies: [
        { name: "CoreWeave", period: "Q1 2026", runRate: 8.3, netIncome: -3.0, capexGuide: 33, debt: 21, backlog: 99.4, valuation: 60, tag: "Q1 loss annualized; backlog 4×’d in a year; Meta $35B, OpenAI $22B contracts" },
        { name: "Nebius", period: "Q1 2026", runRate: 1.9, netIncome: -0.4, capexGuide: 22.5, debt: 6.1, backlog: 50, valuation: 25, tag: "Microsoft $17.4B + Meta $27B deals; >4 GW contracted power" },
        { name: "Lambda, Crusoe, Together AI", period: "mid-2026 est", runRate: 4, netIncome: -0.8, capexGuide: 15, debt: 11, backlog: 20, valuation: 47, tag: "IPO queue forming; Crusoe builds Stargate Abilene" },
      ],
    },
    {
      id: "startups", name: "AI startups (virtual group)", cols: COLS_PRIVATE,
      note: "The application layer minus the big labs: coding agents, search, legal, voice, robotics. Only ~$10B of the top-34's $80B run-rate is not OpenAI/Anthropic.",
      companies: [
        { name: "Cursor, Perplexity, Cognition, Harvey, Glean, ElevenLabs, Figure + long tail", period: "mid-2026 est", runRate: 12, revenue: 6, netIncome: -25, funding: 300, valuation: 700, computeSpend: 10, tag: "aggregate estimates; VC-funded burn" },
      ],
    },
    {
      id: "power", name: "Power & datacenter builders", cols: COLS_PUBLIC,
      note: "Where the non-chip 40% of capex lands: shells, cooling, turbines, grid. Order books say the buildout is still accelerating.",
      companies: [
        { name: "Equinix + Digital Realty", period: "FY2026E", revenue: 17.1, netIncome: 2.8, capex: 7.9, capexGuide: 8, shareholder: 5, aiRev: null, tag: "1.2 GW under construction at DLR; $23B xScale program" },
        { name: "Vertiv", period: "FY2026E", revenue: 13.75, netIncome: 1.8, capex: 0.5, capexGuide: null, shareholder: 0.5, aiRev: null, tag: "orders +252% YoY; $15B backlog" },
        { name: "GE Vernova", period: "FY2026E", revenue: 46, netIncome: 3, capex: 1, capexGuide: null, shareholder: 1, aiRev: null, tag: "$176B backlog; 116 GW of gas turbines contracted" },
      ],
    },
  ];

  // ---- historical anchor points for the model (ecosystem-wide, $B) ----
  // aiCapex: AI-driven datacenter capex (chips + shells + power), all payers.
  //   Global ALL-datacenter capex was $455B (2024) and ~$715B (2025) per
  //   Dell'Oro; the AI-driven share below is our estimate of that.
  // endRev: end-customer AI revenue — what consumers + enterprises actually
  //   paid for AI products (subs, API, AI cloud, AI apps). NOT Gartner's
  //   $1.8T "AI spending" (that counts the hardware itself).
  const history = {
    2024: { aiCapex: 250, endRev: 25, vc: 114, debt: 25, returns: 200, gwAdded: 5 },
    2025: { aiCapex: 480, endRev: 60, vc: 202, debt: 100, returns: 230, gwAdded: 10 },
  };

  // ---- model defaults (the sliders), calibrated to mid-2026 reporting ----
  const defaults = {
    // demand
    endRev26: 150,        // Gartner: $64B models+platforms + Menlo enterprise + app layer + consumer
    demandGrowth: 70,     // % growth in 2027 (top-34 run-rate +112% in 6mo of 2026)
    demandFade: 15,       // pp less growth each later year
    // buildout
    capex26: 850,         // big-5 guides ~$800B + neoclouds ~$70B + labs' own
    capexGrowth: 20,      // % growth 2027 (street consensus still rising)
    capexFade: 8,         // pp less growth each later year (can go negative)
    gpuShare: 60,         // % of capex on chips/servers/networking (MS: ~60% to hardware)
    costPerGw: 50,        // $B all-in per GW of AI datacenter
    deprYears: 5,         // hyperscalers use 5–6; Burry/Kupperman argue 2–3
    // funding
    vc26: 400,            // financial VC into AI. H1 2026 gross was ~$400B but that
                          // included the strategic checks counted under vendor26
                          // (NVIDIA/Amazon/Google/MSFT money inside the mega-rounds);
                          // 400 as a full-year financial-only figure assumes H2 cools.
    vcGrowth: -10,        // %/yr — mega-round pace assumed to cool
    debt26: 220,          // AI-linked bonds + SPVs + GPU-backed loans, 2026 run-rate
    debtGrowth: 10,       // %/yr
    vendor26: 110,        // circular strategic financing: NVIDIA $42B + Amazon $50B + Google $10B + MSFT $5B into labs
    // economics
    chipMargin: 50,       // blended hardware-layer operating margin (NVIDIA ~55 net, memory ~75, OEMs ~5)
    cloudMargin: 25,      // compute-layer operating margin on AI revenue
    hurdle: 10,           // required pre-tax return on net AI PP&E, %
    payout: 40,           // % of ecosystem profits returned to shareholders (buybacks being cut)
    opexPerGw: 2.0,       // $B per GW-year to run (power, staff, network)
  };

  const sliders = [
    { group: "Demand", color: "var(--c-demand)", items: [
      { id: "endRev26", label: "AI end-revenue 2026", unit: "$B", min: 40, max: 500, step: 10, hint: "What customers actually pay for AI this year" },
      { id: "demandGrowth", label: "Revenue growth 2027", unit: "%", min: -20, max: 150, step: 5 },
      { id: "demandFade", label: "Growth fade per year", unit: "pp", min: 0, max: 40, step: 1, hint: "How fast hypergrowth cools" },
    ]},
    { group: "Buildout", color: "var(--c-capex)", items: [
      { id: "capex26", label: "AI capex 2026", unit: "$B", min: 200, max: 1500, step: 25 },
      { id: "capexGrowth", label: "Capex growth 2027", unit: "%", min: -50, max: 100, step: 5 },
      { id: "capexFade", label: "Capex growth fade", unit: "pp", min: 0, max: 50, step: 1, hint: "Set high to make capex peak and roll over" },
      { id: "gpuShare", label: "Chips & servers share", unit: "%", min: 30, max: 80, step: 5, hint: "Rest goes to shells, cooling, power" },
      { id: "costPerGw", label: "Cost per GW", unit: "$B", min: 20, max: 80, step: 5 },
      { id: "deprYears", label: "Depreciation life", unit: "yr", min: 2, max: 8, step: 1, hint: "Hyperscalers say 5–6, critics say 2–3" },
    ]},
    { group: "Funding", color: "var(--c-debt)", items: [
      { id: "vc26", label: "VC into AI 2026", unit: "$B", min: 0, max: 800, step: 10, hint: "H1 2026 gross was ~$400B incl. strategic money" },
      { id: "vcGrowth", label: "VC growth", unit: "%/yr", min: -60, max: 60, step: 5 },
      { id: "debt26", label: "Debt financing 2026", unit: "$B", min: 0, max: 600, step: 10 },
      { id: "debtGrowth", label: "Debt growth", unit: "%/yr", min: -60, max: 60, step: 5 },
      { id: "vendor26", label: "Circular financing", unit: "$B/yr", min: 0, max: 300, step: 5, hint: "Chip makers & clouds investing in their own customers" },
    ]},
    { group: "Economics", color: "var(--c-returns)", items: [
      { id: "chipMargin", label: "Hardware margin", unit: "%", min: 20, max: 65, step: 5 },
      { id: "cloudMargin", label: "Compute margin", unit: "%", min: 0, max: 50, step: 5 },
      { id: "hurdle", label: "Required return", unit: "%", min: 0, max: 25, step: 1, hint: "Pre-tax return investors demand on the fleet" },
      { id: "payout", label: "Payout ratio", unit: "%", min: 0, max: 100, step: 5, hint: "Share of profits going to buybacks + dividends" },
      { id: "opexPerGw", label: "Opex per GW-year", unit: "$B", min: 0.5, max: 5, step: 0.25 },
    ]},
  ];

  // ---- scenario presets ----
  const scenarios = {
    base: { label: "Base", overrides: {} },
    boom: {
      label: "AI delivers",
      overrides: { endRev26: 190, demandGrowth: 100, demandFade: 12, capexGrowth: 30, capexFade: 8, deprYears: 6, vc26: 450, vcGrowth: 5, debtGrowth: 15 },
    },
    pop: {
      label: "The pop",
      overrides: { endRev26: 110, demandGrowth: 40, demandFade: 18, capexGrowth: 0, capexFade: 30, deprYears: 3, vc26: 350, vcGrowth: -45, debtGrowth: -30, vendor26: 150, payout: 25 },
    },
    soft: {
      label: "Soft landing",
      overrides: { endRev26: 150, demandGrowth: 55, demandFade: 8, capexGrowth: 5, capexFade: 6, deprYears: 5, vcGrowth: -20, debtGrowth: -5 },
    },
  };

  // ---- internal split assumptions (documented in methodology) ----
  const splits = {
    endRevToLabs: 0.40,       // share of end revenue billed by labs (ChatGPT, Claude, API…)
    endRevToClouds: 0.42,     // share billed as AI cloud by hyperscalers/neoclouds
    endRevToStartups: 0.18,   // share billed by application startups
    vcToLabs: 0.70,           // share of VC going to labs (OpenAI+Anthropic = 43% of ALL VC in H1 2026)
    labComputeRatio: 1.15,    // 2026: labs' compute spend per $1 of revenue (glides to matureLabCompute)
    matureLabCompute: 0.55,   // ...by 2032, if scale economics work
    labOtherRatio: 0.55,      // 2026: salaries & everything else per $1 of lab revenue
    matureLabOther: 0.32,     // ...by 2032
    startupApiShare: 0.35,    // startups' model-API bill as share of their revenue
    neocloudShare: 0.18,      // share of AI compute rented from neoclouds
    hyperscalerCapexShare: 0.80, // share of ecosystem capex spent by hyperscalers
    fabsShare: 0.35,          // chip revenue passed through to fabs+memory (COGS)
    nonInfraCostFactor: 1.20, // end revenue must also cover the model/app layer above infra
  };

  const meta = {
    updated: "July 26, 2026",
    horizon: [2024, 2031],
    presentYear: 2026,
  };

  // ---- headline aggregates used around the page ----
  const aggregates = {
    contractedBacklog: 1930,  // MSFT RPO $627B + Oracle $638B + Google Cloud $514B + CoreWeave $99B + Nebius $50B
    dcCapex2025: 715,         // Dell'Oro, all datacenter capex CY2025 (+57% YoY)
    dcCapex2026F: 1000,       // Dell'Oro forecast CY2026
    aiVcH1_2026: 400,         // Crunchbase: ~80% of a record $510B global VC half
    cahnQuestion: 3000,       // David Cahn's "$3 trillion question" (rev needed for 2026 infra spend)
    bainNeed2030: 2000,       // Bain: annual AI revenue needed by 2030…
    bainShortfall: 800,       // …and the projected shortfall
    kuppermanBreakeven: 400,  // revenue needed to break even on 2025 capex alone ($320–480B)
    burryDepreciation: 176,   // Burry: understated depreciation 2026–28 across big tech
  };

  const sources = [
    "Company filings & earnings calls: Microsoft, Alphabet, Amazon, Meta, Oracle, NVIDIA, AMD, Broadcom, TSMC, Micron, SK Hynix, Dell, Supermicro, CoreWeave, Nebius, Equinix, Digital Realty, Vertiv, GE Vernova (through Jul 2026)",
    "Dell'Oro Group — datacenter capex: $455B (2024), ~$715B (2025), >$1T forecast (2026), $1.7T/yr by 2030",
    "Goldman Sachs — AI capex $765B (2026E), $1.6T (2031E); US datacenter additions 13.6 GW (2026E)",
    "Morgan Stanley — $2.9T datacenter investment through 2028; JPMorgan — $5.5T through 2030; McKinsey — $5.2T & 156 GW by 2030",
    "Gartner — AI models & platforms end-user spend: $39B (2025), $64B (2026E); Menlo Ventures — enterprise GenAI $37B (2025)",
    "Crunchbase / PitchBook — AI VC: $50B (2023), $114B (2024), $202B (2025), ~$400B (H1 2026); OpenAI+Anthropic = 43% of all H1-2026 VC",
    "Press reporting on private companies (The Information, Bloomberg, Reuters, CNBC, WSJ, TechCrunch, Sacra): OpenAI ~$25–33B run-rate, $852B valuation, ~$50B 2026 compute spend, ~$600B committed through 2030; Anthropic claimed $47B run-rate, $965B valuation; xAI/SpaceX compute-rental ARR ~$26B",
    "Bubble math: David Cahn (Sequoia) '$3T question'; Bain — $2T revenue needed by 2030, ~$800B shortfall; Harris Kupperman — $320–480B break-even on 2025 capex; Michael Burry — $176B understated depreciation (contested by NVIDIA, CoreWeave)",
    "Circular-deal reporting: NVIDIA $30B into OpenAI + $10B Anthropic + $2B xAI + CoreWeave backstop; Amazon $50B into OpenAI, $33B cumulative into Anthropic; Google up to $40B into Anthropic; Anthropic → xAI $1.25B/month; Google → SpaceX $920M/month",
  ];

  return { groups, GROUP_COLORS, history, defaults, sliders, scenarios, splits, meta, aggregates, sources };
})();
