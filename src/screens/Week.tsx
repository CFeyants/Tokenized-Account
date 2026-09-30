import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  FileText,
  Layers,
  Moon,
  Pause,
  Play,
  Repeat,
  Send,
} from 'lucide-react';
import { useApp, useCounters, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { fmtEur, fmtHours } from '@/engine/format';
import { dayPhase, isFriday } from '@/engine/clock';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tip } from '@/components/ui/tooltip';
import { DrawerBar } from '@/components/DrawerBar';
import { EventFeed } from '@/components/EventFeed';
import { LayerTag } from '@/components/Page';
import { MinuteRing } from '@/components/MinuteRing';
import { Animated } from '@/components/Animated';

const H = en.home;
const C = en.counters;

function Hero() {
  const playing = useApp((s) => s.playing);
  const togglePlay = useApp((s) => s.togglePlay);
  const c = useCounters();
  const max = Math.max(c.newTotal, c.tradTotal, 1);
  return (
    <section className="grid grid-cols-12 gap-6">
      <div className="col-span-12 flex flex-col justify-between xl:col-span-5">
        <div>
          <div className="eyebrow mb-3">{H.hello}</div>
          <h1 className="text-[52px] leading-[1.02] tracking-tight">{H.tagline}</h1>
          <p className="mt-5 max-w-[460px] text-[15.5px] leading-relaxed text-muted">{H.intro}</p>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <Button variant="primary" size="lg" onClick={togglePlay}>
            {playing ? <Pause /> : <Play />}
            {playing ? en.shell.pause : en.shell.play}
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link to="/about">
              {en.nav.about} <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <Card className="col-span-12 xl:col-span-7">
        <CardHeader eyebrow={H.compareTitle} title={H.weekTitle} />
        <div className="grid grid-cols-2 gap-8">
          <Tip
            content={
              <>
                {C.newFormula}
                <br />
                <span className="text-muted">{C.actual360}</span>
              </>
            }
          >
            <div tabIndex={0} className="cursor-help">
              <div className="flex items-center gap-2 text-[13px] text-new">
                <MinuteRing size={18} progress={(c.newTotal % 1000) / 1000} />
                {H.newLabel}
              </div>
              <div className="mt-2 font-serif text-[48px] leading-none text-new" aria-live="polite">
                <Animated value={c.newTotal} format={(v) => fmtEur(v, 'EUR', 0)} />
              </div>
              <div className="mt-4 h-2 rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-new transition-[width] duration-300"
                  style={{ width: `${(c.newTotal / max) * 100}%` }}
                />
              </div>
            </div>
          </Tip>
          <Tip content={C.tradFormula}>
            <div tabIndex={0} className="cursor-help">
              <div className="text-[13px] text-muted">{H.tradLabel}</div>
              <div
                className="mt-2 font-serif text-[48px] leading-none text-muted"
                aria-live="polite"
              >
                <Animated value={c.tradTotal} format={(v) => fmtEur(v, 'EUR', 0)} />
              </div>
              <div className="mt-4 h-2 rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-grey transition-[width] duration-300"
                  style={{ width: `${(Math.max(0, c.tradTotal) / max) * 100}%` }}
                />
              </div>
            </div>
          </Tip>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-6 border-t border-line pt-5">
          <Tip content={C.hoursTip}>
            <div tabIndex={0} className="cursor-help">
              <div className="text-[12px] text-muted">{C.hoursTitle}</div>
              <div className="tabular mt-1 text-[20px]">
                <span className="text-new">{fmtHours(c.earningMinutesNew)}</span>
                <span className="text-[13px] text-muted">
                  {C.hoursOf(fmtHours(c.idleMinutesTrad))}
                </span>
              </div>
            </div>
          </Tip>
          <Tip content={C.sweptTip}>
            <div tabIndex={0} className="cursor-help">
              <div className="text-[12px] text-muted">{C.sweptTitle}</div>
              <div className="tabular mt-1 text-[20px]">EUR {Math.round(c.sweptIn / 1e6)}m</div>
            </div>
          </Tip>
          <Tip content={C.jitTip}>
            <div tabIndex={0} className="cursor-help">
              <div className="text-[12px] text-muted">{C.jitTitle}</div>
              <div className="tabular mt-1 text-[20px]">
                {Math.round(c.jitMinutes)} min{' '}
                <span className="text-[13px] text-muted">· {fmtEur(c.jitCost, 'EUR', 0)}</span>
              </div>
            </div>
          </Tip>
        </div>
      </Card>
    </section>
  );
}

function RulesTonight() {
  const { t } = useSim();
  const phase = dayPhase(t);
  const rows = [
    { icon: Layers, text: H.ruleSweep },
    { icon: Moon, text: H.ruleOvernight, tip: en.tips.lateCash },
    { icon: Repeat, text: H.nightSweep },
    { icon: ArrowUpRight, text: H.ruleReturn },
    { icon: Send, text: H.ruleFx },
  ];
  return (
    <Card tone="new" className="h-full">
      <CardHeader
        eyebrow={
          phase === 'business' ? (isFriday(t) ? H.rulesFriday : H.rulesFrom) : H.rulesRunning
        }
        title={H.rulesTonight}
        aside={<LayerTag layer="new" />}
      />
      <ul className="space-y-3">
        {rows.map(({ icon: Icon, text, tip }) => {
          const li = (
            <li
              key={text}
              className="flex items-start gap-3 text-[13.5px] leading-snug"
              tabIndex={tip ? 0 : undefined}
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-new" aria-hidden />
              {text}
            </li>
          );
          return tip ? (
            <Tip key={text} content={tip}>
              {li}
            </Tip>
          ) : (
            li
          );
        })}
      </ul>
      <Button asChild variant="ghost" size="sm" className="mt-5 -ml-3">
        <Link to="/rules">
          {H.open} {en.nav.rules} <ArrowRight />
        </Link>
      </Button>
    </Card>
  );
}

function TraditionalRow() {
  const tools = [
    { to: '/payments', icon: Send, ...en.tradTools.payments },
    { to: '/accounts', icon: Layers, ...en.tradTools.pooling },
    { to: '/statements', icon: FileText, ...en.tradTools.statements },
    { to: '/rules', icon: CalendarRange, ...en.tradTools.forecast },
  ];
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[24px]">{H.trad}</h2>
        <span className="text-[13px] text-muted">{H.tradSub}</span>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {tools.map(({ to, icon: Icon, title, sub }) => (
          <Link
            key={title}
            to={to}
            className="card group flex items-start gap-4 p-5 transition-colors hover:border-line-strong"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-grey-soft text-muted">
              <Icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium">{title}</span>
              <span className="mt-0.5 block text-[12.5px] text-muted">{sub}</span>
              <span className="mt-2 block">
                <LayerTag layer="traditional" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Week() {
  return (
    <div className="space-y-8">
      <Hero />
      <Card>
        <CardHeader eyebrow={H.drawerEyebrow} title={en.drawers.title} />
        <DrawerBar />
      </Card>
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader title={H.feed} eyebrow={H.feedEyebrow} />
          <EventFeed />
        </Card>
        <div className="col-span-12 lg:col-span-4">
          <RulesTonight />
        </div>
      </div>
      <TraditionalRow />
    </div>
  );
}
