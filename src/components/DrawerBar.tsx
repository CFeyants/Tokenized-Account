import { motion } from 'framer-motion';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { drawers, groupAtBank } from '@/engine/selectors';
import { fmtM, numM } from '@/engine/format';
import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const D = en.drawers;

type Seg = { key: string; label: string; value: number; cls: string; swatch: string; tip?: string };

/** Group cash by drawer, one horizontal stacked bar that moves with the clock. */
export function DrawerBar() {
  const { state } = useSim();
  const d = drawers(state);
  const segs: Seg[] = [
    { key: 'current', label: D.current, value: d.current, cls: 'bg-grey', swatch: 'bg-grey' },
    { key: 'tokFree', label: D.tokFree, value: Math.max(0, d.tokFree + d.tokOtherCcyEur), cls: 'bg-new', swatch: 'bg-new', tip: en.tips.tokRate },
    { key: 'tokBlocked', label: D.tokBlocked, value: d.tokBlocked, cls: 'hatch border border-new/60', swatch: 'hatch border border-new/60', tip: en.tips.blockedEarns },
    { key: 'units', label: D.units, value: d.termUnits + d.usdUnitsEur, cls: 'bg-amber-fill', swatch: 'bg-amber-fill', tip: en.tips.lateCash },
    { key: 'fund', label: D.fund, value: d.fund, cls: 'border-2 border-amber-fill bg-amber-soft', swatch: 'border-2 border-amber-fill' },
    { key: 'other', label: D.other, value: d.otherBanks, cls: 'border border-dashed border-line-strong bg-transparent', swatch: 'border border-dashed border-muted' },
  ];
  const total = segs.reduce((a, s) => a + s.value, 0) + d.pendingEur;
  const atBank = groupAtBank(d) + d.usdUnitsEur + d.tokOtherCcyEur;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-6">
        <div className="flex items-baseline gap-3">
          <span className="tabular font-serif text-[44px] leading-none">{numM(total, 1)}</span>
          <span className="text-[13px] text-muted">EUR m · {D.total}</span>
        </div>
        <div className="text-[13px] text-muted">
          <span className="tabular text-fg">{fmtM(atBank)}</span> {D.atBank}
          {d.pendingEur > 0 && (
            <Tip content={en.tips.pendingCover}>
              <span tabIndex={0} className="ml-3 inline-flex cursor-help items-center gap-1.5 rounded-full border border-dashed border-amber/60 px-2 py-0.5 text-[12px] text-amber">
                {en.home.pendingUsd(fmtM(state.pending.filter((p) => p.status === 'pendingCover').reduce((a, p) => a + p.amount, 0), 'USD'))}
              </span>
            </Tip>
          )}
        </div>
      </div>
      <div className="flex h-14 w-full gap-[3px]" role="img" aria-label={segs.map((s) => `${s.label} ${fmtM(s.value)}`).join(', ')}>
        {segs.map((s) =>
          s.value > 0 ? (
            <motion.div
              key={s.key}
              className={cn('h-full min-w-[3px] rounded-[6px]', s.cls)}
              initial={false}
              animate={{ flexGrow: s.value }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              style={{ flexBasis: 0 }}
            />
          ) : null,
        )}
        {d.pendingEur > 0 && (
          <motion.div className="h-full rounded-[6px] border border-dashed border-amber/60" animate={{ flexGrow: d.pendingEur }} style={{ flexBasis: 0 }} />
        )}
      </div>
      <div className="mt-4 grid grid-cols-6 gap-4">
        {segs.map((s) => {
          const item = (
            <div key={s.key} className="min-w-0" tabIndex={s.tip ? 0 : undefined}>
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <span className={cn('size-2.5 shrink-0 rounded-[3px]', s.swatch)} />
                <span className="truncate">{s.label}</span>
              </div>
              <div className={cn('tabular mt-1 text-[18px]', s.key === 'tokFree' && d.tokFree < 0 && 'text-red')}>
                {s.key === 'tokFree' ? numM(d.tokFree + d.tokOtherCcyEur, 1) : numM(s.value, 1)}
                <span className="ml-1 text-[11px] text-muted">m</span>
              </div>
            </div>
          );
          return s.tip ? (
            <Tip key={s.key} content={s.tip}>
              {item}
            </Tip>
          ) : (
            item
          );
        })}
      </div>
    </div>
  );
}
