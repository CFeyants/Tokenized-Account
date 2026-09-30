export type Currency = 'EUR' | 'USD' | 'SGD' | 'BRL' | 'MXN' | 'PLN';

export interface Entity {
  id: string;
  name: string;
  city: string;
  country: string;
  currency: Currency;
}

export const GROUP_NAME = 'Lefèvre Industries';

export const ENTITIES: Entity[] = [
  { id: 'paris', name: 'Lefèvre Industries SA', city: 'Paris', country: 'France', currency: 'EUR' },
  { id: 'munich', name: 'Lefèvre GmbH', city: 'Munich', country: 'Germany', currency: 'EUR' },
  { id: 'madrid', name: 'Lefèvre Ibérica SL', city: 'Madrid', country: 'Spain', currency: 'EUR' },
  { id: 'saopaulo', name: 'Lefèvre do Brasil Ltda', city: 'São Paulo', country: 'Brazil', currency: 'BRL' },
  { id: 'monterrey', name: 'Lefèvre México SA de CV', city: 'Monterrey', country: 'Mexico', currency: 'MXN' },
  { id: 'singapore', name: 'Lefèvre Asia Pte Ltd', city: 'Singapore', country: 'Singapore', currency: 'SGD' },
  { id: 'chicago', name: 'Lefèvre Inc.', city: 'Chicago', country: 'United States', currency: 'USD' },
  { id: 'warsaw', name: 'Lefèvre Polska Sp. z o.o.', city: 'Warsaw', country: 'Poland', currency: 'PLN' },
];

export const entityById = (id: string): Entity => {
  const e = ENTITIES.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown entity ${id}`);
  return e;
};

export interface Bank {
  id: string;
  name: string;
  /** Is it "the bank" (on our ledger)? */
  ours: boolean;
  cutoff: string;
}

export const BANKS: Bank[] = [
  { id: 'bnp', name: 'BNP Paribas', ours: true, cutoff: '18:00' },
  { id: 'bnpsg', name: 'BNP Paribas Singapore', ours: true, cutoff: '17:00 SGT' },
  { id: 'hsbc', name: 'HSBC', ours: false, cutoff: '17:30' },
  { id: 'db', name: 'Deutsche Bank', ours: false, cutoff: '17:45' },
  { id: 'san', name: 'Santander', ours: false, cutoff: '17:00' },
  { id: 'local', name: 'Local banks', ours: false, cutoff: 'local' },
];

export const bankById = (id: string): Bank => {
  const b = BANKS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown bank ${id}`);
  return b;
};
