/**
 * When each use case can exist, and what it depends on. H1 = 2027, H2 = 2028, H3 = 2029 and later.
 * "today" = orchestration the bank can offer on existing rails.
 */
export type Horizon = 'today' | 'H1' | 'H2' | 'H3';

export interface HorizonInfo {
  horizon: Horizon;
  dependencies: string[];
}

export const HORIZONS: Record<string, HorizonInfo> = {
  contracts: {
    horizon: 'H2',
    dependencies: ['Oracle providers under contract', 'Legal template for programmable escrow'],
  },
  brazil: {
    horizon: 'H2',
    dependencies: [
      'Authorised partner (CASP) in Brazil',
      'Euro stablecoin issuer',
      'Local FX treatment',
    ],
  },
  sweep: { horizon: 'H2', dependencies: ['Tokenised money market fund on the ledger'] },
  tmmfUsd: {
    horizon: 'H2',
    dependencies: [
      'Tokenised government 2a-7 fund accepting a bank deposit token as cash leg',
      'Tokenised USD account, New York',
    ],
  },
  tmmfCollateral: {
    horizon: 'H3',
    dependencies: [
      'Fund units accepted as margin by a clearing house (CFTC Letter 25-39 — to validate)',
      'No clearing house accepts them yet',
    ],
  },
  work: { horizon: 'H1', dependencies: ['Tokenised account on one legal entity'] },
  prevalidation: {
    horizon: 'today',
    dependencies: ['Orchestration on existing rails (T2, SCT Inst)'],
  },
  prevalidationLedger: {
    horizon: 'H3',
    dependencies: ['Beneficiary bank on an interbank network (Pontes, TCH)'],
  },
  jit: { horizon: 'H2', dependencies: ['Group entities on the ledger', 'Night FX desk and limit'] },
  jitEur: { horizon: 'H1', dependencies: ['Tokenised account on one legal entity'] },
  tms: { horizon: 'H1', dependencies: ['TMS connector (camt.052/053, rules API)'] },
};
