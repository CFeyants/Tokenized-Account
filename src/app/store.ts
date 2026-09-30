import { create } from 'zustand';
import { useMemo } from 'react';
import { SIM_END, SIM_START, type SimTime } from '@/engine/clock';
import { buildTimeline, nextEvent, prevEvent, type Timeline } from '@/engine/timeline';
import { actionToEvents, type NewUserAction, type UserAction } from '@/engine/userActions';
import { computeCounters } from '@/engine/counters';
import { snapshotAt } from '@/engine/accrual';

export type HoodTab = 'ledger' | 'orchestration' | 'accrual' | 'alm' | 'intragroup' | 'notYet';
export type Speed = 1 | 3 | 8;

interface AppState {
  t: SimTime;
  playing: boolean;
  speed: Speed;
  actions: UserAction[];
  theme: 'dark' | 'light';
  hoodOpen: boolean;
  hoodTab: HoodTab;
  /** Account or unit selected for the accrual tab. */
  accrualTarget: string;
  bannerDismissed: boolean;
  railExpanded: boolean;
  setT: (t: SimTime) => void;
  setPlaying: (p: boolean) => void;
  togglePlay: () => void;
  setSpeed: (s: Speed) => void;
  step: () => void;
  stepBack: () => void;
  restart: () => void;
  addAction: (a: NewUserAction) => void;
  resetActions: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  openHood: (tab?: HoodTab, accrualTarget?: string) => void;
  setHoodOpen: (o: boolean) => void;
  setHoodTab: (t: HoodTab) => void;
  dismissBanner: () => void;
  toggleRail: () => void;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable — fine */
  }
};

const clamp = (t: SimTime) => Math.max(0, Math.min(SIM_END, t));

// One timeline per list of user actions, shared by every component.
let cachedFor: UserAction[] | null = null;
let cached: Timeline = buildTimeline();
export function timelineFor(actions: UserAction[]): Timeline {
  if (actions !== cachedFor) {
    cached = buildTimeline(actions.flatMap(actionToEvents));
    cachedFor = actions;
  }
  return cached;
}

let actionSeq = 0;

export const useApp = create<AppState>((set, get) => ({
  t: SIM_START,
  playing: false,
  speed: 1,
  actions: [],
  theme: read<'dark' | 'light'>('tcm.theme', 'dark'),
  hoodOpen: false,
  hoodTab: 'ledger',
  accrualTarget: 'tok-paris',
  bannerDismissed: read('tcm.banner', false),
  railExpanded: read('tcm.rail', true),
  setT: (t) => set({ t: clamp(t) }),
  setPlaying: (p) => set({ playing: p && get().t < SIM_END }),
  togglePlay: () => {
    const { playing, t } = get();
    if (!playing && t >= SIM_END) set({ t: SIM_START, playing: true });
    else set({ playing: !playing });
  },
  setSpeed: (speed) => set({ speed }),
  step: () => {
    const tl = timelineFor(get().actions);
    const e = nextEvent(tl, get().t);
    set({ t: e ? e.t : SIM_END, playing: false });
  },
  stepBack: () => {
    const tl = timelineFor(get().actions);
    const e = prevEvent(tl, get().t);
    set({ t: e ? e.t : SIM_START, playing: false });
  },
  restart: () => set({ t: SIM_START, playing: false }),
  addAction: (a) => {
    actionSeq += 1;
    const full = { ...a, id: `USR-${String(actionSeq).padStart(2, '0')}`, t: get().t } as UserAction;
    set({ actions: [...get().actions, full] });
  },
  resetActions: () => set({ actions: [] }),
  setTheme: (theme) => {
    write('tcm.theme', theme);
    set({ theme });
  },
  openHood: (tab, accrualTarget) =>
    set((s) => ({ hoodOpen: true, hoodTab: tab ?? s.hoodTab, accrualTarget: accrualTarget ?? s.accrualTarget })),
  setHoodOpen: (hoodOpen) => set({ hoodOpen }),
  setHoodTab: (hoodTab) => set({ hoodTab }),
  dismissBanner: () => {
    write('tcm.banner', true);
    set({ bannerDismissed: true });
  },
  toggleRail: () => {
    const v = !get().railExpanded;
    write('tcm.rail', v);
    set({ railExpanded: v });
  },
}));

/** Everything a screen needs about "now": the timeline, the current state and its twin. */
export function useSim() {
  const t = useApp((s) => s.t);
  const actions = useApp((s) => s.actions);
  const tl = timelineFor(actions);
  const snap = snapshotAt(tl.snaps, t);
  const trad = snapshotAt(tl.trad, t).state;
  return { t, tl, state: snap.state, trad, snapEventId: snap.eventId };
}

export function useCounters() {
  const { t, tl } = useSim();
  return useMemo(() => computeCounters(tl, t), [tl, t]);
}
