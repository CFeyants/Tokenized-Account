/**
 * FX for just-in-time funding, from both sides.
 *  - Treasurer: the quote depends on the window — day desk, thin Asian session, or market closed
 *    (weekend gap). The gain of JIT is the buffer released, not the rate.
 *  - Bank: the night price can never go below what delivering the currency costs the bank:
 *    floor = funding cost of the currency until the hedge + gap premium + capital of the night
 *    limit + 24/7 running cost. Quote ≥ floor; otherwise fall back to Friday pre-funding.
 * All inputs are illustrative parameters.
 */
import { MIN_PER_DAY, dayIndex, minuteOfDay, weekday, type SimTime } from './clock';

export type WindowKind = 'day' | 'thin' | 'closed';

export interface FxWindow {
  kind: WindowKind;
  bps: number;
}

/** Client quote spread by window. */
export const WINDOW_BPS: Record<WindowKind, number> = { day: 3, thin: 12, closed: 25 };
/** "Lock the rate on Friday, deliver at the minute": Friday desk price + a small carry charge. */
export const FRIDAY_LOCK_BPS = 6;

export function fxWindow(t: SimTime): FxWindow {
  const wd = weekday(t);
  const m = minuteOfDay(t);
  if (wd >= 5 || (wd === 4 && m >= 22 * 60)) return { kind: 'closed', bps: WINDOW_BPS.closed };
  if (wd === 0 && m < 7 * 60) return { kind: 'thin', bps: WINDOW_BPS.thin };
  if (m >= 8 * 60 && m < 18 * 60) return { kind: 'day', bps: WINDOW_BPS.day };
  return { kind: 'thin', bps: WINDOW_BPS.thin };
}

/** Bank position and funding assumptions per currency. */
export const POSITIONS: Record<
  string,
  { longEur: number; source: string; fundingRate: number; vol: number }
> = {
  JPY: {
    longEur: 60e6,
    source: 'Long JPY: other clients’ flows and the Tokyo branch',
    fundingRate: 0.005,
    vol: 0.1,
  },
  SAR: {
    longEur: 0,
    source: 'Not long: overdraft on the Riyadh branch until Monday’s hedge',
    fundingRate: 0.055,
    vol: 0.07,
  },
  SGD: {
    longEur: 4e6,
    source: 'Partly long; the rest borrowed by the Singapore branch',
    fundingRate: 0.03,
    vol: 0.06,
  },
  USD: { longEur: 40e6, source: 'Long USD: New York branch', fundingRate: 0.036, vol: 0.07 },
  EUR: { longEur: Infinity, source: 'Home currency', fundingRate: 0.024, vol: 0 },
};

/** Next time the bank can hedge in the interbank market (Monday 07:00 after a weekend). */
export function hedgeAt(t: SimTime): SimTime {
  let d = dayIndex(t);
  const m = minuteOfDay(t);
  if (weekday(t) < 5 && m >= 7 * 60 && m < 18 * 60) return t;
  if (m >= 18 * 60) d += 1;
  while (weekday(d * MIN_PER_DAY) >= 5) d += 1;
  return d * MIN_PER_DAY + 7 * 60;
}

export interface FloorBreakdown {
  ccy: string;
  amountEur: number;
  window: FxWindow;
  quoteBps: number;
  long: boolean;
  source: string;
  hedgeAt: SimTime;
  hours: number;
  fundingBps: number;
  gapBps: number;
  capitalBps: number;
  runningBps: number;
  floorBps: number;
  marginBps: number;
  marginEur: number;
  fallback: boolean;
}

export function fxFloor(
  ccy: string,
  amountEur: number,
  t: SimTime,
  lockFriday = false,
): FloorBreakdown {
  const p = POSITIONS[ccy] ?? POSITIONS.USD;
  const window = fxWindow(t);
  const quoteBps = lockFriday ? FRIDAY_LOCK_BPS : window.bps;
  const h = hedgeAt(t);
  const hours = Math.max(0, (h - t) / 60);
  const long = p.longEur >= amountEur;
  const fundingBps = long ? 0 : p.fundingRate * (hours / 8760) * 10_000;
  // Gap premium: one standard deviation of the move over the closed period, on the uncovered part.
  const uncovered = long ? 0 : 1;
  const gapBps =
    window.kind === 'day'
      ? 0
      : p.vol * Math.sqrt(hours / 8760) * 10_000 * (0.25 + 0.75 * uncovered) * 0.35;
  const capitalBps = window.kind === 'day' ? 0 : 1;
  const runningBps = window.kind === 'day' ? 0.5 : 2;
  const floorBps = fundingBps + gapBps + capitalBps + runningBps;
  const marginBps = quoteBps - floorBps;
  return {
    ccy,
    amountEur,
    window,
    quoteBps,
    long,
    source: p.source,
    hedgeAt: h,
    hours,
    fundingBps,
    gapBps,
    capitalBps,
    runningBps,
    floorBps,
    marginBps,
    marginEur: (amountEur * marginBps) / 10_000,
    fallback: marginBps < 0,
  };
}

/** What the conversion costs the treasurer, in EUR. */
export const fxCostEur = (amountEur: number, bps: number) => (amountEur * bps) / 10_000;
