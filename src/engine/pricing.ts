import { FX_MID, PRICING } from '@/data/rates';
import type { SimTime } from './clock';
import { minuteAccrual } from './accrual';
import type { Unit } from './types';

export interface UnitQuote {
  nominal: number;
  accrued: number;
  spread: number;
  price: number;
  minutes: number;
}

/** Price of `nominal` of a term unit sold to the bank at t: par + accrued to the minute − 2 bps. */
export function unitSaleQuote(
  unit: Pick<Unit, 'rate' | 'start'>,
  nominal: number,
  t: SimTime,
): UnitQuote {
  const minutes = Math.max(0, t - unit.start);
  const accrued = minuteAccrual(nominal, unit.rate, minutes);
  const spread = (nominal * PRICING.unitSpreadBps) / 10_000;
  return { nominal, accrued, spread, price: nominal + accrued - spread, minutes };
}

/** Accrued interest split to the minute when a unit is transferred: seller keeps up to t. */
export function transferSplit(unit: Pick<Unit, 'rate' | 'start' | 'amount'>, t: SimTime) {
  const minutes = Math.max(0, t - unit.start);
  const seller = minuteAccrual(unit.amount, unit.rate, minutes);
  return { minutes, seller };
}

export interface FxQuote {
  ccy: string;
  mid: number;
  rate: number;
  eur: number;
  foreign: number;
  costEur: number;
}

/** Out-of-hours FX quote for intragroup funding: the client buys foreign currency at mid − 10 bps. */
export function fxNightQuote(ccy: string, eur: number): FxQuote {
  const mid = FX_MID[ccy];
  const rate = mid * (1 - PRICING.fxNightBps / 10_000);
  const foreign = eur * rate;
  return { ccy, mid, rate, eur, foreign, costEur: eur - foreign / mid };
}

export const mmfNav = (): number => PRICING.mmfNav;

/** Classic term deposit broken early: accrued on the broken part forfeited + break cost. */
export function classicBreakCost(amount: number, rate: number, days: number) {
  const forfeited = (amount * rate * days) / 360;
  const fee = (amount * PRICING.classicBreakBps) / 10_000;
  return { forfeited, fee, total: forfeited + fee };
}

export const toEur = (amount: number, ccy: string): number => amount / (FX_MID[ccy] ?? 1);
