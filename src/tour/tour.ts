/**
 * The guided tour: Marie's week told in eleven steps. The tour replays a fixed set of actions on the
 * scenario, so every figure the narrator shows comes from the same engine as the screens.
 */
import { at, type SimTime } from '@/engine/clock';
import type { UserAction } from '@/engine/userActions';
import type { Timeline } from '@/engine/timeline';
import type { State } from '@/engine/types';
import type { HoodTab } from '@/app/store';
import { en } from '@/i18n/en';
import { bufferOf } from '@/data/buffers';
import { LATAM } from '@/data/corridors';
import { RATES } from '@/data/rates';
import { drawers } from '@/engine/selectors';
import { collateralInterest } from '@/engine/counters';
import { repatriationQuote } from '@/engine/advanced';
import { ledgerOpportunity } from '@/engine/markets';
import { fxCostEur, fxFloor } from '@/engine/fx';
import { minuteAccrual } from '@/engine/accrual';
import { fmtAmount, fmtEur, fmtM } from '@/engine/format';
import { BRAZIL_BID_BOND } from '@/engine/scenario';
import { weekMetrics } from '@/engine/weekMetrics';
import { usClientValue } from '@/data/tmmf';

const M = 1_000_000;
const T = en.tour;

export const BRAZIL_DIVIDEND_BRL = 36 * M;
export const RIYADH_EUR = 5 * M;
export const TOKYO_EUR = 8 * M;
export const COMMITTED_EUR = 6 * M;

/** What the tour replays on top of the scenario. */
export const TOUR_ACTIONS: UserAction[] = [
  {
    kind: 'repatriate',
    id: 'TOUR-BR',
    t: at(0, '10:15'),
    country: 'BR',
    local: BRAZIL_DIVIDEND_BRL,
  },
  {
    kind: 'prevalidate',
    id: 'TOUR-PV',
    t: at(3, '09:30'),
    category: 'equipment',
    payee: 'Rheinwerk Tunnelbau GmbH',
    amount: COMMITTED_EUR,
    condition: 'Factory acceptance certificate',
    onLedger: false,
    deadline: at(3, '09:30') + 14 * 24 * 60,
  },
  {
    kind: 'jit',
    id: 'TOUR-RY',
    t: at(6, '08:55'),
    to: 'tok-sar-riyadh',
    source: 'USD',
    amountEur: RIYADH_EUR,
  },
  {
    kind: 'jit',
    id: 'TOUR-TK',
    t: at(7, '01:55'),
    to: 'tok-jpy-tokyo',
    source: 'EUR',
    amountEur: TOKYO_EUR,
  },
];

export interface Ctx {
  tl: Timeline;
  t: SimTime;
  state: State;
  actions: UserAction[];
}

export interface TourStep {
  id: string;
  t: SimTime;
  path: string;
  target?: string;
  /** Short label on the tour timeline. */
  label: string;
  title: string;
  what: string;
  marie: (c: Ctx) => string;
  bank: (c: Ctx) => string;
  today: string;
  /** Side effects when entering the step (approve a request, open a hood tab). */
  enter?: { approve?: string; hood?: HoodTab };
}

const S = T.steps;
const groupAtBank = (s: State) => {
  const d = drawers(s);
  return d.current + d.tokFree + d.tokBlocked + d.termUnits + d.fund;
};

