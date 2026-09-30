/**
 * The simulated week (§3.1 of the brief) as data. Headline events carry their row number `n`.
 * Nightly rule runs that the brief implies ("set once, runs every night") are `kind: 'auto'`.
 * Events added to reconcile the state table are `kind: 'extra'` and documented in
 * docs/ASSUMPTIONS.md.
 */
import { en } from '@/i18n/en';
import { NIGHT_FX_LIMIT_EUR, RATES } from '@/data/rates';
import { at, nextOpening } from './clock';
import { M, book, buyUnit, move, nextId, partialUnwind } from './ops';
import {
  runNightSweep,
  runOvernightUnit,
  runReturn,
  runSurplusSweep,
  screeningCheck,
} from './rules';
import { fxNightQuote, unitSaleQuote } from './pricing';
import { fmtEur, fmtM } from './format';
import type { SimEvent, State, TradEvent } from './types';

const S = en.scenario;
const R = en.rulesNames;
const L = en.ledger;

const ev = (
  id: keyof typeof S,
  t: number,
  actor: SimEvent['actor'],
  kind: SimEvent['kind'],
  layer: SimEvent['layer'],
  apply: SimEvent['apply'],
  n?: number,
): SimEvent => ({ id, n, t, actor, kind, layer, title: S[id].title, detail: S[id].detail, apply });

/** Nightly rules at 18:30 / 19:10 and the return at 07:00, for the nights the brief does not spell out. */
function nightly(day: number): SimEvent[] {
  return [
    {
      ...ev('a_sweep', at(day, '18:30'), 'rule', 'auto', 'new', (s, c) => {
        runSurplusSweep(s, c);
        runOvernightUnit(s, c);
      }),
      id: `a_sweep_${day}`,
    },
    {
      ...ev('a_night', at(day, '19:10'), 'rule', 'auto', 'new', (s, c) => {
        runNightSweep(s, c);
        runOvernightUnit(s, c);
      }),
      id: `a_night_${day}`,
    },
  ];
}
const morning = (day: number): SimEvent => ({
  ...ev('a_return', at(day, '07:00'), 'rule', 'auto', 'new', (s, c) => runReturn(s, c)),
  id: `a_return_${day}`,
});

export const BRAZIL_BID_BOND = 'COL-BR-01';

