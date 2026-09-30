/** Escrow templates and oracle sources for purpose-bound money on the tokenised account. */

export interface Oracle {
  id: string;
  name: string;
  provider: string;
  milestones: string[];
  auth: string;
}

export const ORACLES: Oracle[] = [
  {
    id: 'notary',
    name: 'Completion certificate',
    provider: 'Notary platform API (signed webhook)',
    milestones: ['completion'],
    auth: 'mTLS + ES256 signature',
  },
  {
    id: 'authority',
    name: 'Competition authority decision',
    provider: 'Regulator decision feed',
    milestones: ['clearance'],
    auth: 'mTLS + ES256 signature',
  },
  {
    id: 'customs',
    name: 'Bill of lading / delivery',
    provider: 'Trade documents API',
    milestones: ['shipped', 'delivered'],
    auth: 'OAuth 2.0 client credentials + signature',
  },
  {
    id: 'calendar',
    name: 'Date reached',
    provider: 'Bank calendar (internal)',
    milestones: ['warrantyEnd'],
    auth: 'internal',
  },
];

export interface EscrowTemplate {
  id: string;
  name: string;
  purpose: string;
  amount: number;
  payees: string[];
  returnTo: string;
  expiryDays: number;
  oracle: string;
  milestones: { key: string; label: string; share: number }[];
}

export const TEMPLATES: EscrowTemplate[] = [
  {
    id: 'mna',
    name: 'M&A escrow — Aceros del Norte (Monterrey)',
    purpose:
      'Acquisition price, paid to the sellers only on completion; 10% retained for warranties',
    amount: 20_000_000,
    payees: ['Sellers of Aceros del Norte SA de CV (escrow agent: notary)'],
    returnTo: 'Lefèvre Industries SA — tokenised account',
    expiryDays: 90,
    oracle: 'notary',
    milestones: [
      { key: 'clearance', label: 'Competition clearance received', share: 0 },
      { key: 'completion', label: 'Completion certificate signed', share: 0.9 },
      { key: 'warrantyEnd', label: 'Warranty period ends', share: 0.1 },
    ],
  },
  {
    id: 'equipment',
    name: 'Supplier milestones — tunnel boring machine',
    purpose: 'Equipment price released on shipment and delivery only; unusable for any other payee',
    amount: 12_000_000,
    payees: ['Rheinwerk Tunnelbau GmbH'],
    returnTo: 'Lefèvre Industries SA — tokenised account',
    expiryDays: 180,
    oracle: 'customs',
    milestones: [
      { key: 'shipped', label: 'Bill of lading issued', share: 0.4 },
      { key: 'delivered', label: 'Delivery confirmed on site', share: 0.6 },
    ],
  },
];

export const ORACLE_ENDPOINT = (escrowId: string) =>
  `https://api.bank.example/escrow/v1/${escrowId}/oracle-events`;
