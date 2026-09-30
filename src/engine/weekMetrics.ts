/**
 * The week so far, for the client and for the bank — one engine for the tour banner, the narrator
 * and the recap. Everything is computed from the timeline and the actions replayed on it.
 */
import { MARKET, RATES, FX_MID } from '@/data/rates';
import { bufferOf } from '@/data/buffers';
import { CORRIDOR_PRICING } from '@/data/corridors';
import { integrateEod, integrateMinutes } from './accrual';
import { computeCounters } from './counters';
import { compareJit, type JitCcy } from './markets';
import { fxFloor } from './fx';
import { JIT_TARGET } from './advanced';
import type { SimTime } from './clock';
import type { Timeline } from './timeline';
import type { UserAction } from './userActions';

/** Margin our markets desk earns on a repatriation (EUR/BRL), bps. The partner is a paying agent. */
export const MARKETS_BRL_BPS = CORRIDOR_PRICING.marketsBps;

export interface WeekMetrics {
  /** Interest with the ledger minus traditional set-up, this week. */
  interestGain: number;
  interestNew: number;
  interestTrad: number;
  buffersReleased: number;
  failuresAvoided: number;
  /** Bank: change in net interest income this week vs the traditional twin (FTP = €STR). */
  bankNii: number;
  /** Bank: FX margin earned this week (repatriations, JIT above floor). */
  bankFx: number;
  bankTotal: number;
}

export function weekMetrics(
  tl: Timeline,
  t: SimTime,
  actions: UserAction[],
  ftp = MARKET.estr,
): WeekMetrics {
  const c = computeCounters(tl, t);
  const done = actions.filter((a) => a.t <= t);

  let buffers = 0;
  let failures = 0;
  let fx = 0;
  const seen = new Set<string>();
  for (const a of done) {
    if (a.kind === 'jit' && a.to !== 'tok-munich') {
      const tgt = JIT_TARGET[a.to];
      if (!seen.has(tgt.entity)) buffers += bufferOf(tgt.entity);
      seen.add(tgt.entity);
      if (
        compareJit(tgt.ccy as JitCcy, a.amountEur, a.t + 5, a.t).closedAtNeed.includes('parisDesk')
      )
        failures += 1;
      fx += Math.max(0, fxFloor(tgt.ccy, a.amountEur, a.t).marginEur);
    }
    if (a.kind === 'repatriate') {
      const eur =
        a.local /
        FX_MID[
          a.country === 'BR'
            ? 'BRL'
            : a.country === 'MX'
              ? 'MXN'
              : a.country === 'CO'
                ? 'COP'
                : 'CLP'
        ];
      fx += (eur * CORRIDOR_PRICING.marketsBps) / 10_000;
    }
  }

  // Net interest income on the balances the client keeps with us, with and without the ledger.
  const niiNew =
    integrateEod(tl.snaps, t, (s) => Math.max(0, s.bal['cur-paris']) * (ftp - RATES.current)) +
    integrateMinutes(tl.snaps, 0, t, (s) => {
      const tok =
        Math.max(0, s.bal['tok-paris']) +
        Math.max(0, s.bal['tok-munich']) +
        s.blocked +
        s.earmarked;
      const units = s.units
        .filter((u) => u.currency === 'EUR')
        .reduce((a, u) => a + u.amount * (ftp - u.rate), 0);
      return tok * (ftp - RATES.tokenised) + units;
    });
  const niiTrad =
    integrateEod(
      tl.trad,
      t,
      (s) => s.current * (ftp - RATES.current) + s.classicTD * (ftp - RATES.unit3m),
    ) + integrateMinutes(tl.trad, 0, t, (s) => s.cashGage * ftp);
  const bankNii = niiNew - niiTrad;

  return {
    interestGain: c.newTotal - c.tradTotal,
    interestNew: c.newTotal,
    interestTrad: c.tradTotal,
    buffersReleased: buffers,
    failuresAvoided: failures,
    bankNii,
    bankFx: fx,
    bankTotal: bankNii + fx,
  };
}