export const SCENARIO: SimEvent[] = [
  ev('e0', at(0, '09:00'), 'event', 'scenario', 'none', () => {}, 0),

  ev(
    'e1',
    at(0, '11:20'),
    'marie',
    'scenario',
    'traditional',
    (s, c) => {
      book(s, c, 'cur-paris', -8.4 * M, L.sepaBatch);
      book(s, c, 'cur-paris', -2.1 * M, L.payroll);
      c.orchestrate({
        rule: R.marie,
        decision: 'Two files approved (4-eyes)',
        instrument: 'Current account',
        rail: 'SEPA SCT, execution D',
        checks: [{ name: 'Screening', ok: true, detail: 'On the way (traditional)' }],
      });
    },
    1,
  ),

  ev(
    'e2',
    at(0, '17:45'),
    'event',
    'scenario',
    'traditional',
    (s, c) => {
      book(s, c, 'cur-paris', 12 * M, L.sctInstIn);
      c.orchestrate({
        rule: R.receipt,
        decision: 'Credited on the current account',
        instrument: 'Current account',
        rail: 'SCT Inst (final at once)',
        checks: [{ name: en.checks.finality, ok: true, detail: 'Final at 17:45' }],
      });
    },
    2,
  ),

  ev(
    'e3',
    at(0, '18:30'),
    'rule',
    'scenario',
    'new',
    (s, c) => {
      runSurplusSweep(s, c);
      runOvernightUnit(s, c);
    },
    3,
  ),

  ev(
    'e4',
    at(0, '19:10'),
    'event',
    'scenario',
    'new',
    (s, c) => {
      runNightSweep(s, c);
      runOvernightUnit(s, c);
    },
    4,
  ),

  ev(
    'e5',
    at(0, '22:00'),
    'event',
    'scenario',
    'traditional',
    (s, c) => {
      s.pending.push({
        id: 'RCV-USD-01',
        account: 'tok-usd-chicago',
        currency: 'USD',
        amount: 10 * M,
        via: 'Correspondent (MT103)',
        announcedAt: c.t,
        status: 'pendingCover',
      });
      c.post({
        account: 'tok-usd-chicago',
        currency: 'USD',
        amount: 10 * M,
        finality: 'pending',
        memo: L.corrAnnounced,
      });
      c.orchestrate({
        rule: R.receipt,
        decision: 'Announced, not booked as final. No interest.',
        instrument: 'Tokenised account (USD), Chicago',
        rail: 'Correspondent banking',
        checks: [{ name: en.checks.finality, ok: false, detail: en.checks.pending }],
      });
    },
    5,
  ),

  ev('e6', at(1, '07:00'), 'rule', 'scenario', 'new', (s, c) => runReturn(s, c), 6),

  ev(
    'e7',
    at(1, '10:30'),
    'event',
    'scenario',
    'new',
    (s, c) => {
      const r = s.pending.find((p) => p.id === 'RCV-USD-01');
      if (r) {
        r.status = 'final';
        r.finalAt = c.t;
        book(s, c, 'tok-usd-chicago', r.amount, L.corrFinal);
        buyUnit(s, c, {
          currency: 'USD',
          amount: r.amount,
          tenor: '1m',
          maturity: c.t + 30 * 1440,
          rate: RATES.usdUnit1m,
          origin: 'marie',
          memo: L.buyUsdUnit,
        });
      }
      c.orchestrate({
        rule: R.receipt,
        decision: 'Cover on nostro: final. Default choice: USD 1-month unit.',
        instrument: 'USD term unit 3.90%',
        rail: 'Correspondent → ledger',
        checks: [
          {
            name: en.checks.finality,
            ok: true,
            detail: 'Nostro credited 10:30 — interest from this minute',
          },
        ],
      });
    },
    7,
  ),

  ...nightly(1),
  morning(2),

  ev(
    'e8',
    at(2, '11:00'),
    'marie',
    'scenario',
    'new',
    (s, c) => {
      const amt = 15 * M;
      s.bal['tok-paris'] -= amt;
      s.blocked += amt;
      c.post({
        account: 'tok-paris',
        currency: 'EUR',
        amount: -amt,
        finality: 'final',
        memo: L.block,
      });
      c.post({
        account: 'tok-paris:blocked',
        currency: 'EUR',
        amount: amt,
        finality: 'final',
        memo: L.block,
      });
      s.collateral.push({
        id: BRAZIL_BID_BOND,
        kind: 'bidBond',
        entity: 'saopaulo',
        beneficiary: 'State utility tender, Rio de Janeiro',
        amount: amt,
        mode: 'blockOnAccount',
        since: c.t,
        releaseEvent: 'tender',
        status: 'active',
      });
      c.orchestrate({
        rule: R.marie,
        decision: 'Block EUR 15.0m; release on tender result',
        instrument: 'Blocked sub-balance, tokenised account',
        rail: 'Internal ledger',
        checks: [
          { name: en.checks.balance, ok: true, detail: 'Free 41.5 → 26.5' },
          { name: 'Guarantee issued', ok: true, detail: 'Bid bond BRL-equivalent, BNP Paribas' },
        ],
      });
    },
    8,
  ),

  ...nightly(2),

  ev('x1', at(2, '21:15'), 'event', 'extra', 'new', (s, c) => {
    book(s, c, 'tok-munich', -4 * M, L.munichPay);
    c.orchestrate({
      rule: R.funding,
      decision:
        'Receipt of EUR 4.0m expected 06:30: cover with intraday credit, do not unwind units',
      instrument: 'Intraday credit to the minute, 2.50%',
      rail: 'SCT Inst out',
      checks: [
        screeningCheck,
        {
          name: 'Group consolidated position',
          ok: true,
          detail: 'Group net positive on the ledger',
        },
      ],
    });
  }),

  ev('x2', at(3, '06:30'), 'event', 'extra', 'new', (s, c) => {
    book(s, c, 'tok-munich', 4 * M, L.munichIn);
  }),

  morning(3),

  ev(
    'e9',
    at(3, '17:00'),
    'marie',
    'scenario',
    'new',
    (s, c) => {
      move(s, c, 'cur-paris', 'tok-paris', 50 * M, L.moveToTok);
      buyUnit(s, c, {
        currency: 'EUR',
        amount: 50 * M,
        tenor: '3m',
        maturity: c.t + 91 * 1440,
        origin: 'marie',
        memo: L.buy3m,
      });
      c.orchestrate({
        rule: R.marie,
        decision: 'Durable surplus per forecast: 3-month unit',
        instrument: '3-month term unit, 2.20%',
        rail: 'Internal ledger',
        checks: [{ name: 'Source', ok: true, detail: 'Cash forecast (traditional tool)' }],
      });
    },
    9,
  ),

  ev(
    'e10',
    at(3, '17:30'),
    'marie',
    'scenario',
    'new',
    (s, c) => {
      s.fundOrders.push({ id: 'FO-01', amount: 10 * M, placedAt: c.t, status: 'queued' });
      c.post({
        account: 'tok-paris',
        currency: 'EUR',
        amount: 0,
        finality: 'final',
        memo: L.fundQueued,
      });
      c.orchestrate({
        rule: R.fund,
        decision: 'Outside fund hours: queue for Fri 09:00. Cash stays in the overnight unit.',
        instrument: 'Tokenised fund',
        rail: 'Ledger DvP (queued)',
        checks: [{ name: en.checks.fundHours, ok: false, detail: '17:30 is after 15:00' }],
      });
    },
    10,
  ),

  ...nightly(3),
  morning(4),

  ev(
    'e11',
    at(4, '09:00'),
    'event',
    'scenario',
    'new',
    (s, c) => {
      const o = s.fundOrders.find((f) => f.status === 'queued');
      if (!o) return;
      book(s, c, 'tok-paris', -o.amount, L.fundDvp);
      s.fundUnits += o.amount;
      c.post({
        account: 'fund:tokenised-mmf',
        currency: 'EUR',
        amount: o.amount,
        finality: 'final',
        memo: L.fundDvp,
      });
      o.status = 'settled';
      o.settledAt = c.t;
      c.orchestrate({
        rule: R.fund,
        decision: 'Queued order executed at fund opening',
        instrument: '10,000,000 fund units at NAV 1.00',
        rail: 'Ledger DvP — cash and units in one step',
        checks: [{ name: en.checks.fundHours, ok: true, detail: 'Open' }],
      });
    },
    11,
  ),

  ev(
    'e12',
    at(4, '18:30'),
    'rule',
    'scenario',
    'new',
    (s, c) => {
      runSurplusSweep(s, c);
      runNightSweep(s, c);
      runOvernightUnit(s, c);
    },
    12,
  ),

  ev(
    'e13',
    at(5, '22:00'),
    'marie',
    'scenario',
    'new',
    (s, c) => {
      const eur = 10 * M;
      partialUnwind(s, c, eur);
      const q = fxNightQuote('SGD', eur);
      book(s, c, 'tok-paris', -eur, L.fxOut);
      book(s, c, 'tok-sgd-singapore', q.foreign, L.fxIn);
      s.fxNightUsed += eur;
      s.mirrors.push({
        id: nextId(s, 'IG'),
        t: c.t,
        debtorBank: 'BNP Paribas SA',
        creditorBank: 'BNP Paribas Singapore',
        currency: 'SGD',
        amount: q.foreign,
        eur,
        memo: 'Singapore credited the client at once; SA owes Singapore until the intragroup settlement.',
      });
      c.orchestrate({
        rule: R.fx,
        decision: `EUR 10.0m → SGD ${(q.foreign / M).toFixed(2)}m at ${q.rate.toFixed(4)} (mid ${q.mid} − 10 bps)`,
        instrument: 'Intragroup funding, Lefèvre Asia Pte Ltd',
        rail: 'Ledger: BNP Paribas SA → BNP Paribas Singapore',
        checks: [
          screeningCheck,
          {
            name: en.checks.limit,
            ok: true,
            detail: en.checks.fxLimit(
              fmtM(s.fxNightUsed, 'EUR', 0),
              fmtM(NIGHT_FX_LIMIT_EUR, 'EUR', 0),
            ),
          },
          { name: 'Purpose', ok: true, detail: 'Funding a subsidiary — not trading' },
        ],
      });
    },
    13,
  ),

  ev('x3', at(6, '02:00'), 'event', 'extra', 'traditional', (s, c) => {
    book(s, c, 'tok-sgd-singapore', -s.bal['tok-sgd-singapore'], L.sgPay);
  }),

  ev('x4', at(6, '16:00'), 'event', 'extra', 'new', (s, c) => {
    book(s, c, 'tok-paris', 44 * M, L.weekendIn);
    buyUnit(s, c, {
      currency: 'EUR',
      amount: 44 * M,
      tenor: 'weekend',
      maturity: nextOpening(c.t),
      origin: 'rule',
      memo: L.buyWeekend,
    });
    c.orchestrate({
      rule: R.overnight,
      decision: 'Late cash earns: unit bought the minute it is final',
      instrument: 'Weekend unit to Mon 07:00, 1.80%',
      rail: 'SCT Inst in → ledger',
      checks: [
        { name: en.checks.finality, ok: true, detail: 'Instant transfer: final on receipt' },
      ],
    });
  }),

  ev(
    'e14',
    at(6, '19:00'),
    'event',
    'scenario',
    'new',
    (s, c) => releaseCollateral(s, c, BRAZIL_BID_BOND),
    14,
  ),

  ev('e15', at(7, '07:00'), 'rule', 'scenario', 'new', (s, c) => runReturn(s, c), 15),

  ev(
    'e16',
    at(7, '10:00'),
    'marie',
    'scenario',
    'new',
    (s, c) => {
      const unit = s.units.find((u) => u.tenor === '3m' && u.currency === 'EUR');
      if (!unit) return;
      const nominal = Math.min(20 * M, unit.amount);
      const q = unitSaleQuote(unit, nominal, c.t);
      unit.amount -= nominal;
      c.post({
        account: `unit:${unit.id}`,
        currency: 'EUR',
        amount: -nominal,
        finality: 'final',
        unitId: unit.id,
        memo: L.unitSale,
      });
      book(s, c, 'tok-paris', nominal, L.unitSale);
      c.post({
        account: 'interest:tok-paris',
        currency: 'EUR',
        amount: q.accrued - q.spread,
        finality: 'final',
        unitId: unit.id,
        memo: `Accrued ${fmtEur(q.accrued)} − spread ${fmtEur(q.spread)}`,
      });
      s.realised.unitSaleAccrued += q.accrued;
      s.realised.unitSaleSpread += q.spread;
      c.orchestrate({
        rule: R.marie,
        decision: `Sell ${fmtM(nominal)} to the bank as market maker`,
        instrument: `Price = par + ${fmtEur(q.accrued)} accrued − ${fmtEur(q.spread)} spread`,
        rail: 'Internal ledger',
        checks: [
          {
            name: 'Unit not broken',
            ok: true,
            detail: 'Transferred; the bank holds it to maturity',
          },
        ],
      });
    },
    16,
  ),

  ...nightly(7),

  ev(
    'e17',
    at(7, '20:00'),
    'marie',
    'scenario',
    'notYet',
    (_s, c) => {
      c.orchestrate({
        rule: R.marie,
        decision: 'Refused. Offered fallback: SCT Inst from the current account.',
        instrument: 'Payment to a non-client at another bank',
        rail: '—',
        checks: [{ name: 'Payee bank on the ledger', ok: false, detail: en.checks.notYet }],
      });
    },
    17,
  ),
];

