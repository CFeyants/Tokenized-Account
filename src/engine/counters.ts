/**
 * The five weekly counters (§3.2), computed live from the timeline at minute t.
 * Actual/360 everywhere. Balances left at other banks are not counted (assumed 0%).
 */
import { SIM_START, offHoursMinutes, type SimTime } from './clock';
import { integrateEod, integrateMinutes, minutesWhere } from './accrual';
import type { Timeline } from './timeline';
import {
  debitWeight,
  eodWeight,
  hasDebit,
  minuteWeightParts,
  shortUnitsTotal,
  tradEodWeight,
  tradMinuteWeight,
} from './selectors';
import { snapshotAt } from './accrual';
import { RATES } from '@/data/rates';

export interface Counters {
  newTotal: number;
  tradTotal: number;
  newParts: {
    current: number;
    tokenised: number;
    units: number;
    fund: number;
    jitCost: number;
    spread: number;
  };
  tradParts: { current: number; td: number; fund: number; penalty: number };
  idleMinutesTrad: number;
  earningMinutesNew: number;
  sweptIn: number;
  returned: number;
  heldFromOtherBanks: number;
  jitMinutes: number;
  jitCost: number;
}

export function computeCounters(tl: Timeline, t: SimTime): Counters {
  const cur = integrateEod(tl.snaps, t, eodWeight);
  const tok = integrateMinutes(tl.snaps, 0, t, (s) => minuteWeightParts(s).tok);
  const units = integrateMinutes(tl.snaps, 0, t, (s) => minuteWeightParts(s).units);
  const fund = integrateMinutes(tl.snaps, 0, t, (s) => minuteWeightParts(s).fund);
  const jitCost = integrateMinutes(tl.snaps, 0, t, debitWeight);
  const jitMinutes = minutesWhere(tl.snaps, 0, t, hasDebit);
  const st = snapshotAt(tl.snaps, t).state;
  const spread = st.realised.unitSaleSpread;

  const tradEod = integrateEod(tl.trad, t, tradEodWeight);
  const tradCurOnly = integrateEod(tl.trad, t, (s) => tradEodWeight({ ...s, classicTD: 0 }));
  const tradFund = integrateMinutes(tl.trad, 0, t, tradMinuteWeight);
  const penalty = snapshotAt(tl.trad, t).state.penalty;

  const start = Math.min(t, SIM_START);
  const earning = minutesWhere(tl.snaps, start, t, (s) => shortUnitsTotal(s) > 0, offHoursMinutes);

  return {
    newTotal: cur + tok + units + fund - jitCost - spread,
    tradTotal: tradEod + tradFund - penalty,
    newParts: { current: cur, tokenised: tok, units, fund, jitCost, spread },
    tradParts: { current: tradCurOnly, td: tradEod - tradCurOnly, fund: tradFund, penalty },
    idleMinutesTrad: offHoursMinutes(SIM_START, Math.max(SIM_START, t)),
    earningMinutesNew: earning,
    sweptIn: st.sweptInTotal,
    returned: st.returnedTotal,
    heldFromOtherBanks: st.sweptInTotal - st.returnedTotal,
    jitMinutes,
    jitCost,
  };
}

/** Interest earned by a blocked collateral amount between `from` and `to`, to the minute. */
export function collateralInterest(tl: Timeline, collateralId: string, from: SimTime, to: SimTime) {
  const onAccount = integrateMinutes(tl.snaps, from, to, (s) => {
    const c = s.collateral.find((x) => x.id === collateralId);
    return c && c.status === 'active' ? s.blocked * RATES.tokenised : 0;
  });
  const inUnit = integrateMinutes(tl.snaps, from, to, (s) =>
    s.units
      .filter((u) => u.blocked && u.collateralId === collateralId)
      .reduce((a, u) => a + u.amount * u.rate, 0),
  );
  return { onAccount, inUnit, total: onAccount + inUnit };
}
