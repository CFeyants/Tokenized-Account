import { useCallback, useMemo, useRef } from 'react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { BUSINESS_START, LAST_CUTOFF, MIN_PER_DAY, SIM_END, formatClock, formatDate, weekday } from '@/engine/clock';
import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const DAYS = 8;

/** The week as a strip: day/night shading, one mark per event, a handle for the clock. */
export function WeekTimeline() {
  const { t, tl } = useSim();
  const setT = useApp((s) => s.setT);
  const setPlaying = useApp((s) => s.setPlaying);
  const ref = useRef<HTMLDivElement>(null);
  const pct = (m: number) => `${(m / SIM_END) * 100}%`;

  const fromPointer = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      setT(Math.round(x * SIM_END));
    },
    [setT],
  );

  const days = useMemo(
    () =>
      Array.from({ length: DAYS }, (_, d) => {
        const start = d * MIN_PER_DAY;
        const end = Math.min(SIM_END, start + MIN_PER_DAY);
        const wd = weekday(start);
        return { d, start, end, weekend: wd >= 5 };
      }),
    [],
  );

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 60 : 15;
    if (e.key === 'ArrowRight') setT(t + step);
    else if (e.key === 'ArrowLeft') setT(t - step);
    else if (e.key === 'Home') setT(0);
    else if (e.key === 'End') setT(SIM_END);
    else return;
    e.preventDefault();
    setPlaying(false);
  };

  return (
    <div className="flex items-center gap-4 px-6 pb-3 pt-1">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={en.shell.timeline}
        aria-valuemin={0}
        aria-valuemax={SIM_END}
        aria-valuenow={Math.round(t)}
        aria-valuetext={formatClock(t)}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setPlaying(false);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) fromPointer(e.clientX);
        }}
        className="relative h-9 w-full cursor-pointer select-none"
      >
        {/* days */}
        <div className="absolute inset-x-0 top-3 h-3 overflow-hidden rounded-full bg-surface-2">
          {days.map(({ d, start, end, weekend }) => (
            <div key={d} className="absolute inset-y-0" style={{ left: pct(start), width: pct(end - start) }}>
              {weekend ? (
                <div className="absolute inset-0" style={{ background: 'var(--night)' }} />
              ) : (
                <>
                  <div className="absolute inset-y-0 left-0" style={{ width: `${(BUSINESS_START / MIN_PER_DAY) * 100}%`, background: 'linear-gradient(90deg, var(--night), transparent)' }} />
                  <div className="absolute inset-y-0" style={{ left: `${(BUSINESS_START / MIN_PER_DAY) * 100}%`, width: `${((LAST_CUTOFF - BUSINESS_START) / MIN_PER_DAY) * 100}%`, background: 'color-mix(in srgb, var(--new) 10%, transparent)' }} />
                  <div className="absolute inset-y-0 right-0" style={{ width: `${((MIN_PER_DAY - LAST_CUTOFF) / MIN_PER_DAY) * 100}%`, background: 'linear-gradient(90deg, transparent, var(--night))' }} />
                </>
              )}
              <div className="absolute inset-y-0 left-0 w-px bg-line-strong" />
            </div>
          ))}
          <div className="absolute inset-y-0 left-0 bg-new/25" style={{ width: pct(t) }} />
        </div>
        {/* day labels */}
        {days.map(({ d, start }) => (
          <span key={d} className="pointer-events-none absolute top-[22px] pl-1 text-[10.5px] text-muted" style={{ left: pct(start) }}>
            {formatDate(start)}
          </span>
        ))}
        {/* events */}
        {tl.events
          .filter((e) => e.kind !== 'auto')
          .map((e) => (
            <Tip key={e.id} content={<span><span className="text-muted">{formatClock(e.t)} · </span>{e.title}</span>}>
              <button
                type="button"
                tabIndex={-1}
                aria-label={e.title}
                onPointerDown={(ev) => ev.stopPropagation()}
                onClick={() => {
                  setPlaying(false);
                  setT(e.t);
                }}
                className={cn(
                  'absolute top-[9px] size-[9px] -translate-x-1/2 cursor-pointer rounded-full border-2 border-bg transition-transform hover:scale-150',
                  e.t <= t ? 'opacity-100' : 'opacity-55',
                  e.actor === 'rule' ? 'bg-new' : e.actor === 'marie' ? 'bg-fg' : 'bg-muted',
                  e.kind === 'user' && 'bg-amber',
                )}
                style={{ left: pct(e.t) }}
              />
            </Tip>
          ))}
        {/* handle */}
        <div className="pointer-events-none absolute top-0 h-[26px] w-0.5 -translate-x-1/2 rounded-full bg-new" style={{ left: pct(t) }} />
      </div>
    </div>
  );
}
