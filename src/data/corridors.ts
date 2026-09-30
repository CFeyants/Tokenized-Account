import type { AccountId, LatamCountry, WalletId } from '@/engine/types';
import type { Currency } from './entities';

/**
 * Corridors and the rails available on each. Partner banks are fictitious placeholders;
 * the corridor partner and the euro stablecoin issuer are named as the product owner asked —
 * to validate with Partnerships, Legal and Compliance before any external use.
 */
export type Rail = 'interbank' | 'stablecoin' | 'intragroup' | 'traditional';

export interface Corridor {
  id: string;
  label: string;
  from: Currency | 'LATAM';
  to: Currency;
  counterparty: string;
  rails: Rail[];
  status: 'pilot2027' | 'pilot2028' | 'live' | 'traditionalOnly';
  hours: string;
}

export const CORRIDORS: Corridor[] = [
  {
    id: 'eur-partners',
    label: 'EUR → partner banks (eurozone)',
    from: 'EUR',
    to: 'EUR',
    counterparty: 'Banca Adriatica, Noordbank (pilot participants)',
    rails: ['interbank', 'traditional'],
    status: 'pilot2027',
    hours: '24/7',
  },
  {
    id: 'eur-usd',
    label: 'EUR → USD, US partner bank',
    from: 'EUR',
    to: 'USD',
    counterparty: 'Great Lakes Trust (pilot participant)',
    rails: ['interbank', 'traditional'],
    status: 'pilot2028',
    hours: '24/7, payment-versus-payment on the ledger',
  },
  {
    id: 'eur-sgd',
    label: 'EUR → SGD, Singapore partner bank',
    from: 'EUR',
    to: 'SGD',
    counterparty: 'Straits Commercial Bank (pilot participant)',
    rails: ['interbank', 'traditional'],
    status: 'pilot2028',
    hours: '24/7',
  },
  {
    id: 'intragroup',
    label: 'EUR / USD → JPY, SAR, SGD — group entities',
    from: 'EUR',
    to: 'JPY',
    counterparty: 'Norvane Bank Tokyo, Riyadh, Singapore',
    rails: ['intragroup', 'traditional'],
    status: 'live',
    hours: '24/7 within the night FX limit',
  },
  {
    id: 'latam',
    label: 'BRL, MXN, COP, CLP → EUR (repatriation)',
    from: 'LATAM',
    to: 'EUR',
    counterparty: 'Bitso wallets → Qivalis euro stablecoin → master account',
    rails: ['stablecoin', 'traditional'],
    status: 'pilot2027',
    hours: 'PIX / SPEI 24/7; COP and CLP local banking hours',
  },
  {
    id: 'eur-others',
    label: 'EUR → banks not on the ledger',
    from: 'EUR',
    to: 'EUR',
    counterparty: 'e.g. Commerzbank',
    rails: ['traditional'],
    status: 'traditionalOnly',
    hours: 'SCT Inst 24/7; SEPA, T2 business hours',
  },
];

export interface Payee {
  id: string;
  name: string;
  bank: string;
  corridor: string;
  onLedger: boolean;
}

export const PAYEES: Payee[] = [
  {
    id: 'milan',
    name: 'Officine Ferraresi SpA',
    bank: 'Banca Adriatica',
    corridor: 'eur-partners',
    onLedger: true,
  },
  {
    id: 'rotterdam',
    name: 'Haven Logistics BV',
    bank: 'Noordbank',
    corridor: 'eur-partners',
    onLedger: true,
  },
  {
    id: 'detroit',
    name: 'Midwest Castings Inc.',
    bank: 'Great Lakes Trust (USD)',
    corridor: 'eur-usd',
    onLedger: true,
  },
  {
    id: 'hamburg',
    name: 'Nordwerk Maschinenbau',
    bank: 'Commerzbank',
    corridor: 'eur-others',
    onLedger: false,
  },
];

export interface LatamConfig {
  country: LatamCountry;
  entity: string;
  currency: Currency;
  account: AccountId;
  wallet: WalletId;
  localRail: string;
  /** Local rail hours in Paris minutes (null = 24/7), Mon–Fri. */
  railWindow: { from: number; to: number } | null;
}

export const LATAM: LatamConfig[] = [
  {
    country: 'BR',
    entity: 'saopaulo',
    currency: 'BRL',
    account: 'loc-brl-saopaulo',
    wallet: 'bitso-brl',
    localRail: 'PIX',
    railWindow: null,
  },
  {
    country: 'MX',
    entity: 'monterrey',
    currency: 'MXN',
    account: 'loc-mxn-monterrey',
    wallet: 'bitso-mxn',
    localRail: 'SPEI',
    railWindow: null,
  },
  {
    country: 'CO',
    entity: 'bogota',
    currency: 'COP',
    account: 'loc-cop-bogota',
    wallet: 'bitso-cop',
    localRail: 'local transfer',
    railWindow: { from: 15 * 60, to: 23 * 60 },
  },
  {
    country: 'CL',
    entity: 'santiago',
    currency: 'CLP',
    account: 'loc-clp-santiago',
    wallet: 'bitso-clp',
    localRail: 'local transfer',
    railWindow: { from: 13 * 60, to: 21 * 60 },
  },
];

export const CORRIDOR_PRICING = {
  /** Partner conversion into the euro stablecoin. */
  partnerBps: 30,
  networkFeeEur: 2,
  /** Redemption of the euro stablecoin at par on the master account. */
  redemptionBps: 0,
  lockMinutes: 15,
  /** Traditional: local bank FX spread + SWIFT and correspondent fees, value D+2. */
  tradBps: 60,
  tradFeesEur: 65,
  tradValueDays: 2,
};

export const WALLET_ADDRESS: Record<WalletId, string> = {
  'bitso-brl': 'bitso://lefevre-brasil/brl',
  'bitso-mxn': 'bitso://lefevre-mexico/mxn',
  'bitso-cop': 'bitso://lefevre-colombia/cop',
  'bitso-clp': 'bitso://lefevre-chile/clp',
  'bitso-qeur': '0x7a3F…c21E',
};

/** Master account receiving the euro stablecoin, redeemed at par into the tokenised account. */
export const MASTER_ADDRESS = '0xB9e1…04aD (Norvane Bank SA — Lefèvre Industries master account)';
