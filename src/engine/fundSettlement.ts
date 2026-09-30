/**
 * Settling a tokenised money market fund order: (A) in a stablecoin, as the market works today, or
 * (B) in the bank's tokenised deposit. Tokenisation moves the register, not the other five clocks.
 * All hours are Paris time, week of 5 October 2026. Market figures "as of September 2026, to validate".
 */
import { MARKET } from '@/data/rates';
import { at, minuteOfDay, weekday, type SimTime } from './clock';

export type SettleCcy = 'EUR' | 'USD';
export type MomentKey = 'tue' | 'fri' | 'sun';
export type ClockKey = 'token' | 'exit' | 'order' | 'nav' | 'market' | 'centralBank';

export const MOMENTS: Record<MomentKey, SimTime> = {
  tue: at(1, '11:00'),
  fri: at(4, '18:30'),
  sun: at(6, '10:00'),
};

export const CLOCK_KEYS: ClockKey[] = ['token', 'exit', 'order', 'nav', 'market', 'centralBank'];

/** Business-day windows in Paris minutes. USD: New York +6 h. */
const WINDOWS: Record<SettleCcy, Record<'order' | 'market' | 'centralBank', [number, number]>> = {
  // Euro fund hours 09:00–15:00; market 09:00–17:30; T2 07:00–18:00.
  EUR: { order: [9 * 60, 15 * 60], market: [9 * 60, 17 * 60 + 30], centralBank: [7 * 60, 18 * 60] },
  // Order cut-off 15:00 New York = 21:00 Paris; market 08:00–17:00 New York; Fedwire from 21:00 the evening before.
  USD: { order: [3 * 60, 21 * 60], market: [14 * 60, 23 * 60], centralBank: [3 * 60, 24 * 60] },
};

export function clockOpen(key: ClockKey, ccy: SettleCcy, t: SimTime): boolean {
  if (key === 'token' || key === 'exit') return true;
  if (weekday(t) >= 5) return false;
  const w = WINDOWS[ccy][key === 'nav' ? 'order' : key];
  const m = minuteOfDay(t);
  return m >= w[0] && m < w[1];
}

export const clocksAt = (ccy: SettleCcy, t: SimTime) =>
  CLOCK_KEYS.map((key) => ({ key, open: clockOpen(key, ccy, t) }));

/** When the fund is closed, the exit rests on a balance sheet — a dealer's in (A), ours in (B). */
export const exitOnBalanceSheet = (ccy: SettleCcy, t: SimTime) => !clockOpen('order', ccy, t);

export const SETTLE = {
  /** Instant exit window of a stablecoin-settled fund, per investor (market example, to validate). */
  instantCapPerInvestor: 25e6,
  instantCapGlobal24h: 50e6,
  /** Our weekend credit backed by fund units. */
  haircut: 0.02,
  creditSpread: 0.005,
  exceptionAmount: 30e6,
  /** The fund pays out at the next order cut-off: Monday 21:00 Paris for USD. */
  nextPayout: at(7, '21:00'),
};

/** Sunday exception: redeem USD 30m above the instant cap. */
export function sundayException(amount = SETTLE.exceptionAmount, t: SimTime = MOMENTS.sun) {
  const overCap = Math.max(0, amount - SETTLE.instantCapPerInvestor);
  const hours = (SETTLE.nextPayout - t) / 60;
  const rate = MARKET.sofr + SETTLE.creditSpread;
  return {
    amount,
    overCap,
    /** (A): the part above the cap waits for the reopening, or the window refuses it. */
    queued: overCap,
    queuedUntil: SETTLE.nextPayout,
    /** (B): our credit backed by units until the fund pays. */
    unitsPledged: amount / (1 - SETTLE.haircut),
    haircut: SETTLE.haircut,
    rate,
    hours,
    cost: (amount * rate * (hours / 24)) / 360,
  };
}
