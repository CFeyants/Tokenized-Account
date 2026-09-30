import type { SimTime } from './clock';
import type { Currency } from '@/data/entities';
import type { UnitTenor } from '@/data/rates';

export type Actor = 'rule' | 'marie' | 'event';
export type EventKind = 'scenario' | 'auto' | 'extra' | 'user';
export type Finality = 'final' | 'pendingCover' | 'valueTomorrow';

export type AccountId =
  | 'cur-paris'
  | 'tok-paris'
  | 'tok-munich'
  | 'tok-usd-chicago'
  | 'tok-sgd-singapore'
  | 'tok-jpy-tokyo'
  | 'tok-sar-riyadh'
  | 'loc-brl-saopaulo'
  | 'loc-mxn-monterrey'
  | 'loc-cop-bogota'
  | 'loc-clp-santiago'
  | 'hsbc-paris'
  | 'db-munich';

export interface Unit {
  id: string;
  currency: 'EUR' | 'USD';
  amount: number;
  rate: number;
  tenor: UnitTenor;
  start: SimTime;
  maturity: SimTime;
  /** Blocked part of the tokenised account placed in the unit: keeps the unit rate, not transferable. */
  blocked: boolean;
  collateralId?: string;
  /** Earmarked amount (pre-validated payment or escrow) placed in the unit for the night. */
  earmarkId?: string;
  /** Bought by a rule (overnight / weekend) or by Marie. */
  origin: 'rule' | 'marie';
}

export interface Collateral {
  id: string;
  kind: 'bidBond' | 'performanceBond' | 'marginCall' | 'escrow';
  entity: string;
  beneficiary: string;
  amount: number;
  mode: 'blockOnAccount' | 'pledgeUnit' | 'pledgeFund';
  since: SimTime;
  releaseEvent: 'expiry' | 'document' | 'tender';
  status: 'active' | 'released';
  releasedAt?: SimTime;
}

/** A payment screened before departure, waiting for a milestone, a document or an oracle event. */
export interface ConditionalPayment {
  id: string;
  kind: 'payment' | 'large' | 'escrow';
  payee: string;
  amount: number;
  condition: string;
  since: SimTime;
  /** awaitingRail: condition met, waiting for the external rail (T2) to open; still earmarked. */
  status: 'waiting' | 'awaitingRail' | 'released' | 'returned';
  releasedAt?: SimTime;
  released?: number;
  checks?: { name: string; ok: boolean; detail: string }[];
  escrow?: EscrowTerms;
  events?: OracleEvent[];
  /** Kill switch: while paused, events are refused and nothing is paid. */
  paused?: boolean;
  /** Guardrail: largest payment the contract may make in one release. */
  capPerDay?: number;
}

/** Purpose-bound money held in escrow on the tokenised account. */
export interface EscrowTerms {
  purpose: string;
  payees: string[];
  expiry: SimTime;
  returnTo: string;
  template: string;
  oracle: string;
  endpoint: string;
  /** Release schedule: share of the escrow released when an oracle reports the milestone. */
  milestones: {
    key: string;
    label: string;
    share: number;
    done: boolean;
    /** Cascade: one event, several ordered payments. Shares are of the whole escrow. */
    payouts?: { payee: string; share: number }[];
    /** Event accepted; payment due at the end of the challenge window. */
    payAt?: number;
    paid?: boolean;
    contested?: boolean;
  }[];
}

export interface OracleEvent {
  t: SimTime;
  source: string;
  milestone: string;
  payload: string;
  outcome: string;
  accepted: boolean;
}

export type LatamCountry = 'BR' | 'MX' | 'CO' | 'CL';
export type WalletId = 'bitso-brl' | 'bitso-mxn' | 'bitso-cop' | 'bitso-clp' | 'bitso-qeur';

