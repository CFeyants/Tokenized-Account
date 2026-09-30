/**
 * Where the minute counts — the six situations where money stays on the tokenised account and
 * counting to the minute changes the result. Each case compares the daily convention (one
 * snapshot at end of day) with counting to the minute, on the same balance path.
 * Live cases read the scenario; illustrative cases take parameters.
 */
import { RATES } from '@/data/rates';
import { MIN_PER_DAY, at, type SimTime } from './clock';
import { integrateMinutes, minuteAccrual, minutesWhere } from './accrual';
import { collateralInterest } from './counters';
import { BRAZIL_BID_BOND, WARSAW_PAYMENT } from './scenario';
import type { Timeline } from './timeline';

export interface Window {
  from: SimTime;
  to: SimTime;
  amount: number;
}

export interface CaseResult {
  minutes: number;
  minuteInterest: number;
  daysCounted: number;
  dailyInterest: number;
  windows: Window[];
  range: [SimTime, SimTime];
}

/** End-of-day instants, in Paris minutes of the day (week of 5 Oct 2026: CEST, SGT +6 h, EDT −6 h). */
export const EOD = {
  paris: MIN_PER_DAY,
  singapore: 18 * 60,
  newYork: 6 * 60,
} as const;
export type Zone = keyof typeof EOD;

/** Number of end-of-day snapshots (taken just before the zone's midnight) inside [from, to). */
export function daysCounted(from: SimTime, to: SimTime, zone: Zone): number {
  let n = 0;
  const cut = EOD[zone] - 1e-3;
  for (let d = Math.floor(from / MIN_PER_DAY) - 1; d * MIN_PER_DAY <= to; d++) {
    const c = d * MIN_PER_DAY + cut;
    if (c >= from && c < to) n++;
  }
  return n;
}

const perMinute = (amount: number, rate: number, minutes: number) =>
  minuteAccrual(amount, rate, minutes);
const perDay = (amount: number, rate: number, days: number) => (amount * rate * days) / 360;

// 1 ─ Pure intraday float ────────────────────────────────────────────────────
/** A high-rotation profile: collections 08:00–12:00 up to `peak`, payouts 17:00–19:00. */
export function floatCase(peak: number, businessDays = 250) {
  const d = 1; // an ordinary Tuesday
  const windows: Window[] = [];
  for (let h = 8; h < 12; h++)
    windows.push({
      from: at(d, `${h}:00`),
      to: at(d, `${h + 1}:00`),
      amount: (peak * (h - 7)) / 4,
    });
  windows.push({ from: at(d, '12:00'), to: at(d, '17:00'), amount: peak });
  windows.push({ from: at(d, '17:00'), to: at(d, '18:00'), amount: peak / 2 });
  windows.push({ from: at(d, '18:00'), to: at(d, '19:00'), amount: peak / 4 });
  const minuteInterest = windows.reduce(
    (a, w) => a + perMinute(w.amount, RATES.tokenised, w.to - w.from),
    0,
  );
  const minutes = windows.reduce((a, w) => a + (w.to - w.from), 0);
  return {
    minutes,
    minuteInterest,
    daysCounted: 0,
    dailyInterest: 0,
    windows,
    range: [at(d, '00:00'), at(d + 1, '00:00')] as [SimTime, SimTime],
    perYear: minuteInterest * businessDays,
  };
}

// 2 ─ Blocked collateral (live: Brazil bid bond) ─────────────────────────────
export function collateralCase(
  tl: Timeline,
  t: SimTime,
): CaseResult & { onAccount: number; inUnit: number } {
  const from = at(2, '11:00');
  const released = at(6, '19:00');
  const to = Math.max(from, Math.min(t, released));
  const r = collateralInterest(tl, BRAZIL_BID_BOND, from, to);
  return {
    minutes: to - from,
    minuteInterest: r.total,
    onAccount: r.onAccount,
    inUnit: r.inUnit,
    daysCounted: daysCounted(from, to, 'paris'),
    dailyInterest: 0, // cash gage at 0%
    windows: [{ from, to: released, amount: 15_000_000 }],
    range: [at(2, '00:00'), at(7, '00:00')],
  };
}

