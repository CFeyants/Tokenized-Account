/**
 * Business case, annualised, for three client profiles. The value to the client is measured where
 * it really is — buffers released, hours saved, failures avoided — not in interest to the minute.
 * The bank's side shows what it costs (remuneration, cannibalisation) and what it earns.
 * Every figure is illustrative; the assumptions are exported so the UI can show them.
 */

export type ProfileId = 'midcap' | 'large' | 'multi';

export interface Profile {
  id: ProfileId;
  revenue: number;
  subsidiaries: number;
  /** Subsidiaries in time zones where European desks are closed when they need cash. */
  farSubsidiaries: number;
  /** Local buffer each of those keeps today "just in case". */
  bufferPerSub: number;
  averageCash: number;
  corridors: number;
  /** Treasury hours a year spent on pre-funding, manual sweeps, releases, repatriations. */
  manualHours: number;
  /** Late payments, delayed closings, missed cut-offs a year. */
  failures: number;
  costPerFailure: number;
  /** Bank side. */
  activeRules: number;
  nightFxVolume: number;
  tokenisedBalance: number;
  unitBalance: number;
  capturedFromOtherBanks: number;
  intradayLineFees: number;
}

export const PROFILES: Record<ProfileId, Profile> = {
  midcap: {
    id: 'midcap',
    revenue: 800e6,
    subsidiaries: 8,
    farSubsidiaries: 2,
    bufferPerSub: 3e6,
    averageCash: 60e6,
    corridors: 2,
    manualHours: 900,
    failures: 6,
    costPerFailure: 15_000,
    activeRules: 6,
    nightFxVolume: 60e6,
    tokenisedBalance: 12e6,
    unitBalance: 20e6,
    capturedFromOtherBanks: 8e6,
    intradayLineFees: 10_000,
  },
  large: {
    id: 'large',
    revenue: 6e9,
    subsidiaries: 20,
    farSubsidiaries: 5,
    bufferPerSub: 8e6,
    averageCash: 300e6,
    corridors: 5,
    manualHours: 3_200,
    failures: 14,
    costPerFailure: 40_000,
    activeRules: 18,
    nightFxVolume: 600e6,
    tokenisedBalance: 40e6,
    unitBalance: 90e6,
    capturedFromOtherBanks: 24e6,
    intradayLineFees: 60_000,
  },
  multi: {
    id: 'multi',
    revenue: 15e9,
    subsidiaries: 60,
    farSubsidiaries: 18,
    bufferPerSub: 10e6,
    averageCash: 900e6,
    corridors: 12,
    manualHours: 9_000,
    failures: 40,
    costPerFailure: 60_000,
    activeRules: 50,
    nightFxVolume: 2.5e9,
    tokenisedBalance: 120e6,
    unitBalance: 300e6,
    capturedFromOtherBanks: 90e6,
    intradayLineFees: 180_000,
  },
};

export const ASSUMPTIONS = {
  /** Released buffers redeployed in the overnight unit (conservative; debt reduction is worth more). */
  redeployRate: 0.018,
  /** Share of manual hours automated by standing rules. */
  automatedShare: 0.6,
  hoursPerFte: 1_600,
  fteCost: 95_000,
  /** Share of failures the ledger avoids (closed desks, missed cut-offs, late releases). */
  avoidedShare: 0.7,
  /** Bank: internal transfer price of deposits. */
  ftpSight: 0.015,
  ftpOvernight: 0.0195,
  paidCurrent: 0.005,
  paidTokenised: 0.001,
  paidUnit: 0.018,
  subscriptionPerRuleMonth: 150,
  nightFxMarginBps: 10,
};

export function clientValue(p: Profile) {
  const buffers = p.farSubsidiaries * p.bufferPerSub;
  const buffersInterest = buffers * ASSUMPTIONS.redeployRate;
  const hours = p.manualHours * ASSUMPTIONS.automatedShare;
  const fte = hours / ASSUMPTIONS.hoursPerFte;
  const hoursValue = fte * ASSUMPTIONS.fteCost;
  const failures = Math.round(p.failures * ASSUMPTIONS.avoidedShare);
  const failuresValue = failures * p.costPerFailure;
  return {
    buffers,
    buffersInterest,
    hours,
    fte,
    hoursValue,
    failures,
    failuresValue,
    total: buffersInterest + hoursValue + failuresValue,
  };
}

export function bankView(p: Profile) {
  const A = ASSUMPTIONS;
  const retained = p.tokenisedBalance + p.unitBalance;
  // Today, the balances the client keeps with us sit on the current account.
  const atBankToday = retained - p.capturedFromOtherBanks;
  const niiToday = atBankToday * (A.ftpSight - A.paidCurrent);
  const niiNew =
    p.tokenisedBalance * (A.ftpSight - A.paidTokenised) +
    p.unitBalance * (A.ftpOvernight - A.paidUnit);
  const remunerationCost = p.tokenisedBalance * A.paidTokenised + p.unitBalance * A.paidUnit;
  const subscriptions = p.activeRules * A.subscriptionPerRuleMonth * 12;
  const nightFx = p.nightFxVolume * (A.nightFxMarginBps / 10_000);
  const cannibalisation = p.intradayLineFees;
  const net = niiNew - niiToday + subscriptions + nightFx - cannibalisation;
  return {
    retained,
    captured: p.capturedFromOtherBanks,
    remunerationCost,
    niiToday,
    niiNew,
    niiDelta: niiNew - niiToday,
    subscriptions,
    nightFx,
    cannibalisation,
    net,
  };
}
