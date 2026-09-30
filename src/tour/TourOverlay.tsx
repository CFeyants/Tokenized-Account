import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { useGov } from '@/app/governance';
import { en } from '@/i18n/en';
import { formatClock, toParam } from '@/engine/clock';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TOURS } from './tour';
import { useTour } from './useTour';

const T = en.tour;

/** Finds the step's target on the page and keeps its rectangle up to date. */
function useSpotlight(target: string | undefined, key: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    setRect(null);
    if (!target) return;
    let el: Element | null = null;
    let tries = 0;
    let scrolled = false;
    const id = window.setInterval(() => {
      el =
        el && document.body.contains(el) ? el : document.querySelector(`[data-tour="${target}"]`);
      if (!el) {
        if (++tries > 40) setRect(null);
        return;
      }
      if (!scrolled) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        scrolled = true;
      }
      setRect(el.getBoundingClientRect());
    }, 120);
    return () => window.clearInterval(id);
  }, [target, key]);
  return rect;
}

export function TourOverlay() {
  const { active, kind, index, next, prev, restart, exit, go } = useTour();
  const steps = TOURS[kind];
  const step = steps[index];
  const navigate = useNavigate();
  const location = useLocation();
  const { t, tl, state } = useSim();
  const actions = useApp((s) => s.actions);
  const rect = useSpotlight(
    active ? step.target : undefined,
    `${kind}-${index}-${location.pathname}`,
  );

  // Entering a step: move the clock, go to the page, run the step's side effects.
  useEffect(() => {
    if (!active) return;
    const app = useApp.getState();
    app.setPlaying(false);
    app.setT(step.t);
    navigate(`${step.path}${step.path.includes('?') ? '&' : '?'}t=${toParam(step.t)}`);
    if (step.enter?.approve) useGov.getState().approve(step.enter.approve);
    if (step.enter?.hood) app.openHood(step.enter.hood);
    else app.setHoodOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, kind, index]);

  const ctx = { tl, t, state, actions };
  const prevT = index > 0 ? steps[index - 1].t : 0;
  const log = useMemo(
    () => tl.events.filter((e) => e.t > prevT && e.t <= step.t && e.kind !== 'auto').slice(-5),
    [tl, prevT, step.t],
  );
  if (!active) return null;
  const onPage = location.pathname === step.path.split('?')[0];
  const last = index === steps.length - 1;

  return (
    <>
      {rect && onPage && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[45] rounded-2xl border-2 border-new transition-all duration-300"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(8, 12, 10, 0.55)',
          }}
        />
      )}
      <aside
        role="dialog"
        aria-label={step.title}
        data-testid="tour-panel"
        className="card fixed bottom-5 left-[260px] z-[70] w-[min(480px,calc(100vw-300px))] border-new/40 p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">
            {T.step(index + 1, steps.length)} · {formatClock(step.t)}
          </span>
          <button
            type="button"
            onClick={exit}
            aria-label={T.exit}
            className="cursor-pointer rounded-full p-1 text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex gap-1" role="list" aria-label={T.step(index + 1, steps.length)}>
          {steps.map((s, i) => (
            <Tip key={s.id + i} content={`${s.label} — ${s.title}`}>
              <button
                type="button"
                role="listitem"
                aria-label={s.title}
                onClick={() => go(i)}
                className={cn(
                  'h-1.5 flex-1 cursor-pointer rounded-full',
                  i < index ? 'bg-new/60' : i === index ? 'bg-new' : 'bg-surface-2',
                )}
              />
            </Tip>
          ))}
        </div>
        <h2 className="mt-3 text-[20px] leading-tight">{step.title}</h2>
        <dl className="mt-3 space-y-2.5 text-[13px] leading-relaxed">
          <div>
            <dt className="text-[11.5px] text-muted">{T.what}</dt>
            <dd>{step.what}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-new-soft px-3 py-2">
              <dt className="text-[11.5px] text-new">{T.marie}</dt>
              <dd className="font-medium">{step.marie(ctx)}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <dt className="text-[11.5px] text-muted">{T.bank}</dt>
              <dd className="font-medium">{step.bank(ctx)}</dd>
            </div>
          </div>
          <div>
            <dt className="text-[11.5px] text-muted">{T.today}</dt>
            <dd className="text-muted">{step.today}</dd>
          </div>
        </dl>
        <details className="mt-3 text-[12px]">
          <summary className="cursor-pointer text-muted">
            {T.log} ({log.length})
          </summary>
          {log.length === 0 ? (
            <p className="mt-1 text-muted">{T.noLog}</p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {log.map((e) => (
                <li key={e.id} className="flex gap-2">
                  <span className="tabular shrink-0 text-muted">{formatClock(e.t)}</span>
                  <span>{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
        {!onPage && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-soft px-3 py-2 text-[12px] text-amber">
            {T.notOnPage}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                navigate(`${step.path}${step.path.includes('?') ? '&' : '?'}t=${toParam(step.t)}`)
              }
            >
              {T.goThere}
            </Button>
          </div>
        )}
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={restart}>
            <RotateCcw /> {T.restart}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={prev}
            disabled={index === 0}
            className="ml-auto"
          >
            <ChevronLeft /> {T.prev}
          </Button>
          {last ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                exit();
                navigate('/business-case');
              }}
              data-testid="tour-finish"
            >
              {T.finish} <ChevronRight />
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={next} data-testid="tour-next">
              {T.next} <ChevronRight />
            </Button>
          )}
        </div>
        <Chip tone="outside" className="mt-3">
          {en.value.illustrative}
        </Chip>
      </aside>
    </>
  );
}