export function releaseCollateral(s: State, c: Parameters<SimEvent['apply']>[1], id: string): void {
  const col = s.collateral.find((x) => x.id === id);
  if (!col || col.status !== 'active') return;
  for (const u of s.units) {
    if (u.blocked && u.collateralId === id) {
      u.blocked = false;
      c.post({
        account: `unit:${u.id}`,
        currency: 'EUR',
        amount: 0,
        finality: 'final',
        unitId: u.id,
        memo: L.unblockUnit,
      });
    }
  }
  if (s.blocked > 0) {
    const amt = Math.min(s.blocked, col.amount);
    s.blocked -= amt;
    s.bal['tok-paris'] += amt;
    c.post({
      account: 'tok-paris:blocked',
      currency: 'EUR',
      amount: -amt,
      finality: 'final',
      memo: L.release,
    });
    c.post({
      account: 'tok-paris',
      currency: 'EUR',
      amount: amt,
      finality: 'final',
      memo: L.release,
    });
  }
  col.status = 'released';
  col.releasedAt = c.t;
  c.orchestrate({
    rule: R.release,
    decision: 'Tender result received: lost. Guarantee expires; block released.',
    instrument: 'Bid bond Brazil',
    rail: 'Internal ledger',
    checks: [
      { name: 'Release event', ok: true, detail: 'Tender result (document received 18:58)' },
    ],
  });
}

