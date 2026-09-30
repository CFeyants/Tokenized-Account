import { useState } from 'react';
import { Check, ShieldCheck, Zap, CalendarClock } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { FX_MID, NIGHT_FX_LIMIT_EUR } from '@/data/rates';
import {
  MIN_PER_DAY,
  SIM_END,
  at,
  formatDate,
  formatDateTime,
  weekday,
  type SimTime,
} from '@/engine/clock';
import {
  WINDOWS,
  compareJit,
  isOpen,
  ledgerOpportunity,
  type WindowKey,
  type JitCcy,
} from '@/engine/markets';
import { JIT_TARGET, jitQuote, type JitTarget } from '@/engine/advanced';
import { fmtAmount, fmtEur, fmtM } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayerTag, PageHeader, Row } from '@/components/Page';
import { cn } from '@/lib/utils';

const F = en.funding;
const M = 1_000_000;

const ROWS: (WindowKey | 'ledger')[] = [
  'parisDesk',
  'corrCutoff',
  't2',
  'cls',
  'tokyo',
  'riyadh',
  'ledger',
];

/** Week grid: open windows of each traditional system, the ledger 24/7, markers for now and need. */
function MarketHours({ now, need }: { now: SimTime; need: SimTime }) {
  const pct = (m: number) => `${(Math.min(SIM_END, Math.max(0, m)) / SIM_END) * 100}%`;
  const days = Array.from({ length: 8 }, (_, d) => d);
  return (
    <div>
      <div className="grid grid-cols-[250px_1fr] gap-x-4 gap-y-1.5">
        <div />
        <div className="relative h-4 text-[10.5px] text-muted">
          {days.map((d) => (
            <span key={d} className="absolute pl-1" style={{ left: pct(d * MIN_PER_DAY) }}>
              {formatDate(d * MIN_PER_DAY)}
            </span>
          ))}
        </div>
        {ROWS.map((k) => {
          const w = k === 'ledger' ? null : WINDOWS[k];
          const openAtNeed = !w || isOpen(w, need);
          return (
            <div key={k} className="contents">
              <div
                className={cn(
                  'flex items-center justify-between gap-2 text-[12px]',
                  k === 'ledger' ? 'text-new' : 'text-muted',
                )}
              >
                <span className="truncate">{F.rows[k]}</span>
                <span
                  className={cn('size-1.5 shrink-0 rounded-full', openAtNeed ? 'bg-new' : 'bg-red')}
                />
              </div>
              <div className="relative h-5 overflow-hidden rounded-md bg-surface-2">
                {w ? (
                  days
                    .filter((d) => w.days.includes(weekday(d * MIN_PER_DAY)))
                    .map((d) => (
                      <div
                        key={d}
                        className="absolute inset-y-0.5 rounded-sm bg-grey"
                        style={{
                          left: pct(d * MIN_PER_DAY + w.from),
                          width: `calc(${pct(d * MIN_PER_DAY + w.to)} - ${pct(d * MIN_PER_DAY + w.from)})`,
                        }}
                      />
                    ))
                ) : (
                  <div className="absolute inset-y-0.5 left-0 right-0 rounded-sm bg-new/60" />
                )}
                <div className="absolute inset-y-0 w-px bg-fg/60" style={{ left: pct(now) }} />
                <div className="absolute inset-y-0 w-0.5 bg-amber" style={{ left: pct(need) }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-5 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-fg/60" />
          {F.now}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-amber" />
          {F.needMark}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-grey" />
          {en.home.trad}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-new/60" />
          {en.layers.new}
        </span>
      </div>
      <p className="mt-2 text-[11.5px] text-muted">{F.hoursNote}</p>
    </div>
  );
}

const PRESETS: {
  key: 'presetTokyo' | 'presetRiyadh' | 'presetSingapore';
  to: JitTarget;
  need: SimTime;
  amount: number;
  source: 'EUR' | 'USD';
}[] = [
  { key: 'presetTokyo', to: 'tok-jpy-tokyo', need: at(7, '02:00'), amount: 8, source: 'EUR' },
  { key: 'presetRiyadh', to: 'tok-sar-riyadh', need: at(6, '09:00'), amount: 5, source: 'USD' },
  {
    key: 'presetSingapore',
    to: 'tok-sgd-singapore',
    need: at(6, '02:00'),
    amount: 6,
    source: 'EUR',
  },
];

function JitTab() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const setT = useApp((s) => s.setT);
  const [p, setP] = useState(0);
  const [to, setTo] = useState<JitTarget>(PRESETS[0].to);
  const [need, setNeed] = useState<SimTime>(PRESETS[0].need);
  const [amount, setAmount] = useState(PRESETS[0].amount);
  const [source, setSource] = useState<'EUR' | 'USD'>(PRESETS[0].source);
  const [done, setDone] = useState<string | null>(null);
  const tgt = JIT_TARGET[to];
  const ccy = tgt.ccy as JitCcy;
  const execAt = Math.max(t, need - 5);
  const q = jitQuote(tgt.ccy, source, amount * M, execAt);
  const cmp = compareJit(ccy, amount * M, need, t);
  const kept =
    cmp.tradTradeAt === null ? 0 : ledgerOpportunity(amount * M, cmp.tradTradeAt, execAt);
  const limitLeft = Math.max(0, NIGHT_FX_LIMIT_EUR - state.fxNightUsed);

  const pick = (i: number) => {
    const x = PRESETS[i];
    setP(i);
    setTo(x.to);
    setNeed(x.need);
    setAmount(x.amount);
    setSource(x.source);
    setDone(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label={F.presets}>
        {PRESETS.map((x, i) => (
          <button
            key={x.key}
            role="radio"
            aria-checked={p === i}
            onClick={() => pick(i)}
            className={cn(
              'card cursor-pointer p-4 text-left transition-colors',
              p === i ? 'border-new/50' : 'hover:border-line-strong',
            )}
          >
            <div className="text-[14px] font-medium">{F[x.key].title}</div>
            <div className="mt-1 text-[12px] text-muted">{F[x.key].sub}</div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={F.hoursTitle} />
        <MarketHours now={t} need={need} />
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title={F.tabs.jit} />
          <label className="block text-[12px] text-muted">
            {F.entity}
            <select
              aria-label={F.entity}
              value={to}
              onChange={(e) => {
                setTo(e.target.value as JitTarget);
                setDone(null);
              }}
              className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-fg"
            >
              {(Object.keys(JIT_TARGET) as JitTarget[]).map((k) => (
                <option key={k} value={k}>
                  {JIT_TARGET[k].bank.replace('Norvane Bank ', '')} — {JIT_TARGET[k].ccy}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 text-[12px] text-muted">{F.source}</div>
          <div className="mt-1 space-y-1.5" role="radiogroup" aria-label={F.source}>
            {(['EUR', 'USD'] as const).map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={source === s}
                disabled={s === 'USD' && ccy === ('EUR' as string)}
                onClick={() => {
                  setSource(s);
                  setDone(null);
                }}
                className={cn(
                  'w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-[12.5px] disabled:opacity-40',
                  source === s ? 'border-new/50 bg-new-soft' : 'border-line hover:bg-surface-2',
                )}
              >
                {s === 'EUR' ? F.sourceEur : F.sourceUsd}
              </button>
            ))}
          </div>
          {ccy === 'SAR' && <p className="mt-2 text-[11.5px] text-muted">{F.usdNote}</p>}
          <div className="mb-2 mt-4 flex justify-between text-[12px]">
            <span className="text-muted">{F.amount}</span>
            <span className="tabular">{amount}</span>
          </div>
          <Slider
            aria-label={F.amount}
            min={1}
            max={25}
            step={1}
            value={[amount]}
            onValueChange={([v]) => {
              setAmount(v);
              setDone(null);
            }}
          />
          <Row k={F.need} v={formatDateTime(need)} className="mt-3" />
          <p className="mt-1 text-[11.5px] text-muted">{F.limitLeft(fmtM(limitLeft, 'EUR', 0))}</p>
          <div className="mt-5 grid grid-cols-1 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                addAction({ kind: 'jit', to, source, amountEur: amount * M });
                setDone(F.done);
              }}
            >
              <Zap /> {F.execNow}
            </Button>
            <Button
              variant="primary"
              disabled={need - 5 <= t}
              onClick={() => {
                addAction({ kind: 'jit', to, source, amountEur: amount * M }, need - 5);
                setDone(F.scheduled(formatDateTime(need - 5)));
              }}
            >
              <CalendarClock /> {F.schedule}
            </Button>
          </div>
          {done && (
            <p className="mt-3 flex items-center gap-2 text-[12.5px] text-new">
              <Check className="size-3.5" /> {done}
              <button type="button" className="cursor-pointer underline" onClick={() => setT(need)}>
                {formatDateTime(need)}
              </button>
            </p>
          )}
        </Card>

        <Card tone="new" className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader title={F.ledgerTitle} aside={<LayerTag layer="new" />} />
          <ul className="space-y-2.5 text-[13px] leading-relaxed">
            <li>{F.ledgerExec(formatDateTime(execAt))}</li>
            <li className="text-muted">{F.rate(q.rate.toFixed(ccy === 'JPY' ? 2 : 4), q.bps)}</li>
            <li>{F.credited(`${tgt.ccy} ${fmtAmount(q.foreign)}`)}</li>
            <li className="text-new">{F.keepsEarning(fmtEur(kept))}</li>
            <li className="text-muted">{F.subEarns}</li>
          </ul>
          <div className="mt-4 text-[12px] text-muted">{F.closedAtNeed}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cmp.closedAtNeed.map((k) => (
              <Chip key={k} tone="red">
                {F.rows[k]}
              </Chip>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader title={F.tradTitle} aside={<LayerTag layer="traditional" />} />
          {cmp.tradTradeAt === null ? (
            <p className="text-[13px] text-muted">{F.tradNone}</p>
          ) : (
            <ul className="space-y-2.5 text-[13px] leading-relaxed text-muted">
              <li className="text-fg">{F.tradTrade(formatDateTime(cmp.tradTradeAt))}</li>
              <li>{F.tradCredit(formatDateTime(cmp.tradCreditAt ?? cmp.tradTradeAt))}</li>
              <li className="text-red">{F.tradLost(fmtEur(cmp.lostByPrefunding))}</li>
              <li>{F.tradRisk}</li>
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title={F.balances} />
        <div className="grid grid-cols-4 gap-4">
          {(Object.keys(JIT_TARGET) as JitTarget[]).map((k) => (
            <div key={k} className="rounded-xl bg-surface-2 px-4 py-3">
              <div className="text-[12px] text-muted">{JIT_TARGET[k].bank}</div>
              <div className="tabular mt-1 text-[17px]">
                {JIT_TARGET[k].ccy} {fmtAmount(state.bal[k])}
              </div>
              <div className="text-[11px] text-muted">
                ≈ {fmtM(state.bal[k] / FX_MID[JIT_TARGET[k].ccy])}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LargeTab() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const [running, setRunning] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const L = F.large;
  const presets = [
    { key: 'equipment' as const, onLedger: false },
    { key: 'mna' as const, onLedger: true },
  ];
  const checks = (cat: 'equipment' | 'mna', onLedger: boolean) => en.adv.preChecks(cat, onLedger);

  const run = (key: 'equipment' | 'mna', onLedger: boolean) => {
    setRunning(key);
    setShown(0);
    const n = checks(key, onLedger).length;
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(i);
      if (i < n) setTimeout(tick, 160);
      else {
        const x = L[key];
        addAction({
          kind: 'prevalidate',
          category: key,
          payee: x.payee,
          amount: x.amount * M,
          condition: x.condition,
          onLedger,
        });
        setTimeout(() => setRunning(null), 400);
      }
    };
    setTimeout(tick, 160);
  };

  const list = state.conditional.filter((c) => c.kind === 'large');

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-5">
        {presets.map(({ key, onLedger }) => {
          const x = L[key];
          return (
            <Card key={key} tone={onLedger ? 'new' : 'default'}>
              <CardHeader eyebrow={L.presetsTitle} title={x.title} />
              <Row k={en.payments.payee} v={x.payee} />
              <Row k={en.guarantees.releaseOn} v={x.condition} />
              <Row k="Bank" v={x.bank} />
              <Row k={en.guarantees.amount} v={fmtM(x.amount * M, 'EUR', 0)} />
              {running === key && (
                <ul className="mt-3 space-y-1.5">
                  {checks(key, onLedger)
                    .slice(0, shown)
                    .map(([name, detail]) => (
                      <li key={name} className="flex items-start gap-2 text-[12.5px]">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-new" />
                        <span>
                          <span className="text-fg">{name}</span>{' '}
                          <span className="text-muted">— {detail}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              )}
              <Button
                className="mt-4 w-full"
                variant="primary"
                disabled={running !== null}
                onClick={() => run(key, onLedger)}
              >
                <ShieldCheck /> {running === key ? L.checking : L.prevalidate}
              </Button>
            </Card>
          );
        })}
      </div>
      <Card className="col-span-12 xl:col-span-7">
        <CardHeader title={L.list} aside={<LayerTag layer="new" />} />
        {list.length === 0 ? (
          <p className="text-[13px] text-muted">{L.none}</p>
        ) : (
          <div className="space-y-4">
            {list.map((c) => {
              const until = c.releasedAt ?? t;
              const earned = ledgerOpportunity(c.amount, c.since, until);
              const onLedger = c.checks?.some((k) => k.name === en.adv.onLedgerCheck);
              return (
                <div key={c.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] font-medium">{c.payee}</div>
                      <div className="text-[12px] text-muted">{c.condition}</div>
                    </div>
                    <Chip
                      tone={
                        c.status === 'released'
                          ? 'neutral'
                          : c.status === 'awaitingRail'
                            ? 'amber'
                            : 'new'
                      }
                    >
                      {L.status[c.status]}
                    </Chip>
                  </div>
                  <Row k={en.guarantees.amount} v={fmtM(c.amount, 'EUR', 0)} />
                  <Row k={L.earmarked} v={formatDateTime(c.since)} />
                  <Row k={L.earning} v={<span className="text-new">{fmtEur(earned)}</span>} />
                  <details className="mt-1 text-[12px]">
                    <summary className="cursor-pointer text-muted">
                      {F.large.checksTitle} ({c.checks?.length ?? 0})
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {c.checks?.map((k) => (
                        <li key={k.name} className="flex gap-2">
                          <Check className="mt-0.5 size-3 shrink-0 text-new" />
                          <span>
                            {k.name} <span className="text-muted">— {k.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                  {c.status === 'waiting' && (
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="new"
                      onClick={() => addAction({ kind: 'release', target: c.id })}
                    >
                      <Zap /> {L.release}
                    </Button>
                  )}
                  {!onLedger && c.status !== 'released' && (
                    <p className="mt-2 text-[11.5px] text-muted">{L.offLedgerNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-5 text-[12.5px] leading-relaxed">{L.releaseNote}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{L.tradNote}</p>
      </Card>
    </div>
  );
}

export function Funding() {
  return (
    <div>
      <PageHeader eyebrow={F.eyebrow} title={F.title} lead={F.lead} />
      <Tabs defaultValue="jit">
        <TabsList>
          <TabsTrigger value="jit">{F.tabs.jit}</TabsTrigger>
          <TabsTrigger value="large">{F.tabs.large}</TabsTrigger>
        </TabsList>
        <TabsContent value="jit">
          <JitTab />
        </TabsContent>
        <TabsContent value="large">
          <LargeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
