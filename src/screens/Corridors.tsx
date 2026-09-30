import { useState } from 'react';
import { ArrowRight, Check, Lock, Wallet, Zap } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import {
  CORRIDORS,
  CORRIDOR_PRICING,
  LATAM,
  MASTER_ADDRESS,
  PAYEES,
  WALLET_ADDRESS,
  type Rail,
} from '@/data/corridors';
import { entityById } from '@/data/entities';
import { FX_MID, RATES } from '@/data/rates';
import { at, formatDateTime, isBusinessHours, type SimTime } from '@/engine/clock';
import { ledgerOpportunity } from '@/engine/markets';
import { daysCounted } from '@/engine/minuteCases';
import { repatriationQuote } from '@/engine/advanced';
import { fmtAmount, fmtEur, fmtM } from '@/engine/format';
import type { LatamCountry, WalletId } from '@/engine/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip, type ChipTone } from '@/components/ui/chip';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayerTag, PageHeader, Row } from '@/components/Page';
import { cn } from '@/lib/utils';

const K = en.corridors;
const M = 1_000_000;

const RAIL_TONE: Record<Rail, ChipTone> = {
  interbank: 'new',
  stablecoin: 'amber',
  intragroup: 'new',
  traditional: 'traditional',
};

const PATTERNS: Record<string, [SimTime, SimTime]> = {
  day: [at(1, '08:00'), at(1, '19:30')],
  evening: [at(1, '17:45'), at(2, '10:00')],
  late: [at(1, '23:00'), at(2, '01:00')],
  weekend: [at(4, '16:00'), at(7, '09:00')],
  days: [at(0, '10:00'), at(7, '10:00')],
};

