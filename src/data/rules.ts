import { M } from '@/engine/ops';

/** Next-day needs from the cash forecast (traditional tool), by day index (0 = Mon 5 Oct). */
export const FORECAST_NEEDS: Record<number, { current: number }> = {
  1: { current: 80 * M },
  2: { current: 80 * M },
  3: { current: 80 * M },
  4: { current: 30 * M },
  7: { current: 65 * M },
  8: { current: 65 * M },
};

export interface SweepRule {
  id: 'sweep';
  enabled: boolean;
  thresholdWeekday: number;
  thresholdFriday: number;
  runsAt: string;
}

export interface NightSweepRule {
  id: 'nightSweep';
  enabled: boolean;
  banks: { account: 'hsbc-paris' | 'db-munich'; bank: string; cutoff: string; floor: number }[];
  runsAt: string;
  rail: 'SCT Inst';
}

export interface OvernightRule {
  id: 'overnight';
  enabled: boolean;
  fridayThreeDay: boolean;
  includeBlocked: boolean;
}

export interface ReturnRule {
  id: 'ret';
  enabled: boolean;
  runsAt: string;
  source: 'forecast';
}

export interface LadderRule {
  id: 'ladder';
  enabled: boolean;
  above: number;
  tenors: ('1m' | '3m' | '6m' | '12m')[];
}

export interface FundingRule {
  id: 'funding';
  enabled: boolean;
  entity: string;
  floor: number;
  hours: 'any' | 'business';
  fxAllowed: boolean;
  preferCredit: boolean;
}

export interface ReleaseRule {
  id: 'release';
  enabled: boolean;
  event: 'expiry' | 'document' | 'tender';
}

export type RuleConfig =
  SweepRule | NightSweepRule | OvernightRule | ReturnRule | LadderRule | FundingRule | ReleaseRule;

export const DEFAULT_RULES = {
  sweep: {
    id: 'sweep',
    enabled: true,
    thresholdWeekday: 20 * M,
    thresholdFriday: 5 * M,
    runsAt: '18:30',
  } as SweepRule,
  nightSweep: {
    id: 'nightSweep',
    enabled: true,
    banks: [
      { account: 'hsbc-paris', bank: 'HSBC', cutoff: '17:30', floor: 45 * M },
      { account: 'db-munich', bank: 'Deutsche Bank', cutoff: '17:45', floor: 36 * M },
    ],
    runsAt: '19:10',
    rail: 'SCT Inst',
  } as NightSweepRule,
  overnight: {
    id: 'overnight',
    enabled: true,
    fridayThreeDay: true,
    includeBlocked: true,
  } as OvernightRule,
  ret: { id: 'ret', enabled: true, runsAt: '07:00', source: 'forecast' } as ReturnRule,
  ladder: {
    id: 'ladder',
    enabled: false,
    above: 60 * M,
    tenors: ['1m', '3m', '6m', '12m'],
  } as LadderRule,
  funding: {
    id: 'funding',
    enabled: true,
    entity: 'munich',
    floor: 0,
    hours: 'any',
    fxAllowed: true,
    preferCredit: true,
  } as FundingRule,
  release: { id: 'release', enabled: true, event: 'tender' } as ReleaseRule,
};

export type RulesState = typeof DEFAULT_RULES;
