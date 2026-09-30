/**
 * Business case, annualised, for three client profiles. One engine for the value banner, the tour
 * recap and the Business case page.
 *  - Client: buffers released, hours saved, failures avoided, yield pickup on the swept surplus per
 *    currency — not interest to the minute.
 *  - Bank: deposits defended (the main line), deposits captured by source, what the units and the
 *    fund sweep cost, fees, running costs, cost to serve, LCR — net with and without the
 *    night FX margin.
 * Every figure is illustrative; every assumption is exported so the UI can show it on hover.
 */
import { FX_MID, MARKET, RATES } from '@/data/rates';
import { TOTAL_BUFFERS } from '@/data/buffers';
import { US_ENTITY, usClientValue } from '@/data/tmmf';

export type ProfileId = 'midcap' | 'large' | 'multi';

export interface Profile {
  id: ProfileId;
  revenue: number;
  subsidiaries: number;
  /** Subsidiaries in time zones where European desks are closed when they need cash. */
  farSubsidiaries: number;
  /** Local buffers kept today "just in case", total. */
  buffers: number;
  /** Treasury hours a year spent on pre-funding, manual sweeps, releases, repatriations. */
  manualHours: number;
  /** Late payrolls, supplier penalties, delayed closings, missed cut-offs a year. */
  failures: number;
  costPerFailure: number;
  /** Deposits the client keeps with us today (sight). */
  depositsAtBank: number;
  /** Average balance moved into overnight / weekend units. */
  unitBalance: number;
  /** Average EUR surplus swept into a money market fund (leaves the balance sheet). */
  sweptEurToFund: number;
  /** US subsidiaries: operating balance (earnings credit) and surplus above operating needs, USD. */
  usOperating: number;
  usSurplus: number;
  /** EUR equivalent repatriated from Brazil a year. */
  brlVolume: number;
  /** Night FX that is incremental (off-hours premium on volume that would not come to us by day). */
  nightFxIncremental: number;
  activeRules: number;
  transactions: number;
  preValidations: number;
  escrowAverage: number;
  collateralAverage: number;
  intradayLineFees: number;
  /** Share of the bank's fixed running cost of the programme allocated to this client. */
  runningCost: number;
}

const P = (id: ProfileId, s: number, o: Partial<Profile>): Profile => ({
  id,
  revenue: 6e9 * s,
  subsidiaries: Math.round(20 * s),
  farSubsidiaries: Math.max(1, Math.round(3 * s)),
  buffers: TOTAL_BUFFERS * s,
  manualHours: 3_200 * s,
  failures: Math.round(14 * s),
  costPerFailure: 40_000,
  depositsAtBank: 120e6 * s,
  unitBalance: 90e6 * s,
  sweptEurToFund: 20e6 * s,
  usOperating: US_ENTITY.targetUsd * s,
  usSurplus: US_ENTITY.surplusUsd * s,
  brlVolume: 72e6 * s,
  nightFxIncremental: 120e6 * s,
  activeRules: Math.round(18 * s),
  transactions: Math.round(1_200 * s),
  preValidations: Math.round(12 * s),
  escrowAverage: 10e6 * s,
  collateralAverage: 15e6 * s,
  intradayLineFees: 60_000 * s,
  runningCost: 180_000 * Math.sqrt(s),
  ...o,
});

export const PROFILES: Record<ProfileId, Profile> = {
  midcap: P('midcap', 0.25, {
    revenue: 800e6,
    subsidiaries: 8,
    farSubsidiaries: 1,
    buffers: 3e6,
    costPerFailure: 15_000,
  }),
  large: P('large', 1, {}),
  multi: P('multi', 3, {
    revenue: 15e9,
    subsidiaries: 60,
    farSubsidiaries: 18,
    buffers: 180e6,
    costPerFailure: 60_000,
    failures: 40,
  }),
};

