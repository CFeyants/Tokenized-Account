import { describe, expect, it } from 'vitest';
import { at } from '@/engine/clock';
import { buildTimeline, stateAt } from '@/engine/timeline';
import { drawers } from '@/engine/selectors';
import {
  collateralCase,
  conditionalCase,
  daysCounted,
  floatCase,
  timezoneCase,
  transitCase,
  waitingCase,
} from '@/engine/minuteCases';

const tl = buildTimeline();
const END = at(7, '21:00');

describe('where the minute counts', () => {
  it('end of day is not an instant: the same flow counts differently by zone', () => {
    // Sat 22:00 → Sun 02:00 Paris: Paris midnight inside; Singapore (18:00 Paris) and New York (06:00 Paris) outside.
    expect(daysCounted(at(5, '22:00'), at(6, '02:00'), 'paris')).toBe(1);
    expect(daysCounted(at(5, '22:00'), at(6, '02:00'), 'singapore')).toBe(0);
    expect(daysCounted(at(5, '22:00'), at(6, '02:00'), 'newYork')).toBe(0);
    // Munich overdraft Wed 21:15 → Thu 06:30: Paris and New York count it, Singapore does not.
    expect(daysCounted(at(2, '21:15'), at(3, '06:30'), 'paris')).toBe(1);
    expect(daysCounted(at(2, '21:15'), at(3, '06:30'), 'newYork')).toBe(1);
    expect(daysCounted(at(2, '21:15'), at(3, '06:30'), 'singapore')).toBe(0);
    const rows = timezoneCase();
    for (const r of rows) expect(r.minuteInterest).not.toBe(0);
  });

  it('pure intraday float: nothing by the day, something by the minute', () => {
    const f = floatCase(60_000_000);
    expect(f.dailyInterest).toBe(0);
    expect(f.minuteInterest).toBeGreaterThan(0);
  });

  it('collateral: most of it is earned in units at night', () => {
    const c = collateralCase(tl, END);
    expect(c.minutes).toBe(at(6, '19:00') - at(2, '11:00'));
    expect(c.inUnit).toBeGreaterThan(c.onAccount);
  });

  it('waiting buffer earns between 07:00 and 18:30; borrowing costs less to the minute', () => {
    const w = waitingCase(tl, END);
    expect(w.minuteInterest).toBeGreaterThan(0);
    expect(w.debit.minutes).toBe(555);
    expect(w.debit.toMinute).toBeLessThan(w.debit.byDay);
  });

  it('transit and residual', () => {
    const r = transitCase(25_000_000, at(7, '09:30'), 800_000);
    expect(r.minutes).toBe(150);
    expect(r.transit).toBeGreaterThan(0);
  });

  it('conditional payment: earmarked 10:30 → 16:45, earns to the minute, then leaves', () => {
    const during = stateAt(tl, at(7, '12:00'));
    expect(during.earmarked).toBe(6_000_000);
    expect(drawers(during).tokFree).toBeCloseTo(44_500_000, 0);
    const after = stateAt(tl, at(7, '17:00'));
    expect(after.earmarked).toBe(0);
    expect(after.conditional[0].status).toBe('released');
    const c = conditionalCase(tl, END, true);
    expect(c.minutes).toBe(375);
    expect(c.minuteInterest).toBeCloseTo((6_000_000 * 0.001 * 375) / 518_400, 6);
    expect(c.ifLate!.interest).toBeGreaterThan(c.minuteInterest);
  });
});
