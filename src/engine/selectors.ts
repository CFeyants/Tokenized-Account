/** Pure read-models over a State: the drawers of §3.1, account rows, units. */
import { ACCOUNTS, STATIC_OTHER_BANKS_EUR, type AccountDef } from '@/data/accounts';
import { FX_MID, RATES } from '@/data/rates';
import type { SimTime } from './clock';
import type { Finality, State, TradState, Unit } from './types';

export interface Drawers {
  current: number;
  tokFree: number;
  tokBlocked: number;
  termUnits: number;
  fund: number;
  otherBanks: number;
  usdUnitsEur: number;
  pendingEur: number;
  /** Tokenised accounts of foreign subsidiaries (USD, SGD), EUR equivalent — not in the §3.1 table. */
  tokOtherCcyEur: number;
}

const isShort = (u: Unit) => u.tenor === 'overnight' || u.tenor === 'weekend';

/** The five columns of the §3.1 table (EUR), plus what is outside the bank. */
export function drawers(s: State): Drawers {
  const eurUnits = s.units.filter((u) => u.currency === 'EUR');
  return {
    current: s.bal['cur-paris'],
    tokFree: s.bal['tok-paris'] + s.bal['tok-munich'],
    tokBlocked:
      s.blocked + s.earmarked + eurUnits.filter((u) => u.blocked).reduce((a, u) => a + u.amount, 0),
    termUnits: eurUnits.filter((u) => !u.blocked).reduce((a, u) => a + u.amount, 0),
    fund: s.fundUnits,
    otherBanks: s.bal['hsbc-paris'] + s.bal['db-munich'] + STATIC_OTHER_BANKS_EUR,
    usdUnitsEur: s.units
      .filter((u) => u.currency === 'USD')
      .reduce((a, u) => a + u.amount / FX_MID.USD, 0),
    tokOtherCcyEur: s.bal['tok-usd-chicago'] / FX_MID.USD + s.bal['tok-sgd-singapore'] / FX_MID.SGD,
    pendingEur: s.pending
      .filter((p) => p.status === 'pendingCover')
      .reduce((a, p) => a + p.amount / FX_MID[p.currency], 0),
  };
}

export const shortUnits = (s: State) => s.units.filter((u) => isShort(u) && u.currency === 'EUR');
export const shortUnitsTotal = (s: State) => shortUnits(s).reduce((a, u) => a + u.amount, 0);
export const termUnitsOnly = (s: State) => s.units.filter((u) => !isShort(u));
export { isShort };

/** Σ amount × rate on everything counted to the minute (new layer), EUR. Negative balances excluded. */
export function minuteWeight(s: State): number {
  let w = 0;
  const tokEur = ['tok-paris', 'tok-munich'] as const;
  for (const a of tokEur) w += Math.max(0, s.bal[a]) * RATES.tokenised;
  w += (Math.max(0, s.bal['tok-usd-chicago']) / FX_MID.USD) * RATES.tokenised;
  w += (Math.max(0, s.bal['tok-sgd-singapore']) / FX_MID.SGD) * RATES.tokenised;
  w += (s.blocked + s.earmarked) * RATES.tokenised;
  for (const u of s.units) w += (u.amount / (u.currency === 'USD' ? FX_MID.USD : 1)) * u.rate;
  w += s.fundUnits * RATES.mmf;
  return w;
}

export function minuteWeightParts(s: State) {
  const tok =
    (Math.max(0, s.bal['tok-paris']) + Math.max(0, s.bal['tok-munich']) + s.blocked + s.earmarked) *
      RATES.tokenised +
    (Math.max(0, s.bal['tok-usd-chicago']) / FX_MID.USD +
      Math.max(0, s.bal['tok-sgd-singapore']) / FX_MID.SGD) *
      RATES.tokenised;
  const units = s.units.reduce(
    (a, u) => a + (u.amount / (u.currency === 'USD' ? FX_MID.USD : 1)) * u.rate,
    0,
  );
  const fund = s.fundUnits * RATES.mmf;
  return { tok, units, fund };
}

/** Intraday credit weight: Σ |negative tokenised balance| × debit rate. */
export function debitWeight(s: State): number {
  return (
    (Math.max(0, -s.bal['tok-paris']) + Math.max(0, -s.bal['tok-munich'])) * RATES.intradayDebit
  );
}

export const hasDebit = (s: State) => s.bal['tok-paris'] < 0 || s.bal['tok-munich'] < 0;

/** Current-account weight for the end-of-day convention. */
export const eodWeight = (s: State) => Math.max(0, s.bal['cur-paris']) * RATES.current;

export const tradEodWeight = (s: TradState) =>
  s.current * RATES.current +
  (s.usdCurrent / FX_MID.USD) * RATES.usdCurrent +
  s.classicTD * RATES.classicTD['3m'];
export const tradMinuteWeight = (s: TradState) => s.fund * RATES.mmf;

export interface AccountRow {
  def: AccountDef;
  balance: number;
  blocked: number;
  inUnit: number;
  finality: Finality;
  pending: number;
}

export function accountRows(s: State, t: SimTime): AccountRow[] {
  void t;
  return ACCOUNTS.map((def) => {
    const balance = def.dynamic ? s.bal[def.dynamic] : (def.staticBalance ?? 0);
    const pending = s.pending
      .filter((p) => p.account === def.dynamic && p.status === 'pendingCover')
      .reduce((a, p) => a + p.amount, 0);
    const inUnit =
      def.id === 'tok-paris'
        ? s.units.filter((u) => u.currency === 'EUR').reduce((a, u) => a + u.amount, 0)
        : def.id === 'tok-usd-chicago'
          ? s.units.filter((u) => u.currency === 'USD').reduce((a, u) => a + u.amount, 0)
          : 0;
    return {
      def,
      balance,
      blocked: def.id === 'tok-paris' ? s.blocked + s.earmarked : 0,
      inUnit,
      pending,
      finality: pending > 0 ? 'pendingCover' : 'final',
    };
  });
}

/** Group total at the bank in EUR (all drawers). */
export function groupAtBank(d: Drawers): number {
  return d.current + d.tokFree + d.tokBlocked + d.termUnits + d.fund;
}
