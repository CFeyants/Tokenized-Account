import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { en } from '@/i18n/en';
import { MIN_PER_DAY, dayIndex, formatDateTime, hhmm } from '@/engine/clock';
import {
  CLOCK_KEYS,
  MOMENTS,
  clockOpen,
  exitOnBalanceSheet,
  sundayException,
  type MomentKey,
  type SettleCcy,
} from '@/engine/fundSettlement';
import { fmtAmount, fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { InfoTip } from '@/components/ui/tooltip';
import { HorizonTag } from '@/components/Journey';
import { LayerTag, PageHeader } from '@/components/Page';
import { cn } from '@/lib/utils';

const S = en.settle;
const M = 1_000_000;
const usd = (v: number) => `USD ${fmtAmount(v / M, 1)}m`;

type Step = { k: string; h: string; r: string };

function Path({
  title,
  steps,
  at,
  tone,
  aside,
  children,
}: {
  title: string;
  steps: readonly Step[];
  at: number;
  tone: 'outside' | 'new';
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card tone={tone} className="col-span-12 xl:col-span-6">
      <CardHeader title={title} aside={aside} />
      <ol className="space-y-2">
        {steps.map((s, i) => {
          const done = i < at;
          const current = i === at - 1;
          return (
            <motion.li
              key={s.k}
              layout
              animate={{ opacity: done ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'rounded-xl px-3 py-2.5 text-[12.5px]',
                current
                  ? tone === 'new'
                    ? 'bg-new-soft'
                    : 'bg-surface-2 ring-1 ring-line-strong'
                  : 'bg-surface-2',
              )}
            >
              <div className="font-medium">
                {i + 1}. {s.k}
              </div>
              {done && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mt-1 text-muted">
                    <span className="text-fg">{S.holder}:</span> {s.h}
                  </div>
                  <div className="text-muted">
                    <span className="text-fg">{S.risk}:</span> {s.r}
                  </div>
                </motion.div>
              )}
            </motion.li>
          );
        })}
      </ol>
      {children}
    </Card>
  );
}

/** One clock over the chosen day: open windows, a marker at the chosen moment. */
function ClockRow({ k, ccy, t }: { k: (typeof CLOCK_KEYS)[number]; ccy: SettleCcy; t: number }) {
  const day = dayIndex(t) * MIN_PER_DAY;
  const slots = Array.from({ length: 48 }, (_, i) => clockOpen(k, ccy, day + i * 30));
  const open = clockOpen(k, ccy, t);
  return (
    <div
      className={cn('grid grid-cols-[210px_1fr_90px] items-center gap-3', !open && 'opacity-50')}
    >
      <div className="text-[12.5px]">
        {S.clocks[k]}
        <div className="text-[11px] text-muted">{S.clockNotes[k]}</div>
      </div>
      <div className="relative flex h-4 overflow-hidden rounded bg-surface-2">
        {slots.map((o, i) => (
          <div
            key={i}
            className={cn(
              'h-full flex-1',
              o && (k === 'token' || k === 'exit' ? 'bg-new/60' : 'bg-grey'),
            )}
          />
        ))}
        <div
          className="absolute inset-y-0 w-0.5 bg-amber"
          style={{ left: `${((t - day) / MIN_PER_DAY) * 100}%` }}
        />
      </div>
      <Chip tone={open ? 'new' : 'neutral'} className="justify-self-end">
        {open ? S.open : S.closed}
      </Chip>
    </div>
  );
}

