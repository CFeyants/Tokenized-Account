/**
 * Lefèvre Inc. (United States) and tokenised government money market funds (rule 2a-7). One source
 * for the US surplus journey, the sweep page, just-in-time funding, the fund settlement screen and
 * the business case. Market figures are "as of September 2026, to validate". Illustrative.
 */
import { MARKET, SPREADS } from './rates';

export const US_ENTITY = {
  name: 'Lefèvre Inc.',
  city: 'Chicago',
  bank: 'Norvane Bank New York',
  /** Target balance kept on the operating account to cover fees through the earnings credit rate. */
  targetUsd: 15e6,
  /** Average surplus above operating needs. */
  surplusUsd: 42e6,
  /** Earnings credit rate: balances earn credits that only offset fees. */
  ecr: 0.02,
  feesOffsetUsdYear: 300_000,
};

export const TMMF = {
  /** Government fund yield, net of fees: indexed on the day's secured overnight financing rate. */
  yield: MARKET.sofr + SPREADS.mmfNet,
  /** Tokenised USD account paid while the cash waits. */
  cashLeg: 0.001,
  /** Instant redemption window, capped per night (payment is 24/7, the fund is not). */
  nightRedemptionCapUsd: 10e6,
  intradayLineUsd: 20e6,
};

/** Liquidity cascade for a USD need out of hours. */
export const USD_CASCADE = [
  { key: 'tok', limit: Infinity },
  { key: 'overnight', limit: Infinity },
  { key: 'tmmf', limit: TMMF.nightRedemptionCapUsd },
  { key: 'intraday', limit: TMMF.intradayLineUsd },
] as const;

/** Take from each source in order until the need is met. */
export function cascade(
  needUsd: number,
  balances: { tok: number; overnight: number; tmmf: number },
) {
  let left = needUsd;
  return USD_CASCADE.map((s) => {
    const avail =
      s.key === 'intraday'
        ? s.limit
        : Math.min(s.limit, balances[s.key as 'tok' | 'overnight' | 'tmmf']);
    const take = Math.max(0, Math.min(left, avail));
    left -= take;
    return { key: s.key, take, avail };
  });
}

/** What keeping the surplus working with us is worth to Lefèvre Inc., a year. */
export function usClientValue(surplus = US_ENTITY.surplusUsd, fundYield = TMMF.yield) {
  const fund = surplus * fundYield;
  const ecrLost = surplus * US_ENTITY.ecr;
  return { surplus, fundYield, fund, ecrLost, pickup: fund - ecrLost };
}
