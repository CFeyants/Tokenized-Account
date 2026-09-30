import { describe, expect, it } from 'vitest';
import { RATES, UNIT_RATE } from '@/data/rates';
import { dailyAccrual, integrateEod, integrateMinutes, minuteAccrual } from '@/engine/accrual';
import {
  at,
  dayPhase,
  formatClock,
  isBusinessHours,
  nextOpening,
  offHoursMinutes,
  parseParam,
  toParam,
} from '@/engine/clock';
import { computeCounters, collateralInterest } from '@/engine/counters';
import { accrualStart, earningMinutes, finalityOnArrival } from '@/engine/finality';
import { classicBreakCost, fxNightQuote, unitSaleQuote } from '@/engine/pricing';
import { minuteWeight } from '@/engine/selectors';
import { buildTimeline, stateAt } from '@/engine/timeline';
import { BRAZIL_BID_BOND } from '@/engine/scenario';
import type { Snapshot } from '@/engine/types';

const tl = buildTimeline();

describe('doctrine', () => {
  it('the tokenised account never pays more than the current account', () => {
    expect(RATES.tokenised).toBeLessThanOrEqual(RATES.current);
  });

  it('yield lives in term units: every unit pays more than the current account', () => {
    for (const r of Object.values(UNIT_RATE)) expect(r).toBeGreaterThan(RATES.current);
  });

  it('at every event, no tokenised balance earns above the current account rate', () => {
    for (const snap of tl.snaps) {
      const s = snap.state;
      const tokOnly = { ...s, units: [], fundUnits: 0 };
      const bal = Math.max(0, s.bal['tok-paris']) + Math.max(0, s.bal['tok-munich']) + s.blocked;
      if (bal > 0) expect(minuteWeight(tokOnly) / bal).toBeLessThanOrEqual(RATES.current + 1e-12);
    }
  });

  it('no interest before finality: the USD receipt earns nothing until Tue 10:30', () => {
    const before = computeCounters(tl, at(1, '10:29'));
    const s = stateAt(tl, at(1, '10:29'));
    expect(s.units.some((u) => u.currency === 'USD')).toBe(false);
    expect(s.bal['tok-usd-chicago']).toBe(0);
    const r = s.pending[0];
    expect(accrualStart(r)).toBeNull();
    expect(earningMinutes(r, at(1, '10:29'))).toBe(0);
    const after = stateAt(tl, at(1, '11:30'));
    expect(earningMinutes(after.pending[0], at(1, '11:30'))).toBe(60);
    expect(before.newParts.units).toBeGreaterThan(0); // EUR units only
  });

  it('finality by rail', () => {
    expect(finalityOnArrival('sctInst')).toBe('final');
    expect(finalityOnArrival('intragroup')).toBe('final');
    expect(finalityOnArrival('correspondent')).toBe('pendingCover');
  });
});

describe('accrual', () => {
  it('minute accrual is Actual/360', () => {
    expect(minuteAccrual(1_000_000, 0.018, 1440)).toBeCloseTo(50, 10);
    expect(minuteAccrual(1_000_000, 0.018, 12 * 60)).toBeCloseTo(25, 10);
  });

  it('daily accrual on the end-of-day balance', () => {
    expect(dailyAccrual(1_000_000, 0.005)).toBeCloseTo(13.8889, 3);
  });

  it('same euro, two accounts: 19:00 → 09:00', () => {
    // Current account: counted for the full day on the end-of-day balance.
    const snaps: Snapshot<number>[] = [
      { t: 0, eventId: 's', state: 0 },
      { t: at(0, '19:00'), eventId: 'in', state: 1_000_000 },
      { t: at(1, '09:00'), eventId: 'out', state: 0 },
    ];
    const current = integrateEod(snaps, at(2, '00:00'), (b) => b * RATES.current);
    expect(current).toBeCloseTo(13.89, 2);
    // Tokenised + overnight unit: 12 h in the unit, 2 h on the account.
    const tok =
      minuteAccrual(1_000_000, RATES.overnightUnit, 12 * 60) +
      minuteAccrual(1_000_000, RATES.tokenised, 120);
    expect(tok).toBeCloseTo(
      (1_000_000 * RATES.overnightUnit * 12) / 8640 + (1_000_000 * RATES.tokenised * 2) / 8640,
      6,
    );
    expect(tok).toBeGreaterThan(current);
  });

  it('integrates constant segments exactly', () => {
    const snaps: Snapshot<number>[] = [
      { t: 0, eventId: 'a', state: 0 },
      { t: 60, eventId: 'b', state: 518_400 },
      { t: 120, eventId: 'c', state: 0 },
    ];
    expect(integrateMinutes(snaps, 0, 1000, (w) => w)).toBeCloseTo(60, 10);
  });
});