export function SettleFund() {
  const [ccy, setCcy] = useState<SettleCcy>('USD');
  const [moment, setMoment] = useState<MomentKey>('fri');
  const [at, setAt] = useState(1);
  const t = MOMENTS[moment];
  const coin = ccy === 'USD' ? 'USDC' : 'EURC';
  const stepsA = S.stepsA(coin);
  const n = stepsA.length;
  const x = sundayException();
  const onBs = exitOnBalanceSheet(ccy, t);

  return (
    <div className="space-y-6">
      <PageHeader title={S.title} lead={S.lead} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12.5px] text-muted">{S.ccy}</span>
        {(['EUR', 'USD'] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            aria-pressed={ccy === c}
            variant={ccy === c ? 'new' : 'secondary'}
            onClick={() => setCcy(c)}
          >
            {c}
          </Button>
        ))}
        <span className="ml-4 mr-1 text-[12.5px] text-muted">{S.moment}</span>
        {(Object.keys(MOMENTS) as MomentKey[]).map((m) => (
          <Button
            key={m}
            size="sm"
            aria-pressed={moment === m}
            variant={moment === m ? 'new' : 'secondary'}
            onClick={() => setMoment(m)}
          >
            {S.moments[m]}
          </Button>
        ))}
        <span className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-muted">{S.stepOf(at, n)}</span>
          {at < n ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setAt(at + 1)}
              data-testid="settle-next"
            >
              {S.next} <ArrowRight />
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setAt(1)}>
              <RotateCcw /> {S.restart}
            </Button>
          )}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6" data-tour="settle-paths">
        <Path
          title={S.pathA}
          steps={stepsA}
          at={at}
          tone="outside"
          aside={<LayerTag layer="traditional" />}
        >
          <p className="mt-3 flex items-start gap-1 text-[12px] text-muted">
            {S.redemptionA} <InfoTip content={S.redemptionTip} />
          </p>
        </Path>
        <Path
          title={S.pathB}
          steps={S.stepsB}
          at={at}
          tone="new"
          aside={
            <span className="flex gap-1.5">
              <LayerTag layer="new" />
              <HorizonTag id="settleB" />
            </span>
          }
        />
      </div>

      <Card>
        <CardHeader
          title={S.clocksTitle}
          eyebrow={`${S.moments[moment]} · ${formatDateTime(t)} (Paris) · ${ccy}`}
        />
        <div className="space-y-2">
          {CLOCK_KEYS.map((k) => (
            <ClockRow key={k} k={k} ccy={ccy} t={t} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-[210px_1fr_90px] gap-3 text-[10.5px] text-muted">
          <span />
          <span className="flex justify-between">
            {[0, 6, 12, 18, 24].map((h) => (
              <span key={h}>{hhmm(h * 60).replace('24:00', '00:00')}</span>
            ))}
          </span>
        </div>
        <p className="mt-4 font-serif text-[18px] text-new">{S.clocksMessage}</p>
        <p className="mt-1 text-[12.5px] text-muted">{onBs ? S.onBalanceSheet : S.fundOpen}</p>
      </Card>

      <Card>
        <CardHeader title={S.tableTitle} eyebrow={S.asOf} />
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted">
              {S.tableCols.map((c) => (
                <th key={c} className="pb-2 pr-4 font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {S.table.map(([k, a, b]) => (
              <tr key={k} className="border-t border-line align-top">
                <td className="py-2 pr-4 font-medium">{k}</td>
                <td className="py-2 pr-4 text-muted">{a}</td>
                <td className="py-2 text-new">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-6" data-tour="settle-exception">
          <CardHeader title={S.exceptionTitle} eyebrow={S.asOf} />
          <p className="rounded-xl border border-dashed border-line-strong px-3 py-2 text-[12.5px] text-muted">
            {S.exceptionA(usd(x.queued), formatDateTime(x.queuedUntil))}
          </p>
          <p className="mt-2 rounded-xl bg-new-soft px-3 py-2 text-[12.5px]">
            {S.exceptionB(
              usd(x.unitsPledged),
              fmtPct(x.haircut, 0),
              fmtPct(x.rate),
              `USD ${fmtAmount(x.cost)}`,
            )}
          </p>
        </Card>
        <Card className="col-span-12 xl:col-span-6">
          <CardHeader title={S.bankTitle} />
          <ul className="space-y-1.5 text-[12.5px]">
            <li className="text-muted">{S.bankA}</li>
            <li>{S.bankB}</li>
            <li className="text-muted">{S.bankRevenues}</li>
            <li className="text-muted">{S.bankCosts}</li>
          </ul>
        </Card>
      </div>

      <Card tone="new">
        <p className="font-serif text-[20px] leading-snug">{S.conclusion}</p>
      </Card>
    </div>
  );
}
