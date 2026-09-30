import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { fmtEur, fmtM } from '@/engine/format';
import { weekMetrics, type WeekMetrics } from '@/engine/weekMetrics';
import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TOURS } from './tour';
import { useTour } from './useTour';

const T = en.tour;

/** During the tour: the week so far only. Each figure flashes when the step moves it. */
export function TourValueBanner() {
  const { t, tl } = useSim();
  const actions = useApp((s) => s.actions);
  const { kind, index } = useTour();
  const prevT = index > 0 ? TOURS[kind][index - 1].t : 0;
  const now = weekMetrics(tl, t, actions);
  const before = weekMetrics(tl, prevT, actions);
  const cols: { key: keyof WeekMetrics; label: string; v: string; tip: string }[] = [
    {
      key: 'interestGain',
      label: T.interest,
      v: fmtEur(now.interestGain, 'EUR', 0),
      tip: en.tour.recapSources[0],
    },
    {
      key: 'buffersReleased',
      label: T.buffers,
      v: fmtM(now.buffersReleased, 'EUR', 0),
      tip: en.tour.recapSources[1],
    },
    {
      key: 'failuresAvoided',
      label: T.failures,
      v: String(now.failuresAvoided),
      tip: en.tour.recapSources[2],
    },
    {
      key: 'bankTotal',
      label: T.bankMargin,
      v: fmtEur(now.bankTotal, 'EUR', 0),
      tip: en.tour.recapSources[3],
    },
  ];
  return (
    <div
      className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] items-center gap-2 px-6 pb-2"
      aria-live="polite"
    >
      <span className="eyebrow pr-3">{T.weekTitle}</span>
      {cols.map((c) => {
        const moved = Math.abs((now[c.key] as number) - (before[c.key] as number)) > 0.5;
        return (
          <Tip key={c.key} content={c.tip} side="bottom">
            <div
              key={`${c.key}-${index}`}
              tabIndex={0}
              className={cn(
                'cursor-help rounded-xl px-3 py-1.5',
                moved && 'pulse-once bg-new-soft',
              )}
            >
              <div className="text-[11px] text-muted">{c.label}</div>
              <div
                className={cn(
                  'tabular text-[17px] font-medium',
                  c.key === 'bankTotal' && now.bankTotal < 0 ? 'text-red' : 'text-new',
                )}
              >
                {c.v}
              </div>
            </div>
          </Tip>
        );
      })}
    </div>
  );
}