/** The traditional twin of the same week: current accounts, classic deposit, cash gage, fund. */
const TRAD_LIST: TradEvent[] = [
  {
    id: 't2',
    t: at(0, '17:45'),
    title: en.trad.t2,
    apply: (s) => {
      s.current += 12 * M;
    },
  },
  {
    id: 't1',
    t: at(0, '11:20'),
    title: en.trad.t1,
    apply: (s) => {
      s.current -= 10.5 * M;
    },
  },
  {
    id: 't7',
    t: at(1, '10:30'),
    title: en.trad.t7,
    apply: (s) => {
      s.usdCurrent += 10 * M;
    },
  },
  {
    id: 't8',
    t: at(2, '11:00'),
    title: en.trad.t8,
    apply: (s) => {
      s.current -= 15 * M;
      s.cashGage += 15 * M;
    },
  },
  {
    id: 't9',
    t: at(3, '17:00'),
    title: en.trad.t9,
    apply: (s) => {
      s.current -= 50 * M;
      s.classicTD += 50 * M;
    },
  },
  {
    id: 't11',
    t: at(4, '09:00'),
    title: en.trad.t11,
    apply: (s) => {
      s.current -= 10 * M;
      s.fund += 10 * M;
    },
  },
  {
    id: 't13',
    t: at(4, '17:00'),
    title: en.trad.t13,
    apply: (s) => {
      s.current -= 10 * M;
    },
  },
  {
    id: 't14',
    t: at(6, '16:00'),
    title: en.trad.t14,
    apply: (s) => {
      s.current += 44 * M;
    },
  },
  {
    id: 't15',
    t: at(7, '09:00'),
    title: en.trad.t15,
    apply: (s) => {
      s.cashGage -= 15 * M;
      s.current += 15 * M;
    },
  },
  {
    id: 't16',
    t: at(7, '10:00'),
    title: en.trad.t16,
    apply: (s) => {
      s.classicTD -= 20 * M;
      s.current += 20 * M;
      // 4 days accrued on the broken EUR 20m forfeited (Thu → Mon) + 5 bps break cost.
      s.penalty += (20 * M * RATES.classicTD['3m'] * 4) / 360 + (20 * M * 5) / 10_000;
    },
  },
];

export const TRAD_EVENTS: TradEvent[] = [...TRAD_LIST].sort((a, b) => a.t - b.t);

export const initialTradState = () => ({
  current: 120 * M,
  usdCurrent: 0,
  classicTD: 0,
  cashGage: 0,
  fund: 0,
  penalty: 0,
});
