import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AccountSummary } from '@/components/AccountSummary';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { MIN_PER_DAY, at, formatClock, formatDate, hhmm, type SimTime } from '@/engine/clock';
import { fmtEur, fmtMinutes } from '@/engine/format';
import {
  EOD,
  collateralCase,
  conditionalCase,
  floatCase,
  timezoneCase,
  transitCase,
  waitingCase,
  type Window,
  type Zone,
} from '@/engine/minuteCases';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { PageHeader, Row } from '@/components/Page';
import { MinuteRing } from '@/components/MinuteRing';
import { cn } from '@/lib/utils';

const T = en.minute;
const C = T.cases;
const M = 1_000_000;

/** A time strip: the balance window in green (red if borrowed), end-of-day snapshots as ticks. */
function DayStrip({
  range,
  windows,
  zones = ['paris'],
}: {
  range: [SimTime, SimTime];
  windows: Window[];
  zones?: Zone[];
}) {
  const [a, b] = range;
  const pct = (x: number) => `${((Math.min(b, Math.max(a, x)) - a) / (b - a)) * 100}%`;
  const max = Math.max(...windows.map((w) => Math.abs(w.amount)));
  const ticks: { t: SimTime; zone: Zone }[] = [];
  for (const z of zones)
    for (let d = Math.floor(a / MIN_PER_DAY) - 1; d * MIN_PER_DAY <= b; d++) {
      const t = d * MIN_PER_DAY + EOD[z];
      if (t > a && t < b) ticks.push({ t, zone: z });
    }
  const covered = (t: number) => windows.some((w) => t - 1e-3 >= w.from && t - 1e-3 < w.to);
  const hours = (b - a) / 60;
  const step = hours > 48 ? 24 * 60 : hours > 20 ? 6 * 60 : 3 * 60;
  const labels: number[] = [];
  for (let t = Math.ceil(a / step) * step; t <= b; t += step) labels.push(t);
  return (
    <div className="mt-4">
      <div className="relative h-12 rounded-lg bg-surface-2">
        {windows.map((w, i) => (
          <div
            key={i}
            className={cn('absolute bottom-0', w.amount < 0 ? 'bg-red/50' : 'bg-new/45')}
            style={{
              left: pct(w.from),
              width: `calc(${pct(w.to)} - ${pct(w.from)})`,
              height: `${(Math.abs(w.amount) / max) * 100}%`,
            }}
          />
        ))}
        {ticks.map(({ t, zone }) => (
          <div key={`${zone}${t}`} className="absolute inset-y-0" style={{ left: pct(t) }}>
            <div className={cn('h-full w-0.5', covered(t) ? 'bg-fg' : 'bg-muted/60')} />
            <span
              className={cn(
                'absolute -top-5 -translate-x-1/2 whitespace-nowrap text-[10px]',
                covered(t) ? 'text-fg' : 'text-muted',
              )}
            >
              {zones.length > 1 ? C.zones.zoneNames[zone] : '23:59'}
            </span>
          </div>
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-muted">
        {labels.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 tabular" style={{ left: pct(t) }}>
            {step >= 24 * 60 ? formatDate(t) : hhmm(t)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Compare({
  days,
  daily,
  minutes,
  minute,
}: {
  days: number;
  daily: number;
  minutes: number;
  minute: number;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-4">
      <div className="rounded-xl bg-grey-soft p-4">
        <div className="text-[12px] text-muted">{T.byDay}</div>
        <div className="tabular mt-1 font-serif text-[26px] text-muted">{fmtEur(daily)}</div>
        <div className="text-[11.5px] text-muted">{T.days(days)}</div>
      </div>
      <div className="rounded-xl bg-new-soft p-4">
        <div className="flex items-center gap-2 text-[12px] text-new">
          <MinuteRing size={14} progress={1} />
          {T.byMinute}
        </div>
        <div className="tabular mt-1 font-serif text-[26px] text-new">{fmtEur(minute)}</div>
        <div className="text-[11.5px] text-muted">{T.minutes(fmtMinutes(minutes))}</div>
      </div>
    </div>
  );
}

function CaseCard({
  n,
  title,
  what,
  who,
  verdict,
  live,
  jumpTo,
  children,
  className,
  day,
  minute,
}: {
  n: number;
  title: string;
  what: string;
  who: string;
  verdict: string;
  live: boolean;
  jumpTo?: SimTime;
  children: React.ReactNode;
  className?: string;
  day: number;
  minute: number;
}) {
  const setT = useApp((s) => s.setT);
  const setPlaying = useApp((s) => s.setPlaying);
  const [open, setOpen] = useState(false);
  return (
    <Card tone={live ? 'new' : 'default'} className={cn('flex flex-col py-5', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="grid cursor-pointer grid-cols-[36px_1fr_150px_150px_110px_20px] items-center gap-4 text-left"
      >
        <span className="tabular font-serif text-[26px] leading-none text-muted">{n}</span>
        <span>
          <span className="block text-[17px] font-medium leading-tight">{title}</span>
          <span className="mt-0.5 block text-[12.5px] text-muted">{who}</span>
        </span>
        <span className="text-right">
          <span className="block text-[11px] text-muted">{T.byDay}</span>
          <span className="tabular text-[15px] text-muted">{fmtEur(day)}</span>
        </span>
        <span className="text-right">
          <span className="block text-[11px] text-new">{T.byMinute}</span>
          <span className="tabular text-[15px] text-new">{fmtEur(minute)}</span>
        </span>
        <Chip tone={live ? 'new' : 'outside'} className="justify-self-end">
          {live ? T.live : T.illustrative}
        </Chip>
        <ChevronDown
          className={cn('size-4 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <>
          <p className="mt-3 text-[13.5px] leading-relaxed">{what}</p>
          <div className="flex-1">{children}</div>
          <p className="mt-5 border-t border-line pt-4 text-[12.5px] leading-relaxed text-muted">
            <span className="font-medium text-fg">{T.verdict}. </span>
            {verdict}
          </p>
          {jumpTo !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 mt-2 self-start"
              onClick={() => {
                setPlaying(false);
                setT(jumpTo);
              }}
            >
              {T.jump} · {formatClock(jumpTo)} <ArrowRight />
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

export function Minute() {
  const { t, tl } = useSim();
  const [peak, setPeak] = useState(60);
  const [transit, setTransit] = useState(25);
  const [dep, setDep] = useState(150);
  const [residual, setResidual] = useState(800);
  const [late, setLate] = useState(false);

  const f = floatCase(peak * M);
  const col = collateralCase(tl, t);
  const w = waitingCase(tl, t);
  const tr = transitCase(transit * M, at(7, '07:00') + dep, residual * 1000);
  const cd = conditionalCase(tl, t, true);
  const zones = timezoneCase();

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={T.eyebrow} title={T.title} lead={T.lead} />
      <AccountSummary />
      <div className="card flex gap-3 px-5 py-4 text-[13.5px] leading-relaxed" role="note">
        <MinuteRing size={22} progress={0.25} />
        {T.honest}
      </div>

      <h2 className="text-[24px]">{T.title}</h2>
      <div className="space-y-3">
        <CaseCard n={1} {...C.float} live={false} day={0} minute={f.minuteInterest}>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-[12.5px]">
              <span className="text-muted">{C.float.peak}</span>
              <span className="tabular">{peak}</span>
            </div>
            <Slider
              aria-label={C.float.peak}
              min={10}
              max={200}
              step={10}
              value={[peak]}
              onValueChange={([v]) => setPeak(v)}
            />
          </div>
          <DayStrip range={f.range} windows={f.windows} />
          <Compare days={0} daily={0} minutes={f.minutes} minute={f.minuteInterest} />
          <p className="mt-2 text-right text-[12px] text-muted">
            {C.float.perYear(fmtEur(f.perYear, 'EUR', 0))}
          </p>
        </CaseCard>

        <CaseCard
          n={2}
          {...C.collateral}
          live
          jumpTo={at(6, '19:00')}
          day={0}
          minute={col.minuteInterest}
        >
          <DayStrip range={col.range} windows={col.windows} />
          <Compare
            days={col.daysCounted}
            daily={0}
            minutes={col.minutes}
            minute={col.minuteInterest}
          />
          <div className="mt-3">
            <Row k={C.collateral.onAccount} v={fmtEur(col.onAccount)} />
            <Row k={C.collateral.inUnit} v={fmtEur(col.inUnit)} />
            <Row k={C.collateral.gage} v={fmtEur(0)} />
          </div>
        </CaseCard>

        <CaseCard
          n={3}
          {...C.waiting}
          live
          jumpTo={at(2, '10:59')}
          day={w.dailyInterest}
          minute={w.minuteInterest}
        >
          <DayStrip
            range={[at(2, '00:00'), at(3, '00:00')]}
            windows={[
              { from: at(2, '07:00'), to: at(2, '11:00'), amount: 41.5 * M },
              { from: at(2, '11:00'), to: at(2, '18:30'), amount: 26.5 * M },
            ]}
          />
          <Compare
            days={w.daysCounted}
            daily={w.dailyInterest}
            minutes={w.minutes}
            minute={w.minuteInterest}
          />
          <div className="mt-3">
            {w.examples.map((e) => (
              <Row key={e.label} k={e.label} v={fmtEur((e.amount * 0.001 * e.minutes) / 518_400)} />
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-line p-3.5 text-[12.5px]">
            <div className="font-medium">{C.waiting.debitTitle}</div>
            <div className="mt-1 text-new">
              {C.waiting.debitMinute(fmtMinutes(w.debit.minutes), fmtEur(w.debit.toMinute))}
            </div>
            <div className="text-muted">{C.waiting.debitDay(fmtEur(w.debit.byDay))}</div>
          </div>
        </CaseCard>

        <CaseCard
          n={4}
          {...C.transit}
          live={false}
          day={tr.dailyInterest}
          minute={tr.minuteInterest}
        >
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <div className="mb-2 flex justify-between text-[12px]">
                <span className="text-muted">{C.transit.amount}</span>
                <span className="tabular">{transit}</span>
              </div>
              <Slider
                aria-label={C.transit.amount}
                min={5}
                max={100}
                step={5}
                value={[transit]}
                onValueChange={([v]) => setTransit(v)}
              />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-[12px]">
                <span className="text-muted">{C.transit.departure}</span>
                <span className="tabular">{hhmm(at(7, '07:00') + dep)}</span>
              </div>
              <Slider
                aria-label={C.transit.departure}
                min={30}
                max={240}
                step={15}
                value={[dep]}
                onValueChange={([v]) => setDep(v)}
              />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-[12px]">
                <span className="text-muted">{C.transit.residual}</span>
                <span className="tabular">{residual}</span>
              </div>
              <Slider
                aria-label={C.transit.residual}
                min={0}
                max={990}
                step={10}
                value={[residual]}
                onValueChange={([v]) => setResidual(v)}
              />
            </div>
          </div>
          <DayStrip range={tr.range} windows={tr.windows} />
          <Compare
            days={tr.daysCounted}
            daily={tr.dailyInterest}
            minutes={tr.minutes + tr.nightMinutes}
            minute={tr.minuteInterest}
          />
          <div className="mt-3">
            <Row k={C.transit.transitLine} v={fmtEur(tr.transit)} />
            <Row k={C.transit.residualLine} v={fmtEur(tr.residualInterest)} />
          </div>
        </CaseCard>

        <CaseCard
          n={5}
          {...C.conditional}
          live
          jumpTo={at(7, '16:44')}
          day={0}
          minute={cd.minuteInterest}
        >
          <DayStrip range={cd.range} windows={cd.windows} />
          <Compare days={0} daily={0} minutes={cd.minutes} minute={cd.minuteInterest} />
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 text-[12.5px]">
            <span className="text-muted">{C.conditional.ifLate}</span>
            <Switch checked={late} onCheckedChange={setLate} aria-label={C.conditional.ifLate} />
          </label>
          {late && cd.ifLate && (
            <p className="mt-2 rounded-xl bg-new-soft p-3 text-[12.5px]">
              {C.conditional.ifLateLine(fmtEur(cd.ifLate.interest), fmtEur(cd.ifLate.dailyAt050))}
            </p>
          )}
        </CaseCard>

        <CaseCard
          n={6}
          {...C.zones}
          live
          jumpTo={at(5, '22:00')}
          day={zones[0].byZone.paris.interest}
          minute={zones[0].minuteInterest}
        >
          <DayStrip
            range={[at(5, '12:00'), at(6, '12:00')]}
            windows={[{ from: at(5, '22:00'), to: at(6, '02:00'), amount: 10 * M }]}
            zones={['paris', 'singapore', 'newYork']}
          />
          <table className="mt-4 w-full text-[13px]">
            <thead>
              <tr className="text-left text-muted">
                {C.zones.cols.map((c, i) => (
                  <th key={c} className={cn('pb-1.5 font-normal', i > 0 && 'text-right')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {zones.map((r) => (
                <tr key={r.label} className="border-t border-line align-top">
                  <td className="py-2 pr-2">{r.label}</td>
                  {(['paris', 'singapore', 'newYork'] as Zone[]).map((z) => (
                    <td
                      key={z}
                      className={cn('py-2 text-right', r.byZone[z].days ? 'text-fg' : 'text-muted')}
                    >
                      {T.daysShort(r.byZone[z].days)}
                      <div className="text-[11px] text-muted">{fmtEur(r.byZone[z].interest)}</div>
                    </td>
                  ))}
                  <td className="py-2 text-right text-new">
                    {fmtMinutes(r.to - r.from)}
                    <div className="text-[11px]">{fmtEur(r.minuteInterest)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CaseCard>
      </div>
    </div>
  );
}
