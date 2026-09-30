/**
 * Actions a colleague can take while playing the week. Each one becomes an extra event at the
 * minute it was taken and is replayed on top of the scenario, so every screen stays consistent.
 * "Reset to scenario" removes them. The scenario tests never include user actions.
 */
import { NIGHT_FX_LIMIT_EUR, type UnitTenor, TENOR_DAYS } from '@/data/rates';
import { en } from '@/i18n/en';
import {
  isBusinessHours,
  isFundHours,
  nextOpening,
  type SimTime,
  MIN_PER_DAY,
  dayIndex,
  FUND_OPEN,
  weekday,
} from './clock';
import { book, buyUnit, move, nextId, partialUnwind } from './ops';
import { fxNightQuote, unitSaleQuote } from './pricing';
import { screeningCheck } from './rules';
import { fmtEur, fmtM } from './format';
import type { SimEvent, State } from './types';

export type UserAction =
  | {
      kind: 'payment';
      id: string;
      t: SimTime;
      from: 'cur-paris' | 'tok-paris';
      amount: number;
      rail: 'sepa' | 'sctInst' | 'crossBorder';
      payee: string;
    }
  | {
      kind: 'intragroup';
      id: string;
      t: SimTime;
      to: 'tok-munich' | 'tok-sgd-singapore' | 'tok-usd-chicago';
      amountEur: number;
    }
  | { kind: 'toTokenised'; id: string; t: SimTime; amount: number }
  | { kind: 'buyUnit'; id: string; t: SimTime; tenor: UnitTenor; amount: number }
  | { kind: 'sellUnit'; id: string; t: SimTime; unitId: string; amount: number }
  | { kind: 'fund'; id: string; t: SimTime; amount: number }
  | { kind: 'block'; id: string; t: SimTime; amount: number; label: string };

/** A user action before the store stamps it with an id and the current minute. */
export type NewUserAction = UserAction extends infer U
  ? U extends UserAction
    ? Omit<U, 'id' | 't'>
    : never
  : never;

const R = en.rulesNames;
const ccyOf = {
  'tok-munich': 'EUR',
  'tok-sgd-singapore': 'SGD',
  'tok-usd-chicago': 'USD',
} as const;

/** Cash available on the tokenised account, unwinding short units to the minute if needed. */
function ensureTok(s: State, c: Parameters<SimEvent['apply']>[1], amount: number) {
  const missing = amount - Math.max(0, s.bal['tok-paris']);
  if (missing > 0) partialUnwind(s, c, missing);
}

export function nextFundOpening(t: SimTime): SimTime {
  let d = dayIndex(t);
  if (t - d * MIN_PER_DAY >= FUND_OPEN) d += 1;
  while (weekday(d * MIN_PER_DAY) >= 5) d += 1;
  return d * MIN_PER_DAY + FUND_OPEN;
}

