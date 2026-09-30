import { CircleDashed, Link2 } from 'lucide-react';
import { en } from '@/i18n/en';
import { HORIZONS, type Horizon } from '@/data/horizons';
import { Chip } from '@/components/ui/chip';
import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type JourneyId = (typeof en.journeys.list)[number]['id'];

export const journey = (id: JourneyId) => {
  const i = en.journeys.list.findIndex((j) => j.id === id);
  return { ...en.journeys.list[i], n: i + 1 };
};

const HZ = en.horizon;

/** When it can exist (H1 2027 / H2 2028 / H3 2029+ / today) and what it depends on. */
export function HorizonTag({ id, className }: { id: string; className?: string }) {
  const h = HORIZONS[id];
  if (!h) return null;
  const tone = h.horizon === 'today' ? 'traditional' : h.horizon === 'H3' ? 'notYet' : 'new';
  return (
    <Tip
      content={
        <>
          {HZ.dependsOn}: {h.dependencies.join(' · ')}
        </>
      }
    >
      <span tabIndex={0} className={cn('inline-flex cursor-help', className)}>
        <Chip tone={tone}>
          <Link2 />
          {HZ.labels[h.horizon as Horizon]}
        </Chip>
      </span>
    </Tip>
  );
}

/** The top of every journey: its number, one-sentence promise, horizon, and three steps. */
export function JourneyHeader({ id, aside }: { id: JourneyId; aside?: React.ReactNode }) {
  const j = journey(id);
  const h = HORIZONS[id];
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-6">
        <div className="max-w-[820px]">
          <div className="eyebrow mb-2">
            {en.journeys.section} · {j.n} / {en.journeys.list.length}
          </div>
          <h1 className="text-[38px] leading-[1.1]">{j.title}</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">{j.promise}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <HorizonTag id={id} />
          {h && (
            <span className="max-w-[280px] text-right text-[11.5px] text-muted">
              {h.dependencies.join(' · ')}
            </span>
          )}
          {aside}
        </div>
      </div>
      <ol className="mt-6 grid grid-cols-3 gap-3">
        {j.steps.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-new-soft text-[13px] font-medium text-new">
              {i + 1}
            </span>
            <span className="text-[13.5px]">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Interbank use cases: shown to explain, not available at launch. */
export function LaterTag({ className }: { className?: string }) {
  return (
    <Tip content={en.journeys.laterTip}>
      <span tabIndex={0} className={cn('inline-flex', className)}>
        <Chip tone="notYet" className="cursor-help">
          <CircleDashed />
          {en.journeys.later}
        </Chip>
      </span>
    </Tip>
  );
}