export const ASSUMPTIONS = {
  /** Released buffers redeployed in the overnight unit (conservative; debt reduction is worth more). */
  redeployRate: RATES.overnightUnit,
  automatedShare: 0.6,
  hoursPerFte: 1_600,
  fteCost: 95_000,
  avoidedShare: 0.7,
  failureTypes:
    'late payroll (penalties, staff), supplier paid late (lost discount, penalties), closing date missed (price adjustment, fees), cut-off missed (overdraft, pre-funding)',
  /** Without the programme, share of deposits leaving by 2030 (funds, stablecoins, competitor deposits). */
  migration: 0.3,
  /** Share of released buffers that comes to our balance sheet (the rest pays down debt, goes to funds, stays elsewhere). */
  bridge: { captured: 0.5, debt: 0.2, funds: 0.2, elsewhere: 0.1 },
  paidOnCaptured: RATES.tokenised,
  nightFxNetBps: 7,
  subscriptionPerRuleMonth: 150,
  feePreValidation: 1_500,
  escrowAgentBps: 10,
  guaranteeBps: 40,
  /** US surplus kept working with us: distribution / sweep fee and cash-leg settlement, bps a year. */
  usDistributionBps: 8,
  usCashLegBps: 2,
  /** US costs a year at the large profile: fund partner, transfer agent connection, US compliance. */
  usCosts: { fundPartner: 40_000, transferAgent: 60_000, compliance: 80_000 },
  costPerTransaction: 8,
  swiftFeesLostPerOp: 40,
  hqlaCarry: 0.003,
  lcrOutflow: { operational: 0.25, nonOperational: 0.4, term: 0 },
  operationalBelowMarketBps: 5,
};

export function clientValue(p: Profile) {
  const A = ASSUMPTIONS;
  const buffersInterest = p.buffers * A.redeployRate;
  const hours = p.manualHours * A.automatedShare;
  const fte = hours / A.hoursPerFte;
  const hoursValue = fte * A.fteCost;
  const failures = Math.round(p.failures * A.avoidedShare);
  const failuresValue = failures * p.costPerFailure;
  // Yield pickup on the swept surplus, per currency.
  const eurPickup = p.sweptEurToFund * (RATES.unit3m - RATES.current);
  // USD already in funds: a change of rail. The pickup is on balances left on earnings credits.
  const usdPickup = usClientValue(p.usSurplus).pickup / FX_MID.USD;
  return {
    buffers: p.buffers,
    buffersInterest,
    hours,
    fte,
    hoursValue,
    failures,
    failuresValue,
    eurPickup,
    usdPickup,
    total: buffersInterest + hoursValue + failuresValue,
  };
}

export interface BankLine {
  key: string;
  value: number;
  /** Deposits (EUR) the line is computed on, for the tooltip. */
  base?: number;
  rate?: number;
}

