import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Ban, Check, CircleDashed, FileUp, ShieldCheck, Zap } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { at, formatDateTime, isBusinessHours } from '@/engine/clock';
import { fxNightQuote } from '@/engine/pricing';
import { fmtAmount, fmtM } from '@/engine/format';
import { NIGHT_FX_LIMIT_EUR } from '@/data/rates';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Tip } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayerTag, PageHeader, Row } from '@/components/Page';
import { cn } from '@/lib/utils';

const P = en.payments;
const M = 1_000_000;

function ScreeningOnTheWay() {
  return (
    <Tip content={P.screeningOnTheWayTip}>
      <span tabIndex={0}>
        <Chip tone="traditional" className="cursor-help">
          <CircleDashed />
          {P.screeningOnTheWay}
        </Chip>
      </span>
    </Tip>
  );
}

/** New layer: compliance checks run before the transfer leaves (target 2027). */
function PreScreen({
  onCleared,
  disabled,
}: {
  onCleared: (ok: boolean) => void;
  disabled?: boolean;
}) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'cleared'>('idle');
  const [p, setP] = useState(0);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const run = () => {
    setPhase('running');
    const start = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / 1200);
      setP(x);
      if (x < 1) raf.current = requestAnimationFrame(tick);
      else {
        setPhase('cleared');
        onCleared(true);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };
  if (phase === 'cleared')
    return (
      <Chip tone="new">
        <ShieldCheck />
        {P.ledger.cleared} · 1.2 s
      </Chip>
    );
  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant="secondary"
        onClick={run}
        disabled={disabled || phase === 'running'}
      >
        <ShieldCheck />
        {phase === 'running' ? P.ledger.screening : P.ledger.screen}
      </Button>
      {phase === 'running' && (
        <div
          className="h-1 w-32 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={Math.round(p * 100)}
        >
          <div className="h-full bg-new" style={{ width: `${p * 100}%` }} />
        </div>
      )}
    </div>
  );
}

const BATCHES = [
  {
    id: 'b1',
    name: 'SEPA supplier batch — week 41',
    n: 214,
    amount: 8.4 * M,
    exec: at(0, '11:20'),
    scenario: true,
  },
  {
    id: 'b2',
    name: 'Payroll Spain — October',
    n: 1_184,
    amount: 2.1 * M,
    exec: at(0, '11:20'),
    scenario: true,
  },
  { id: 'b3', name: 'Freight carriers — October', n: 42, amount: 1.2 * M, scenario: false },
  { id: 'b4', name: 'Utilities and rent — Q4', n: 18, amount: 0.6 * M, scenario: false },
];

