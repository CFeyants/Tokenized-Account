import { create } from 'zustand';
import { useApp } from '@/app/store';
import { useGov } from '@/app/governance';
import { TOURS, TOUR_ACTIONS, type TourKind } from './tour';

interface TourState {
  active: boolean;
  kind: TourKind;
  index: number;
  /** A tour was started in this session (for "Back to the tour"). */
  started: boolean;
  start: (kind: TourKind) => void;
  go: (index: number) => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  exit: () => void;
  resume: () => void;
}

export const useTour = create<TourState>((set, get) => ({
  active: false,
  kind: 'full',
  index: 0,
  started: false,
  start: (kind) => {
    // A clean week: the scenario, the tour's own actions, the seeded requests.
    useGov.getState().reset();
    useApp.setState({
      actions: [...TOUR_ACTIONS],
      playing: false,
      demoMode: false,
      frameworks: { dividend: true },
    });
    set({ active: true, kind, index: 0, started: true });
  },
  go: (index) =>
    set({ index: Math.max(0, Math.min(TOURS[get().kind].length - 1, index)), active: true }),
  next: () => get().go(get().index + 1),
  prev: () => get().go(get().index - 1),
  restart: () => get().start(get().kind),
  exit: () => set({ active: false }),
  resume: () => set({ active: true }),
}));
