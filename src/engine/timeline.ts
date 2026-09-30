/**
 * The scenario reducer: applies every event in time order to produce one snapshot per event,
 * plus the ledger and the orchestration log. Every screen reads from this timeline at the
 * current simulated minute, so everything re-renders from the same state.
 */
import type { SimTime } from './clock';
import { cloneState, initialState } from './ops';
import { initialTradState, SCENARIO, TRAD_EVENTS } from './scenario';
import type {
  Ctx,
  LedgerEntry,
  OrchestrationEntry,
  SimEvent,
  Snapshot,
  State,
  TradState,
} from './types';
import { snapshotAt } from './accrual';

export interface Timeline {
  events: SimEvent[];
  snaps: Snapshot<State>[];
  trad: Snapshot<TradState>[];
  ledger: LedgerEntry[];
  orch: OrchestrationEntry[];
}

const KIND_ORDER: Record<SimEvent['kind'], number> = { scenario: 0, auto: 0, extra: 0, user: 1 };

export function sortEvents(events: SimEvent[]): SimEvent[] {
  return events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.t - b.e.t || KIND_ORDER[a.e.kind] - KIND_ORDER[b.e.kind] || a.i - b.i)
    .map((x) => x.e);
}

export function buildTimeline(extra: SimEvent[] = []): Timeline {
  const events = sortEvents([...SCENARIO, ...extra]);
  const snaps: Snapshot<State>[] = [{ t: 0, eventId: 'start', state: initialState() }];
  const ledger: LedgerEntry[] = [];
  const orch: OrchestrationEntry[] = [];
  let state = snaps[0].state;

  for (const e of events) {
    const draft = cloneState(state);
    let sec = 0;
    const ctx: Ctx = {
      t: e.t,
      eventId: e.id,
      post: (p) => {
        ledger.push({
          ...p,
          id: `L${String(ledger.length + 1).padStart(4, '0')}`,
          t: e.t + sec / 60,
          eventId: e.id,
        });
        sec += 1;
      },
      orchestrate: (o) => orch.push({ ...o, t: e.t, eventId: e.id }),
    };
    e.apply(draft, ctx);
    state = draft;
    snaps.push({ t: e.t, eventId: e.id, state });
  }

  const trad: Snapshot<TradState>[] = [{ t: 0, eventId: 'start', state: initialTradState() }];
  let ts = trad[0].state;
  for (const e of TRAD_EVENTS) {
    const d = { ...ts };
    e.apply(d);
    ts = d;
    trad.push({ t: e.t, eventId: e.id, state: ts });
  }

  return { events, snaps, trad, ledger, orch };
}

export const stateAt = (tl: Timeline, t: SimTime): State => snapshotAt(tl.snaps, t).state;
export const tradAt = (tl: Timeline, t: SimTime): TradState => snapshotAt(tl.trad, t).state;

/** State right after a given event (for the §3.1 table). */
export function stateAfter(tl: Timeline, eventId: string): State {
  const i = tl.snaps.findIndex((s) => s.eventId === eventId);
  if (i < 0) throw new Error(`No event ${eventId}`);
  return tl.snaps[i].state;
}

export const eventsUpTo = (tl: Timeline, t: SimTime): SimEvent[] =>
  tl.events.filter((e) => e.t <= t);
export const nextEvent = (tl: Timeline, t: SimTime): SimEvent | undefined =>
  tl.events.find((e) => e.t > t);
export const prevEvent = (tl: Timeline, t: SimTime): SimEvent | undefined =>
  [...tl.events].reverse().find((e) => e.t < t);
