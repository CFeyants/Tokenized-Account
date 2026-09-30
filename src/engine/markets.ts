/**
 * Traditional market and payment-system hours, in Paris time for the week of 5 October 2026
 * (CEST; Tokyo +7 h, Riyadh +1 h). Indicative — to confirm with Markets and Cash Management.
 * The ledger's instant FX for intragroup funding runs 24/7 within the night limit.
 */
import {
  MIN_PER_DAY,
  dayIndex,
  minuteOfDay,
  weekday,
  offHoursMinutes,
  type SimTime,
} from './clock';
import { RATES } from '@/data/rates';
import { minuteAccrual } from './accrual';

export interface MarketWindow {
  key: string;
  /** Days of week, 0 = Monday. */
  days: number[];
  from: number; // minute of day, Paris
  to: number;
}

export const WINDOWS = {
  parisDesk: { key: 'parisDesk', days: [0, 1, 2, 3, 4], from: 8 * 60, to: 18 * 60 },
  corrCutoff: { key: 'corrCutoff', days: [0, 1, 2, 3, 4], from: 8 * 60, to: 16 * 60 },
  t2: { key: 't2', days: [0, 1, 2, 3, 4], from: 7 * 60, to: 17 * 60 },
  tokyo: { key: 'tokyo', days: [0, 1, 2, 3, 4], from: 2 * 60, to: 8 * 60 },
  riyadh: { key: 'riyadh', days: [0, 1, 2, 3, 6], from: 7 * 60, to: 15 * 60 },
  cls: { key: 'cls', days: [0, 1, 2, 3, 4], from: 7 * 60, to: 12 * 60 },
} satisfies Record<string, MarketWindow>;

export type WindowKey = keyof typeof WINDOWS;

export function isOpen(w: MarketWindow, t: SimTime): boolean {
  const m = minuteOfDay(t);
  return w.days.includes(weekday(t)) && m >= w.from && m < w.to;
}

/** Next opening of a window strictly after t (searches two weeks). */
export function nextOpen(w: MarketWindow, t: SimTime): SimTime {
  for (let d = dayIndex(t); d < dayIndex(t) + 14; d++) {
    const start = d * MIN_PER_DAY + w.from;
    if (w.days.includes(weekday(d * MIN_PER_DAY)) && start > t) return start;
    if (w.days.includes(weekday(d * MIN_PER_DAY)) && t >= start && t < d * MIN_PER_DAY + w.to)
      return t;
  }
  return t;
}

/** Latest moment ≤ t inside the window (end of the previous open window if closed). */
export function lastOpenBefore(w: MarketWindow, t: SimTime): SimTime | null {
  if (isOpen(w, t)) return t;
  for (let d = dayIndex(t); d > dayIndex(t) - 14; d--) {
    const end = d * MIN_PER_DAY + w.to;
    if (w.days.includes(weekday(d * MIN_PER_DAY)) && end <= t) return end - 1;
  }
  return null;
}

export type JitCcy = 'JPY' | 'SAR' | 'SGD' | 'USD';
export const LOCAL_SYSTEM: Record<JitCcy, WindowKey | null> = {
  JPY: 'tokyo',
  SAR: 'riyadh',
  SGD: null,
  USD: null,
};

/**
 * Money the group would have earned on the ledger between two instants: the overnight / weekend
 * unit rate outside business hours, the tokenised account rate by day.
 */
export function ledgerOpportunity(eur: number, from: SimTime, to: SimTime): number {
  if (to <= from) return 0;
  const off = offHoursMinutes(from, to);
  const day = to - from - off;
  return minuteAccrual(eur, RATES.overnightUnit, off) + minuteAccrual(eur, RATES.tokenised, day);
}

export interface JitComparison {
  /** Ledger: executed at the minute of need (or now, if later). */
  ledgerAt: SimTime;
  /** Traditional: latest trade the Paris desk and the correspondent cut-off allow. */
  tradTradeAt: SimTime | null;
  /** Traditional: when the local system credits the subsidiary. */
  tradCreditAt: SimTime | null;
  /** The traditional route arrives after the need. */
  tradLate: boolean;
  /** Interest the group gives up by pre-funding. */
  lostByPrefunding: number;
  /** All traditional systems closed at the minute of need? */
  closedAtNeed: WindowKey[];
}

export function compareJit(ccy: JitCcy, eur: number, need: SimTime, now: SimTime): JitComparison {
  const ledgerAt = Math.max(now, need - 5);
  const trade = lastOpenBefore(WINDOWS.corrCutoff, need - 60);
  const localKey = LOCAL_SYSTEM[ccy];
  let credit: SimTime | null = trade;
  if (trade !== null && localKey) credit = nextOpen(WINDOWS[localKey], trade);
  const closedAtNeed = (
    ['parisDesk', 't2', 'cls', ...(localKey ? [localKey] : [])] as WindowKey[]
  ).filter((k) => !isOpen(WINDOWS[k], need));
  return {
    ledgerAt,
    tradTradeAt: trade,
    tradCreditAt: credit,
    tradLate: credit === null || credit > need,
    lostByPrefunding: trade === null ? 0 : ledgerOpportunity(eur, trade, need),
    closedAtNeed,
  };
}
