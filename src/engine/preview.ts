/**
 * "If this rule had run last week…" — pure previews computed on the scenario week, using the
 * traditional twin as the baseline (what the balances were without any rule).
 */
import { RATES } from '@/data/rates';
import { at, formatDate, isFriday, nextOpening, MIN_PER_DAY } from './clock';
import { minuteAccrual, integrateMinutes, snapshotAt } from './accrual';
import type { Timeline } from './timeline';

export interface NightRow {
  label: string;
  swept: number;
  hours: number;
  unitInterest: number;
  sightLost: number;
}

/** Sweep the current account surplus above `threshold` into overnight / weekend units. */
export function previewSweep(tl: Timeline, threshold: number, fridayThreshold: number) {
  const rows: NightRow[] = [];
  for (let d = 0; d < 5; d++) {
    const t = at(d, '18:30');
    const bal = snapshotAt(tl.trad, t).state.current;
    const th = isFriday(t) ? fridayThreshold : threshold;
    const swept = Math.max(0, bal - th);
    const minutes = nextOpening(t) - t;
    const days = isFriday(t) ? 3 : 1;
    rows.push({
      label: formatDate(t),
      swept,
      hours: minutes / 60,
      unitInterest: minuteAccrual(swept, RATES.overnightUnit, minutes),
      sightLost: (swept * RATES.current * days) / 360,
    });
  }
  const gain = rows.reduce((a, r) => a + r.unitInterest - r.sightLost, 0);
  return { rows, gain };
}

/** Sweep other banks' surplus above their floor each night (balances at other banks at 0%). */
export function previewNightSweep(banks: { floor: number; balance: number }[]) {
  let total = 0;
  let swept = 0;
  for (let d = 0; d < 5; d++) {
    const t = at(d, '19:10');
    const minutes = nextOpening(t) - t;
    for (const b of banks) {
      const s = Math.max(0, b.balance - b.floor);
      swept += s;
      total += minuteAccrual(s, RATES.overnightUnit, minutes);
    }
  }
  return { swept, gain: total };
}

const TENOR_RATE = {
  '1m': RATES.unit1m,
  '3m': RATES.unit3m,
  '6m': RATES.unit6m,
  '12m': RATES.unit12m,
} as const;

/** Surplus above X laddered in equal slices; compared with leaving it on the current account. */
export function previewLadder(tl: Timeline, above: number, tenors: (keyof typeof TENOR_RATE)[]) {
  // Average end-of-day current balance in the traditional twin over the five business days.
  let sum = 0;
  for (let d = 0; d < 5; d++)
    sum += snapshotAt(tl.trad, (d + 1) * MIN_PER_DAY - 1e-6).state.current;
  const avg = sum / 5;
  const amount = Math.max(0, avg - above);
  const rate = tenors.length ? tenors.reduce((a, k) => a + TENOR_RATE[k], 0) / tenors.length : 0;
  const perYear = amount * (rate - RATES.current);
  return { avg, amount, rate, perYear, perWeek: (perYear * 7) / 360 };
}

/** Intraday credit to the minute vs a traditional overdraft charged for the whole day. */
export function previewFunding(amount: number, minutes: number) {
  const toMinute = minuteAccrual(amount, RATES.intradayDebit, minutes);
  const fullDay = (amount * RATES.intradayDebit) / 360;
  return { toMinute, fullDay, saved: fullDay - toMinute };
}

/** Interest kept by a block released by rule, vs a cash gage at 0% released next business day. */
export function previewRelease(tl: Timeline, collateralId: string, from: number, to: number) {
  const kept = integrateMinutes(tl.snaps, from, to, (s) => {
    const col = s.collateral.find((c) => c.id === collateralId);
    const onAcc = col && col.status === 'active' ? s.blocked * RATES.tokenised : 0;
    const inUnit = s.units
      .filter((u) => u.blocked && u.collateralId === collateralId)
      .reduce((a, u) => a + u.amount * u.rate, 0);
    return onAcc + inUnit;
  });
  return { kept, gage: 0, minutes: to - from };
}
