import { useCounters } from '@/app/store';
import { en } from '@/i18n/en';
import { fmtEur, fmtHours, fmtM, fmtMinutes, numM } from '@/engine/format';
import { Animated } from '@/components/Animated';
import { Tip } from '@/components/ui/tooltip';
import { MinuteRing } from '@/components/MinuteRing';
import { cn } from '@/lib/utils';

const C = en.counters;
const eur0 = (v: number) => fmtEur(v, 'EUR', 0);

function Item({
  label,
  tip,
  children,
  sub,
  className,
}: {
  label: string;
  tip: React.ReactNode;
  children: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <Tip content={tip} side="bottom">
      <div
        tabIndex={0}
        className={cn(
          'min-w-0 cursor-help rounded-xl px-3 py-1.5 outline-none hover:bg-surface-2 focus-visible:bg-surface-2',
          className,
        )}
      >
        <div className="truncate text-[11px] text-muted">{label}</div>
        <div className="truncate text-[15px] font-medium leading-6">{children}</div>
        {sub && <div className="truncate text-[11px] text-muted">{sub}</div>}
      </div>
    </Tip>
  );
}

/** The five weekly counters (§3.2), always visible. */
export function CounterStrip() {
  const c = useCounters();
  const diff = c.newTotal - c.tradTotal;
  return (
    <div
      className="grid grid-cols-[1.15fr_1.15fr_0.9fr_1fr_1fr_1fr] items-center gap-1 px-4 pb-1"
      aria-live="polite"
      aria-atomic="false"
    >
      <Item
        label={C.newShort}
        tip={
          <>
            <b className="font-medium">{C.newTitle}</b>
            <br />
            {C.newFormula}
            <br />
            <span className="text-muted">{C.actual360}</span>
          </>
        }
      >
        <span className="flex items-center gap-2 text-new">
          <MinuteRing size={16} progress={(c.newTotal % 1000) / 1000} />
          <Animated value={c.newTotal} format={eur0} />
        </span>
      </Item>
      <Item
        label={C.tradShort}
        tip={
          <>
            <b className="font-medium">{C.tradTitle}</b>
            <br />
            {C.tradFormula}
          </>
        }
      >
        <Animated value={c.tradTotal} format={eur0} className="text-muted" />
      </Item>
      <Item label={C.diff} tip={C.diffTip}>
        <Animated
          value={diff}
          format={(v) => (v >= 0 ? '+' : '') + eur0(v)}
          className={diff >= 0 ? 'text-new' : 'text-red'}
        />
      </Item>
      <Item label={C.hoursTitle} tip={C.hoursTip}>
        <span className="tabular">
          <span className="text-new">{fmtHours(c.earningMinutesNew)}</span>
          <span className="text-[12px] text-muted">{C.hoursOf(fmtHours(c.idleMinutesTrad))}</span>
        </span>
      </Item>
      <Item label={C.sweptTitle} tip={C.sweptTip}>
        <span className="tabular">
          {fmtM(c.sweptIn, 'EUR', 0)}{' '}
          <span className="text-[12px] text-muted">{C.held(numM(c.heldFromOtherBanks, 0))}</span>
        </span>
      </Item>
      <Item label={C.jitTitle} tip={C.jitTip}>
        <span className="tabular">
          {fmtMinutes(c.jitMinutes)}{' '}
          <span className="text-[12px] text-muted">· {fmtEur(c.jitCost, 'EUR', 0)}</span>
        </span>
      </Item>
    </div>
  );
}
