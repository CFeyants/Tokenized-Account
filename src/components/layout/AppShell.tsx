import { useEffect, useRef, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { parseParam, toParam, formatClock } from '@/engine/clock';
import { Rail } from './Rail';
import { TopBar } from './TopBar';
import { useClockLoop } from './useClockLoop';
import { HoodPanel } from '@/components/hood/HoodPanel';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';

/** Keeps ?t= in the URL while paused, and reads it on first load (share a moment). */
function useUrlClock() {
  const [params, setParams] = useSearchParams();
  const t = useApp((s) => s.t);
  const playing = useApp((s) => s.playing);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      const parsed = parseParam(params.get('t'));
      if (parsed !== null) useApp.getState().setT(parsed);
      return;
    }
    if (playing) return;
    const v = toParam(t);
    if (params.get('t') !== v) {
      const next = new URLSearchParams(params);
      next.set('t', v);
      setParams(next, { replace: true });
    }
  }, [t, playing, params, setParams]);
}

function Banner() {
  const dismissed = useApp((s) => s.bannerDismissed);
  const dismiss = useApp((s) => s.dismissBanner);
  if (dismissed) return null;
  return (
    <div role="note" className="mx-auto mt-6 flex max-w-[1440px] items-center gap-4 px-8">
      <div className="card flex w-full items-center gap-4 border-new/30 px-5 py-3.5">
        <span className="size-2 shrink-0 rounded-full bg-new" />
        <p className="flex-1 text-[14px] leading-relaxed">{en.shell.banner}</p>
        <Button size="sm" variant="new" onClick={dismiss}>
          {en.shell.dismiss}
        </Button>
      </div>
    </div>
  );
}

/** A short card for each event as the clock passes it, so the story tells itself. */
function EventToast() {
  const { t, tl } = useSim();
  const [shown, setShown] = useState<string | null>(null);
  const lastId = useRef<string | null>(null);
  const mountedAt = useRef(performance.now());
  const passed = tl.events.filter((e) => e.t <= t && e.kind !== 'auto');
  const latest = passed[passed.length - 1];

  useEffect(() => {
    if (!latest || latest.id === lastId.current) return;
    const firstRender = lastId.current === null;
    lastId.current = latest.id;
    if (firstRender || t - latest.t > 90 || performance.now() - mountedAt.current < 1500) return; // do not pop old events when jumping far
    setShown(latest.id);
    const h = setTimeout(() => setShown((s) => (s === latest.id ? null : s)), 5200);
    return () => clearTimeout(h);
  }, [latest, t]);

  const e = tl.events.find((x) => x.id === shown);
  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[min(560px,90vw)] -translate-x-1/2"
      aria-live="polite"
    >
      <AnimatePresence>
        {e && (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="card pointer-events-auto flex items-start gap-3 border-line-strong px-4 py-3.5"
          >
            <Chip tone={e.actor} className={e.actor === 'rule' ? 'pulse-once' : ''}>
              {en.actors[e.actor]}
            </Chip>
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] text-muted tabular">
                {e.n !== undefined ? `#${e.n} · ` : ''}
                {formatClock(e.t)}
              </div>
              <div className="text-[14px] font-medium leading-snug">{e.title}</div>
              <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{e.detail}</div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShown(null)}
              className="cursor-pointer rounded-full p-1 text-muted hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell() {
  useClockLoop();
  useUrlClock();
  const theme = useApp((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Space toggles play when focus is not in a form field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        e.code !== 'Space' ||
        /INPUT|TEXTAREA|SELECT|BUTTON/.test(el.tagName) ||
        el.getAttribute('role') === 'slider'
      )
        return;
      e.preventDefault();
      useApp.getState().togglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
      >
        {en.shell.skip}
      </a>
      <Rail />
      <div className="min-w-0 flex-1">
        <TopBar />
        <Banner />
        <main id="main" className="mx-auto max-w-[1440px] px-8 pb-24 pt-8">
          <Outlet />
        </main>
      </div>
      <HoodPanel />
      <EventToast />
    </div>
  );
}
