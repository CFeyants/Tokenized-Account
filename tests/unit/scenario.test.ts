import { describe, expect, it } from 'vitest';
import { buildTimeline, stateAfter, stateAt } from '@/engine/timeline';
import { drawers } from '@/engine/selectors';
import { at } from '@/engine/clock';

const tl = buildTimeline();
const m = (v: number) => Math.round((v / 1_000_000) * 1000) / 1000;

/** §3.1 — Current / Tokenised free / Tokenised blocked / Term units / Fund units (EUR m). */
const TABLE: [string, number, number, number, number, number][] = [
  ['e0', 120, 0, 0, 0, 0],
  ['e1', 109.5, 0, 0, 0, 0],
  ['e2', 121.5, 0, 0, 0, 0],
  ['e3', 20, 0, 0, 101.5, 0],
  ['e4', 20, 0, 0, 125.5, 0],
  ['e5', 20, 0, 0, 125.5, 0],
  ['e6', 80, 41.5, 0, 0, 0],
  ['e7', 80, 41.5, 0, 0, 0],
  ['e8', 80, 26.5, 15, 0, 0],
  ['e9', 30, 26.5, 15, 50, 0],
  ['e10', 30, 26.5, 15, 50, 0],
  ['e11', 30, 16.5, 15, 50, 10],
  ['e12', 5, 0, 15, 115.5, 10],
  ['e13', 5, 0, 15, 105.5, 10],
  ['e15', 65, 30.5, 0, 50, 10],
  ['e16', 65, 50.5, 0, 30, 10],
];

describe('scenario — state table of §3.1', () => {
  it.each(TABLE)('after %s', (id, cur, free, blocked, units, fund) => {
    const d = drawers(stateAfter(tl, id));
    expect([m(d.current), m(d.tokFree), m(d.tokBlocked), m(d.termUnits), m(d.fund)]).toEqual([
      cur,
      free,
      blocked,
      units,
      fund,
    ]);
  });

  it('row 5: USD 10m pending cover, not earning', () => {
    const s = stateAfter(tl, 'e5');
    expect(s.pending).toHaveLength(1);
    expect(s.pending[0].status).toBe('pendingCover');
    expect(s.bal['tok-usd-chicago']).toBe(0);
  });

  it('row 7: USD becomes final at Tue 10:30 and sits in a 1-month unit at 3.90%', () => {
    const s = stateAfter(tl, 'e7');
    const u = s.units.find((x) => x.currency === 'USD');
    expect(u?.amount).toBe(10_000_000);
    expect(u?.rate).toBeCloseTo(0.039);
    expect(s.pending[0].finalAt).toBe(at(1, '10:30'));
  });

  it('row 10: fund order queued, cash stays in the overnight unit', () => {
    expect(stateAfter(tl, 'e10').fundOrders[0].status).toBe('queued');
    const night = stateAt(tl, at(3, '23:00'));
    expect(night.fundOrders[0].status).toBe('queued');
    expect(drawers(night).tokFree).toBe(0);
  });

  it('row 12: the blocked amount is inside the unit, flagged not transferable', () => {
    const s = stateAfter(tl, 'e12');
    const blockedUnits = s.units.filter((u) => u.blocked);
    expect(blockedUnits.reduce((a, u) => a + u.amount, 0)).toBe(15_000_000);
    expect(blockedUnits.every((u) => u.tenor === 'weekend')).toBe(true);
    expect(s.blocked).toBe(0);
  });

  it('row 13: Singapore credited at once, mirror intragroup balance, within the night FX limit', () => {
    const s = stateAfter(tl, 'e13');
    expect(s.bal['tok-sgd-singapore']).toBeGreaterThan(14_000_000);
    expect(s.mirrors).toHaveLength(1);
    expect(s.fxNightUsed).toBeLessThanOrEqual(25_000_000);
  });

  it('row 14: guarantee expired, block released automatically', () => {
    const s = stateAfter(tl, 'e14');
    expect(drawers(s).tokBlocked).toBe(0);
    expect(s.collateral[0].status).toBe('released');
    expect(s.collateral[0].releasedAt).toBe(at(6, '19:00'));
  });

  it('row 17: no state change for the refused night payment', () => {
    const before = drawers(stateAt(tl, at(7, '19:59')));
    const after = drawers(stateAfter(tl, 'e17'));
    expect(after).toEqual(before);
  });

  it('daytime state matches after every nightly rule cycle (returns are complete)', () => {
    const tue = drawers(stateAt(tl, at(2, '10:00')));
    expect([m(tue.current), m(tue.tokFree), m(tue.termUnits)]).toEqual([80, 41.5, 0]);
    const thu = drawers(stateAt(tl, at(3, '10:00')));
    expect([m(thu.current), m(thu.tokFree), m(thu.tokBlocked)]).toEqual([80, 26.5, 15]);
  });

  it('the Munich account uses intraday credit overnight and is back to zero at 06:30', () => {
    expect(stateAt(tl, at(2, '22:00')).bal['tok-munich']).toBe(-4_000_000);
    expect(stateAt(tl, at(3, '06:31')).bal['tok-munich']).toBe(0);
  });
});