function SepaTab() {
  const { t } = useSim();
  const actions = useApp((s) => s.actions);
  const addAction = useApp((s) => s.addAction);
  const [file, setFile] = useState<string | null>(null);
  const [payee, setPayee] = useState('Atelier Morel SARL');
  const [amount, setAmount] = useState(1);
  const [sent, setSent] = useState(false);
  const approved = (name: string) => actions.some((a) => a.kind === 'payment' && a.payee === name);

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-12 xl:col-span-8">
        <CardHeader
          title={P.batches}
          aside={
            <span className="flex gap-2">
              <ScreeningOnTheWay />
              <LayerTag layer="traditional" />
            </span>
          }
        />
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted">
              {P.batchCols.map((c, i) => (
                <th
                  key={i}
                  className={cn('pb-2 font-normal', (i === 1 || i === 2) && 'text-right')}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BATCHES.map((b) => {
              const done = b.scenario ? t >= (b.exec ?? 0) : approved(b.name);
              return (
                <tr key={b.id} className="border-t border-line">
                  <td className="py-3">{b.name}</td>
                  <td className="tabular py-3 text-right">{fmtAmount(b.n)}</td>
                  <td className="tabular py-3 text-right">{fmtM(b.amount, 'EUR', 2)}</td>
                  <td className="py-3 pl-4 text-muted">
                    {b.scenario ? formatDateTime(b.exec ?? 0) : P.execD}
                  </td>
                  <td className="py-3">
                    {done ? (
                      <Chip tone="neutral">
                        <Check />
                        {b.scenario ? P.executed : P.approved}
                      </Chip>
                    ) : (
                      <Chip tone="amber">{P.fourEyes}</Chip>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {!done && !b.scenario && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          addAction({
                            kind: 'payment',
                            from: 'cur-paris',
                            amount: b.amount,
                            rail: 'sepa',
                            payee: b.name,
                          })
                        }
                      >
                        {P.approve}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-7 text-center hover:bg-surface-2/50">
            <FileUp className="size-5 text-muted" />
            <span className="mt-2 text-[13.5px]">{P.upload}</span>
            <span className="mt-1 text-[12px] text-muted">{P.uploadHint}</span>
            <span className="mt-3 text-[12px] text-new">{P.choose}</span>
            <input
              type="file"
              className="sr-only"
              accept=".xml,.txt"
              onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          <div className="rounded-2xl bg-surface-2/60 p-5">
            <div className="text-[13.5px] font-medium">{P.single}</div>
            <label className="mt-3 block text-[12px] text-muted">
              {P.payee}
              <input
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-fg"
              />
            </label>
            <div className="mt-3 mb-2 flex justify-between text-[12px] text-muted">
              <span>{P.amount}</span>
              <span className="tabular text-fg">{amount}</span>
            </div>
            <Slider
              aria-label={P.amount}
              min={1}
              max={10}
              step={1}
              value={[amount]}
              onValueChange={([v]) => {
                setAmount(v);
                setSent(false);
              }}
            />
            <Button
              className="mt-4 w-full"
              variant="primary"
              onClick={() => {
                addAction({
                  kind: 'payment',
                  from: 'cur-paris',
                  amount: amount * M,
                  rail: 'sctInst',
                  payee,
                });
                setSent(true);
              }}
            >
              <Zap /> {sent ? P.sent : `${P.send} ${fmtM(amount * M, 'EUR', 0)}`}
            </Button>
          </div>
        </div>
        {file && (
          <p className="mt-3 text-[12.5px] text-muted">
            <span className="font-mono text-fg">{file}</span> — {P.parsed(38, 'EUR 0.74m')}
          </p>
        )}
      </Card>
      <Card className="col-span-12 xl:col-span-4">
        <CardHeader title={P.calendar} aside={<LayerTag layer="traditional" />} />
        {P.calendarRows.map(([k, a, b]) => (
          <div key={k} className="border-b border-line py-2.5 last:border-0">
            <div className="text-[13.5px]">{k}</div>
            <div className="mt-0.5 flex justify-between text-[12px] text-muted">
              <span>{a}</span>
              <span>{b}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function CrossTab() {
  const { t } = useSim();
  const steps = [at(0, '22:00'), at(1, '10:30'), at(1, '10:30'), at(1, '10:30')];
  const reached = [t >= steps[0], t >= steps[0], t >= steps[1], t >= steps[1]];
  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-12 xl:col-span-7">
        <CardHeader
          title={P.cross.tracker}
          aside={
            <span className="flex gap-2">
              <ScreeningOnTheWay />
              <LayerTag layer="traditional" />
            </span>
          }
        />
        <ol className="relative ml-2 border-l border-line-strong">
          {P.cross.steps.map((s, i) => (
            <li key={s} className="relative pb-6 pl-6 last:pb-0">
              <span
                className={cn(
                  'absolute -left-[7px] top-0.5 size-3.5 rounded-full border-2',
                  reached[i]
                    ? i === 1 && t < steps[1]
                      ? 'border-amber bg-amber-soft'
                      : 'border-new bg-new'
                    : 'border-line-strong bg-surface',
                )}
              />
              <div className={cn('text-[14px]', !reached[i] && 'text-muted')}>{s}</div>
              <div className="text-[12px] text-muted">
                {reached[i] ? formatDateTime(i < 2 ? steps[0] : steps[1]) : '—'}
              </div>
              {i === 1 && reached[1] && t < steps[1] && (
                <Tip content={en.tips.pendingCover}>
                  <span tabIndex={0}>
                    <Chip tone="amber" className="mt-2 cursor-help">
                      {P.cross.notEarning}
                    </Chip>
                  </span>
                </Tip>
              )}
              {i === 2 && reached[2] && (
                <Chip tone="new" className="mt-2">
                  {P.cross.earning}
                </Chip>
              )}
            </li>
          ))}
        </ol>
      </Card>
      <div className="col-span-12 space-y-6 xl:col-span-5">
        <Card>
          <CardHeader title={P.cross.routing} />
          <div className="mb-4 flex items-center gap-2 text-[12px]">
            {P.cross.nodes.map((n, i) => (
              <span key={n} className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1.5',
                    i < 2 ? 'border border-dashed border-line-strong text-muted' : 'bg-surface-2',
                  )}
                >
                  {n}
                </span>
                {i < P.cross.nodes.length - 1 && <ArrowRight className="size-3.5 text-muted" />}
              </span>
            ))}
          </div>
          <p className="text-[13px] leading-relaxed text-muted">{P.cross.routingText}</p>
        </Card>
        <Card>
          <CardHeader title={P.cross.valueDates} />
          <p className="text-[13px] leading-relaxed text-muted">{P.cross.valueDatesText}</p>
        </Card>
      </div>
    </div>
  );
}

type Dest = 'tok-munich' | 'tok-sgd-singapore' | 'tok-usd-chicago';
const CCY: Record<Dest, string> = {
  'tok-munich': 'EUR',
  'tok-sgd-singapore': 'SGD',
  'tok-usd-chicago': 'USD',
};

function LedgerTab() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const [to, setTo] = useState<Dest>('tok-sgd-singapore');
  const [amount, setAmount] = useState(5);
  const [cleared, setCleared] = useState(false);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);
  const [tried, setTried] = useState(false);
  const [fellBack, setFellBack] = useState(false);
  const night = !isBusinessHours(t);
  const ccy = CCY[to];
  const q = ccy !== 'EUR' ? fxNightQuote(ccy, amount * M) : null;
  const used = state.fxNightUsed;
  const over = night && q !== null && used + amount * M > NIGHT_FX_LIMIT_EUR;
  const reset = () => {
    setCleared(false);
    setDone(false);
    setKey((k) => k + 1);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card tone="new" className="col-span-12 xl:col-span-7">
        <CardHeader title={P.ledger.transfer} aside={<LayerTag layer="new" />} />
        <p className="text-[13px] leading-relaxed text-muted">{P.ledger.anyHour}</p>
        <div className="mt-4 space-y-2" role="radiogroup" aria-label={P.ledger.to}>
          {(Object.keys(CCY) as Dest[]).map((d) => (
            <button
              key={d}
              role="radio"
              aria-checked={to === d}
              onClick={() => {
                setTo(d);
                reset();
              }}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left text-[13.5px]',
                to === d ? 'border-new/50 bg-new-soft' : 'border-line hover:bg-surface-2',
              )}
            >
              {d === 'tok-munich'
                ? P.ledger.toMunich
                : d === 'tok-sgd-singapore'
                  ? P.ledger.toSingapore
                  : P.ledger.toChicago}
              {to === d && <Check className="size-4 text-new" />}
            </button>
          ))}
        </div>
        <div className="mt-5 mb-2 flex justify-between text-[13px]">
          <span className="text-muted">{P.amount}</span>
          <span className="tabular">{amount}</span>
        </div>
        <Slider
          aria-label={P.amount}
          min={1}
          max={25}
          step={1}
          value={[amount]}
          onValueChange={([v]) => {
            setAmount(v);
            reset();
          }}
        />
        {q && (
          <div className="mt-5 rounded-xl bg-surface-2 px-4 py-2">
            <Row
              k={night ? P.ledger.fxNight : P.ledger.fxDay}
              v={`${q.rate.toFixed(4)} (mid ${q.mid} − 10 bps)`}
            />
            <Row k={P.ledger.credited(ccy)} v={`${ccy} ${fmtAmount(q.foreign)}`} />
            {night && (
              <div className="pb-2 pt-1">
                <div className="mb-1 flex justify-between text-[12px] text-muted">
                  <span>{P.ledger.nightLimit}</span>
                  <span className="tabular">
                    {fmtM(used + amount * M, 'EUR', 0)} / {fmtM(NIGHT_FX_LIMIT_EUR, 'EUR', 0)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className={cn('h-full', over ? 'bg-red' : 'bg-new')}
                    style={{
                      width: `${Math.min(100, ((used + amount * M) / NIGHT_FX_LIMIT_EUR) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {over && <p className="mt-2 text-[12.5px] text-red">{P.ledger.overLimit}</p>}
        {ccy !== 'EUR' && (
          <Tip content={en.tips.mirror}>
            <p
              tabIndex={0}
              className="mt-3 cursor-help text-[12px] text-muted underline decoration-dotted underline-offset-4"
            >
              {P.ledger.mirrorNote}
            </p>
          </Tip>
        )}
        <div className="mt-5 flex items-center justify-between gap-3">
          <PreScreen key={key} onCleared={setCleared} disabled={over} />
          <Button
            variant="primary"
            disabled={!cleared || over || done}
            onClick={() => {
              addAction({ kind: 'intragroup', to, amountEur: amount * M });
              setDone(true);
            }}
          >
            {done ? (
              <>
                <Check />
                {P.ledger.done}
              </>
            ) : (
              `${P.ledger.execute} ${fmtM(amount * M, 'EUR', 0)}`
            )}
          </Button>
        </div>
      </Card>

      <div className="col-span-12 space-y-6 xl:col-span-5">
        <Card tone="outside">
          <CardHeader
            title={P.ledger.nonClient}
            aside={night ? <LayerTag layer="notYet" /> : <LayerTag layer="traditional" />}
          />
          <p className="text-[13px] leading-relaxed text-muted">{P.ledger.nonClientText}</p>
          <div className="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-[13px]">
            {P.ledger.supplier} · {P.ledger.supplierAmount}
          </div>
          {!tried ? (
            <Button
              className="mt-4 w-full"
              variant="secondary"
              onClick={() => setTried(true)}
              data-testid="pay-non-client"
            >
              {P.ledger.tryPay}
            </Button>
          ) : night ? (
            <div
              className="mt-4 rounded-xl border border-dashed border-line-strong p-4"
              role="alert"
              data-testid="not-available"
            >
              <div className="flex items-center gap-2 text-[13.5px] font-medium">
                <Ban className="size-4 text-muted" /> {P.ledger.notAvailable}
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                {P.ledger.notAvailableMsg}
              </p>
              <Button
                className="mt-3 w-full"
                variant="primary"
                disabled={fellBack}
                onClick={() => {
                  addAction({
                    kind: 'payment',
                    from: 'cur-paris',
                    amount: 2 * M,
                    rail: 'sctInst',
                    payee: P.ledger.supplier,
                  });
                  setFellBack(true);
                }}
              >
                <Zap /> {fellBack ? P.sent : P.ledger.fallback}
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-surface-2 p-4 text-[12.5px] text-muted">
              {P.ledger.byDay}
              <Button
                className="mt-3 w-full"
                variant="primary"
                disabled={fellBack}
                onClick={() => {
                  addAction({
                    kind: 'payment',
                    from: 'tok-paris',
                    amount: 2 * M,
                    rail: 'sepa',
                    payee: P.ledger.supplier,
                  });
                  setFellBack(true);
                }}
              >
                {fellBack ? P.sent : P.send}
              </Button>
            </div>
          )}
          <Tip content={en.tips.notYet}>
            <p
              tabIndex={0}
              className="mt-3 cursor-help text-[11.5px] text-muted underline decoration-dotted underline-offset-4"
            >
              {P.ledger.whyNot}
            </p>
          </Tip>
        </Card>
        <Card tone="outside">
          <CardHeader title={P.ledger.pvp} aside={<LayerTag layer="notYet" />} />
          <p className="text-[13px] leading-relaxed text-muted">{P.ledger.pvpText}</p>
          <Tip content={en.tips.notYet}>
            <span tabIndex={0} className="mt-4 inline-block">
              <Button variant="secondary" disabled>
                {P.ledger.notAvailable}
              </Button>
            </span>
          </Tip>
        </Card>
      </div>
    </div>
  );
}

export function Payments() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'sepa';
  return (
    <div>
      <PageHeader eyebrow={P.eyebrow} title={P.title} lead={P.lead} />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set('tab', v);
          setParams(next, { replace: true });
        }}
      >
        <TabsList aria-label={P.eyebrow}>
          <TabsTrigger value="sepa">{P.tabs.sepa}</TabsTrigger>
          <TabsTrigger value="cross">{P.tabs.cross}</TabsTrigger>
          <TabsTrigger value="ledger" data-testid="tab-ledger">
            <span className="size-1.5 rounded-full bg-new" />
            {P.tabs.ledger}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sepa">
          <SepaTab />
        </TabsContent>
        <TabsContent value="cross">
          <CrossTab />
        </TabsContent>
        <TabsContent value="ledger">
          <LedgerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