/** Repatriation through the stablecoin corridor: local account → partner wallet → euro stablecoin → master account. */
export interface Repatriation {
  id: string;
  country: LatamCountry;
  currency: Currency;
  local: number;
  rate: number;
  lockedAt: SimTime;
  lockUntil: SimTime;
  eur: number;
  fee: number;
  status: 'locked' | 'inWallet' | 'converted' | 'inTransit' | 'credited';
  steps: { key: string; at: SimTime }[];
}

export interface PendingReceipt {
  id: string;
  account: AccountId;
  currency: Currency;
  amount: number;
  via: string;
  announcedAt: SimTime;
  finalAt?: SimTime;
  status: 'pendingCover' | 'final';
}

export interface FundOrder {
  id: string;
  amount: number;
  placedAt: SimTime;
  status: 'queued' | 'settled';
  settledAt?: SimTime;
}

export interface MirrorBalance {
  id: string;
  t: SimTime;
  /** Entity of the bank that owes (e.g. Norvane Bank SA). */
  debtorBank: string;
  creditorBank: string;
  currency: Currency;
  amount: number;
  eur: number;
  memo: string;
}

export interface State {
  /** Free balances, in the account's own currency. May be negative on tokenised accounts (intraday credit). */
  bal: Record<AccountId, number>;
  /** Blocked (earmarked) sub-balance on the tokenised account. */
  blocked: number;
  units: Unit[];
  fundUnits: number;
  pending: PendingReceipt[];
  collateral: Collateral[];
  fundOrders: FundOrder[];
  mirrors: MirrorBalance[];
  /** Out-of-hours FX used tonight, EUR equivalent. */
  fxNightUsed: number;
  /** Swept in from other banks tonight, per bank, awaiting the return rule. */
  sweptTonight: Record<'hsbc-paris' | 'db-munich', number>;
  sweptInTotal: number;
  returnedTotal: number;
  /** Earmarked for pre-screened payments waiting for a condition: committed, not yet gone. */
  earmarked: number;
  conditional: ConditionalPayment[];
  /** Balances held with the corridor partner (local currencies and the euro stablecoin). */
  wallets: Record<WalletId, number>;
  repatriations: Repatriation[];
  /** Realised amounts outside principal: unit sale accrued, spreads, FX. Posted to the interest engine. */
  realised: { unitSaleAccrued: number; unitSaleSpread: number };
  seq: number;
}

export interface LedgerEntry {
  id: string;
  /** Minutes, with a seconds fraction so entries of one event are ordered to the second. */
  t: SimTime;
  eventId: string;
  account: string;
  currency: Currency;
  amount: number;
  finality: 'final' | 'pending';
  unitId?: string;
  memo: string;
}

export interface OrchestrationEntry {
  t: SimTime;
  eventId: string;
  rule: string;
  decision: string;
  instrument: string;
  rail: string;
  checks: { name: string; ok: boolean; detail: string }[];
}

export interface Ctx {
  t: SimTime;
  eventId: string;
  post: (e: Omit<LedgerEntry, 'id' | 't' | 'eventId'>) => void;
  orchestrate: (e: Omit<OrchestrationEntry, 't' | 'eventId'>) => void;
}

export interface SimEvent {
  id: string;
  /** Scenario row number (§3.1), when it is one of the headline events. */
  n?: number;
  t: SimTime;
  actor: Actor;
  kind: EventKind;
  title: string;
  detail: string;
  /** "new" = what the ledger adds, "traditional" = already works today, "notYet" = interbank layer. */
  layer: 'new' | 'traditional' | 'notYet' | 'none';
  apply: (s: State, ctx: Ctx) => void;
}

/** The traditional twin: the same week without the new layer. */
export interface TradState {
  current: number;
  usdCurrent: number;
  classicTD: number;
  cashGage: number;
  fund: number;
  penalty: number;
}

export interface TradEvent {
  id: string;
  t: SimTime;
  title: string;
  apply: (s: TradState) => void;
}

export interface Snapshot<S> {
  t: SimTime;
  eventId: string;
  state: S;
}
