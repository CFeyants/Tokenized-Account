import { useState } from 'react';
import { Link2, Moon, Pause, Play, RotateCcw, SkipBack, SkipForward, Sun, Wrench, CalendarClock, Undo2 } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { dayPhase, formatClock, formatDate, minuteOfDay, toParam, type DayPhase } from '@/engine/clock';
import { Button } from '@/components/ui/button';
import { Tip } from '@/components/ui/tooltip';
import { Chip } from '@/components/ui/chip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MinuteRing } from '@/components/MinuteRing';
import { CounterStrip } from './CounterStrip';
import { WeekTimeline } from './WeekTimeline';
import { cn } from '@/lib/utils';

const PHASE_LABEL: Record<DayPhase, string> = {
  business: en.shell.business,
  evening: en.shell.evening,
  night: en.shell.night,
  weekend: en.shell.weekend,
};

export function PhaseChip({ phase }: { phase: DayPhase }) {
  return (
    <Tip content={en.shell.phaseTip}>
      <span tabIndex={0}>
        <Chip tone={phase === 'business' ? 'traditional' : 'new'} className="cursor-help">
          {phase === 'business' ? <Sun /> : <Moon />}
          {PHASE_LABEL[phase]}
        </Chip>
      </span>
    </Tip>
  );
}

function JumpDialog() {
  const { tl } = useSim();
  const setT = useApp((s) => s.setT);
  const setPlaying = useApp((s) => s.setPlaying);
  const [open, setOpen] = useState(false);
  const headline = tl.events.filter((e) => e.n !== undefined);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tip content={en.shell.jump}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={en.shell.jump}>
            <CalendarClock />
          </Button>
        </DialogTrigger>
      </Tip>
      <DialogContent title={en.shell.jumpTitle} description={en.shell.jumpDesc} className="w-[min(680px,92vw)]">
        <ol className="scrollbar-thin -mx-2 max-h-[60vh] space-y-0.5 overflow-y-auto">
          {headline.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setT(e.t);
                  setOpen(false);
                }}
                className="grid w-full cursor-pointer grid-cols-[28px_88px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2"
              >
                <span className="tabular text-[12px] text-muted">{e.n}</span>
                <span className="tabular text-[13px] text-muted">{formatClock(e.t)}</span>
                <span className="text-[13.5px]">{e.title}</span>
                <Chip tone={e.actor}>{en.actors[e.actor]}</Chip>
              </button>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

export function TopBar() {
  const { t } = useSim();
  const playing = useApp((s) => s.playing);
  const speed = useApp((s) => s.speed);
  const actions = useApp((s) => s.actions);
  const theme = useApp((s) => s.theme);
  const hoodOpen = useApp((s) => s.hoodOpen);
  const { togglePlay, step, stepBack, restart, setSpeed, setTheme, setHoodOpen, resetActions } = useApp.getState();
  const [copied, setCopied] = useState(false);
  const phase = dayPhase(t);
  const dark = phase !== 'business';

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('t', toParam(t));
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the URL bar already carries ?t= when paused */
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-sm">
      {/* night slowly darkens the header */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-[2000ms]"
        style={{ background: 'linear-gradient(180deg, var(--night), transparent)', opacity: dark ? 1 : 0 }}
      />
      <div className="relative flex h-[64px] items-center gap-5 px-6">
        <div className="flex items-center gap-3">
          <MinuteRing size={42} progress={(minuteOfDay(t) % 60) / 60}>
            <span className="size-1.5 rounded-full bg-new" />
          </MinuteRing>
          <div className="leading-tight">
            <div className="tabular font-serif text-[26px] leading-none" aria-live="off">
              {formatClock(t)} <span className="font-sans text-[12px] text-muted">{en.shell.cet}</span>
            </div>
            <div className="mt-1 text-[11.5px] text-muted">{formatDate(t)} 2026</div>
          </div>
          <PhaseChip phase={phase} />
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Clock controls">
          <Tip content={en.shell.restart}>
            <Button variant="ghost" size="icon" onClick={restart} aria-label={en.shell.restart}>
              <RotateCcw />
            </Button>
          </Tip>
          <Tip content={en.shell.stepBack}>
            <Button variant="ghost" size="icon" onClick={stepBack} aria-label={en.shell.stepBack}>
              <SkipBack />
            </Button>
          </Tip>
          <Button variant="primary" onClick={togglePlay} className="w-[112px]" aria-label={playing ? en.shell.pause : en.shell.play} data-testid="play">
            {playing ? <Pause /> : <Play />}
            {playing ? en.shell.pause : 'Play'}
          </Button>
          <Tip content={en.shell.step}>
            <Button variant="ghost" size="icon" onClick={step} aria-label={en.shell.step} data-testid="step">
              <SkipForward />
            </Button>
          </Tip>
          <div className="ml-1 flex rounded-full border border-line p-0.5" role="radiogroup" aria-label={en.shell.speed}>
            {([1, 3, 8] as const).map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={speed === s}
                onClick={() => setSpeed(s)}
                className={cn('h-7 cursor-pointer rounded-full px-2.5 text-[12px] tabular', speed === s ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')}
              >
                {s}×
              </button>
            ))}
          </div>
          <JumpDialog />
        </div>

        <div className="ml-auto flex items-center gap-1">
          {actions.length > 0 && (
            <Tip content={en.shell.userActions(actions.length)}>
              <Button variant="ghost" size="sm" onClick={resetActions} className="text-amber">
                <Undo2 />
                {en.shell.reset}
              </Button>
            </Tip>
          )}
          <Tip content={copied ? en.shell.copied : en.shell.share}>
            <Button variant="ghost" size="icon" onClick={share} aria-label={en.shell.share}>
              <Link2 />
            </Button>
          </Tip>
          <Button
            variant={hoodOpen ? 'new' : 'secondary'}
            size="sm"
            onClick={() => setHoodOpen(!hoodOpen)}
            aria-pressed={hoodOpen}
            data-testid="hood-toggle"
          >
            <Wrench />
            {en.shell.hood}
          </Button>
          <Tip content={en.shell.theme}>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={en.shell.theme}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </Tip>
        </div>
      </div>
      <div className="relative">
        <CounterStrip />
        <WeekTimeline />
      </div>
    </header>
  );
}
