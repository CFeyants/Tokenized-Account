import { CircleDashed } from 'lucide-react';
import { en } from '@/i18n/en';
import { Chip } from '@/components/ui/chip';
import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type JourneyId = (typeof en.journeys.list)[number]['id'];

export const journey = (id: JourneyId) => {
  const i = en.journeys.list.findIndex((j) => j.id === id);
  return { ...en.journeys.list[i], n: i + 1 };
};

/** The top of every journey: its number, one-sentence promise, and three steps. */
export function JourneyHeader({ id, aside }: { id: JourneyId; aside?: React.ReactNode }) {
  const j = journey(id);
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
        {aside}
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
