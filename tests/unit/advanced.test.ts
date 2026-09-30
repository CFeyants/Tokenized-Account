import { describe, expect, it } from 'vitest';
import { at } from '@/engine/clock';
import { buildTimeline, stateAt } from '@/engine/timeline';
import { actionToEvents, type UserAction } from '@/engine/userActions';
import { compareJit } from '@/engine/markets';
import { repatriationQuote } from '@/engine/advanced';
import { LATAM } from '@/data/corridors';
import { FX_MID } from '@/data/rates';

const M = 1_000_000;
const tlWith = (actions: UserAction[]) => buildTimeline(actions.flatMap(actionToEvents));

describe('just-in-time funding in JPY and SAR', () => {
  it('Tokyo needs yen Monday 09:00 JST (= Mon 02:00 Paris): funded on the ledger at 01:55, from EUR', () => {
    const tl = tlWith([
      {
        kind: 'jit',
        id: 'J1',
        t: at(7, '01:55'),
        to: 'tok-jpy-tokyo',
        source: 'EUR',
        amountEur: 8 * M,
      },
    ]);
    const s = stateAt(tl, at(7, '01:56'));
    expect(s.bal['tok-jpy-tokyo']).toBeCloseTo(8 * M * FX_MID.JPY * (1 - 10 / 10_000), 0);
    // Saturday's EUR 10m for Singapore counts in the same weekend night: 18 of 25.
    expect(s.fxNightUsed).toBe(18 * M);
    expect(s.mirrors.some((m) => m.creditorBank === 'Norvane Bank Tokyo')).toBe(true);
  });

  it('traditional route must pre-fund on Friday: the yen desk and Tokyo never overlap', () => {
    const c = compareJit('JPY', 8 * M, at(7, '02:00'), at(5, '10:00'));
    expect(c.tradTradeAt).toBeLessThanOrEqual(at(4, '16:00'));
    expect(c.lostByPrefunding).toBeGreaterThan(0);
    expect(c.closedAtNeed).toContain('parisDesk');
  });

  it('Riyadh on Sunday: SARIE open, Paris closed — funded from the dollar leg', () => {
    const tl = tlWith([
      {
        kind: 'jit',
        id: 'J2',
        t: at(6, '08:55'),
        to: 'tok-sar-riyadh',
        source: 'USD',
        amountEur: 5 * M,
      },
    ]);
    const s = stateAt(tl, at(6, '09:00'));
    expect(s.bal['tok-sar-riyadh']).toBeGreaterThan(20 * M);
    const usdUnit = s.units.find((u) => u.currency === 'USD');
    expect(usdUnit!.amount).toBeLessThan(10 * M); // part sold to the bank, not broken
    const c = compareJit('SAR', 5 * M, at(6, '09:00'), at(6, '08:00'));
    expect(c.closedAtNeed).toContain('parisDesk');
    expect(c.closedAtNeed).not.toContain('riyadh');
  });
});

describe('large payments pre-validated', () => {
  it('earmarked and earning; released at night to a bank off the ledger waits for T2', () => {
    const tl = tlWith([
      {
        kind: 'prevalidate',
        id: 'P1',
        t: at(7, '11:00'),
        category: 'mna',
        payee: 'Sellers',
        amount: 20 * M,
        condition: 'Completion',
        onLedger: false,
      },
      { kind: 'release', id: 'R1', t: at(7, '19:00'), target: 'P1' },
    ]);
    // + the scenario's EUR 6m Warsaw earmark (10:30 → 16:45)
    expect(stateAt(tl, at(7, '12:00')).earmarked).toBe(26 * M);
    const night = stateAt(tl, at(7, '19:30'));
    expect(night.conditional.find((c) => c.id === 'P1')!.status).toBe('awaitingRail');
    expect(night.units.some((u) => u.earmarkId)).toBe(true); // the 18:30 rule put the earmark in a flagged unit
  });
});

describe('escrow with purpose-bound money', () => {
  it('releases shares on valid oracle events and ignores bad signatures', () => {
    const tl = tlWith([
      { kind: 'escrow', id: 'E1', t: at(7, '11:00'), template: 'mna' },
      {
        kind: 'oracle',
        id: 'O1',
        t: at(7, '12:00'),
        target: 'E1',
        milestone: 'completion',
        valid: false,
      },
      {
        kind: 'oracle',
        id: 'O2',
        t: at(7, '13:00'),
        target: 'E1',
        milestone: 'clearance',
        valid: true,
      },
      {
        kind: 'oracle',
        id: 'O3',
        t: at(7, '14:00'),
        target: 'E1',
        milestone: 'completion',
        valid: true,
      },
    ]);
    expect(stateAt(tl, at(7, '12:30')).earmarked).toBe(26 * M);
    const s = stateAt(tl, at(7, '14:01'));
    const e = s.conditional.find((c) => c.id === 'E1')!;
    expect(e.released).toBeCloseTo(18 * M, 0);
    expect(s.earmarked).toBeCloseTo(8 * M, 0);
    expect(e.events!.filter((x) => !x.accepted)).toHaveLength(1);
  });
});

describe('corridors', () => {
  it('interbank tokenised deposit from the tokenised account works at night on a pilot corridor', () => {
    const tl = tlWith([
      {
        kind: 'corridorPay',
        id: 'C1',
        t: at(7, '20:30'),
        payee: 'milan',
        amount: 3 * M,
        from: 'tok-paris',
        rail: 'interbank',
      },
    ]);
    expect(tl.ledger.some((l) => l.account.startsWith('interbank:') && l.eventId === 'C1')).toBe(
      true,
    );
  });

  it('Brazil → EUR through the stablecoin corridor on Saturday night, credited and placed in a unit', () => {
    const brl = 30 * M;
    const tl = tlWith([
      { kind: 'repatriate', id: 'L1', t: at(5, '21:00'), country: 'BR', local: brl },
    ]);
    const q = repatriationQuote(LATAM[0], brl);
    const mid = stateAt(tl, at(5, '21:02'));
    expect(mid.wallets['bitso-qeur']).toBeCloseTo(q.eur, 2);
    const done = stateAt(tl, at(5, '21:10'));
    expect(done.repatriations[0].status).toBe('credited');
    expect(done.wallets['bitso-qeur']).toBeCloseTo(0, 6);
    expect(done.units.some((u) => Math.abs(u.amount - q.eur) < 1)).toBe(true);
  });

  it('Colombia waits for the local rail to open', () => {
    const tl = tlWith([
      { kind: 'repatriate', id: 'L2', t: at(5, '10:00'), country: 'CO', local: 10_000 * M },
    ]);
    const r = stateAt(tl, at(7, '16:00')).repatriations[0];
    expect(r.steps.find((x) => x.key === 'wallet')!.at).toBe(at(7, '15:00'));
  });
});
