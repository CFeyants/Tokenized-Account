import type { Currency } from './entities';
import type { AccountId } from '@/engine/types';
import { FX_MID } from './rates';

export type AccountType = 'current' | 'tokenised' | 'otherBank';
export type NightBehaviour = 'swept' | 'notSwept' | 'pooled' | 'inUnit' | 'local';

export interface AccountDef {
  id: string;
  entity: string;
  bank: string;
  currency: Currency;
  type: AccountType;
  iban: string;
  cutoff: string;
  night: NightBehaviour;
  /** Dynamic accounts read their balance from the engine state. */
  dynamic?: AccountId;
  /** Static balance in account currency for accounts the scenario does not move. */
  staticBalance?: number;
}

export const ACCOUNTS: AccountDef[] = [
  { id: 'cur-paris', entity: 'paris', bank: 'bnp', currency: 'EUR', type: 'current', iban: 'FR76 3000 4000 0312 3456 7890 143', cutoff: '18:00', night: 'swept', dynamic: 'cur-paris' },
  { id: 'cur-munich', entity: 'munich', bank: 'bnp', currency: 'EUR', type: 'current', iban: 'DE12 5123 0800 0000 0419 21', cutoff: '18:00', night: 'pooled', staticBalance: 0 },
  { id: 'cur-madrid', entity: 'madrid', bank: 'bnp', currency: 'EUR', type: 'current', iban: 'ES91 0149 0001 2100 0435 6702', cutoff: '18:00', night: 'pooled', staticBalance: 0 },
  { id: 'tok-paris', entity: 'paris', bank: 'bnp', currency: 'EUR', type: 'tokenised', iban: 'FR76 3000 4000 0399 0000 0001 207', cutoff: 'none', night: 'inUnit', dynamic: 'tok-paris' },
  { id: 'tok-munich', entity: 'munich', bank: 'bnp', currency: 'EUR', type: 'tokenised', iban: 'FR76 3000 4000 0399 0000 0002 110', cutoff: 'none', night: 'inUnit', dynamic: 'tok-munich' },
  { id: 'tok-usd-chicago', entity: 'chicago', bank: 'bnp', currency: 'USD', type: 'tokenised', iban: 'FR76 3000 4000 0399 0000 0003 842', cutoff: 'none', night: 'inUnit', dynamic: 'tok-usd-chicago' },
  { id: 'tok-sgd-singapore', entity: 'singapore', bank: 'bnpsg', currency: 'SGD', type: 'tokenised', iban: 'SG 7171 0049 2210', cutoff: 'none', night: 'inUnit', dynamic: 'tok-sgd-singapore' },
  { id: 'hsbc-paris', entity: 'paris', bank: 'hsbc', currency: 'EUR', type: 'otherBank', iban: 'FR76 3005 6000 1100 2233 4455 012', cutoff: '17:30', night: 'swept', dynamic: 'hsbc-paris' },
  { id: 'db-munich', entity: 'munich', bank: 'db', currency: 'EUR', type: 'otherBank', iban: 'DE89 3704 0044 0532 0130 00', cutoff: '17:45', night: 'swept', dynamic: 'db-munich' },
  { id: 'san-madrid', entity: 'madrid', bank: 'san', currency: 'EUR', type: 'otherBank', iban: 'ES66 0049 1500 0512 3456 7892', cutoff: '17:00', night: 'notSwept', staticBalance: 40_000_000 },
  { id: 'local-saopaulo', entity: 'saopaulo', bank: 'local', currency: 'BRL', type: 'otherBank', iban: 'BR 0001 2345 6789', cutoff: '16:00 BRT', night: 'local', staticBalance: 12_000_000 * FX_MID.BRL },
  { id: 'local-monterrey', entity: 'monterrey', bank: 'local', currency: 'MXN', type: 'otherBank', iban: 'MX 0021 8000 1234', cutoff: '17:00 CST', night: 'local', staticBalance: 8_000_000 * FX_MID.MXN },
  { id: 'local-warsaw', entity: 'warsaw', bank: 'local', currency: 'PLN', type: 'otherBank', iban: 'PL61 1090 1014 0000 0712 1981 2874', cutoff: '16:30', night: 'local', staticBalance: 9_000_000 * FX_MID.PLN },
  { id: 'local-chicago', entity: 'chicago', bank: 'local', currency: 'USD', type: 'otherBank', iban: 'US ABA 071000013', cutoff: '17:00 CT', night: 'local', staticBalance: 6_000_000 * FX_MID.USD },
];

/** EUR balance held at other banks that the scenario never moves (Santander + local banks). */
export const STATIC_OTHER_BANKS_EUR = ACCOUNTS.filter(
  (a) => a.type === 'otherBank' && a.staticBalance !== undefined,
).reduce((s, a) => s + (a.staticBalance ?? 0) / FX_MID[a.currency], 0);
