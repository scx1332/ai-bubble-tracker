/* ============================================================
   AI Bubble Simulator — dataset (compiled late July 2026)
   All money figures in billions of USD unless noted.
   "period" tells you what window each figure covers.

   The ecosystem is modelled as two blocs. Export controls have
   split the AI buildout into two largely separate money loops:
   the US-led one (NVIDIA silicon, TSMC wafers, venture capital)
   and China's (Huawei and Cambricon silicon, SMIC wafers, state
   and platform money). They share customers and a thin stream of
   import spending, but almost nothing else — so they get their
   own parameters rather than being pooled into one average.

   Sources: company filings & earnings calls, Dell'Oro, Gartner,
   Crunchbase/PitchBook, Morgan Stanley, JPMorgan, McKinsey, Bain,
   Goldman Sachs, IDC, TrendForce, and press reporting on private
   companies. Everything about private companies is an estimate.
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
    cnPlatforms: "var(--c-compute)",
    cnChips: "var(--c-capex)",
    cnMemory: "var(--c-capex)",
    cnLabs: "var(--c-vc)",
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
  const COLS_CN_CHIPS = [
    ["revenue", "Revenue"], ["netIncome", "Net income"], ["aiRev", "AI chip rev"],
    ["capex", "Capex"], ["valuation", "Market cap"],
  ];
  const COLS_CN_PLAT = [
    ["revenue", "Revenue"], ["netIncome", "Net income"], ["capex", "Capex"],
    ["capexGuide", "Capex plan"], ["aiRev", "Cloud rev"], ["shareholder", "Buybacks + divs"],
  ];

  const groups = [
    {
      id: "hyperscalers", name: "Hyperscalers", cols: COLS_PUBLIC, bloc: "us",
      note: "Rent AI compute and fund most of the buildout — increasingly with debt and cut buybacks. 2026 capex guides total ~$800B.",
      companies: [
        { name: "Microsoft", logo: "microsoft", period: "TTM Mar 2026", revenue: 318.3, netIncome: 125.2, capex: 135, capexGuide: 190, shareholder: 42.5, aiRev: 37, tag: "AI run-rate $37B; RPO $627B incl. OpenAI" },
        { name: "Alphabet", logo: "alphabet", period: "FY2025 + TTM", revenue: 445.9, netIncome: 132.2, capex: 132.4, capexGuide: 200, shareholder: 55.7, aiRev: 58.7, tag: "buybacks halted 2026; raised $49.6B equity + $74B debt for capex" },
        { name: "Amazon", logo: "amazon", period: "TTM Mar 2026", revenue: 742.7, netIncome: 90.9, capex: 150, capexGuide: 200, shareholder: 0, aiRev: 128.7, tag: "AWS FY25; AI run-rate >$15B; TTM FCF ~$1B" },
        { name: "Meta", logo: "meta", period: "TTM Mar 2026", revenue: 215, netIncome: 70.6, capex: 78.4, capexGuide: 135, shareholder: 31.6, aiRev: null, tag: "$55B bonds + $27B SPV debt; no AI segment disclosed" },
        { name: "Oracle", logo: "oracle", period: "FY2026 (May)", revenue: 67.4, netIncome: 17.0, capex: 55.7, capexGuide: 92.5, shareholder: 5.9, aiRev: 18.1, tag: "RPO $638B (OpenAI $300B); FCF −$23.7B" },
      ],
    },
    {
      id: "chips", name: "Chip designers & AI hardware", cols: COLS_PUBLIC, bloc: "us",
      note: "Where most capex lands, at extraordinary margins. NVIDIA alone: ~$330B run-rate, and >$40B invested back into its own customers in 2026.",
      companies: [
        { name: "NVIDIA", logo: "nvidia", period: "FY2026 (Jan)", revenue: 215.9, netIncome: 120, capex: 5, capexGuide: null, shareholder: 41.1, aiRev: 193.7, tag: "Q1 FY27 run-rate ~$326B; $119B supply commitments; $42B equity into AI labs/neoclouds" },
        { name: "AMD", logo: "amd", period: "Q1 2026 ann.", revenue: 41, netIncome: 5.6, capex: 1.5, capexGuide: null, shareholder: 0.9, aiRev: 23.2, tag: "OpenAI 6 GW deal + warrant for ~10% of AMD" },
        { name: "Broadcom", logo: "broadcom", period: "Q2 FY26 ann.", revenue: 88.8, netIncome: 37.2, capex: 1, capexGuide: null, shareholder: 15.5, aiRev: 56, tag: "FY26 AI rev guide ~$56B; >$100B line of sight FY27" },
        { name: "Dell + Supermicro", logo: "dell", period: "FY2026", revenue: 153.5, netIncome: 8, capex: 3, capexGuide: null, shareholder: 6, aiRev: 65, tag: "AI servers: thin margins, $51B Dell backlog" },
      ],
    },
    {
      id: "fabs", name: "Fabs & memory", cols: COLS_PUBLIC, bloc: "us",
      note: "The chokepoint. Memory margins (85% on commodity DRAM) are the clearest mean-reversion risk in the whole stack.",
      companies: [
        { name: "TSMC", logo: "tsmc", period: "CY2026E", revenue: 172, netIncome: 75, capex: 62, capexGuide: 62, shareholder: 15, aiRev: 106, tag: "HPC ~2/3 of revenue; record 67.7% gross margin" },
        { name: "SK Hynix", logo: "skhynix", period: "Q1 2026 ann.", revenue: 144, netIncome: 110, capex: 20, capexGuide: null, shareholder: 1.5, aiRev: 84, tag: "~58% HBM share; 72–77% operating margin" },
        { name: "Micron", logo: "micron", period: "FQ3 2026 ann.", revenue: 166, netIncome: 113, capex: 27, capexGuide: 27, shareholder: 1, aiRev: 90, tag: "quarterly revenue 4.5× YoY; 85% gross margin" },
      ],
    },
    {
      id: "labs", name: "AI labs", cols: COLS_PRIVATE, bloc: "us",
      note: "Frontier model builders. Revenue is exploding but every dollar of it costs more than a dollar to serve — the gap is filled by VC and vendors.",
      companies: [
        { name: "OpenAI", logo: "openai", period: "mid-2026", runRate: 29, revenue: 13, netIncome: -14, funding: 180, valuation: 852, computeSpend: 50, tag: "~$600B compute committed through 2030 (reset from $1.4T); S-1 filed" },
        { name: "Anthropic", logo: "anthropic", period: "mid-2026", runRate: 47, revenue: 10, netIncome: -6, funding: 128, valuation: 965, computeSpend: 20, tag: "claimed run-rate, unaudited; ~$275B compute commitments; S-1 submitted" },
        { name: "xAI (SpaceX)", logo: "spacex", period: "mid-2026", runRate: 26.5, revenue: 0.5, netIncome: -10, funding: 42, valuation: 250, computeSpend: 12, tag: "now mostly a compute seller: Anthropic $15B/yr + Google $11B/yr rent Colossus" },
        { name: "Mistral, SSI, Thinking Machines, Cohere", logo: "mistral", period: "mid-2026", runRate: 1.2, revenue: 0.7, netIncome: -3, funding: 12, valuation: 71, computeSpend: 3, tag: "second tier: 40–50× ARR valuations; Thinking Machines' $50B round collapsed" },
      ],
    },
    {
      id: "neoclouds", name: "Neoclouds", cols: COLS_NEO, bloc: "us",
      note: "GPU landlords. Loss-making at 100–700% growth, capex at multiples of revenue, financed by GPU-backed debt with an NVIDIA backstop.",
      companies: [
        { name: "CoreWeave", logo: "coreweave", period: "Q1 2026", runRate: 8.3, netIncome: -3.0, capexGuide: 33, debt: 21, backlog: 99.4, valuation: 60, tag: "Q1 loss annualized; backlog 4×’d in a year; Meta $35B, OpenAI $22B contracts" },
        { name: "Nebius", logo: "nebius", period: "Q1 2026", runRate: 1.9, netIncome: -0.4, capexGuide: 22.5, debt: 6.1, backlog: 50, valuation: 25, tag: "Microsoft $17.4B + Meta $27B deals; >4 GW contracted power" },
        { name: "Lambda, Crusoe, Together AI", logo: "lambda", period: "mid-2026 est", runRate: 4, netIncome: -0.8, capexGuide: 15, debt: 11, backlog: 20, valuation: 47, tag: "IPO queue forming; Crusoe builds Stargate Abilene" },
      ],
    },
    {
      id: "startups", name: "AI startups (virtual group)", cols: COLS_PRIVATE, bloc: "us",
      note: "The application layer minus the big labs: coding agents, search, legal, voice, robotics. Only ~$10B of the top-34's $80B run-rate is not OpenAI/Anthropic.",
      companies: [
        { name: "Cursor, Perplexity, Cognition, Harvey, Glean, ElevenLabs, Figure + long tail", logo: "startups", period: "mid-2026 est", runRate: 12, revenue: 6, netIncome: -25, funding: 300, valuation: 700, computeSpend: 10, tag: "aggregate estimates; VC-funded burn" },
      ],
    },
    {
      id: "power", name: "Power & datacenter builders", cols: COLS_PUBLIC, bloc: "us",
      note: "Where the non-chip 40% of capex lands: shells, cooling, turbines, grid. Order books say the buildout is still accelerating.",
      companies: [
        { name: "Equinix + Digital Realty", logo: "equinix", period: "FY2026E", revenue: 17.1, netIncome: 2.8, capex: 7.9, capexGuide: 8, shareholder: 5, aiRev: null, tag: "1.2 GW under construction at DLR; $23B xScale program" },
        { name: "Vertiv", logo: "vertiv", period: "FY2026E", revenue: 13.75, netIncome: 1.8, capex: 0.5, capexGuide: null, shareholder: 0.5, aiRev: null, tag: "orders +252% YoY; $15B backlog" },
        { name: "GE Vernova", logo: "gevernova", period: "FY2026E", revenue: 46, netIncome: 3, capex: 1, capexGuide: null, shareholder: 1, aiRev: null, tag: "$176B backlog; 116 GW of gas turbines contracted" },
      ],
    },

    // ---------------- China bloc ----------------
    {
      id: "cnChips", name: "Chinese AI silicon", cols: COLS_CN_CHIPS, bloc: "cn",
      note: "Domestic accelerators now carry ~79% of China's AI chip spend by value, up from ~66% — less because they got competitive than because both governments closed the border.",
      companies: [
        { name: "Huawei (Ascend)", logo: "huawei", period: "FY2025", revenue: 130.1, netIncome: 10.0, aiRev: 7.5, capex: null, valuation: null, tag: "unlisted, no capex disclosed; ~$12B AI-chip revenue targeted for 2026 (internal figure, unverified); ~300k 910C shipped 2025, ~600k targeted 2026" },
        { name: "Cambricon", logo: "cambricon", period: "TTM Mar 2026", revenue: 1.22, netIncome: 0.40, aiRev: 1.22, capex: null, valuation: 113.7, tag: "first profitable year in 2025; trades near 93× sales; ~2nd-largest allocation of SMIC advanced-node capacity" },
        { name: "Hygon", logo: "hygon", period: "FY2025", revenue: 2.12, netIncome: 0.38, aiRev: null, capex: null, valuation: 107.8, tag: "CPU/DCU split never disclosed; Sugon merger terminated Dec 2025" },
        { name: "Moore Threads, MetaX, Biren, Enflame", logo: "cndragons", period: "FY2025", revenue: 0.76, netIncome: -0.6, aiRev: 0.76, capex: null, valuation: 101.8, tag: "three listed Dec 2025–Jan 2026 at 75–200× sales; losses shown on an operating basis (Biren's headline loss is a one-off listing charge)" },
        { name: "Alibaba T-Head + Baidu Kunlunxin", logo: "cninhouse", period: "2026 run-rate", revenue: 2.0, netIncome: null, aiRev: 2.0, capex: null, valuation: null, tag: "in-house silicon, roughly break-even; Alibaba discloses 560k chips shipped cumulatively; Kunlunxin filed for listing" },
      ],
    },
    {
      id: "cnMemory", name: "Chinese fabs & memory", cols: COLS_CN_CHIPS, bloc: "cn",
      note: "The real ceiling on China's buildout. Logic capacity is not binding — HBM is, and CXMT has just chosen 70%-margin commodity DRAM over it.",
      companies: [
        { name: "SMIC", logo: "smic", period: "FY2025", revenue: 9.33, netIncome: 0.69, aiRev: null, capex: 8.1, valuation: null, tag: "~45k wpm advanced node, planning to double in 2026; 20% gross margin on 93.5% utilization — yield economics, not wafer starts, is the problem" },
        { name: "CXMT", logo: "cxmt", period: "FY2025", revenue: 8.6, netIncome: 1.0, aiRev: null, capex: null, valuation: 85, tag: "largest STAR Market IPO ever (Jul 2026, raised $8.6B); ~9% of world DRAM; HBM still ~5k wpm and publicly deprioritized" },
        { name: "YMTC", logo: "ymtc", period: "Q1 2026 ann.", revenue: 11.8, netIncome: null, aiRev: null, capex: 3.06, valuation: null, tag: "NAND not HBM, so not on the AI critical path; ~13% world NAND share; pre-IPO coaching started May 2026" },
      ],
    },
    {
      id: "cnLabs", name: "Chinese AI labs", cols: COLS_PRIVATE, bloc: "cn",
      note: "Chinese models now serve ~58% of the tokens consumed by US firms, at a tenth to a thirtieth of US prices — so they win volume share and lose revenue share. Hong Kong's January 2026 listing window re-rated the sector 5–17× in weeks on revenues still measured in tens of millions.",
      companies: [
        { name: "DeepSeek", logo: "deepseek", period: "mid-2026", runRate: null, revenue: null, netIncome: null, funding: 7.4, valuation: 52, computeSpend: null, tag: "no longer self-funded by High-Flyer: $7.4B raised Jun 2026, the largest Asian round of the quarter; a follow-on at $71B stalled in July" },
        { name: "Zhipu AI / Z.ai", logo: "zhipu", period: "FY2025 + Mar 2026", runRate: 0.25, revenue: 0.10, netIncome: -0.45, funding: 0.54, valuation: 56, computeSpend: null, tag: "first pure-play model developer to IPO (HKEX, Jan 2026); peaked near $112B on $101M of revenue; raised API prices 83% while rivals cut" },
        { name: "Moonshot AI (Kimi)", logo: "moonshot", period: "mid-2026", runRate: 0.20, revenue: null, netIncome: null, funding: 3.9, valuation: 20, computeSpend: null, tag: "valuation ladder $4.3B → $20B in eight months, $50B pre-IPO target; Kimi K3 is priced at parity with Claude Sonnet" },
        { name: "MiniMax", logo: "minimax", period: "FY2025", runRate: null, revenue: 0.08, netIncome: null, funding: 0.62, valuation: 33, computeSpend: null, tag: "HKEX Jan 2026, closed day one above 5× issue; >70% of revenue from outside China" },
        { name: "StepFun, Baichuan, 01.AI + tail", logo: "stepfun", period: "mid-2026", runRate: null, revenue: null, netIncome: null, funding: 3.2, valuation: null, computeSpend: null, tag: "consolidating: StepFun raised ~$2.5B pre-IPO, while Baichuan and 01.AI have announced no round in 18 months" },
      ],
    },
  ];

  // ============================================================
  //  BLOC CONFIGURATION
  // ============================================================

  const blocs = {
    us: {
      id: "us",
      label: "US-led",
      long: "the US-led bloc",
      gwBase: 3,          // installed AI capacity entering 2024, GW
      pre: { 2023: { aiCapex: 150 } },
      vendorHistory: { 2024: 10, 2025: 40 },

      // ---- historical anchors ($B) ----
      // aiCapex: AI-driven datacenter capex (chips + shells + power), all payers.
      //   Global ALL-datacenter capex was $455B (2024) and ~$715B (2025) per
      //   Dell'Oro; the AI-driven share below is our estimate of that.
      // endRev: end-customer AI revenue — what consumers + enterprises actually
      //   paid for AI products (subs, API, AI cloud, AI apps). NOT Gartner's
      //   $1.8T "AI spending" (that counts the hardware itself).
      history: {
        2024: { aiCapex: 250, endRev: 25, vc: 114, debt: 25, returns: 200, gwAdded: 5 },
        2025: { aiCapex: 480, endRev: 60, vc: 202, debt: 100, returns: 230, gwAdded: 10 },
      },

      splits: {
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
        hyperscalerCapexShare: 0.80, // share of bloc capex spent by hyperscalers
        fabsShare: 0.35,          // chip revenue passed through to fabs+memory (COGS)
        opCashMargin: 0.55,       // cash margin on AI cloud revenue before capex
        nonInfraCostFactor: 1.20, // end revenue must also cover the model/app layer above infra
      },

      nodeLabels: {
        lab: { note: "OpenAI, Anthropic, xAI, Mistral…" },
        hyp: { note: "Microsoft, Google, Amazon, Meta, Oracle" },
        neo: { note: "CoreWeave, Nebius, Lambda, Crusoe…" },
        tre: { note: "Capex not covered by AI cash flow or debt — subsidized by search, ads and Windows profits" },
        vcfLab: "VC/PE equity into frontier labs",
        vcfNeo: "Equity raised by neoclouds (IPO/secondary)",
        dbtNeo: "GPU-backed loans and bonds",
        dbtHyp: "Investment-grade bonds funding capex",
        hypChp: "Hyperscaler chip & server orders",
        neoChp: "Neocloud GPU purchases",
        chpFab: "Wafers, HBM and components (COGS)",
        circChp: "Circular: NVIDIA & co investing in the labs that buy their chips",
        circHyp: "Circular: hyperscalers investing in the labs that rent their clouds",
      },

      defaults: {
        // demand
        endRev26: 150,        // Gartner: $64B models+platforms + Menlo enterprise + app layer + consumer
        demandGrowth: 70,     // % growth in 2027 (top-34 run-rate +112% in 6mo of 2026)
        demandFade: 15,       // pp less growth each later year
        // buildout
        capex26: 850,         // big-5 guides ~$800B + neoclouds ~$70B + labs' own
        capexGrowth: 20,      // % growth 2027 (street consensus still rising)
        capexFade: 8,         // pp less growth each later year (can go negative)
        gpuShare: 60,         // % of capex on chips/servers/networking
        costPerGw: 50,        // $B all-in per GW of AI datacenter
        deprYears: 5,         // hyperscalers use 5–6; Burry/Kupperman argue 2–3
        importShare: 0,       // the US-led bloc builds its own accelerators
        // funding
        vc26: 400,            // financial VC into AI. H1 2026 gross was ~$400B but that
                              // included the strategic checks counted under vendor26
                              // (NVIDIA/Amazon/Google/MSFT money inside the mega-rounds);
                              // 400 as a full-year financial-only figure assumes H2 cools.
        vcGrowth: -10,        // %/yr — mega-round pace assumed to cool
        debt26: 220,          // AI-linked bonds + SPVs + GPU-backed loans, 2026 run-rate
        debtGrowth: 10,       // %/yr
        vendor26: 110,        // circular financing: NVIDIA $42B + Amazon $50B + Google $10B + MSFT $5B into labs
        // economics
        chipMargin: 50,       // blended hardware-layer operating margin (NVIDIA ~55 net, memory ~75, OEMs ~5)
        cloudMargin: 25,      // compute-layer operating margin on AI revenue
        hurdle: 10,           // required pre-tax return on net AI PP&E, %
        payout: 40,           // % of profits returned to shareholders (buybacks being cut)
        opexPerGw: 2.0,       // $B per GW-year to run (power, staff, network)
      },

      sliders: [
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
      ],
    },
  };

  blocs.cn = {
    id: "cn",
    label: "China",
    long: "China's bloc",
    castNote: "A separate stack on domestic silicon, roughly a sixth the size of the US-led buildout.",
    gwBase: 2,
    pre: { 2023: { aiCapex: 25 } },
    vendorHistory: { 2024: 4, 2025: 10 },

    // aiCapex: China AI/datacenter capex, platforms + state/telco projects.
    //   ~$70B (2025 actual) rising to $100–120B (2026E) — roughly a sixth of
    //   the US-led bloc, which guides to ~$800B for the big five alone.
    history: {
      2024: { aiCapex: 45, endRev: 6, vc: 45, debt: 25, returns: 40, gwAdded: 2 },
      2025: { aiCapex: 70, endRev: 14, vc: 58, debt: 35, returns: 45, gwAdded: 3.5 },
    },

    splits: {
      endRevToLabs: 0.25,       // Chinese labs monetize models far more weakly…
      endRevToClouds: 0.55,     // …most AI money is billed as cloud by the platforms
      endRevToStartups: 0.20,
      vcToLabs: 0.40,           // much state money funds fabs and datacenters, not labs
      labComputeRatio: 1.30,
      matureLabCompute: 0.60,
      labOtherRatio: 0.50,
      matureLabOther: 0.30,
      startupApiShare: 0.30,
      neocloudShare: 0.30,      // telco and state clouds carry a bigger share than US neoclouds
      hyperscalerCapexShare: 0.55, // the rest is state, provincial and telco projects
      fabsShare: 0.40,          // more of the domestic chip dollar reaches SMIC/CXMT
      opCashMargin: 0.45,       // thinner cloud margins than AWS/Azure
      nonInfraCostFactor: 1.20,
    },

    nodeLabels: {
      lab: { label: "AI labs", note: "DeepSeek, Moonshot, Zhipu, MiniMax, StepFun" },
      hyp: { label: "Platforms", note: "Alibaba, Tencent, ByteDance, Baidu, Huawei Cloud" },
      neo: { label: "Telco & state clouds", note: "China Mobile/Telecom/Unicom and provincial compute hubs" },
      chp: { label: "Huawei & domestic chips", note: "Ascend, Cambricon, Hygon, in-house platform silicon" },
      fab: { label: "SMIC, CXMT & parts", note: "Domestic wafers, DRAM and components" },
      vcf: { label: "State funds & VC", note: "Big Fund tranches, national and provincial AI funds, and a much thinner venture layer" },
      dbt: { label: "Debt & local govt bonds", note: "Bank lending and local-government special bonds financing compute hubs" },
      tre: { label: "Platform treasuries", note: "Capex funded from commerce, gaming and advertising profits" },
      imp: { label: "Foreign chip vendors", note: "Export-compliant imports — the one place this bloc's money leaves for the other" },
      inv: { label: "Shareholders (buybacks + divs)", note: "Alibaba and Tencent return real cash; the state-backed chip firms do not" },
      vcfLab: "State and venture money into the labs",
      vcfNeo: "State and provincial equity into compute hubs",
      dbtNeo: "Bank loans and local-government bonds",
      dbtHyp: "Corporate bonds funding platform capex",
      treHyp: "Capex funded from platform profits",
      hypChp: "Platform orders for domestic accelerators",
      neoChp: "Telco and state cloud orders for domestic accelerators",
      hypImp: "Export-compliant foreign accelerators — money leaving the bloc",
      neoImp: "Export-compliant foreign accelerators — money leaving the bloc",
      chpFab: "Domestic wafers, DRAM and components (COGS)",
      circChp: "Circular: chip makers and their state backers funding the labs that buy the chips",
      circHyp: "Circular: platforms investing in the labs that rent their clouds",
    },

    defaults: {
      // demand — CALIBRATION PENDING: refine against China AI revenue research
      endRev26: 30,
      demandGrowth: 65,
      demandFade: 15,
      // buildout — grounded: $70B actual 2025 → $100–120B 2026E
      capex26: 110,
      capexGrowth: 25,      // state "AI+" push plus the platforms' raised plans
      capexFade: 10,
      gpuShare: 55,         // cheaper silicon, so relatively more spent on shells and power
      costPerGw: 35,        // cheaper land, construction and power than the US
      deprYears: 5,
      importShare: 20,      // domestic share of AI chip value ~79% in 2026, up from ~66%
      // funding. Chinese AI VC ran ~$10–11B/yr through 2024–25 and jumped to
      // ~$30–35B in H1 2026 alone (DeepSeek $7.4B, StepFun $2.5B, Moonshot
      // $2B). Roughly half to two-thirds of it is state money: government
      // guidance funds supply ~55% of all LP capital in Chinese PE/VC and
      // 60–70% of deep-tech investment, so this line is counter-cyclical and
      // does not price-discover the way the US venture layer does.
      vc26: 70,
      vcGrowth: 5,
      debt26: 60,
      debtGrowth: 10,
      vendor26: 15,
      // economics
      chipMargin: 35,       // domestic accelerators earn nothing like NVIDIA's margin
      cloudMargin: 20,
      hurdle: 6,            // state-directed capital tolerates a lower return
      payout: 25,           // the platforms buy back; the state-backed chip firms do not
      opexPerGw: 1.6,       // cheaper power, and no grid scarcity premium
    },

    sliders: [
      { group: "Demand", color: "var(--c-demand)", items: [
        { id: "endRev26", label: "AI end-revenue 2026", unit: "$B", min: 5, max: 200, step: 5, hint: "Chinese customers pay far less per token" },
        { id: "demandGrowth", label: "Revenue growth 2027", unit: "%", min: -20, max: 150, step: 5 },
        { id: "demandFade", label: "Growth fade per year", unit: "pp", min: 0, max: 40, step: 1 },
      ]},
      { group: "Buildout", color: "var(--c-capex)", items: [
        { id: "capex26", label: "AI capex 2026", unit: "$B", min: 20, max: 500, step: 10, hint: "$70B in 2025; the drafted national compute plan would add far more" },
        { id: "capexGrowth", label: "Capex growth 2027", unit: "%", min: -50, max: 100, step: 5 },
        { id: "capexFade", label: "Capex growth fade", unit: "pp", min: 0, max: 50, step: 1 },
        { id: "gpuShare", label: "Chips & servers share", unit: "%", min: 30, max: 80, step: 5 },
        { id: "costPerGw", label: "Cost per GW", unit: "$B", min: 15, max: 70, step: 5, hint: "Cheaper to build and power than the US" },
        { id: "deprYears", label: "Depreciation life", unit: "yr", min: 2, max: 8, step: 1 },
        { id: "importShare", label: "Imported silicon share", unit: "%", min: 0, max: 70, step: 5, hint: "The one edge where this bloc's money leaves for the other" },
      ]},
      { group: "Funding", color: "var(--c-debt)", items: [
        { id: "vc26", label: "State funds & VC 2026", unit: "$B", min: 0, max: 300, step: 5, hint: "Big Fund tranches, national and provincial AI funds, plus venture" },
        { id: "vcGrowth", label: "Funding growth", unit: "%/yr", min: -60, max: 60, step: 5 },
        { id: "debt26", label: "Debt & govt bonds 2026", unit: "$B", min: 0, max: 300, step: 5 },
        { id: "debtGrowth", label: "Debt growth", unit: "%/yr", min: -60, max: 60, step: 5 },
        { id: "vendor26", label: "Circular financing", unit: "$B/yr", min: 0, max: 100, step: 5 },
      ]},
      { group: "Economics", color: "var(--c-returns)", items: [
        { id: "chipMargin", label: "Hardware margin", unit: "%", min: 10, max: 65, step: 5 },
        { id: "cloudMargin", label: "Compute margin", unit: "%", min: 0, max: 50, step: 5 },
        { id: "hurdle", label: "Required return", unit: "%", min: 0, max: 25, step: 1, hint: "State-directed capital can accept less" },
        { id: "payout", label: "Payout ratio", unit: "%", min: 0, max: 100, step: 5 },
        { id: "opexPerGw", label: "Opex per GW-year", unit: "$B", min: 0.5, max: 5, step: 0.25 },
      ]},
    ],
  };

  blocs.us.castNote = "The buildout the bubble debate is actually about.";

  // ---- scenario presets (per bloc) ----
  const scenarios = {
    base: { label: "Base", overrides: { us: {}, cn: {} } },
    boom: {
      label: "AI delivers",
      overrides: {
        us: { endRev26: 190, demandGrowth: 100, demandFade: 12, capexGrowth: 30, capexFade: 8, deprYears: 6, vc26: 450, vcGrowth: 5, debtGrowth: 15 },
        cn: { demandGrowth: 90, demandFade: 10, capexGrowth: 35, capexFade: 8, deprYears: 6 },
      },
    },
    pop: {
      label: "The pop",
      overrides: {
        us: { endRev26: 110, demandGrowth: 40, demandFade: 18, capexGrowth: 0, capexFade: 30, deprYears: 3, vc26: 350, vcGrowth: -45, debtGrowth: -30, vendor26: 150, payout: 25 },
        cn: { demandGrowth: 30, demandFade: 15, capexGrowth: -10, capexFade: 25, deprYears: 3, vcGrowth: -30 },
      },
    },
    soft: {
      label: "Soft landing",
      overrides: {
        us: { endRev26: 150, demandGrowth: 55, demandFade: 8, capexGrowth: 5, capexFade: 6, deprYears: 5, vcGrowth: -20, debtGrowth: -5 },
        cn: { demandGrowth: 50, demandFade: 8, capexGrowth: 10, capexFade: 8, deprYears: 5 },
      },
    },
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
    "China bloc — company reporting: Huawei annual report (FY2025 revenue $130.1B, AI-chip revenue per FT); SMIC, Cambricon, Hygon, Moore Threads, MetaX, Biren and Iluvatar filings; CXMT STAR Market prospectus (Jul 2026); Zhipu and MiniMax HKEX listings. RMB converted at 6.77–6.90/USD",
    "China bloc — analysis: SemiAnalysis (Ascend production ramp, CXMT), TrendForce and Digitimes (domestic share of AI chip value 66% → 79%), Bernstein (China AI accelerator market ~$36B in 2025), Dell'Oro and IDC (China datacenter capex), PitchBook and Crunchbase (China AI venture ~$10–11B/yr 2024–25, ~$30–35B H1 2026)",
    "China bloc — state capital: government guidance funds (2,178 funds, ~$900B raised) supply ~55% of LP capital in Chinese PE/VC; Big Fund phases I–III ~$96B; National VC Guidance Fund (RMB 100B seed, RMB 1T target); NDRC national compute plan reported at RMB 2T but still in draft",
    "China bloc — pricing and volume: published API price lists (DeepSeek, Z.ai, OpenAI, Anthropic, Google) and OpenRouter model data, July 2026 — Chinese models at roughly a tenth to a thirtieth of US prices while serving a majority of US firms' token volume",
  ];

  return { groups, GROUP_COLORS, blocs, defaults: blocs.us.defaults, sliders: blocs.us.sliders,
           scenarios, meta, aggregates, sources };
})();
