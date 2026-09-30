import { useEffect } from 'react';
import { useApp } from '@/app/store';
import { REAL_MS_PER_SIM_HOUR, SIM_END } from '@/engine/clock';

/** Advances the simulated clock while playing: 1 simulated hour ≈ 1.5 s at speed 1. */
export function useClockLoop() {
  const playing = useApp((s) => s.playing);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      // Re-render at ~25 fps: smooth enough, light on charts.
      if (acc >= 40) {
        const { t, speed, setT, setPlaying } = useApp.getState();
        const next = t + (acc / REAL_MS_PER_SIM_HOUR) * 60 * speed;
        acc = 0;
        if (next >= SIM_END) {
          setT(SIM_END);
          setPlaying(false);
          return;
        }
        setT(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
}