function Matter() {
  const [key, setKey] = useState('evening');
  const [amount, setAmount] = useState(10);
  const [from, to] = PATTERNS[key];
  const cur = (amount * M * RATES.current * daysCounted(from, to, 'paris')) / 360;
  const tok = ledgerOpportunity(amount * M, from, to);
  const tokWins = tok >= cur;
  return (
    <Card>
      <CardHeader eyebrow={K.matterLead} title={K.matterTitle} />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={K.matterTitle}>
        {K.patterns.map((p) => (
          <Button
            key={p.key}
            size="sm"
            role="radio"
            aria-checked={key === p.key}
            variant={key === p.key ? 'new' : 'secondary'}
            onClick={() => setKey(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="mb-2 mt-5 flex justify-between text-[12.5px]">
        <span className="text-muted">{K.amount}</span>
        <span className="tabular">{amount}</span>
      </div>
      <Slider
        aria-label={K.amount}
        min={1}
        max={100}
        step={1}
        value={[amount]}
        onValueChange={([v]) => setAmount(v)}
      />
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div
          className={cn(
            'rounded-xl p-4',
            !tokWins ? 'border border-line-strong bg-grey-soft' : 'bg-grey-soft',
          )}
        >
          <div className="text-[12px] text-muted">{K.curResult}</div>
          <div className="tabular mt-1 font-serif text-[28px]">{fmtEur(cur)}</div>
        </div>
        <div
          className={cn(
            'rounded-xl p-4',
            tokWins ? 'border border-new/50 bg-new-soft' : 'bg-new-soft',
          )}
        >
          <div className="text-[12px] text-new">{K.tokResult}</div>
          <div className="tabular mt-1 font-serif text-[28px] text-new">{fmtEur(tok)}</div>
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed">{tokWins ? K.verdictTok : K.verdictCur}</p>
      <p className="mt-1 text-[12px] text-muted">{K.verdictNote}</p>
    </Card>
  );
}

function RailsTab() {
  const { t } = useSim();
  const addAction = useApp((s) => s.addAction);
  const [payee, setPayee] = useState(PAYEES[0].id);
  const [amount, setAmount] = useState(3);
  const [from, setFrom] = useState<'cur-paris' | 'tok-paris'>('tok-paris');
  const [rail, setRail] = useState<'interbank' | 'traditional'>('interbank');
  const [sent, setSent] = useState(false);
  const p = PAYEES.find((x) => x.id === payee)!;
  const effRail = p.onLedger ? rail : 'traditional';
  const night = !isBusinessHours(t);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="px-6 pt-6">
          <CardHeader title={K.tableTitle} />
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11.5px] text-muted">
              {K.cols.map((c) => (
                <th key={c} className="px-6 py-2.5 font-medium first:pl-6">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORRIDORS.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-6 py-3">{c.label}</td>
                <td className="px-6 py-3 text-muted">{c.counterparty}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.rails.map((r) => (
                      <Chip key={r} tone={RAIL_TONE[r]}>
                        {K.rails[r]}
                      </Chip>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <Chip
                    tone={
                      c.status === 'traditionalOnly'
                        ? 'outside'
                        : c.status === 'live'
                          ? 'neutral'
                          : 'new'
                    }
                  >
                    {K.status[c.status]}
                  </Chip>
                </td>
                <td className="px-6 py-3 text-[12px] text-muted">{c.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card tone="new" className="col-span-12 xl:col-span-5">
          <CardHeader title={K.payTitle} />
          <label className="block text-[12px] text-muted">
            {K.payee}
            <select
              aria-label={K.payee}
              value={payee}
              onChange={(e) => {
                setPayee(e.target.value);
                setSent(false);
              }}
              className="mt-1 h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-fg"
            >
              {PAYEES.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} — {x.bank}
                </option>
              ))}
            </select>
          </label>
          <div className="mb-2 mt-4 flex justify-between text-[12px]">
            <span className="text-muted">{K.amount}</span>
            <span className="tabular">{amount}</span>
          </div>
          <Slider
            aria-label={K.amount}
            min={1}
            max={20}
            step={1}
            value={[amount]}
            onValueChange={([v]) => {
              setAmount(v);
              setSent(false);
            }}
          />
          <div className="mt-4 text-[12px] text-muted">{K.from}</div>
          <div className="mt-1 space-y-1.5" role="radiogroup" aria-label={K.from}>
            {(['cur-paris', 'tok-paris'] as const).map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={from === f}
                onClick={() => {
                  setFrom(f);
                  setSent(false);
                }}
                className={cn(
                  'w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-[12.5px]',
                  from === f ? 'border-new/50 bg-new-soft' : 'border-line hover:bg-surface-2',
                )}
              >
                {f === 'cur-paris' ? K.fromCur : K.fromTok}
              </button>
            ))}
          </div>
          <div className="mt-4 text-[12px] text-muted">{K.rail}</div>
          <div className="mt-1 space-y-1.5" role="radiogroup" aria-label={K.rail}>
            {(['interbank', 'traditional'] as const).map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={effRail === r}
                disabled={r === 'interbank' && !p.onLedger}
                onClick={() => {
                  setRail(r);
                  setSent(false);
                }}
                className={cn(
                  'w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-[12.5px] disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-50',
                  effRail === r ? 'border-new/50 bg-new-soft' : 'border-line hover:bg-surface-2',
                )}
              >
                {r === 'interbank' ? K.railInterbank : K.railTrad(night)}
              </button>
            ))}
          </div>
          {!p.onLedger && <p className="mt-2 text-[12px] text-muted">{K.notOnLedger}</p>}
          <Button
            className="mt-5 w-full"
            variant="primary"
            disabled={sent}
            onClick={() => {
              addAction({ kind: 'corridorPay', payee, amount: amount * M, from, rail: effRail });
              setSent(true);
            }}
          >
            {sent ? (
              <>
                <Check /> {K.paid}
              </>
            ) : (
              <>
                <Zap /> {K.pay} {fmtM(amount * M, 'EUR', 0)}
              </>
            )}
          </Button>
        </Card>
        <div className="col-span-12 xl:col-span-7">
          <Matter />
        </div>
      </div>
    </div>
  );
}

function LatamTab() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const L = K.latam;
  const [country, setCountry] = useState<LatamCountry>('BR');
  const [share, setShare] = useState(50);
  const cfg = LATAM.find((l) => l.country === country)!;
  const balance = state.bal[cfg.account];
  const local = Math.max(0, (balance * share) / 100);
  const q = repatriationQuote(cfg, local);
  const digits = cfg.currency === 'COP' || cfg.currency === 'CLP' ? 0 : 4;

  const wallets: WalletId[] = ['bitso-brl', 'bitso-mxn', 'bitso-cop', 'bitso-clp', 'bitso-qeur'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {LATAM.map((l) => {
          const e = entityById(l.entity);
          return (
            <Card key={l.country} tone="outside" className="p-5">
              <div className="text-[12px] text-muted">
                {e.city} · {e.name}
              </div>
              <div className="tabular mt-1 text-[18px]">
                {l.currency} {fmtAmount(state.bal[l.account])}
              </div>
              <div className="text-[11.5px] text-muted">
                ≈ {fmtM(state.bal[l.account] / FX_MID[l.currency])} · {l.localRail}
                {l.railWindow ? '' : ' 24/7'}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          eyebrow={L.walletsLead}
          title={
            <span className="flex items-center gap-2">
              <Wallet className="size-5 text-amber" />
              {L.walletsTitle}
            </span>
          }
        />
        <div className="grid grid-cols-5 gap-4">
          {wallets.map((w) => {
            const ccy = w === 'bitso-qeur' ? 'EUR' : w.slice(-3).toUpperCase();
            return (
              <div
                key={w}
                className={cn(
                  'rounded-xl border p-4',
                  w === 'bitso-qeur'
                    ? 'border-amber/40 bg-amber-soft'
                    : 'border-dashed border-line-strong',
                )}
              >
                <div className="flex items-center justify-between text-[12px] text-muted">
                  <span>{w === 'bitso-qeur' ? L.qeur : `Bitso · ${ccy}`}</span>
                  <Chip tone="neutral">{L.connected}</Chip>
                </div>
                <div className="tabular mt-2 text-[17px]">
                  {ccy} {fmtAmount(state.wallets[w], w === 'bitso-qeur' ? 2 : 0)}
                </div>
                <div className="mt-1 truncate font-mono text-[10.5px] text-muted">
                  {WALLET_ADDRESS[w]}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 truncate text-[11.5px] text-muted">
          {L.master}: <span className="font-mono">{MASTER_ADDRESS}</span>
        </p>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card tone="new" className="col-span-12 xl:col-span-5">
          <CardHeader title={L.decideTitle} aside={<LayerTag layer="new" />} />
          <div className="flex gap-2" role="radiogroup" aria-label={L.country}>
            {LATAM.map((l) => (
              <Button
                key={l.country}
                size="sm"
                role="radio"
                aria-checked={country === l.country}
                variant={country === l.country ? 'new' : 'secondary'}
                onClick={() => setCountry(l.country)}
              >
                {entityById(l.entity).country} · {l.currency}
              </Button>
            ))}
          </div>
          <div className="mb-2 mt-5 flex justify-between text-[12px]">
            <span className="text-muted">{L.share}</span>
            <span className="tabular">
              {share}% · {cfg.currency} {fmtAmount(local)}
            </span>
          </div>
          <Slider
            aria-label={L.share}
            min={10}
            max={100}
            step={10}
            value={[share]}
            onValueChange={([v]) => setShare(v)}
          />
          <div className="mt-5 rounded-xl bg-surface-2 px-4 py-2">
            <Row k={L.rate} v={q.rate.toFixed(digits)} />
            <Row k={L.fees} v={fmtEur(q.fee)} />
            <Row k={L.receive} v={<span className="text-new">{fmtEur(q.eur)}</span>} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
            <Lock className="size-3.5" />
            {L.quoteLocked(CORRIDOR_PRICING.lockMinutes)}
          </p>
          <div className="mt-4 rounded-xl border border-line px-4 py-2 text-[12.5px]">
            <div className="py-1 font-medium">{L.tradTitle}</div>
            <Row k={L.tradReceive} v={fmtEur(q.tradEur)} />
            <Row k={L.tradFees} v={`−${fmtEur(q.tradFee)}`} />
            <p className="pb-1 text-muted">{L.tradValue}</p>
          </div>
          <Button
            className="mt-5 w-full"
            variant="primary"
            disabled={local <= 0}
            onClick={() => addAction({ kind: 'repatriate', country, local })}
          >
            <Lock /> {L.lock}
          </Button>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title={L.trackerTitle} />
          {state.repatriations.length === 0 && <p className="text-[13px] text-muted">{L.none}</p>}
          <div className="space-y-5">
            {state.repatriations.map((r) => (
              <div key={r.id} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-medium">
                    {r.currency} {fmtAmount(r.local)}{' '}
                    <ArrowRight className="inline size-3.5 text-muted" /> {fmtEur(r.eur)}
                  </div>
                  <Chip tone={r.status === 'credited' ? 'new' : 'amber'}>
                    {
                      L.steps[
                        (r.steps.filter((s) => s.at <= t).slice(-1)[0]?.key ??
                          'lock') as keyof typeof L.steps
                      ]
                    }
                  </Chip>
                </div>
                <ol className="mt-3 space-y-2">
                  {r.steps.map((s) => {
                    const done = s.at <= t;
                    return (
                      <li key={s.key} className="flex items-start gap-3 text-[12.5px]">
                        <span
                          className={cn(
                            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                            done ? 'border-new bg-new text-bg' : 'border-line-strong',
                          )}
                        >
                          {done && <Check className="size-2.5" />}
                        </span>
                        <span className={cn('flex-1', !done && 'text-muted')}>
                          {L.steps[s.key as keyof typeof L.steps]}
                          {s.key === 'lock' && (
                            <span className="text-muted">
                              {' '}
                              · {L.lockUntil(formatDateTime(r.lockUntil))}
                            </span>
                          )}
                          {s.key === 'wallet' && s.at - r.lockedAt > 1 && (
                            <span className="text-amber"> · {L.waitingRail}</span>
                          )}
                          {s.key === 'credit' && done && (
                            <span className="block text-new">{L.earning}</span>
                          )}
                        </span>
                        <span className="tabular text-muted">{formatDateTime(s.at)}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-line-strong p-4">
            <div className="text-[12.5px] font-medium">{L.complianceTitle}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-muted">
              {L.compliance.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Corridors() {
  return (
    <div>
      <PageHeader eyebrow={K.eyebrow} title={K.title} lead={K.lead} />
      <Tabs defaultValue="rails">
        <TabsList>
          <TabsTrigger value="rails">{K.tabs.rails}</TabsTrigger>
          <TabsTrigger value="latam">{K.tabs.latam}</TabsTrigger>
        </TabsList>
        <TabsContent value="rails">
          <RailsTab />
        </TabsContent>
        <TabsContent value="latam">
          <LatamTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
