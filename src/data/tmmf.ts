/**
 * US subsidiary and tokenised government money market fund (2a-7). Illustrative; every product
 * statement is "to validate" before any client use.
 */
import { MARKET, SPREADS } from './rates';

export const US_ENTITY = {
  name: 'Lefèvre Inc (United States)',
  bank: 'Norvane Bank New York',
  /** Average USD surplus above the operating threshold. */
  surplusUsd: 45e6,
  thresholdUsd: 15e6,
  /** Earnings credit rate: balances earn credits that only offset fees. */
  ecr: 0.02,
  feesOffsetUsdYear: 180_000,
};

export const TMMF = {
  /** Government 2a-7 fund, net of fees: Fed funds / SOFR area minus the fund's net spread. */
  yield: MARKET.sofr + SPREADS.mmfNet,
  /** Tokenised USD deposit paid on the cash leg while waiting. */
  cashLeg: 0.001,
  /** Redemption cap per night through the fund's instant liquidity (payment is 24/7, the fund is not). */
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

/** Simple cascade fill: take from each source in order until the need is met. */
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
