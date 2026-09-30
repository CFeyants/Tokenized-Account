import { create } from 'zustand';
import { useMemo } from 'react';
import { SIM_END, SIM_START, at, type SimTime } from '@/engine/clock';
import type { ProfileId } from '@/engine/businessCase';
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
  showCounters: boolean;
  toggleCounters: () => void;
  /** Demo mode shows the clock controls and the week timeline. Off by default. */
  demoMode: boolean;
  toggleDemo: () => void;
  profile: ProfileId;
  setProfile: (p: ProfileId) => void;
  railExpanded: boolean;
  setT: (t: SimTime) => void;
  setPlaying: (p: boolean) => void;
  togglePlay: () => void;
  setSpeed: (s: Speed) => void;
  step: () => void;
  stepBack: () => void;
  restart: () => void;
  /** Adds an action at the current minute (or at `at`, e.g. the minute of need). Returns its id. */
  addAction: (a: NewUserAction, at?: SimTime) => string;
  resetActions: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  openHood: (tab?: HoodTab, accrualTarget?: string) => void;
  setHoodOpen: (o: boolean) => void;
  setHoodTab: (t: HoodTab) => void;
  dismissBanner: () => void;
  toggleRail: () => void;
}

const read = <T>(key: string, fallback: T): T => {
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

/** The demo opens on the Monday morning cash meeting. */
export const COCKPIT_START = at(0, '08:30');

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
  t: COCKPIT_START,
  playing: false,
  speed: 1,
  actions: [],
  theme: read<'dark' | 'light'>('tcm.theme', 'dark'),
  hoodOpen: false,
  hoodTab: 'ledger',
  accrualTarget: 'tok-paris',
  bannerDismissed: read('tcm.banner', false),
  railExpanded: read('tcm.rail', true),
  showCounters: read('tcm.counters', false),
  demoMode: read('tcm.demo', false),
  toggleDemo: () => {
    const v = !get().demoMode;
    write('tcm.demo', v);
    set({ demoMode: v, playing: false });
  },
  profile: read<ProfileId>('tcm.profile', 'large'),
  setProfile: (profile) => {
    write('tcm.profile', profile);
    set({ profile });
  },
  toggleCounters: () => {
    const v = !get().showCounters;
    write('tcm.counters', v);
    set({ showCounters: v });
  },
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
  restart: () => set({ t: COCKPIT_START, playing: false }),
  addAction: (a, at) => {
    actionSeq += 1;
    const id = `USR-${String(actionSeq).padStart(2, '0')}`;
    const full = { ...a, id, t: at ?? get().t } as UserAction;
    set({ actions: [...get().actions, full] });
    return id;
  },
  resetActions: () => set({ actions: [] }),
  setTheme: (theme) => {
    write('tcm.theme', theme);
    set({ theme });
  },
  openHood: (tab, accrualTarget) =>
    set((s) => ({
      hoodOpen: true,
      hoodTab: tab ?? s.hoodTab,
      accrualTarget: accrualTarget ?? s.accrualTarget,
    })),
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
