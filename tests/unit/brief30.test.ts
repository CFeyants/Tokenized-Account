import { describe, expect, it } from 'vitest';
import { at } from '@/engine/clock';
import { buildTimeline, stateAt } from '@/engine/timeline';
import { actionToEvents, type UserAction } from '@/engine/userActions';
import { groupDay } from '@/engine/minuteCases';
import { cascade, TMMF, usClientValue } from '@/data/tmmf';
import { FX_MID } from '@/data/rates';
import { PROFILES, clientValue } from '@/engine/businessCase';
import { FRIDAY_LOCK_BPS, fxFloor } from '@/engine/fx';

const M = 1_000_000;
const tlWith = (actions: UserAction[]) => buildTimeline(actions.flatMap(actionToEvents));

describe('committed, not gone', () => {
  it('an earmark whose condition is not met by the deadline comes back by itself', () => {
    const tl = tlWith([
      {
        kind: 'prevalidate',
        id: 'P1',
        t: at(1, '10:00'),
        category: 'equipment',
        payee: 'Supplier',
        amount: 10 * M,
        condition: 'Acceptance',
        onLedger: false,
        deadline: at(2, '10:00'),
      },
    ]);
    const before = stateAt(tl, at(2, '09:59'));
    const after = stateAt(tl, at(2, '10:01'));
    expect(before.conditional.find((c) => c.id === 'P1')!.status).toBe('waiting');
    expect(after.conditional.find((c) => c.id === 'P1')!.status).toBe('returned');
    expect(before.earmarked - after.earmarked).toBeCloseTo(10 * M, 0);
  });
});

describe('just-in-time FX', () => {
  it('a rate locked on Friday uses no night FX limit and prices at the lock spread', () => {
    const base = {
      kind: 'jit' as const,
      id: 'J',
      t: at(7, '01:55'),
      to: 'tok-jpy-tokyo' as const,
      source: 'EUR' as const,
      amountEur: 8 * M,
    };
    const floating = stateAt(tlWith([base]), at(7, '02:00'));
    const locked = stateAt(tlWith([{ ...base, lockFriday: true }]), at(7, '02:00'));
    expect(locked.fxNightUsed).toBe(floating.fxNightUsed - 8 * M);
    expect(fxFloor('JPY', 8 * M, at(7, '01:55'), true).quoteBps).toBe(FRIDAY_LOCK_BPS);
  });
});

describe('US money funds', () => {
  it('the USD cascade uses the account, then the unit, then the fund within its nightly cap', () => {
    const r = cascade(30 * M, { tok: 5 * M, overnight: 5 * M, tmmf: 45 * M });
    expect(r.map((x) => x.take)).toEqual([5 * M, 5 * M, TMMF.nightRedemptionCapUsd, 10 * M]);
  });

  it('the USD pickup is on balances left on earnings credits', () => {
    const v = clientValue(PROFILES.large);
    expect(v.usdPickup).toBeCloseTo(usClientValue(PROFILES.large.usSurplus).pickup / FX_MID.USD, 6);
  });
});

describe('a multi-time-zone day', () => {
  it('group effect is nil; the allocation moves from Singapore to Paris', () => {
    const g = groupDay();
    const [sg, pa] = g.legs;
    expect(sg.days).toBe(0);
    expect(pa.days).toBe(1);
    expect(g.dayTotal).toBeCloseTo(g.minuteTotal, 0);
    expect(sg.minuteInterest).toBeGreaterThan(0);
    expect(sg.minuteInterest + pa.minuteInterest - pa.dayInterest).toBeCloseTo(0, 0);
  });
});
