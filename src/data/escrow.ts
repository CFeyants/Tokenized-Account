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
    id: 'engineer',
    name: 'Site acceptance',
    provider: "Engineer's acceptance certificate (e-signature platform)",
    milestones: ['acceptance'],
    auth: 'mTLS + ES256 signature',
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
  /** Guardrail: largest single release allowed. */
  capPerDay: number;
  oracle: string;
  milestones: {
    key: string;
    label: string;
    share: number;
    payouts?: { payee: string; share: number }[];
  }[];
}

export const TEMPLATES: EscrowTemplate[] = [
  {
    id: 'cascade',
    name: 'Cascade payment — rail depot, Warsaw',
    purpose: 'Contract price paid down the supply chain the minute the site is accepted',
    amount: 10_000_000,
    payees: [
      'Wisła Rail Works (main contractor)',
      'Elektro-Mazowsze (electrical subcontractor)',
      'Budowa Nord (civil works subcontractor)',
    ],
    returnTo: 'Lefèvre Industries SA — tokenised account',
    expiryDays: 120,
    capPerDay: 10_000_000,
    oracle: 'engineer',
    milestones: [
      {
        key: 'acceptance',
        label: 'Site acceptance certificate',
        share: 0.95,
        payouts: [
          { payee: 'Wisła Rail Works (main contractor)', share: 0.6 },
          { payee: 'Elektro-Mazowsze (electrical subcontractor)', share: 0.25 },
          { payee: 'Budowa Nord (civil works subcontractor)', share: 0.1 },
        ],
      },
      {
        key: 'warrantyEnd',
        label: 'Retention released at warranty end',
        share: 0.05,
        payouts: [{ payee: 'Wisła Rail Works (main contractor)', share: 0.05 }],
      },
    ],
  },
  {
    id: 'mna',
    name: 'M&A escrow — Aceros del Norte (Monterrey)',
    purpose:
      'Acquisition price, paid to the sellers only on completion; 10% retained for warranties',
    amount: 20_000_000,
    payees: ['Sellers of Aceros del Norte SA de CV (escrow agent: notary)'],
    returnTo: 'Lefèvre Industries SA — tokenised account',
    expiryDays: 90,
    capPerDay: 20_000_000,
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
    capPerDay: 12_000_000,
    oracle: 'customs',
    milestones: [
      { key: 'shipped', label: 'Bill of lading issued', share: 0.4 },
      { key: 'delivered', label: 'Delivery confirmed on site', share: 0.6 },
    ],
  },
];

export const ORACLE_ENDPOINT = (escrowId: string) =>
  `https://api.bank.example/contracts/v1/${escrowId}/events`;
