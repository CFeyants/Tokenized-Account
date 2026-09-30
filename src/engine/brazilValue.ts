/**
 * What faster repatriation from Brazil is worth to the treasurer — honestly. Most of it is risk
 * removed, not yield: the spread gain is a range that can be zero, and bringing cash home earlier
 * gives up the Brazilian carry. All inputs are illustrative parameters.
 */
import { MARKET } from '@/data/rates';

export const BRAZIL = {
  /** Spread + fees, all in: traditional 35–90 bps, tokenised 35–70 bps → gain 0 to 20 bps. */
  gainBps: [0, 20] as [number, number],
  valueDays: 2,
  valueDaysFriday: 4,
  brlVol: 0.12,
  /** IOF by nature of the flow — to validate with local tax. */
  iof: { dividend: 0, loanShort: 0.035 },
};

export type Frequency = 'monthly' | 'weekly';

export function brazilValue(opEur: number, frequency: Frequency, fridays = 2) {
  const ops = frequency === 'monthly' ? 12 : 52;
  const volume = opEur * ops;
  const perDay = (opEur * MARKET.estr) / 360;
  const valueDaysYear =
    perDay * BRAZIL.valueDays * (ops - fridays) + perDay * BRAZIL.valueDaysFriday * fridays;
  const exposure1Sigma = opEur * BRAZIL.brlVol * Math.sqrt(BRAZIL.valueDays / 252);
  const avgExposure = { monthly: (opEur * 12) / 24, weekly: (opEur * 12) / 52 / 2 };
  const carryPerDay = (opEur * (MARKET.cdi - MARKET.estr)) / 365;
  return {
    ops,
    volume,
    spread: [(volume * BRAZIL.gainBps[0]) / 10_000, (volume * BRAZIL.gainBps[1]) / 10_000] as [
      number,
      number,
    ],
    valueDaysOp: perDay * BRAZIL.valueDays,
    valueDaysFridayOp: perDay * BRAZIL.valueDaysFriday,
    valueDaysYear,
    exposure1Sigma,
    avgExposure,
    carryPerDay,
    iofShortLoanYear: volume * BRAZIL.iof.loanShort,
  };
}