export function bankView(p: Profile, ftp: number = MARKET.estr) {
  const A = ASSUMPTIONS;
  // Deposits captured, by source.
  const sources = {
    jitBuffers: p.buffers * A.bridge.captured,
    collateral: p.collateralAverage,
    escrow: p.escrowAverage,
    earmarked: 3e6 * (p.brlVolume / 72e6),
    preValidated: 4e6 * (p.brlVolume / 72e6),
    brazil: 2e6 * (p.brlVolume / 72e6),
  };
  const captured = Object.values(sources).reduce((a, b) => a + b, 0);

  const defended = p.depositsAtBank * A.migration * (ftp - RATES.current);
  const capturedNii = captured * (ftp - A.paidOnCaptured);
  const unitCost = -p.unitBalance * (RATES.overnightUnit - RATES.current);
  const sweepLost = -p.sweptEurToFund * (ftp - RATES.current);
  const fees =
    p.activeRules * A.subscriptionPerRuleMonth * 12 +
    p.preValidations * A.feePreValidation +
    p.escrowAverage * (A.escrowAgentBps / 10_000) +
    p.collateralAverage * (A.guaranteeBps / 10_000);
  const running = -p.runningCost;
  const costToServe = -p.transactions * A.costPerTransaction;
  const swiftLost =
    -(p.brlVolume / 6e6) * A.swiftFeesLostPerOp - p.transactions * 0.1 * A.swiftFeesLostPerOp;
  const cannibalisation = -p.intradayLineFees;
  const nightFx = p.nightFxIncremental * (A.nightFxNetBps / 10_000);
  // United States. Reference scenario: the sweep leaves for a competitor's fund and the operating
  // relationship follows. The surplus is already in funds there: capturing it cannibalises little.
  const usOperatingEur = p.usOperating / FX_MID.USD;
  const usSurplusEur = p.usSurplus / FX_MID.USD;
  const usRetained = usOperatingEur * (MARKET.sofr - US_ENTITY.ecr);
  const usSweep = usSurplusEur * ((A.usDistributionBps + A.usCashLegBps) / 10_000);
  const usScale = Math.sqrt(p.usSurplus / US_ENTITY.surplusUsd);
  const usCosts = -Object.values(A.usCosts).reduce((a, b) => a + b, 0) * usScale;

  const lines: BankLine[] = [
    {
      key: 'defended',
      value: defended,
      base: p.depositsAtBank * A.migration,
      rate: ftp - RATES.current,
    },
    { key: 'captured', value: capturedNii, base: captured, rate: ftp - A.paidOnCaptured },
    {
      key: 'unitCost',
      value: unitCost,
      base: p.unitBalance,
      rate: RATES.overnightUnit - RATES.current,
    },
    { key: 'sweepLost', value: sweepLost, base: p.sweptEurToFund, rate: ftp - RATES.current },
    { key: 'fees', value: fees },
    { key: 'running', value: running },
    { key: 'costToServe', value: costToServe },
    { key: 'swiftLost', value: swiftLost },
    { key: 'cannibalisation', value: cannibalisation },
    {
      key: 'usRetained',
      value: usRetained,
      base: usOperatingEur,
      rate: MARKET.sofr - US_ENTITY.ecr,
    },
    {
      key: 'usSweep',
      value: usSweep,
      base: usSurplusEur,
      rate: (A.usDistributionBps + A.usCashLegBps) / 10_000,
    },
    { key: 'usCosts', value: usCosts },
  ];
  const netWithout = lines.reduce((a, l) => a + l.value, 0);
  const net = netWithout + nightFx;

  // Liquidity: operational deposits (rules installed, paid ≥ 5 bps below market) run off at 25%,
  // non-operational at 40%, beyond 30 days at 0%. The overnight unit is not operational.
  const operational =
    sources.collateral +
    sources.escrow +
    sources.earmarked +
    sources.preValidated +
    sources.jitBuffers +
    usOperatingEur;
  const nonOperational = p.unitBalance + sources.brazil;
  const hqlaWith =
    operational * A.lcrOutflow.operational + nonOperational * A.lcrOutflow.nonOperational;
  const hqlaIfAllNonOp = (operational + nonOperational) * A.lcrOutflow.nonOperational;
  const hqlaSaved = hqlaIfAllNonOp - hqlaWith;

  return {
    ftp,
    sources,
    captured,
    lines,
    nightFx,
    net,
    netWithout,
    lcr: { operational, nonOperational, hqlaWith, hqlaSaved, hqlaValue: hqlaSaved * A.hqlaCarry },
    bridge: {
      released: p.buffers,
      captured: p.buffers * A.bridge.captured,
      debt: p.buffers * A.bridge.debt,
      funds: p.buffers * A.bridge.funds,
      elsewhere: p.buffers * A.bridge.elsewhere,
    },
  };
}

/** Net for the bank at several FTP levels. */
export const sensitivity = (p: Profile, ftps = [0.01, 0.02, MARKET.estr, 0.025]) =>
  ftps.map((ftp) => ({ ftp, net: bankView(p, ftp).net, netWithout: bankView(p, ftp).netWithout }));
