import type { AccountId, Ctx, State, Unit } from './types';
import { en } from '@/i18n/en';
import type { SimTime } from './clock';
import { UNIT_RATE, type UnitTenor } from '@/data/rates';

export const M = 1_000_000;

export function initialState(): State {
  return {
    bal: {
      'cur-paris': 120 * M,
      'tok-paris': 0,
      'tok-munich': 0,
      'tok-usd-chicago': 0,
      'tok-sgd-singapore': 0,
      'hsbc-paris': 60 * M,
      'db-munich': 45 * M,
    },
    blocked: 0,
    units: [],
    fundUnits: 0,
    pending: [],
    collateral: [],
    fundOrders: [],
    mirrors: [],
    fxNightUsed: 0,
    sweptTonight: { 'hsbc-paris': 0, 'db-munich': 0 },
    sweptInTotal: 0,
    returnedTotal: 0,
    realised: { unitSaleAccrued: 0, unitSaleSpread: 0 },
    seq: 0,
  };
}

export const cloneState = (s: State): State => structuredClone(s);

export function nextId(s: State, prefix: string): string {
  s.seq += 1;
  return `${prefix}-${String(s.seq).padStart(3, '0')}`;
}

const CCY: Record<AccountId, 'EUR' | 'USD' | 'SGD'> = {
  'cur-paris': 'EUR',
  'tok-paris': 'EUR',
  'tok-munich': 'EUR',
  'tok-usd-chicago': 'USD',
  'tok-sgd-singapore': 'SGD',
  'hsbc-paris': 'EUR',
  'db-munich': 'EUR',
};

export const accountCurrency = (a: AccountId) => CCY[a];

/** Credit or debit one account, with its ledger entry. */
export function book(s: State, ctx: Ctx, account: AccountId, amount: number, memo: string): void {
  s.bal[account] += amount;
  ctx.post({ account, currency: CCY[account], amount, finality: 'final', memo });
}

/** Move cash between two accounts of the group (both legs final at once). */
export function move(
  s: State,
  ctx: Ctx,
  from: AccountId,
  to: AccountId,
  amount: number,
  memo: string,
): void {
  if (amount <= 0) return;
  book(s, ctx, from, -amount, memo);
  book(s, ctx, to, amount, memo);
}

export interface BuyUnitArgs {
  currency: 'EUR' | 'USD';
  amount: number;
  tenor: UnitTenor;
  maturity: SimTime;
  blocked?: boolean;
  collateralId?: string;
  origin: 'rule' | 'marie';
  rate?: number;
  memo: string;
}

/** Buy a term unit from the tokenised account (free part, or blocked part when flagged). */
export function buyUnit(s: State, ctx: Ctx, a: BuyUnitArgs): Unit | null {
  if (a.amount <= 0) return null;
  const account: AccountId = a.currency === 'USD' ? 'tok-usd-chicago' : 'tok-paris';
  const unit: Unit = {
    id: nextId(s, 'U'),
    currency: a.currency,
    amount: a.amount,
    rate: a.rate ?? UNIT_RATE[a.tenor],
    tenor: a.tenor,
    start: ctx.t,
    maturity: a.maturity,
    blocked: a.blocked ?? false,
    collateralId: a.collateralId,
    origin: a.origin,
  };
  if (unit.blocked) {
    s.blocked -= a.amount;
    ctx.post({ account: `${account}:blocked`, currency: a.currency, amount: -a.amount, finality: 'final', unitId: unit.id, memo: a.memo });
  } else {
    s.bal[account] -= a.amount;
    ctx.post({ account, currency: a.currency, amount: -a.amount, finality: 'final', unitId: unit.id, memo: a.memo });
  }
  ctx.post({ account: `unit:${unit.id}`, currency: a.currency, amount: a.amount, finality: 'final', unitId: unit.id, memo: a.memo });
  s.units.push(unit);
  return unit;
}

/** Unwind every overnight / weekend unit that has reached maturity. */
export function unwindMatured(s: State, ctx: Ctx): number {
  let total = 0;
  const keep: Unit[] = [];
  for (const u of s.units) {
    const short = u.tenor === 'overnight' || u.tenor === 'weekend';
    if (short && u.currency === 'EUR' && u.maturity <= ctx.t) {
      total += u.amount;
      ctx.post({ account: `unit:${u.id}`, currency: 'EUR', amount: -u.amount, finality: 'final', unitId: u.id, memo: en.ledger.unwind });
      if (u.blocked) {
        s.blocked += u.amount;
        ctx.post({ account: 'tok-paris:blocked', currency: 'EUR', amount: u.amount, finality: 'final', unitId: u.id, memo: en.ledger.unwind });
      } else {
        s.bal['tok-paris'] += u.amount;
        ctx.post({ account: 'tok-paris', currency: 'EUR', amount: u.amount, finality: 'final', unitId: u.id, memo: en.ledger.unwind });
      }
    } else {
      keep.push(u);
    }
  }
  s.units = keep;
  return total;
}

/** Take `amount` out of free short units (latest first), to the minute. Returns what was unwound. */
export function partialUnwind(s: State, ctx: Ctx, amount: number): number {
  let left = amount;
  const shorts = s.units
    .filter((u) => !u.blocked && u.currency === 'EUR' && (u.tenor === 'overnight' || u.tenor === 'weekend'))
    .sort((a, b) => b.start - a.start);
  for (const u of shorts) {
    if (left <= 0) break;
    const take = Math.min(left, u.amount);
    u.amount -= take;
    left -= take;
    ctx.post({ account: `unit:${u.id}`, currency: 'EUR', amount: -take, finality: 'final', unitId: u.id, memo: en.ledger.partialUnwind });
    book(s, ctx, 'tok-paris', take, en.ledger.partialUnwind);
  }
  s.units = s.units.filter((u) => u.amount > 0.005);
  return amount - left;
}
