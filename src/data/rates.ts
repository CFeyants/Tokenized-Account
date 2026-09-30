/**
 * Rates used by the mock-up (annual, Actual/360). Every product rate is derived from a market
 * reference plus a spread, so recalibrating one reference moves every screen consistently.
 * Market references as given in the brief of 30 September 2026 — update them to the day.
 * Doctrine: the tokenised account never pays more than the current account; yield lives in units
 * and in the sweep.
 */
export const MARKET = {
  /** ECB deposit facility rate, since 10 September 2026. */
  dfr: 0.025,
  /** Euro short-term rate. */
  estr: 0.024,
  /** Brazil: Selic and CDI. */
  selic: 0.1375,
  cdi: 0.1365,
  /** USD overnight reference (SOFR). Parameter — set it to the day's fixing. */
  sofr: 0.036,
};

/** Spreads to the reference (negative = below). */
export const SPREADS = {
  overnightUnit: -0.0025,
  unit1m: -0.0015,
  unit3m: -0.001,
  unit6m: -0.0005,
  unit12m: 0,
  mmfNet: -0.0015,
  intradayDebit: 0.0025,
  usdUnit1m: -0.002,
};

export const RATES = {
  current: 0.005,
  tokenised: 0.001,
  overnightUnit: MARKET.estr + SPREADS.overnightUnit,
  weekendUnit: MARKET.estr + SPREADS.overnightUnit,
  unit1m: MARKET.estr + SPREADS.unit1m,
  unit3m: MARKET.estr + SPREADS.unit3m,
  unit6m: MARKET.estr + SPREADS.unit6m,
  unit12m: MARKET.estr + SPREADS.unit12m,
  mmf: MARKET.estr + SPREADS.mmfNet,
  classicTD: {
    '1m': MARKET.estr + SPREADS.unit1m,
    '3m': MARKET.estr + SPREADS.unit3m,
    '6m': MARKET.estr + SPREADS.unit6m,
    '12m': MARKET.estr + SPREADS.unit12m,
  },
  usdUnit1m: MARKET.sofr + SPREADS.usdUnit1m,
  usdCurrent: 0.005,
  /** Intraday credit on the tokenised account, counted to the minute. */
  intradayDebit: MARKET.estr + SPREADS.intradayDebit,
} as const;

export const PRICING = {
  /** Term unit sold back to the bank: par + accrued − 2 bps of nominal. */
  unitSpreadBps: 2,
  /** Out-of-hours FX quote: mid ± 10 bps (see engine/fx.ts for the window-based quote). */
  fxNightBps: 10,
  /** Money market fund: constant NAV. */
  mmfNav: 1.0,
  /** Classic term deposit broken early: accrued on the broken part is forfeited, plus a 5 bps break cost. */
  classicBreakBps: 5,
};

/** Out-of-hours FX for intragroup funding: published night limit, EUR equivalent. */
export const NIGHT_FX_LIMIT_EUR = 25_000_000;
export const NIGHT_FX_CURRENCIES = ['USD', 'SGD', 'BRL', 'MXN', 'PLN', 'JPY', 'SAR'] as const;

/** Mid rates: units of foreign currency per EUR. */
export const FX_MID: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  SGD: 1.448,
  BRL: 6.05,
  MXN: 20.9,
  PLN: 4.28,
  JPY: 172,
  SAR: 4.05,
  COP: 4700,
  CLP: 1050,
  QEUR: 1,
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