export const FULL: TourStep[] = [
  {
    id: 'cockpit',
    t: at(0, '08:30'),
    path: '/',
    target: 'cockpit-position',
    label: 'Mon 08:30',
    ...S.cockpit,
    marie: ({ state }) => S.cockpit.marieV(fmtM(drawers(state).otherBanks + groupAtBank(state))),
    bank: ({ state }) => S.cockpit.bankV(fmtM(groupAtBank(state))),
  },
  {
    id: 'rule',
    t: at(0, '08:40'),
    path: '/',
    target: 'cockpit-approvals',
    label: 'Mon 08:40',
    ...S.rule,
    enter: { approve: 'APR-TOKYO' },
    marie: () => S.rule.marieV(fmtM(bufferOf('tokyo'), 'EUR', 0)),
    bank: () => S.rule.bankV,
  },
  {
    id: 'brazil',
    t: at(0, '10:21'),
    path: '/repatriation',
    target: 'brazil-pipeline',
    label: 'Mon 10:15',
    ...S.brazil,
    marie: () => {
      const q = repatriationQuote(LATAM[0], BRAZIL_DIVIDEND_BRL);
      const oneSigma = (BRAZIL_DIVIDEND_BRL / 6.05) * 0.12 * Math.sqrt(2 / 252);
      return S.brazil.marieV(fmtEur(q.eur, 'EUR', 0), fmtEur(oneSigma, 'EUR', 0));
    },
    bank: () =>
      S.brazil.bankV(fmtEur(repatriationQuote(LATAM[0], BRAZIL_DIVIDEND_BRL).eur, 'EUR', 0)),
  },
  {
    id: 'bidbond',
    t: at(2, '11:00'),
    path: '/put-to-work',
    target: 'work-collateral',
    label: 'Wed 11:00',
    ...S.bidbond,
    marie: ({ tl }) =>
      S.bidbond.marieV(
        fmtEur(
          collateralInterest(tl, BRAZIL_BID_BOND, at(2, '11:00'), at(6, '19:00')).total,
          'EUR',
          0,
        ),
      ),
    bank: () => S.bidbond.bankV(fmtM(15 * M, 'EUR', 0)),
  },
  {
    id: 'committed',
    t: at(3, '09:30'),
    path: '/pre-validation',
    target: 'prevalidation-list',
    label: 'Thu 09:30',
    ...S.committed,
    marie: () =>
      S.committed.marieV(
        fmtM(COMMITTED_EUR, 'EUR', 0),
        fmtEur(ledgerOpportunity(COMMITTED_EUR, at(3, '09:30'), at(7, '09:00')), 'EUR', 0),
      ),
    bank: () => S.committed.bankV(fmtM(COMMITTED_EUR, 'EUR', 0)),
  },
  {
    id: 'friday',
    t: at(4, '18:30'),
    path: '/put-to-work',
    target: 'work-night',
    label: 'Fri 18:30',
    ...S.friday,
    marie: ({ state }) => {
      const units = state.units
        .filter((u) => u.tenor === 'weekend')
        .reduce((a, u) => a + u.amount, 0);
      return S.friday.marieV(
        fmtM(units),
        fmtEur(minuteAccrual(units, RATES.weekendUnit, 60.5 * 60), 'EUR', 0),
      );
    },
    bank: ({ state }) => {
      const units = state.units
        .filter((u) => u.tenor === 'weekend')
        .reduce((a, u) => a + u.amount, 0);
      return S.friday.bankV(fmtEur(minuteAccrual(units, 0.0025, 60.5 * 60), 'EUR', 0));
    },
  },
  {
    id: 'us',
    t: at(4, '20:00'),
    path: '/us-surplus',
    target: 'us-rule',
    label: 'Fri 20:00',
    ...S.us,
    marie: () => S.us.marieV(`USD ${fmtAmount(usClientValue().pickup)}`),
    bank: () => S.us.bankV,
  },
  {
    id: 'incident',
    t: at(5, '21:10'),
    path: '/incidents',
    target: 'incident-travel',
    label: 'Sat 21:10',
    ...S.incident,
    marie: () => S.incident.marieV,
    bank: () => S.incident.bankV,
  },
  {
    id: 'riyadh',
    t: at(6, '09:00'),
    path: '/just-in-time?preset=riyadh',
    target: 'jit-compare',
    label: 'Sun 09:00',
    ...S.riyadh,
    marie: () => S.riyadh.marieV(fmtM(bufferOf('riyadh'), 'EUR', 0)),
    bank: () =>
      S.riyadh.bankV(fmtEur(fxFloor('SAR', RIYADH_EUR, at(6, '08:55')).marginEur, 'EUR', 0)),
  },
  {
    id: 'tokyo',
    t: at(7, '02:00'),
    path: '/just-in-time?preset=tokyo',
    target: 'jit-compare',
    label: 'Mon 02:00',
    ...S.tokyo,
    enter: { hood: 'fx' },
    marie: () =>
      S.tokyo.marieV(
        fmtM(bufferOf('tokyo'), 'EUR', 0),
        fmtEur(fxCostEur(TOKYO_EUR, fxFloor('JPY', TOKYO_EUR, at(7, '01:55')).quoteBps), 'EUR', 0),
      ),
    bank: () => {
      const f = fxFloor('JPY', TOKYO_EUR, at(7, '01:55'));
      return S.tokyo.bankV(
        f.floorBps.toFixed(1),
        f.quoteBps.toFixed(0),
        fmtEur(f.marginEur, 'EUR', 0),
      );
    },
  },
  {
    id: 'recap',
    t: at(7, '09:00'),
    path: '/tour-recap',
    target: 'tour-recap',
    label: 'Recap',
    ...S.recap,
    marie: ({ tl, t, actions }) =>
      S.recap.marieV(fmtEur(weekMetrics(tl, t, actions).interestGain, 'EUR', 0)),
    bank: ({ tl, t, actions }) =>
      S.recap.bankV(fmtEur(weekMetrics(tl, t, actions).bankTotal, 'EUR', 0)),
  },
];

const byId = (id: string) => FULL.find((s) => s.id === id)!;

export const BANK: TourStep[] = [
  {
    id: 'bc',
    t: at(7, '09:00'),
    path: '/business-case',
    target: 'bc-net',
    label: 'Business case',
    ...S.bc,
    marie: () => S.bc.marieV,
    bank: () => S.bc.bankV,
  },
  {
    id: 'alm',
    t: at(4, '20:00'),
    path: '/week',
    label: 'Asset-liability management',
    ...S.alm,
    enter: { hood: 'alm' },
    marie: () => S.alm.marieV,
    bank: () => S.alm.bankV,
  },
  { ...byId('tokyo'), id: 'fxpos', label: 'Foreign exchange & position' },
  { ...byId('incident'), label: 'Incidents' },
];

export const TOURS = {
  full: FULL,
  cfo: [
    byId('cockpit'),
    byId('brazil'),
    byId('tokyo'),
    { ...byId('recap'), path: '/business-case', target: 'bc-net' },
  ],
  bank: BANK,
};

export type TourKind = keyof typeof TOURS;