// 3 ─ Cash waiting for the just-in-time draw (live) ──────────────────────────
/** Group buffer on the tokenised account between the 07:00 return and the 18:30 rule, each day. */
export function waitingCase(tl: Timeline, t: SimTime) {
  const days = [1, 2, 3, 4, 7];
  const rows = days.map((d) => {
    const a = at(d, '07:00');
    const b = Math.min(t, at(d, '18:30'));
    const interest = integrateMinutes(
      tl.snaps,
      a,
      b,
      (s) => Math.max(0, s.bal['tok-paris']) * RATES.tokenised,
    );
    const minutes = Math.max(0, b - a);
    return { day: d, from: a, to: at(d, '18:30'), minutes, interest };
  });
  // The other direction: Munich borrowed to the minute.
  const debitMinutes = minutesWhere(tl.snaps, 0, t, (s) => s.bal['tok-munich'] < 0);
  const debitMinute = perMinute(4_000_000, RATES.intradayDebit, debitMinutes);
  const debitDaily = perDay(
    4_000_000,
    RATES.intradayDebit,
    daysCounted(at(2, '21:15'), Math.min(t, at(3, '06:30')), 'paris'),
  );
  return {
    rows,
    minuteInterest: rows.reduce((a, r) => a + r.interest, 0),
    minutes: rows.reduce((a, r) => a + r.minutes, 0),
    dailyInterest: 0, // at 23:59 the buffer sits in the overnight unit: nothing on the account
    daysCounted: 0,
    examples: [
      {
        label: 'Wed: EUR 15m waits 07:00 → 11:00 for the bid bond',
        amount: 15_000_000,
        minutes: 240,
      },
      {
        label: 'Fri: EUR 10m waits 07:00 → 09:00 for the fund settlement',
        amount: 10_000_000,
        minutes: 120,
      },
    ],
    debit: { minutes: debitMinutes, toMinute: debitMinute, byDay: debitDaily },
  };
}

// 4 ─ Transit and amounts below the unit minimum (illustrative) ─────────────
export function transitCase(amount: number, departure: SimTime, residual: number) {
  const d = 7;
  const from = at(d, '07:00');
  const transit = perMinute(amount, RATES.tokenised, departure - from);
  // A residual below the unit minimum stays on the account from 18:30 to 07:00.
  const nightMinutes = at(d + 1, '07:00') - at(d, '18:30');
  const residualInterest = perMinute(residual, RATES.tokenised, nightMinutes);
  return {
    minutes: departure - from,
    transit,
    residualInterest,
    nightMinutes,
    minuteInterest: transit + residualInterest,
    // Daily convention: the transit is gone before midnight (0); the residual is there at 23:59 (1 day).
    daysCounted: 1,
    dailyInterest: perDay(residual, RATES.tokenised, 1),
    windows: [{ from, to: departure, amount }],
    range: [at(d, '00:00'), at(d, '12:00')] as [SimTime, SimTime],
  };
}

// 5 ─ Pre-screened payments waiting for a condition (live: Warsaw) ──────────
export function conditionalCase(tl: Timeline, t: SimTime, overnightIfLate: boolean) {
  const from = at(7, '10:30');
  const released = at(7, '16:45');
  const to = Math.max(from, Math.min(t, released));
  const live = integrateMinutes(tl.snaps, from, to, (s) => {
    const p = s.conditional.find((x) => x.id === WARSAW_PAYMENT && x.status === 'waiting');
    return p ? s.earmarked * RATES.tokenised : 0;
  });
  // What if the certificate came the next morning at 09:40? The earmark sits in a flagged overnight unit.
  const lateNight =
    perMinute(6_000_000, RATES.tokenised, at(7, '18:30') - from) +
    perMinute(6_000_000, RATES.overnightUnit, at(8, '07:00') - at(7, '18:30')) +
    perMinute(6_000_000, RATES.tokenised, at(8, '09:40') - at(8, '07:00'));
  return {
    minutes: to - from,
    minuteInterest: live,
    daysCounted: 0,
    dailyInterest: 0,
    windows: [{ from, to: released, amount: 6_000_000 }],
    range: [at(7, '06:00'), at(7, '22:00')] as [SimTime, SimTime],
    ifLate: overnightIfLate
      ? {
          interest: lateNight,
          minutes: at(8, '09:40') - from,
          dailyAt050: perDay(6_000_000, RATES.current, 1),
        }
      : null,
  };
}

// 6 ─ Multi-time-zone groups: "end of day" is not an instant ─────────────────
export interface ZoneRow {
  label: string;
  from: SimTime;
  to: SimTime;
  amount: number;
  rate: number;
  minuteInterest: number;
  byZone: Record<Zone, { days: number; interest: number }>;
}

function zoneRow(label: string, from: SimTime, to: SimTime, amount: number, rate: number): ZoneRow {
  const byZone = {} as ZoneRow['byZone'];
  for (const z of Object.keys(EOD) as Zone[]) {
    const days = daysCounted(from, to, z);
    byZone[z] = { days, interest: perDay(Math.abs(amount), rate, days) * Math.sign(amount) };
  }
  return {
    label,
    from,
    to,
    amount,
    rate,
    minuteInterest: perMinute(Math.abs(amount), rate, to - from) * Math.sign(amount),
    byZone,
  };
}

export function timezoneCase() {
  return [
    zoneRow(
      'Singapore funding, Sat 22:00 → Sun 02:00 (Paris)',
      at(5, '22:00'),
      at(6, '02:00'),
      10_000_000,
      RATES.tokenised,
    ),
    zoneRow(
      'Munich intraday credit, Wed 21:15 → Thu 06:30 (Paris)',
      at(2, '21:15'),
      at(3, '06:30'),
      -4_000_000,
      RATES.intradayDebit,
    ),
    zoneRow(
      'EUR 5m received 16:30, paid out 19:30 (Paris)',
      at(3, '16:30'),
      at(3, '19:30'),
      5_000_000,
      RATES.tokenised,
    ),
  ];
}
