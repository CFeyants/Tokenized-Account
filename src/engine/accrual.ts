/**
 * Interest conventions, Actual/360.
 *  - Tokenised account and units: accrued to the minute on time-stamped balances.
 *  - Current account (and classic deposit): end-of-day balance × rate / 360, once per calendar day.
 */
import { MIN_PER_DAY, type SimTime } from './clock';
import type { Snapshot } from './types';

export const MINUTES_PER_YEAR_360 = 360 * MIN_PER_DAY; // 518,400

/** amount × rate × minutes / (360 × 1440) */
export function minuteAccrual(amount: number, rate: number, minutes: number): number {
  return (amount * rate * minutes) / MINUTES_PER_YEAR_360;
}

/** amount × rate / 360 — one calendar day on the end-of-day balance. */
export function dailyAccrual(eodBalance: number, rate: number): number {
  return (eodBalance * rate) / 360;
}

/** Last snapshot at or before t (snapshots sorted by time; the first one starts the week). */
export function snapshotAt<S>(snaps: Snapshot<S>[], t: SimTime): Snapshot<S> {
  let lo = 0;
  let hi = snaps.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (snaps[mid].t <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return snaps[ans];
}

/**
 * Σ over constant-balance segments of weight(state) × minutes / 518,400, from `from` to `to`.
 * `weight` returns Σ amount × annual rate for the state (a "rate-weighted balance").
 */
export function integrateMinutes<S>(
  snaps: Snapshot<S>[],
  from: SimTime,
  to: SimTime,
  weight: (s: S) => number,
): number {
  if (to <= from) return 0;
  let total = 0;
  for (let i = 0; i < snaps.length; i++) {
    const a = Math.max(from, snaps[i].t);
    const b = Math.min(to, i + 1 < snaps.length ? snaps[i + 1].t : Infinity);
    if (b > a) total += (weight(snaps[i].state) * (b - a)) / MINUTES_PER_YEAR_360;
  }
  return total;
}

/** Minutes between from and to during which pred(state) holds. */
export function minutesWhere<S>(
  snaps: Snapshot<S>[],
  from: SimTime,
  to: SimTime,
  pred: (s: S) => boolean,
  within?: (a: SimTime, b: SimTime) => number,
): number {
  let total = 0;
  for (let i = 0; i < snaps.length; i++) {
    const a = Math.max(from, snaps[i].t);
    const b = Math.min(to, i + 1 < snaps.length ? snaps[i + 1].t : Infinity);
    if (b > a && pred(snaps[i].state)) total += within ? within(a, b) : b - a;
  }
  return total;
}

/**
 * Daily convention: for every calendar day completed by t, the end-of-day balance (as it stands
 * at 23:59) × rate / 360. `weight` returns Σ balance × rate. Days before `firstDay` are ignored.
 */
export function integrateEod<S>(
  snaps: Snapshot<S>[],
  t: SimTime,
  weight: (s: S) => number,
  firstDay = 0,
): number {
  let total = 0;
  for (let d = firstDay; (d + 1) * MIN_PER_DAY <= t; d++) {
    const eod = snapshotAt(snaps, (d + 1) * MIN_PER_DAY - 1e-6).state;
    total += weight(eod) / 360;
  }
  return total;
}

/** Per-day EOD postings (for the "daily amount posted to the classic interest engine" view). */
export function eodPostings<S>(snaps: Snapshot<S>[], t: SimTime, weight: (s: S) => number) {
  const rows: { day: number; amount: number }[] = [];
  for (let d = 0; (d + 1) * MIN_PER_DAY <= t; d++) {
    const eod = snapshotAt(snaps, (d + 1) * MIN_PER_DAY - 1e-6).state;
    rows.push({ day: d, amount: weight(eod) / 360 });
  }
  return rows;
}
