/**
 * Indicative rates used by the mock-up (annual, Actual/360). Illustrative only.
 * Doctrine: the tokenised account never pays more than the current account.
 */
export const RATES = {
  current: 0.005,
  tokenised: 0.001,
  overnightUnit: 0.018,
  weekendUnit: 0.018,
  unit1m: 0.0205,
  unit3m: 0.022,
  unit6m: 0.023,
  unit12m: 0.0235,
  mmf: 0.0195,
  classicTD: { '1m': 0.0205, '3m': 0.022, '6m': 0.023, '12m': 0.0235 },
  usdUnit1m: 0.039,
  usdCurrent: 0.005,
  /** Intraday credit on the tokenised account, counted to the minute (assumption A-5). */
  intradayDebit: 0.025,
} as const;

export const PRICING = {
  /** Term unit sold back to the bank: par + accrued − 2 bps of nominal. */
  unitSpreadBps: 2,
  /** Out-of-hours FX quote: mid ± 10 bps. */
  fxNightBps: 10,
  /** Money market fund: constant NAV. */
  mmfNav: 1.0,
  /** Classic term deposit broken early: accrued on the broken part is forfeited, plus a 5 bps break cost. */
  classicBreakBps: 5,
};

/** Out-of-hours FX for intragroup funding: published night limit, EUR equivalent. */
export const NIGHT_FX_LIMIT_EUR = 25_000_000;
export const NIGHT_FX_CURRENCIES = ['USD', 'SGD', 'BRL', 'MXN', 'PLN'] as const;

/** Mid rates: units of foreign currency per EUR. */
export const FX_MID: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  SGD: 1.448,
  BRL: 6.05,
  MXN: 20.9,
  PLN: 4.28,
};

export type UnitTenor = 'overnight' | 'weekend' | '1m' | '3m' | '6m' | '12m';

export const UNIT_RATE: Record<UnitTenor, number> = {
  overnight: RATES.overnightUnit,
  weekend: RATES.weekendUnit,
  '1m': RATES.unit1m,
  '3m': RATES.unit3m,
  '6m': RATES.unit6m,
  '12m': RATES.unit12m,
};

export const TENOR_DAYS: Record<UnitTenor, number> = {
  overnight: 1,
  weekend: 3,
  '1m': 30,
  '3m': 91,
  '6m': 182,
  '12m': 365,
};