export function actionToEvents(a: UserAction): SimEvent[] {
  const base = { id: a.id, t: a.t, actor: 'marie' as const, kind: 'user' as const };
  switch (a.kind) {
    case 'payment':
      return [
        {
          ...base,
          layer: 'traditional',
          title: `Payment ${fmtM(a.amount)} to ${a.payee}`,
          detail:
            a.rail === 'sctInst'
              ? 'SCT Inst — final in seconds.'
              : a.rail === 'sepa'
                ? 'SEPA credit transfer, next cycle.'
                : 'Cross-border via correspondent, value D+1.',
          apply: (s, c) => {
            if (a.from === 'tok-paris') ensureTok(s, c, a.amount);
            book(s, c, a.from, -a.amount, `${en.ledger.userPay} — ${a.payee}`);
            c.orchestrate({
              rule: R.marie,
              decision: `Pay ${a.payee}`,
              instrument: a.from === 'tok-paris' ? 'Tokenised account' : 'Current account',
              rail:
                a.rail === 'sctInst'
                  ? 'SCT Inst'
                  : a.rail === 'sepa'
                    ? 'SEPA SCT'
                    : 'Correspondent (gpi)',
              checks: [screeningCheck],
            });
          },
        },
      ];
    case 'intragroup': {
      const ccy = ccyOf[a.to];
      return [
        {
          ...base,
          layer: 'new',
          title: `Intragroup funding ${fmtM(a.amountEur)}${ccy !== 'EUR' ? ` → ${ccy}` : ''}`,
          detail: 'On the ledger, final at once, at any hour.',
          apply: (s, c) => {
            ensureTok(s, c, a.amountEur);
            if (ccy === 'EUR') {
              move(s, c, 'tok-paris', a.to, a.amountEur, 'Intragroup funding on the ledger');
            } else {
              const q = fxNightQuote(ccy, a.amountEur);
              book(
                s,
                c,
                'tok-paris',
                -a.amountEur,
                `${isBusinessHours(c.t) ? 'FX' : 'Out-of-hours FX'} EUR → ${ccy}`,
              );
              book(s, c, a.to, q.foreign, `${ccy} credited — intragroup funding`);
              if (!isBusinessHours(c.t)) s.fxNightUsed += a.amountEur;
              const bank = ccy === 'SGD' ? 'BNP Paribas Singapore' : 'BNP Paribas New York';
              s.mirrors.push({
                id: nextId(s, 'IG'),
                t: c.t,
                debtorBank: 'BNP Paribas SA',
                creditorBank: bank,
                currency: ccy,
                amount: q.foreign,
                eur: a.amountEur,
                memo: 'Mirror intragroup balance created at the same instant.',
              });
              c.orchestrate({
                rule: R.fx,
                decision: `EUR → ${ccy} at ${q.rate.toFixed(4)}`,
                instrument: 'Intragroup funding',
                rail: `Ledger: BNP Paribas SA → ${bank}`,
                checks: [
                  screeningCheck,
                  {
                    name: en.checks.limit,
                    ok: s.fxNightUsed <= NIGHT_FX_LIMIT_EUR,
                    detail: en.checks.fxLimit(
                      fmtM(s.fxNightUsed, 'EUR', 0),
                      fmtM(NIGHT_FX_LIMIT_EUR, 'EUR', 0),
                    ),
                  },
                ],
              });
            }
          },
        },
      ];
    }
    case 'toTokenised':
      return [
        {
          ...base,
          layer: 'new',
          title: `Transfer ${fmtM(a.amount)} to the tokenised account`,
          detail: 'Same legal entity: final at once.',
          apply: (s, c) => move(s, c, 'cur-paris', 'tok-paris', a.amount, en.ledger.moveToTok),
        },
      ];
    case 'buyUnit':
      return [
        {
          ...base,
          layer: 'new',
          title: `Term unit bought: ${fmtM(a.amount)}, ${a.tenor}`,
          detail: 'Bought from the tokenised account. Transferable, never broken.',
          apply: (s, c) => {
            ensureTok(s, c, a.amount);
            const maturity =
              a.tenor === 'overnight' || a.tenor === 'weekend'
                ? nextOpening(c.t)
                : c.t + TENOR_DAYS[a.tenor] * MIN_PER_DAY;
            buyUnit(s, c, {
              currency: 'EUR',
              amount: a.amount,
              tenor: a.tenor,
              maturity,
              origin: 'marie',
              memo: `${a.tenor} term unit bought`,
            });
          },
        },
      ];
    case 'sellUnit':
      return [
        {
          ...base,
          layer: 'new',
          title: `Term unit sold: ${fmtM(a.amount)}`,
          detail: 'Sold to the bank at the day’s price, cash in minutes.',
          apply: (s, c) => {
            const u = s.units.find((x) => x.id === a.unitId && !x.blocked);
            if (!u) return;
            const nominal = Math.min(a.amount, u.amount);
            const q = unitSaleQuote(u, nominal, c.t);
            u.amount -= nominal;
            s.units = s.units.filter((x) => x.amount > 0.005);
            c.post({
              account: `unit:${u.id}`,
              currency: 'EUR',
              amount: -nominal,
              finality: 'final',
              unitId: u.id,
              memo: en.ledger.unitSale,
            });
            book(s, c, 'tok-paris', nominal, en.ledger.unitSale);
            s.realised.unitSaleAccrued += q.accrued;
            s.realised.unitSaleSpread += q.spread;
            c.orchestrate({
              rule: R.marie,
              decision: `Sell ${fmtM(nominal)}`,
              instrument: `Par + ${fmtEur(q.accrued)} − ${fmtEur(q.spread)}`,
              rail: 'Internal ledger',
              checks: [{ name: 'Unit not broken', ok: true, detail: 'Transferred to the bank' }],
            });
          },
        },
      ];
    case 'fund': {
      const open = isFundHours(a.t);
      const settleAt = open ? a.t : nextFundOpening(a.t);
      const orderId = `${a.id}-order`;
      const events: SimEvent[] = [
        {
          ...base,
          layer: 'new',
          title: open
            ? `Tokenised fund: ${fmtM(a.amount)} subscribed`
            : `Tokenised fund order ${fmtM(a.amount)} — queued`,
          detail: open
            ? 'Settled at once on the ledger, delivery versus payment.'
            : 'Outside fund hours: queued for the next opening. The cash keeps earning meanwhile.',
          apply: (s, c) => {
            s.fundOrders.push({ id: orderId, amount: a.amount, placedAt: c.t, status: 'queued' });
            if (open) settleFund(s, c, orderId);
          },
        },
      ];
      if (!open)
        events.push({
          ...base,
          id: `${a.id}-settle`,
          t: settleAt,
          actor: 'event',
          layer: 'new',
          title: `Fund order ${fmtM(a.amount)} settled`,
          detail: 'Delivery versus payment on the ledger.',
          apply: (s, c) => settleFund(s, c, orderId),
        });
      return events;
    }
    case 'block':
      return [
        {
          ...base,
          layer: 'new',
          title: `${fmtM(a.amount)} blocked as collateral`,
          detail: a.label,
          apply: (s, c) => {
            ensureTok(s, c, a.amount);
            s.bal['tok-paris'] -= a.amount;
            s.blocked += a.amount;
            c.post({
              account: 'tok-paris',
              currency: 'EUR',
              amount: -a.amount,
              finality: 'final',
              memo: `Blocked — ${a.label}`,
            });
            c.post({
              account: 'tok-paris:blocked',
              currency: 'EUR',
              amount: a.amount,
              finality: 'final',
              memo: `Blocked — ${a.label}`,
            });
            s.collateral.push({
              id: a.id,
              kind: 'marginCall',
              entity: 'paris',
              beneficiary: a.label,
              amount: a.amount,
              mode: 'blockOnAccount',
              since: c.t,
              releaseEvent: 'document',
              status: 'active',
            });
          },
        },
      ];
  }
}

function settleFund(s: State, c: Parameters<SimEvent['apply']>[1], orderId: string) {
  const o = s.fundOrders.find((f) => f.id === orderId && f.status === 'queued');
  if (!o) return;
  ensureTok(s, c, o.amount);
  book(s, c, 'tok-paris', -o.amount, en.ledger.fundDvp);
  s.fundUnits += o.amount;
  c.post({
    account: 'fund:tokenised-mmf',
    currency: 'EUR',
    amount: o.amount,
    finality: 'final',
    memo: en.ledger.fundDvp,
  });
  o.status = 'settled';
  o.settledAt = c.t;
}
