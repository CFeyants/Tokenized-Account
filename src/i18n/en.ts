/**
 * Every client-facing string of the mock-up. Add fr.ts with the same shape for a French version.
 * Vocabulary rule: ledger, account, unit, rule, blocked, released, final — no crypto words.
 */
export const en = {
  product: {
    name: 'Tokenised account',
    units: 'Term units',
    fund: 'Tokenised fund',
    rules: 'Rules',
    hood: 'Under the hood',
    tagline: 'Treasury, counted in minutes.',
    bank: 'BNP Paribas',
  },

  scenario: {
    e0: {
      title: 'Week starts. Payments day.',
      detail:
        'EUR 120m on the group current accounts at the bank. Nothing on the tokenised account yet.',
    },
    e1: {
      title: 'Supplier batch and Spanish payroll approved',
      detail:
        'SEPA supplier batch EUR 8.4m and payroll file for Spain EUR 2.1m. Traditional tools, nothing new.',
    },
    e2: {
      title: 'Instant collection from a key customer, EUR 12m',
      detail: 'SCT Inst, final at 17:45. On a current account it earns the sight rate for the day.',
    },
    e3: {
      title: 'Cut-off passed: surplus swept, overnight unit bought',
      detail:
        'Rule "sweep surplus above EUR 20m" moves EUR 101.5m to the tokenised account; rule "overnight unit on idle balance" buys a unit that minute.',
    },
    e4: {
      title: 'Night sweep from HSBC and Deutsche Bank, EUR 24m',
      detail:
        'EUR 15m from HSBC and EUR 9m from Deutsche Bank by instant transfer — final at once — straight into the overnight unit.',
    },
    e5: {
      title: 'USD 10m announced by the correspondent',
      detail:
        'Receipt for the US subsidiary. Cover not yet on our nostro: pending, not earning yet.',
    },
    e6: {
      title: 'Opening: overnight unit unwound, cash returned',
      detail:
        'EUR 60m back to the current account, EUR 15m to HSBC, EUR 9m to Deutsche Bank (their day needs). EUR 41.5m stays on the tokenised account as group buffer.',
    },
    e7: {
      title: 'USD cover received: USD 10m is final',
      detail:
        'Default choice applied: kept in USD and placed in a 1-month term unit at 3.90%. Interest counts from 10:30, not from Monday.',
    },
    e8: {
      title: 'Bid bond for Brazil: EUR 15m blocked as collateral',
      detail:
        'Exact amount blocked on the tokenised account; the bank issues the guarantee. The blocked amount keeps earning. Traditional: a cash gage at 0%.',
    },
    e9: {
      title: 'Durable surplus: 3-month term unit, EUR 50m',
      detail:
        'The cash forecast (traditional tool) shows EUR 50m of durable surplus. EUR 50m moved from the current account, 3-month unit bought at 2.20%.',
    },
    e10: {
      title: 'Tokenised fund order, EUR 10m — queued',
      detail:
        'Placed at 17:30, after fund hours (09:00–15:00). Queued for Friday 09:00; the cash stays in the overnight unit meanwhile.',
    },
    e11: {
      title: 'Fund order settled on the ledger',
      detail:
        'EUR 10m of fund units against EUR 10m of cash, in one step (delivery versus payment). No cash left the ledger.',
    },
    e12: {
      title: 'Weekend: three-day unit bought, night sweep again',
      detail:
        'Weekend threshold EUR 5m on the current account. EUR 24m swept from HSBC and Deutsche Bank. The blocked EUR 15m sits inside the unit, flagged not transferable.',
    },
    e13: {
      title: 'Singapore funded on Saturday night, EUR 10m → SGD',
      detail:
        'Supplier due Monday 08:00 in Singapore (Sunday 02:00 in Paris). Out-of-hours FX at the markets desk, within the night limit. The three-day unit is partly unwound to the minute.',
    },
    e14: {
      title: 'Brazil tender lost: guarantee expired, EUR 15m released',
      detail:
        'Release by rule on the tender result. Interest was earned for every minute of the block.',
    },
    e15: {
      title: 'Monday opening: units unwound, week-1 statement',
      detail:
        'EUR 60m back to the current account, EUR 24m returned to HSBC and Deutsche Bank, EUR 30.5m stays on the tokenised account.',
    },
    e16: {
      title: 'Acquisition signs early: EUR 20m of the 3-month unit sold',
      detail:
        'Sold to the bank at the day’s price (par + accrued − 2 bps). Cash on the tokenised account in minutes. Traditional: break a deposit and pay a penalty.',
    },
    e17: {
      title: 'Night payment to a supplier at another bank — not available',
      detail:
        'Available when banks exchange tokenised deposits (interbank ledger, 2028). Use SCT Inst instead.',
    },
    a_sweep: {
      title: 'Cut-off passed: surplus swept, overnight unit bought',
      detail:
        'Same rules as every business night: surplus above the threshold to the tokenised account, idle balance into an overnight unit.',
    },
    a_night: {
      title: 'Night sweep from HSBC and Deutsche Bank',
      detail:
        'Surplus above each bank’s next-day need, by instant transfer, final at once, into the overnight unit.',
    },
    a_return: {
      title: 'Opening: overnight unit unwound, cash returned',
      detail:
        'Each bank gets back what it needs today — not everything. The rest stays on the tokenised account.',
    },
    x1: {
      title: 'Munich pays EUR 4m at 21:15 — funded to the minute',
      detail:
        'Urgent supplier payment by SCT Inst. The Munich account goes EUR 4m below zero; intraday credit counted to the minute until the expected receipt.',
    },
    x2: {
      title: 'Munich receipt EUR 4m: intraday credit repaid',
      detail:
        'Expected customer receipt, final at once. Munich back to zero. It paid only for the minutes it borrowed.',
    },
    x3: {
      title: 'Singapore supplier paid (Mon 08:00 SGT)',
      detail: 'Local payment from the BNP Paribas Singapore account, on time.',
    },
    x5: {
      title: 'Warsaw contractor: EUR 6m screened, waiting for the acceptance certificate',
      detail:
        'Pre-screened now, earmarked on the tokenised account, released by rule when the certificate arrives. Committed, not gone — it keeps earning to the minute.',
    },
    x6: {
      title: 'Acceptance certificate received: EUR 6m leaves at once',
      detail:
        'The condition is met at 16:45; the payment departs already cleared. Earmarked for 375 minutes, each one counted.',
    },
    x4: {
      title: 'Weekend collections, EUR 44m by instant transfer',
      detail:
        'Distributors pay over the weekend. Final at once, placed in a weekend unit that minute (assumption A-3).',
    },
    userPay: { title: 'Payment approved', detail: '' },
  },

  trad: {
    t0: 'Week starts: EUR 120m on current accounts',
    t1: 'Supplier batch and payroll paid',
    t2: 'Instant collection EUR 12m',
    t7: 'USD 10m credited on USD current account',
    t8: 'Cash gage EUR 15m on a blocked account at 0%',
    t9: 'Classic 3-month term deposit EUR 50m at 2.20%',
    t11: 'Money market fund EUR 10m (order executed next day)',
    t13: 'Singapore pre-funded Friday before cut-off',
    t14: 'Weekend collections EUR 44m on the current account',
    t15: 'Cash gage released on Monday (next business day)',
    t16: 'Term deposit broken: EUR 20m, penalty paid',
  },

  ledger: {
    sepaBatch: 'SEPA supplier batch (pain.001), 214 payments',
    payroll: 'Payroll Spain (pain.001)',
    sctInstIn: 'SCT Inst received — final',
    sweepToTok: 'Rule sweep: current → tokenised account',
    buyOvernight: 'Overnight unit bought',
    buyWeekend: 'Three-day unit bought',
    buyBlockedInUnit: 'Blocked amount placed in unit (not transferable)',
    unwind: 'Unit unwound at maturity',
    returnCurrent: 'Return rule: tokenised → current account',
    returnBank: (bank: string) => `Return rule: back to ${bank} by SCT Inst`,
    nightSweep: (bank: string) => `Night sweep from ${bank} by SCT Inst — final`,
    corrAnnounced: 'MT103 received from correspondent — cover pending on nostro',
    corrFinal: 'Nostro credited — funds final',
    buyUsdUnit: 'USD 1-month term unit bought',
    block: 'Amount blocked as collateral — bid bond Brazil',
    moveToTok: 'Transfer current → tokenised account',
    buy3m: '3-month term unit bought',
    fundQueued: 'Tokenised fund order queued (outside fund hours)',
    fundDvp: 'Tokenised fund subscription — delivery versus payment',
    partialUnwind: 'Unit partly unwound to the minute',
    fxOut: 'Out-of-hours FX EUR → SGD (markets desk)',
    fxIn: 'SGD credited — intragroup funding',
    release: 'Block released by rule (tender result)',
    unblockUnit: 'Unit part unblocked — transferable again',
    unitSale: 'Term unit sold to the bank at the day’s price',
    munichPay: 'SCT Inst to supplier — Munich',
    munichIn: 'SCT Inst received — Munich',
    sgPay: 'Supplier payment, Singapore (local)',
    weekendIn: 'Weekend SCT Inst collections — final',
    blocked: 'Refused: payee at another bank, outside hours',
    earmark: 'Earmarked for a pre-screened payment — Warsaw contractor',
    conditionalOut: 'Condition met: payment released by SCT Inst — Warsaw contractor',
    userPay: 'Payment',
  },

  rulesNames: {
    sweep: 'Night sweep — current account',
    overnight: 'Overnight unit',
    nightSweep: 'Night sweep — other banks',
    ret: 'Return before opening',
    ladder: 'Ladder',
    funding: 'Funding',
    release: 'Collateral release',
    fund: 'Fund order',
    fx: 'Out-of-hours FX',
    marie: 'Instruction from Marie',
    receipt: 'Incoming payment',
  },

  nav: {
    home: 'Cockpit',
    accounts: 'Accounts',
    payments: 'Payments',
    rules: 'Rules',
    placements: 'Placements',
    guarantees: 'Guarantees',
    statements: 'Statements',
    about: 'About',
    collapse: 'Collapse menu',
    expand: 'Expand menu',
    persona: 'Marie Lefèvre',
    personaRole: 'Group Treasurer, Paris',
  },

  shell: {
    play: 'Play the week',
    pause: 'Pause',
    step: 'Next event',
    stepBack: 'Previous event',
    restart: 'Back to Monday 09:00',
    speed: 'Speed',
    jump: 'Jump to a moment',
    jumpTitle: 'Jump to a moment of the week',
    jumpDesc: 'Every headline event of the scenario. The clock moves there; every screen follows.',
    hood: 'Under the hood',
    theme: 'Switch theme',
    share: 'Copy a link to this moment',
    copied: 'Link copied',
    timeline: 'Week timeline — drag to move the clock',
    business: 'Business hours',
    night: 'Night',
    weekend: 'Weekend',
    evening: 'After cut-off',
    morning: 'Before opening',
    phaseTip: 'Business hours Mon–Fri 09:00–18:00. Last cut-off 18:00. Opening 07:00.',
    userActions: (n: number) => `${n} action${n > 1 ? 's' : ''} of yours replayed on the week`,
    reset: 'Reset to scenario',
    endOfWeek: 'End of the scenario week',
    banner:
      'You are Marie, group treasurer. Press Play to live a week. Green is what the ledger adds; grey is what already works today; dashed is outside the bank.',
    dismiss: 'Got it',
    cet: 'CET',
    skip: 'Skip to content',
  },

  counters: {
    newTitle: 'Interest this week — with the new layer',
    tradTitle: 'Interest this week — traditional set-up',
    newShort: 'Interest — with the ledger',
    tradShort: 'Interest — traditional',
    diff: 'Difference this week',
    hoursTitle: 'Off-hours spent earning',
    hoursIdle: 'idle (traditional)',
    hoursOf: (h: string) => ` of ${h} off-hours`,
    held: (m: string) => `· ${m}m held`,
    hoursEarning: 'earning (new)',
    sweptTitle: 'Brought from other banks',
    sweptSub: (held: string) => `${held} held now, net of returns`,
    jitTitle: 'Intraday credit (just-in-time)',
    jitSub: (cost: string) => `cost ${cost}`,
    newFormula:
      'Current account: end-of-day balance × 0.50% / 360, once a day. Tokenised account: balance × 0.10% × minutes / 518,400. Term units: amount × unit rate × minutes / 518,400. Fund: 1.95% to the minute. Minus intraday credit (2.50% to the minute) and the 2 bps spread on units sold.',
    tradFormula:
      'Everything on the current account: end-of-day balance × 0.50% / 360. Classic 3-month deposit 2.20% (daily), fund 1.95%. Blocked collateral: cash gage at 0%. Nothing placed overnight or at the weekend. Breaking the deposit on Monday costs the accrued interest on EUR 20m plus 5 bps.',
    diffTip:
      'The gap comes from late cash earning the overnight rate, collateral that keeps earning, the weekend unit and selling a unit instead of breaking a deposit. The ledger pays nothing extra on sight balances: 0.10% is below the current account.',
    hoursTip:
      'Off-hours time elapsed (after 18:00, before 09:00, weekends). Traditional: cash sits at the sight rate. New: hours during which idle cash was inside an overnight or weekend unit.',
    sweptTip:
      'Gross amount swept by instant transfer from HSBC and Deutsche Bank after their cut-off, and what is still held after each morning’s return rule. Balances left at other banks are counted at 0%.',
    jitTip:
      'Minutes a group account spent below zero on the ledger, and what it cost: |balance| × 2.50% × minutes / 518,400. Only the minutes borrowed are paid.',
    actual360: 'Actual/360 throughout.',
  },

  drawers: {
    title: 'Group cash by drawer',
    current: 'Current accounts',
    tokFree: 'Tokenised — free',
    tokBlocked: 'Tokenised — blocked',
    units: 'Term units',
    fund: 'Fund units',
    other: 'At other banks',
    pending: 'Pending cover',
    usd: 'USD units',
    total: 'Group cash',
    atBank: 'at the bank',
  },

  tips: {
    tokRate:
      'The tokenised account is a service account, not a yield account. It pays 0.10%, never more than the current account (0.50%). Its value is what it does: time counted to the minute, rules at any hour, blocking and releasing exact amounts. Yield lives in term units.',
    lateCash:
      'Late cash earns. Any balance final on the tokenised account after the 18:00 cut-off is placed by rule into an overnight unit that minute (a three-day unit on Friday), and unwound before opening at 07:00.',
    unitSold:
      'A term unit is never broken. Before maturity it is sold — to a group entity, another client, or the bank as market maker — at par + accrued to the minute − a 2 bps spread. The buyer holds it to maturity.',
    fundQueued:
      'The fund deals within fund hours (09:00–15:00). An order placed later is queued for the next opening. The cash does not wait idle: it stays in the overnight unit and earns until the order settles.',
    pendingCover:
      'Paid through a correspondent bank: the message has arrived, but the cover is not yet on our nostro. The funds are not final, so they do not earn. The clock starts the minute the nostro is credited.',
    notYet:
      'Paying a supplier banked elsewhere at night needs both banks on a shared ledger (interbank tokenised deposits, 2028). Until then, use SCT Inst — it runs 24/7 and is final in seconds.',
    final:
      'Final means the funds cannot be recalled and sit on the paying entity’s books. Interest to the minute starts only from that minute: at once within the bank, at once for an instant transfer, at nostro credit for a correspondent payment.',
    mirror:
      'When a transfer crosses two Group entities (e.g. BNP Paribas SA → BNP Paribas Singapore), the client is credited at once and the two entities record a mirror intragroup balance at the same instant, remunerated on the same clock.',
    blockedEarns:
      'An exact amount is blocked on the tokenised account. It stays yours and keeps earning — 0.10% by day and the unit rate at night — until the minute it is released by rule.',
    minute: 'Counted to the minute: balance × rate × minutes / (360 × 1440).',
    daily: 'Counted by the day: end-of-day balance × rate / 360.',
  },

  home: {
    hello: 'Good to see you, Marie.',
    tagline: 'Treasury, counted in minutes.',
    intro:
      'EUR 300m of group cash across 20 subsidiaries, 120 of it at BNP Paribas. Play the week: the rules work at night, you decide by day.',
    feed: 'What just happened',
    feedEmpty: 'Nothing yet. Press Play.',
    rulesTonight: 'Rules active tonight',
    trad: 'Already there today',
    tradSub: 'The tools you use every day, unchanged.',
    ruleSweep: 'Sweep above EUR 20m at 18:30 (EUR 5m on Friday)',
    ruleOvernight: 'Overnight unit on idle balance, 1.80% (three-day on Friday)',
    ruleReturn: 'Return at 07:00 — each bank gets its day’s need',
    ruleFx: 'Out-of-hours FX for funding: EUR 25m per night',
    nightSweep: 'Night sweep: HSBC and Deutsche Bank after cut-off',
    open: 'Open',
    showEntries: 'Ledger entries',
    hideEntries: 'Hide entries',
    compareTitle: 'The week so far',
    weekTitle: 'Interest earned this week',
    newLabel: 'With the ledger',
    tradLabel: 'Traditional set-up',
    rulesFriday: 'Friday — three-day unit tonight',
    rulesFrom: 'From 18:00',
    rulesRunning: 'Running now',
    drawerEyebrow: 'BNP Paribas + other banks',
    feedEyebrow: 'Rule · Marie · Event',
    yours: 'yours',
    pendingUsd: (v: string) => `+ ${v} pending cover`,
  },

  tradTools: {
    payments: { title: 'Payments', sub: 'SEPA, instant, payroll, cross-border' },
    pooling: { title: 'Cash pooling', sub: 'Zero-balancing into the Paris header' },
    statements: { title: 'Statements', sub: 'camt.053 / camt.054, reconciliation' },
    forecast: { title: 'Forecast', sub: '13-week cash forecast' },
  },

  accounts: {
    eyebrow: 'All banks, all entities',
    title: 'Accounts',
    lead: 'Every account of the group, at the bank and elsewhere. Balances follow the clock; finality says from when a euro earns.',
    cols: {
      entity: 'Entity',
      bank: 'Bank',
      ccy: 'Ccy',
      type: 'Type',
      balance: 'Balance',
      eur: 'EUR eq.',
      finality: 'Finality',
      cutoff: 'Cut-off',
      night: 'At night',
    },
    types: { current: 'Current', tokenised: 'Tokenised', otherBank: 'At other bank' },
    finality: { final: 'Final', pendingCover: 'Pending cover', valueTomorrow: 'Value tomorrow' },
    night: {
      swept: 'Swept',
      notSwept: 'Not swept',
      pooled: 'Pooled to Paris',
      inUnit: 'In unit by rule',
      local: 'Local bank',
    },
    noCutoff: 'none — 24/7',
    open: 'Open account',
    sameEuro: 'Same euro, two accounts',
    sameEuroLead: 'EUR 1m arrives at 19:00 and leaves at 09:00 the next morning.',
    sameCurrent: 'Current account',
    sameCurrentHow: 'Counted for the full day at 0.50% on the end-of-day balance.',
    sameTok: 'Tokenised account + overnight unit',
    sameTokHow:
      '12 hours in the overnight unit at 1.80% (19:00 → 07:00), then 2 hours on the account at 0.10% until it leaves.',
    poolingTitle: 'Cash pooling — zero-balancing',
    poolingText:
      'Munich and Madrid current accounts are zero-balanced into the Paris header every evening, as today. The pool is where the night sweep starts.',
    pendingUsd: 'USD 10m announced by the correspondent',
    back: 'All accounts',
    subFree: 'Free',
    subBlocked: 'Blocked',
    subInUnit: 'In unit',
    minuteBadge: 'Counted to the minute',
    dailyBadge: 'Counted by the day',
    accrued: 'Accrued this week',
    accruedTok: 'on the account (0.10%)',
    accruedUnits: 'in units',
    intraday: 'Balance today, minute by minute',
    intradayCurrent: 'Balance today',
    eod: 'End-of-day balance',
    dailyPosting: 'Daily interest posted',
    rate: 'Rate',
    movements: 'Movements today',
    noMovements: 'No movement yet today.',
    valueDates: 'Value dates',
    valueDatesText:
      'SEPA credit received: value today if before 18:00, otherwise next business day. Cross-border via correspondent: D+1 / D+2. Instant: value now.',
    cutoffs: 'Cut-offs',
    cutoffsText:
      'SEPA 18:00 · Urgent (TARGET2) 17:00 · Cross-border USD 16:00 · Intragroup on the ledger: none.',
    dayConvention:
      'A euro that arrives at 19:00 and leaves at 09:00 counts for a full day at the sight rate — and a euro that leaves at 23:00 counts for nothing.',
    unitsHere: 'Units bought from this account',
    none: '—',
    notFound: 'This account has no detail page in the mock-up.',
    currentTitle: 'Current account · EUR',
    currentOf: (city: string) => `Current account, ${city}`,
    toMinute: (r: string) => `${r} to the minute`,
    vsCurrent: (a: string, b: string) => `${a} ≤ ${b} current account`,
    blockedSub: 'Keeps earning until released',
    balanceLabel: 'Balance',
  },

  hood: {
    title: 'Under the hood',
    lead: 'What happens inside the bank, for colleagues from IT, ALM and compliance.',
    tabs: {
      ledger: 'Ledger',
      orchestration: 'Orchestration',
      accrual: 'Accrual',
      alm: 'ALM',
      intragroup: 'Intragroup',
      notYet: 'Not yet',
    },
    close: 'Close panel',
    ledgerLead: 'Chronological entries up to now, time-stamped to the second.',
    cols: {
      time: 'Time',
      account: 'Account',
      amount: 'Amount',
      finality: 'Finality',
      unit: 'Unit',
      memo: 'Memo',
    },
    filterAll: 'All entries',
    filterToday: 'Today only',
    orchLead: 'Rule → decision → instrument → rail, with screening and limit checks.',
    accrualTitle: 'Accrual, minute by minute',
    accrualLead:
      'For the selected account or unit: the accrual table, the daily amount posted to the classic interest engine, and the formula.',
    target: 'Account or unit',
    lastMinutes: 'Last 30 minutes',
    showTable: 'Show minute table',
    hideTable: 'Hide minute table',
    posted: 'Posted to the interest engine, per day',
    formula: 'Formula',
    formulaText:
      'interest = balance × rate × minutes / (360 × 1,440). Each minute uses the time-stamped balance of that minute. Negative balances accrue at the intraday rate.',
    almLead: 'The bank’s view of the same cash, by behaviour.',
    alm: {
      operational: 'Operational sight (current accounts)',
      tokSight: 'Tokenised sight',
      units: 'Term units by maturity',
      blocked: 'Blocked as collateral',
      overnight: 'Pure overnight (rule units)',
      fund: 'Fund units (off balance sheet for the bank)',
      lock: 'locked since',
      release: 'release on',
    },
    almNote:
      'Stability visible on the ledger: a blocked guarantee is a deposit for as long as the guarantee lasts; overnight money is treated as overnight money.',
    igLead:
      'When a transfer crosses two Group entities, a mirror intragroup balance is created at the same instant and remunerated on the same clock.',
    igEmpty:
      'No transfer has crossed two Group entities yet. Jump to Saturday 22:00 (Singapore funding).',
    igAccrued: 'accrued on the same clock',
    labels: {
      decision: 'Decision',
      instrument: 'Instrument',
      rail: 'Rail',
      owes: 'owes',
      eurEq: 'EUR eq.',
      soFar: '(so far)',
      unit: 'Unit',
      minCols: ['min', 'balance', 'rate', 'this minute', 'cumulative'],
    },
    notYetLead: 'Deliberately not working in this mock-up. Each needs the interbank layer.',
    notYetItems: [
      {
        title: 'Interbank tokenised deposits',
        text: 'Pay a supplier banked elsewhere at night, final on both ledgers.',
        year: '2028',
      },
      {
        title: 'PvP FX with another bank',
        text: 'Payment-versus-payment of two currencies between two banks’ ledgers.',
        year: '2028–2030',
      },
      {
        title: 'Settlement with non-clients',
        text: 'Deliver an asset against cash to a counterparty that banks elsewhere.',
        year: '2028–2030',
      },
      { title: 'Stablecoin corridors', text: 'Not in scope of this mock-up.', year: '—' },
    ],
  },

  rulesScreen: {
    eyebrow: 'Rules',
    title: 'Set once, runs every night.',
    lead: 'Rules run on the ledger at any hour. You set the thresholds; the forecast says what each bank needs tomorrow. Change a value and see what it would have done last week.',
    preview: 'If this rule had run last week…',
    json: 'Rule definition',
    log: 'Decision log',
    on: 'On',
    off: 'Off',
    sweep: {
      title: 'Night sweep — current account',
      threshold: 'Keep on the current account',
      friday: 'Friday (weekend) threshold',
      runs: 'Runs at 18:30, after the last cut-off',
      gainLine: (g: string) => `${g} more interest over the week`,
      nightsCols: ['Night', 'Swept', 'Hours in unit', 'Unit interest', 'Sight interest given up'],
    },
    night: {
      title: 'Night sweep — other banks',
      floor: 'Leave for tomorrow',
      rail: 'By SCT Inst after each bank’s cut-off — the only rail final all night between banks today. Later: interbank tokenised deposits.',
      gainLine: (g: string, s: string) =>
        `${s} swept over five nights, ${g} earned in overnight units (0% if left at the other bank)`,
    },
    overnight: {
      title: 'Overnight unit',
      friday: 'Three-day unit on Friday',
      blocked: 'Include blocked amounts (flagged not transferable)',
      text: 'Every balance final after 18:00 is placed into an overnight unit that minute, at 1.80%, and unwound at 07:00.',
      gainLine: (g: string) => `${g} earned in overnight and weekend units this week`,
    },
    ret: {
      title: 'Return before opening',
      text: 'At 07:00: units unwound, each bank gets back what it needs today — not everything — and the current account is brought to the day’s need. The rest stays on the tokenised account as group buffer.',
      source: 'Needs come from the cash forecast (traditional tool).',
    },
    ladder: {
      title: 'Ladder',
      above: 'Surplus above',
      text: 'Durable surplus placed in equal slices of 1, 3, 6 and 12-month units. Each slice can be sold before maturity; none is ever broken.',
      gainLine: (a: string, g: string) =>
        `On ${a} above the threshold: ${g} a year more than the current account`,
    },
    funding: {
      title: 'Funding',
      entity: 'Subsidiary',
      floor: 'Floor balance',
      hours: 'Allowed hours',
      any: 'Any hour',
      business: 'Business hours',
      fx: 'Out-of-hours FX allowed within the night limit (EUR 25m)',
      credit: 'Prefer intraday credit when a receipt is expected before opening',
      gainLine: (m: string, a: string, b: string) =>
        `Munich, Wednesday night: ${m} of intraday credit cost ${a}. Charged by the day, it would have cost ${b}.`,
    },
    release: {
      title: 'Collateral release',
      event: 'Release on',
      events: { expiry: 'Expiry date', document: 'Document received', tender: 'Tender result' },
      gainLine: (k: string) =>
        `Brazil bid bond: ${k} kept while blocked; a cash gage at 0% would have earned nothing.`,
    },
    forecast: {
      title: 'Cash forecast',
      lead: 'The forecast you already run. The return rule reads tomorrow’s needs from it.',
      cols: ['Day', 'Current account need'],
    },
  },

  placements: {
    eyebrow: 'Placements',
    title: 'Yield, without locking the money.',
    lead: 'Three ways to place a surplus. The classic deposit and the fund work as today. Term units add one thing: you can get out before maturity without breaking anything.',
    ladderTitle: 'Where the yield lives',
    ladderLead: 'Indicative euro rates. The tokenised account sits at the bottom on purpose.',
    avail: {
      any: 'any hour',
      business: 'business hours',
      transfer: 'by transfer',
      fund: 'fund hours',
    },
    ladder: [
      { key: 'tok', label: 'Tokenised account', avail: 'any' },
      { key: 'cur', label: 'Current account', avail: 'business' },
      { key: 'on', label: 'Overnight unit', avail: 'any' },
      { key: 'mmf', label: 'Money market fund', avail: 'fund' },
      { key: '1m', label: '1-month unit', avail: 'transfer' },
      { key: '3m', label: '3-month unit', avail: 'transfer' },
      { key: '6m', label: '6-month unit', avail: 'transfer' },
      { key: '12m', label: '12-month unit', avail: 'transfer' },
    ],
    classic: {
      title: 'Classic term deposit',
      text: 'Fixed amount, fixed rate, 1 to 12 months. To get the money back early you break it: the accrued interest on the broken part is lost and a break cost applies.',
      rates: 'Rates 2.05% – 2.35%',
      example: 'Breaking EUR 20m of a 3-month deposit after 4 days',
      forfeited: 'Accrued interest forfeited',
      fee: 'Break cost (5 bps)',
      total: 'Cost of getting out',
    },
    units: {
      title: 'Term units',
      text: 'A term deposit issued as a unit on the ledger, bought from the tokenised account. Overnight to 12 months. Before maturity it is sold or transferred — to a group entity, another client, or the bank — with accrued interest split to the minute.',
      buy: 'Buy a term unit',
      tenor: 'Tenor',
      amount: 'Amount (EUR m)',
      from: 'From the tokenised account (units unwound to the minute if needed)',
      confirm: 'Buy',
      bought: 'Bought — see positions below',
    },
    fund: {
      title: 'Money market fund',
      text: 'The fund you may already use, with its 15:00 cut-off. The tokenised fund is the same kind of fund, bought and sold from the tokenised account and settled on the ledger: cash and units change hands in one step.',
      trad: 'Classic fund — order by 15:00, settled D or D+1 through the transfer agent',
      tok: 'Tokenised fund — from the tokenised account, delivery versus payment',
      subscribe: 'Subscribe',
      queuedNote:
        'Outside fund hours: the order will be queued for the next opening at 09:00, the cash stays in the overnight unit meanwhile.',
      openNote: 'Fund hours: settled at once on the ledger.',
      held: 'Fund units held',
      nav: 'NAV 1.00, net yield 1.95%',
      pledge: 'Fund units can be pledged as collateral.',
    },
    positions: 'Positions',
    positionsLead: 'Units held, with interest accrued to the minute.',
    cols: ['Unit', 'Tenor', 'Nominal', 'Rate', 'Since', 'Maturity', 'Accrued now', ''],
    noUnits: 'No term unit held at this moment.',
    sell: 'Sell',
    blockedNote: 'blocked — not transferable',
    sellTitle: 'Sell before maturity',
    sellDesc:
      'Sold to the bank as market maker at the day’s price. The unit is not broken: the bank holds it to maturity.',
    nominal: 'Nominal to sell (EUR m)',
    par: 'Par',
    accrued: 'Accrued to this minute',
    spread: 'Spread (2 bps)',
    price: 'Price paid to you',
    vsBreak: 'Breaking a classic deposit of the same size instead',
    transferTitle: 'Or transfer it',
    transferGroup: 'To a group entity — the unit moves, accrued split to the minute',
    transferClient: 'To another client of the bank — on the ledger',
    confirmSell: 'Sell to the bank',
    queuedSince: (a: string, when: string) => `${a} queued since ${when}`,
    cancel: 'Cancel',
    minutesHeld: (m: string) => `held ${m}`,
  },

  payments: {
    eyebrow: 'Payments',
    title: 'Payments — what works today, what the ledger adds.',
    lead: 'SEPA, instant and cross-border payments work as they do today. The ledger adds transfers between group accounts at any hour, funding to the minute and out-of-hours FX for funding.',
    tabs: { sepa: 'SEPA / Instant', cross: 'Cross-border', ledger: 'Intragroup on the ledger' },
    batches: 'Batches awaiting approval',
    batchCols: ['Batch', 'Payments', 'Amount', 'Execution', 'Status', ''],
    approve: 'Approve',
    execD: 'D, 18:00 cut-off',
    fourEyes: '4-eyes',
    approved: 'Approved',
    executed: 'Executed',
    upload: 'Upload a pain.001 file',
    uploadHint:
      'Drop a file here or choose one. In the mock-up any file is read as a 38-payment supplier run.',
    choose: 'Choose file',
    parsed: (n: number, a: string) =>
      `pain.001.001.09 read: ${n} payments, ${a}. Checks passed: IBAN, BIC, duplicates, currency.`,
    single: 'Single instant payment (SCT Inst)',
    payee: 'Payee',
    amount: 'Amount (EUR m)',
    send: 'Send',
    sent: 'Sent — final in seconds',
    screeningOnTheWay: 'Screening on the way',
    screeningOnTheWayTip:
      'Today, sanctions screening runs while the payment travels; a hit can stop it after departure.',
    calendar: 'Cut-off calendar',
    calendarRows: [
      ['SEPA credit transfer', 'Mon–Fri 18:00', 'Value D'],
      ['SEPA Instant (SCT Inst)', '24/7/365', 'Final in < 10 s'],
      ['Urgent EUR (T2)', 'Mon–Fri 17:00', 'Value D'],
      ['Payroll files', 'D-1 16:00', 'Value D'],
      ['Tax payments', 'Mon–Fri 14:00', 'Value D'],
    ],
    cross: {
      routing: 'Correspondent routing',
      routingText:
        'A USD payment travels from our books to a correspondent bank, then to the beneficiary’s bank. Each leg has its cut-off; the money is final only when the cover lands.',
      valueDates: 'Value D+1 / D+2',
      valueDatesText:
        'USD sent after 16:00 Paris is valued next business day in New York; exotic currencies can take two days. Unchanged by the ledger.',
      tracker: 'Tracker — USD 10m to Lefèvre Inc., Chicago',
      steps: [
        'Message received (MT103)',
        'Cover pending on nostro',
        'Nostro credited — final',
        'Placed in USD unit',
      ],
      notEarning: 'Not earning yet',
      earning: 'Earning from 10:30',
      nodes: ['Payer’s bank', 'Correspondent', 'Nostro at BNP Paribas', 'Lefèvre Inc.'],
    },
    ledger: {
      transfer: 'Transfer to a group entity',
      to: 'To',
      toMunich: 'Lefèvre GmbH, Munich — EUR',
      toSingapore: 'Lefèvre Asia, Singapore — SGD (BNP Paribas Singapore)',
      toChicago: 'Lefèvre Inc., Chicago — USD (BNP Paribas New York)',
      anyHour:
        'At any hour, final at once. From the tokenised account; units are unwound to the minute if needed.',
      fxQuote: 'FX quote',
      fxDay: 'Markets desk, business hours',
      fxNight: 'Out-of-hours FX — for intragroup funding only',
      nightLimit: 'Night limit used',
      overLimit: 'Above tonight’s limit. Wait for opening or reduce the amount.',
      screen: 'Run pre-screening',
      screening: 'Screening…',
      cleared: 'Cleared before departure',
      execute: 'Execute',
      done: 'Done — credited at once',
      mirrorNote: 'Crosses two Group entities: a mirror intragroup balance appears under the hood.',
      nonClient: 'Pay a supplier at another bank',
      nonClientText:
        'From the tokenised account. By day it leaves through the usual rails. At night, both banks would need a shared ledger.',
      supplier: 'Nordwerk Maschinenbau — Commerzbank',
      supplierAmount: 'EUR 2.0m, due tonight',
      credited: (c: string) => `${c} credited`,
      whyNot: 'Why not yet?',
      tryPay: 'Pay from the tokenised account',
      notAvailable: 'Not available yet — interbank ledger, 2028',
      notAvailableMsg:
        'Available when banks exchange tokenised deposits (interbank ledger, 2028). Use SCT Inst instead.',
      fallback: 'Send by SCT Inst instead',
      byDay: 'Business hours: sent through SEPA, as today.',
      pvp: 'FX payment-versus-payment with another bank',
      pvpText:
        'Exchange EUR against USD with a bank that is not on our ledger, both legs final together.',
    },
  },

  guarantees: {
    eyebrow: 'Guarantees & collateral',
    title: 'Collateral that keeps earning.',
    lead: 'An exact amount is blocked on the tokenised account, or a term unit or fund unit is pledged. It stays yours and keeps earning until the minute a rule releases it — on an expiry date, a document, or a tender result.',
    live: 'Live in the scenario',
    illustrative: 'Illustrative',
    items: {
      bidBond: {
        title: 'Bid bond — Brazil tender',
        who: 'Lefèvre do Brasil · State utility tender, Rio de Janeiro',
        release: 'Tender result',
      },
      perf: {
        title: 'Performance bond — Poland',
        who: 'Lefèvre Polska · rail depot contract, 12 months',
        release: 'Expiry date',
      },
      margin: {
        title: 'Margin call — energy hedge',
        who: 'Lefèvre Industries SA · power swap, variation margin',
        release: 'Document received (margin return)',
      },
      escrow: {
        title: 'Escrow — Mexican acquisition',
        who: 'Lefèvre México · share purchase, 3 months',
        release: 'Document received (closing)',
      },
    },
    amount: 'Amount',
    duration: 'Duration',
    releaseOn: 'Release on',
    compare: 'Compare',
    trad: 'Traditional',
    tradGage: 'Cash gage on a blocked account at 0%',
    tradLine: 'Or a guarantee line: fee 0.60% a year',
    newBlock: 'Block on the tokenised account — keeps earning (0.10% by day, unit rate at night)',
    newPledge: 'Pledge a term unit — keeps its rate',
    kept: 'Interest kept over the life',
    blended: (r: string) => `≈ ${r} blended over a week`,
    days: (d: number) => `${d} days`,
    status: { active: 'Blocked', released: 'Released', notYet: 'Not yet set up' },
    brazil: {
      title: 'Brazil bid bond — minute by minute',
      since: 'Blocked since',
      released: 'Released by rule',
      pending: 'Waiting for the tender result',
      byDay: 'On the account by day (0.10%)',
      byNight: 'Inside the overnight / weekend unit at night',
      total: 'Earned while blocked',
      minutes: 'Minutes blocked',
      tradSide:
        'Cash gage: 0%, released by the back office on Monday 09:00 — 14 more hours locked.',
      event: 'Release event',
      eventText:
        'Tender result received Sunday 18:58 — lost. The guarantee expires; the rule releases the block at 19:00.',
    },
    pledgeFund: 'Fund units can be pledged too — they keep the fund yield.',
  },

  statements: {
    eyebrow: 'Statements & reporting',
    title: 'Statements — as today.',
    banner: 'Reconciliation and closing do not change. ISO 20022 already does this.',
    lead: 'The camt.053 you reconcile today, with one addition for the tokenised account: its sub-balances and a minute-level interest line. Everything else is identical.',
    viewer: 'camt.053 end-of-day statement',
    account: 'Account',
    day: 'Statement date',
    formatted: 'Formatted',
    xml: 'XML',
    noDay: 'No completed day yet — the first statement is produced at Monday midnight.',
    opening: 'Opening booked balance (OPBD)',
    closing: 'Closing booked balance (CLBD)',
    added: 'Added for the tokenised account',
    subFree: 'Free (PRTRY: FREE)',
    subBlocked: 'Blocked (PRTRY: BLCK)',
    subUnit: 'In unit (PRTRY: UNIT)',
    interestLine: 'Interest accrued to the minute (PRTRY: MINT)',
    entries: 'Entries',
    noEntries: 'No entries on this day.',
    ias7: 'IAS 7 helper',
    ias7Lead: 'Informational only — confirm with your auditor.',
    cashEq: 'Cash and cash equivalents',
    cashEqNote: 'Current accounts, tokenised free balance, overnight units',
    restricted: 'Restricted cash',
    restrictedNote: 'Blocked as collateral',
    shortInv: 'Term units and fund',
    shortInvNote: 'Classify by maturity and your policy',
    weekly: 'Week-1 interest statement',
    weeklyLead: 'Produced by the return rule on Monday 07:00.',
    weeklyPending: 'Produced on Monday 12 October at 07:00.',
    weeklyRows: {
      current: 'Current account (daily)',
      tokenised: 'Tokenised account (minute)',
      units: 'Term units (minute)',
      fund: 'Tokenised fund',
      jit: 'Intraday credit',
      spread: 'Spread on units sold',
    },
    camt054: 'camt.054 notifications continue unchanged for each credit and debit.',
  },

  about: {
    eyebrow: 'About this mock-up',
    title: 'What is real, what is illustrative, what is not built.',
    lead: 'A front-end-only mock-up for bank colleagues. No backend, no login, mock data and a simulated clock.',
    how: 'How to use it',
    howSteps: [
      'Press Play (or Space). One simulated hour lasts about 1.5 seconds.',
      'Use Next event to step through the week, or the calendar icon to jump to a moment.',
      'Drag the week timeline under the counters to move the clock freely.',
      'Open "Under the hood" to see ledger entries, rule decisions, accruals and the ALM view.',
      'Act yourself: buy or sell a unit, fund a subsidiary, subscribe to the fund. Your actions replay on the week; "Reset to scenario" removes them.',
      'Copy a link to share the exact moment you are looking at.',
    ],
    doctrine: 'Product doctrine — implemented literally',
    doctrineLines: [
      'The tokenised account is a service account: it pays 0.10%, never more than the current account (0.50%).',
      'Time is counted to the minute on the tokenised account, both ways; the current account counts end-of-day balances.',
      'The clock follows finality: no interest before funds are final on the paying entity’s books.',
      'Yield lives in term units bought from the tokenised account, overnight to 12 months — transferable, never broken.',
      'Late cash earns: after 18:00, idle balances go into an overnight unit that minute (three-day on Friday), unwound at 07:00.',
      'Collateral keeps earning until the minute a rule releases it.',
      'Just-in-time funding at any hour: a subsidiary pays only for the minutes it borrows.',
      'Out-of-hours FX is for intragroup funding only, within a published night limit.',
      'The tokenised fund is an option, not the engine: bought from the tokenised account, settled on the ledger, within fund hours.',
      'The night sweep brings cash from other banks by instant transfer and returns only what each bank needs.',
      'Payments, payroll, tax, forecasting, statements, reconciliation, closing and netting do not change.',
      'Across banks, not yet: paying non-clients at night, PvP with other banks, settlement with non-clients need the interbank layer (2028+).',
    ],
    illustrative: 'Illustrative',
    illustrativeText:
      'All rates, amounts, names, limits and spreads are indicative. The group, its subsidiaries and its counterparties are fictitious. Four small events were added to make the week consistent; see docs/ASSUMPTIONS.md.',
    notBuilt: 'Not built',
    notBuiltText:
      'The interbank ledger (tokenised deposits exchanged between banks), PvP FX with other banks, settlement with non-clients, stablecoin corridors. They appear as "Not yet" with a fallback.',
    roadmap: 'Roadmap',
    road: [
      {
        year: '2027',
        text: 'Tokenised account and term units on one legal entity. Rules, night sweep by SCT Inst, collateral blocking, pre-screening before departure.',
      },
      {
        year: '2028',
        text: 'Group entities on the ledger with mirror intragroup balances, intraday pricing, tokenised fund.',
      },
      {
        year: '2028–2030',
        text: 'Interbank layer: tokenised deposits exchanged between banks, PvP, settlement with non-clients.',
      },
    ],
    legend: 'Colour code',
    legendNew: 'Green — what the ledger adds',
    legendTrad: 'Grey — what already works today',
    legendOut: 'Dashed — outside the bank',
    legendAmber: 'Amber — term units and fund',
  },

  minute: {
    nav: 'Why the minute',
    eyebrow: 'Remuneration to the minute',
    title: 'Where the minute counts.',
    lead: 'The tokenised account pays 0.10%. Counting to the minute rarely changes a treasurer’s year — it changes what is counted. These are the six situations where money stays on the account and the minute matters, with the amounts, however small.',
    honest:
      'Read the amounts as they are: at 0.10% the minute is worth little per euro. Its value is being exact — no euro counted for a day it was not there, none ignored because it left before midnight — and it is what lets units, blocks and releases run to the minute.',
    live: 'Live in the scenario',
    illustrative: 'Illustrative',
    jump: 'Go to this moment',
    byDay: 'Counted by the day',
    byMinute: 'Counted to the minute',
    days: (n: number) => `${n} day${n === 1 ? '' : 's'} counted`,
    daysShort: (n: number) => `${n} d`,
    minutes: (m: string) => `${m} counted`,
    who: 'Matters for',
    verdict: 'Honestly',
    eodLegend: 'End-of-day snapshot (23:59)',
    cases: {
      float: {
        title: 'Pure intraday float',
        what: 'Collections in the morning, payouts in the evening. The balance is high all day and back to zero at night.',
        who: 'High-rotation clients — payment institutions, retailers, marketplaces. Not industrial groups like Marie’s.',
        verdict:
          'The daily convention sees a zero balance at 23:59 and counts nothing. To the minute, the day is paid. Small per day, real over a year for a high-rotation client.',
        peak: 'Peak balance (EUR m)',
        perYear: (v: string) => `${v} a year over 250 business days`,
      },
      collateral: {
        title: 'Blocked collateral',
        what: 'EUR 15m blocked for the Brazil bid bond from Wed 11:00 until the tender result on Sun 19:00.',
        who: 'Any group posting bid bonds, margin or escrow.',
        verdict:
          'Most of the amount is earned inside the overnight and weekend units, not on the account. The minute matters at both ends: the block starts at 11:00 and ends at 19:00, not at a day boundary.',
        onAccount: 'On the account by day (0.10%)',
        inUnit: 'In units at night (1.80%)',
        gage: 'Cash gage at 0%',
      },
      waiting: {
        title: 'Cash waiting for the just-in-time draw',
        what: 'After the 07:00 return, the group buffer stays on the tokenised account until the minute it is needed — or until the 18:30 rule places it in a unit.',
        who: 'Groups funding subsidiaries on demand from a central buffer.',
        verdict:
          'At 23:59 the buffer is inside the overnight unit, so a daily convention on the account counts nothing for the day. The minute pays the hours it waited. The mirror case — borrowing — is where the minute saves more.',
        debitTitle: 'The other direction: Munich borrowed to the minute',
        debitMinute: (m: string, v: string) => `${m} of intraday credit: ${v}`,
        debitDay: (v: string) => `Charged by the day at 23:59 Paris: ${v}`,
      },
      transit: {
        title: 'Transit and amounts below the unit',
        what: 'Between the unit unwinding at 07:00 and the payments leaving at 09:30; and residual amounts too small for the overnight unit.',
        who: 'Every client with a morning payment run.',
        verdict:
          'Pennies per day. Without the minute, the transit counts for nothing (it is gone before midnight) and the residual counts for a full day or nothing depending on where midnight falls.',
        amount: 'Amount in transit (EUR m)',
        departure: 'Payments leave at',
        residual: 'Residual < unit minimum (EUR k)',
        transitLine: 'Transit 07:00 → departure',
        residualLine: 'Residual overnight on the account',
      },
      conditional: {
        title: 'Pre-screened payments waiting for a condition',
        what: 'EUR 6m to the Warsaw contractor, screened at 10:30, released by rule when the acceptance certificate arrives at 16:45. The money is committed, not gone.',
        who: 'Groups paying on milestones, documents or deliveries — construction, trade, M&A closings.',
        verdict:
          'On a current account the money has usually left or is blocked at 0%. Earmarked on the tokenised account it earns every minute until departure; if the document slips overnight, it sits flagged in the overnight unit.',
        ifLate: 'If the certificate arrived tomorrow at 09:40',
        ifLateLine: (v: string, d: string) =>
          `${v} to the minute, flagged in the overnight unit — against ${d} for one day on a current account at 0.50%`,
      },
      zones: {
        title: 'Groups across time zones',
        what: '"End of day" is not an instant. In the week of 5 October, 23:59 in Paris is 05:59 in Singapore the next morning; the Singapore day closes at 18:00 Paris and New York’s at 06:00 Paris.',
        who: 'Groups with treasury centres or banks in several zones.',
        verdict:
          'The same flow counts one day or none depending on whose midnight is used — arbitrary winners and losers. To the minute, every zone gets the same answer.',
        cols: ['Flow', 'Paris 23:59', 'Singapore 23:59', 'New York 23:59', 'To the minute'],
        zoneNames: { paris: 'Paris', singapore: 'Singapore', newYork: 'New York' },
      },
    },
  },

  /** Engine copy for funding, large payments, escrow and corridors. */
  adv: {
    jitTitle: (a: string, ccy: string, src: string) =>
      `Just-in-time funding ${a} → ${ccy} (from ${src})`,
    jitDetail: (bank: string) =>
      `Converted by the markets desk on the ledger and credited on ${bank} at once, final. Interest counted to the minute on both sides.`,
    jitMemo: (ccy: string) => `${ccy} credited — just-in-time intragroup funding`,
    fxMemo: (from: string, to: string, day: boolean) =>
      `${day ? 'FX' : 'Out-of-hours FX'} ${from} → ${to} (markets desk)`,
    mirrorMemo: 'Mirror intragroup balance created at the same instant.',
    jitDecision: (src: string, ccy: string, rate: string, bps: number) =>
      `${src} → ${ccy} at ${rate} (mid − ${bps} bps)`,
    ledgerRail: 'Ledger — final at once',
    purposeCheck: 'Purpose',
    purposeOk: 'Funding a group entity — not trading',
    preTitle: (a: string, p: string) => `Large payment pre-validated: ${a} to ${p}`,
    preDetail: (cond: string) =>
      `All checks done in advance. Earmarked on the tokenised account until: ${cond}. Keeps earning to the minute.`,
    preMemo: (p: string) => `Earmarked — pre-validated payment to ${p}`,
    preDecision: 'Pre-validate now, release in seconds when the condition is met',
    earmarkInstrument: 'Earmarked sub-balance, tokenised account',
    onLedgerCheck: 'Beneficiary bank on the ledger',
    preChecks: (cat: 'equipment' | 'mna', onLedger: boolean): [string, string][] => [
      ['Sanctions & embargo screening', 'Payee, beneficiary bank, goods / target cleared'],
      ['Verification of payee', 'Name matches the account'],
      [
        'KYC / beneficial owners',
        cat === 'mna' ? 'Sellers and escrow agent identified' : 'Supplier file up to date',
      ],
      ['Approvals', cat === 'mna' ? 'Board resolution + two signatories' : 'CFO + two signatories'],
      ['Limit', 'One-off payment limit raised for this transaction'],
      ['Liquidity', 'Funded from the tokenised account and units, sold to the minute if needed'],
      ...(onLedger
        ? ([['Beneficiary bank on the ledger', 'Final at once, at any hour']] as [string, string][])
        : ([['Rail at release', 'T2 (RTGS), Mon–Fri 07:00–17:00']] as [string, string][])),
    ],
    releaseTitle: 'Condition met: pre-validated payment released',
    releaseDetail: 'No new checks at release — they were done in advance.',
    releasedMemo: (p: string) => `Pre-validated payment released — ${p}`,
    releasedNow: 'Released now',
    alreadyScreened: 'Screening',
    noRecheck: 'Done at pre-validation, still valid',
    awaitT2: (a: string) => `${a} waits for T2 to open — still earmarked, still earning`,
    t2Closed: 'T2 closed — the beneficiary bank is not on the ledger',
    t2OpenTitle: 'T2 opens: pre-validated payment leaves',
    t2OpenDetail: 'The payment departs at the first minute the rail allows.',
    escrowRule: 'Escrow rule',
    escrowTitle: (a: string, n: string) => `Escrow opened: ${a} — ${n}`,
    escrowDetail:
      'Purpose-bound money on the tokenised account: it can only go to the listed payees, when the oracle confirms each milestone.',
    escrowMemo: (n: string) => `Escrow — ${n}`,
    escrowDecision: 'Open escrow from template; bind oracle; whitelist payees',
    pbmInstrument: 'Purpose-bound sub-balance, tokenised account',
    payeeWhitelist: 'Payee whitelist',
    oracleTitle: (m: string, ok: boolean) =>
      ok ? `Oracle event received: ${m}` : `Oracle event rejected: ${m}`,
    oracleOk: 'Signature verified, milestone matched, the rule executes.',
    oracleRejected: 'Invalid signature: nothing moves.',
    oracleRejectedDecision: 'Event rejected — no movement',
    duplicate: 'Milestone already met — ignored',
    badSignature: 'Signature does not match the registered key',
    signatureCheck: 'Oracle signature',
    escrowPaid: (m: string) => `Escrow release — ${m}`,
    paidOut: (a: string) => `Paid ${a} to the whitelisted payee`,
    conditionMet: 'Condition met — nothing to pay at this step',
    corridorTitle: (a: string, p: string, rail: 'interbank' | 'traditional') =>
      `Payment ${a} to ${p} — ${rail === 'interbank' ? 'interbank tokenised deposit' : 'traditional rail'}`,
    corridorDetail: (fromTok: boolean, rail: 'interbank' | 'traditional') =>
      `${fromTok ? 'From the tokenised account (counted to the minute until departure)' : 'From the current account (daily convention)'}; ${rail === 'interbank' ? 'final on both banks’ ledgers at once.' : 'SCT Inst or T2.'}`,
    corridorMemo: (p: string, b: string, rail: 'interbank' | 'traditional') =>
      `${rail === 'interbank' ? 'Interbank tokenised deposit' : 'SCT Inst'} — ${p} (${b})`,
    interbankLeg: 'Interbank ledger: deposit transferred to the partner bank, final',
    interbankRail: 'Interbank ledger (pilot corridor)',
    corridorRule: 'Stablecoin corridor',
    repDetail: (ccy: string) =>
      `Repatriation ${ccy} → EUR through the partner wallet and the euro stablecoin.`,
    repLock: (a: string, rate: string) => `Rate locked for 15 minutes: ${a} at ${rate}`,
    repWallet: (rail: string) => `Local account → partner wallet by ${rail}`,
    repWalletMemo: (rail: string) => `To partner wallet by ${rail}`,
    repConvert: 'Converted into the Qivalis euro stablecoin at the locked rate',
    repSend: 'Euro stablecoin sent to the master account address',
    repCredit: 'Redeemed at par: EUR credited on the tokenised account, final',
    repCreditDecision: (a: string) => `${a} credited — off-ramped at par on the master account`,
    stablecoinRail: 'Partner wallet → euro stablecoin → master account',
    travelRule: 'Travel rule',
    travelRuleOk: 'Originator and beneficiary data received with the transfer',
    redeemedAtPar: 'Redeemed 1:1 — final on our books',
  },

  actors: { rule: 'Rule', marie: 'Marie', event: 'Event' },
  layers: { new: 'New', traditional: 'Today', notYet: 'Not yet', none: '' },

  checks: {
    screening: 'Pre-screening (sanctions, embargo)',
    screeningOk: 'Cleared before departure, 1.2 s',
    limit: 'Limit',
    finality: 'Finality',
    finalOk: 'Final on the paying entity’s books',
    pending: 'Pending cover on nostro — no accrual',
    balance: 'Available balance',
    fundHours: 'Fund hours 09:00–15:00',
    fxLimit: (used: string, limit: string) => `Night FX limit: ${used} of ${limit} used`,
    notYet: 'Interbank ledger not live (2028)',
  },
} as const;

export type Strings = typeof en;
