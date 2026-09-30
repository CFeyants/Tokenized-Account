/**
 * "The clock follows finality." Interest to the minute runs only from the minute funds are
 * final on the paying entity's books.
 *  - Within one legal entity: final at once.
 *  - Between two Group entities: final at once for the client, with a mirror intragroup balance.
 *  - From another bank: instant transfers are final at once; correspondent payments are final
 *    only when the nostro is credited.
 */
import type { SimTime } from './clock';
import type { Finality, PendingReceipt } from './types';

export type Rail = 'internal' | 'intragroup' | 'sctInst' | 'sepa' | 'correspondent';

export interface FinalityRule {
  rail: Rail;
  /** Final at the moment of booking? */
  immediate: boolean;
  /** Needs a mirror intragroup balance? */
  mirror: boolean;
  stateOnArrival: Finality;
}

export const FINALITY_RULES: Record<Rail, FinalityRule> = {
  internal: { rail: 'internal', immediate: true, mirror: false, stateOnArrival: 'final' },
  intragroup: { rail: 'intragroup', immediate: true, mirror: true, stateOnArrival: 'final' },
  sctInst: { rail: 'sctInst', immediate: true, mirror: false, stateOnArrival: 'final' },
  sepa: { rail: 'sepa', immediate: false, mirror: false, stateOnArrival: 'valueTomorrow' },
  correspondent: { rail: 'correspondent', immediate: false, mirror: false, stateOnArrival: 'pendingCover' },
};

export const finalityOnArrival = (rail: Rail): Finality => FINALITY_RULES[rail].stateOnArrival;

/** Minute from which a receipt earns interest; null while not final. */
export function accrualStart(r: PendingReceipt): SimTime | null {
  return r.status === 'final' && r.finalAt !== undefined ? r.finalAt : null;
}

/** Minutes of accrual a receipt is entitled to between announcement and t. Never before finality. */
export function earningMinutes(r: PendingReceipt, t: SimTime): number {
  const start = accrualStart(r);
  if (start === null || t <= start) return 0;
  return t - start;
}
