import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { at, formatDateTime } from '@/engine/clock';
import { JIT_TARGET } from '@/engine/advanced';
import { fxFloor, type FloorBreakdown } from '@/engine/fx';
import { fmtEur, fmtM } from '@/engine/format';
import { Chip } from '@/components/ui/chip';
import { Row } from '@/components/Page';
import { cn } from '@/lib/utils';

const X = en.fxTab;

function OneOp({ when, f }: { when: number; f: FloorBreakdown }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-medium">
          EUR → {f.ccy} · {fmtM(f.amountEur, 'EUR', 0)}
        </span>
        <Chip
          tone={f.window.kind === 'day' ? 'neutral' : f.window.kind === 'thin' ? 'amber' : 'red'}
        >
          {X.windows[f.window.kind]}
        </Chip>
      </div>
      <div className="mt-1 text-[11.5px] text-muted">{formatDateTime(when)}</div>
      <div className="mt-3 text-[12px]">
        <Row k={X.position} v={f.long ? X.long : X.notLong} />
        <p className="-mt-1 mb-1 text-[11.5px] text-muted">{f.source}</p>
        <Row k={X.hedge} v={`${formatDateTime(f.hedgeAt)} (${f.hours.toFixed(1)} h)`} />
        <Row k={X.funding} v={`${f.fundingBps.toFixed(1)} bps`} />
        <Row k={X.gap} v={`${f.gapBps.toFixed(1)} bps`} />
        <Row k={X.capital} v={`${f.capitalBps.toFixed(1)} bps`} />
        <Row k={X.running} v={`${f.runningBps.toFixed(1)} bps`} />
        <Row
          k={<span className="text-fg">{X.floor}</span>}
          v={`${f.floorBps.toFixed(1)} bps`}
          className="border-t border-line"
        />
        <Row k={<span className="text-fg">{X.quote}</span>} v={`${f.quoteBps.toFixed(1)} bps`} />
        <Row
          k={<span className="text-fg">{X.margin}</span>}
          v={
            <span
              className={cn(f.marginBps < 0 ? 'text-red' : 'text-new')}
            >{`${f.marginBps.toFixed(1)} bps · ${fmtEur(f.marginEur, 'EUR', 0)}`}</span>
          }
        />
        {f.fallback && <p className="mt-1 text-[12px] text-red">{X.fallback}</p>}
      </div>
    </div>
  );
}

/** The bank's side of every night conversion: where the currency comes from and what it costs. */
export function FxTab() {
  const { t } = useSim();
  const actions = useApp((s) => s.actions);
  const ops = actions.filter((a) => a.kind === 'jit' && a.to !== 'tok-munich' && a.t <= t);
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-muted">{X.lead}</p>
      <div className="rounded-xl bg-new-soft px-4 py-3 text-[13px] font-medium">{X.rule}</div>
      {ops.length === 0 ? (
        <>
          <p className="text-[12.5px] text-muted">{X.example}</p>
          <OneOp when={at(7, '01:55')} f={fxFloor('JPY', 8e6, at(7, '01:55'))} />
        </>
      ) : (
        ops.map((a) =>
          a.kind === 'jit' ? (
            <OneOp key={a.id} when={a.t} f={fxFloor(JIT_TARGET[a.to].ccy, a.amountEur, a.t)} />
          ) : null,
        )
      )}
      <div className="rounded-xl border border-dashed border-line-strong p-4 text-[12.5px] leading-relaxed text-muted">
        <div className="mb-1 font-medium text-fg">{X.pvpTitle}</div>
        {X.pvp}
      </div>
    </div>
  );
}
