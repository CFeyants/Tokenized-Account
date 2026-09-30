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
  /** Entity of the bank that owes (e.g. BNP Paribas SA). */
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