describe('clock', () => {
  it('business hours, phases and next opening', () => {
    expect(isBusinessHours(at(0, '10:00'))).toBe(true);
    expect(isBusinessHours(at(0, '18:00'))).toBe(false);
    expect(isBusinessHours(at(5, '10:00'))).toBe(false);
    expect(dayPhase(at(5, '10:00'))).toBe('weekend');
    expect(nextOpening(at(4, '18:30'))).toBe(at(7, '07:00'));
    expect(nextOpening(at(0, '18:30'))).toBe(at(1, '07:00'));
    expect(formatClock(at(4, '18:32'))).toBe('Fri 18:32');
  });

  it('parses and prints the ?t= parameter', () => {
    expect(parseParam('2026-10-05T18:30')).toBe(at(0, '18:30'));
    expect(toParam(at(4, '18:30'))).toBe('2026-10-09T18:30');
    expect(parseParam('2027-01-01T00:00')).toBeNull();
  });

  it('counts off-hours minutes', () => {
    expect(offHoursMinutes(at(0, '09:00'), at(0, '18:00'))).toBe(0);
    expect(offHoursMinutes(at(0, '18:00'), at(1, '09:00'))).toBe(15 * 60);
    expect(offHoursMinutes(at(4, '18:00'), at(7, '09:00'))).toBe(63 * 60);
  });
});

describe('pricing', () => {
  it('unit sale price = par + accrued − 2 bps', () => {
    const q = unitSaleQuote({ rate: 0.022, start: 0 }, 20_000_000, 1440);
    expect(q.accrued).toBeCloseTo(1222.22, 2);
    expect(q.spread).toBeCloseTo(4000, 6);
    expect(q.price).toBeCloseTo(20_000_000 + 1222.22 - 4000, 1);
  });

  it('night FX quote is mid − 10 bps', () => {
    const q = fxNightQuote('SGD', 10_000_000);
    expect(q.rate).toBeCloseTo(1.448 * 0.999, 8);
    expect(q.costEur).toBeCloseTo(10_000, 0);
  });

  it('breaking a classic deposit costs forfeited interest + fee', () => {
    const c = classicBreakCost(20_000_000, 0.022, 4);
    expect(c.total).toBeCloseTo(4888.89 + 10_000, 1);
  });
});

describe('counters', () => {
  const end = computeCounters(tl, at(7, '21:00'));

  it('both counters are positive at the end of the week and the new layer earns more', () => {
    expect(end.newTotal).toBeGreaterThan(0);
    expect(end.tradTotal).toBeGreaterThan(0);
    expect(end.newTotal).toBeGreaterThan(end.tradTotal);
  });

  it('intraday credit: 555 minutes for Munich', () => {
    expect(end.jitMinutes).toBe(555);
    expect(end.jitCost).toBeCloseTo((4_000_000 * RATES.intradayDebit * 555) / 518_400, 6);
  });

  it('night sweeps: gross in and returns', () => {
    expect(end.sweptIn).toBe(24_000_000 * 6);
    expect(end.heldFromOtherBanks).toBe(24_000_000);
  });

  it('collateral kept earning for every minute of the block', () => {
    const r = collateralInterest(tl, BRAZIL_BID_BOND, at(2, '11:00'), at(6, '19:00'));
    expect(r.onAccount).toBeGreaterThan(0);
    expect(r.inUnit).toBeGreaterThan(r.onAccount);
  });

  it('nothing earns before the week starts', () => {
    const c = computeCounters(tl, at(0, '09:00'));
    expect(c.newParts.tokenised + c.newParts.units + c.newParts.fund).toBe(0);
  });
});

describe('rule previews', async () => {
  const { previewSweep, previewFunding, previewLadder } = await import('@/engine/preview');
  it('sweep preview: a lower threshold earns more', () => {
    const a = previewSweep(tl, 20_000_000, 5_000_000);
    const b = previewSweep(tl, 40_000_000, 5_000_000);
    expect(a.gain).toBeGreaterThan(b.gain);
    expect(a.rows).toHaveLength(5);
    expect(a.rows[0].swept).toBe(101_500_000);
  });
  it('funding preview: to the minute is cheaper than a full day', () => {
    const f = previewFunding(4_000_000, 555);
    expect(f.toMinute).toBeLessThan(f.fullDay);
  });
  it('ladder preview earns above the current account', () => {
    expect(previewLadder(tl, 60_000_000, ['1m', '3m', '6m', '12m']).perYear).toBeGreaterThan(0);
  });
});
