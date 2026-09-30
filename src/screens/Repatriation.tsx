import { useState } from 'react';
import { ArrowRight, Check, Landmark, Lock, Wallet } from 'lucide-react';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { CORRIDOR_PRICING, LATAM, MASTER_ADDRESS, WALLET_ADDRESS } from '@/data/corridors';
import { entityById } from '@/data/entities';
import { FX_MID, RATES } from '@/data/rates';
import { ApprovalButton } from '@/components/ApprovalButton';

type FlowKind = 'dividend' | 'loan' | 'royalties';
import { formatDateTime } from '@/engine/clock';
import { repatriationQuote } from '@/engine/advanced';
import { fmtAmount, fmtEur, fmtM } from '@/engine/format';
import type { LatamCountry } from '@/engine/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Slider } from '@/components/ui/slider';
import { Row } from '@/components/Page';
import { JourneyHeader } from '@/components/Journey';
import { cn } from '@/lib/utils';

const L = en.corridors.latam;
const P = en.repatriation;

export function Repatriation() {
  const { t, state } = useSim();
  const [country, setCountry] = useState<LatamCountry>('BR');
  const [share, setShare] = useState(50);
  const [flow, setFlow] = useState<FlowKind>('dividend');
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const cfg = LATAM.find((l) => l.country === country)!;
  const e = entityById(cfg.entity);
  const balance = state.bal[cfg.account];
  const local = Math.max(0, (balance * share) / 100);
  const q = repatriationQuote(cfg, local);
  const needed = [...P.qualify.flows[flow].docs, ...P.qualify.common];
  const qualified = needed.every((d) => docs[d]);
  const gross = local / FX_MID[cfg.currency];
  const gap = {
    spread: (gross * (CORRIDOR_PRICING.tradBps - CORRIDOR_PRICING.partnerBps)) / 10_000,
    fees: CORRIDOR_PRICING.tradFeesEur - CORRIDOR_PRICING.networkFeeEur,
    days: (gross * RATES.overnightUnit * CORRIDOR_PRICING.tradValueDays) / 360,
  };
  const digits = cfg.currency === 'COP' || cfg.currency === 'CLP' ? 0 : 4;
  const mine = state.repatriations.filter((r) => r.country === country);
  const last = mine[mine.length - 1];
  const stage = !last
    ? -1
    : ['locked', 'inWallet', 'converted', 'inTransit', 'credited'].indexOf(last.status);

  const partner = P.partner;
  const boxes = [
    {
      icon: Landmark,
      title: P.box.bank(e.city),
      value: `${cfg.currency} ${fmtAmount(balance)}`,
      sub: `≈ ${fmtM(balance / FX_MID[cfg.currency])} · ${cfg.localRail}`,
      on: stage <= 0,
      outside: true,
    },
    {
      icon: Wallet,
      title: P.box.wallet(cfg.currency),
      value: `${cfg.currency} ${fmtAmount(state.wallets[cfg.wallet])}`,
      sub: WALLET_ADDRESS[cfg.wallet],
      on: stage === 1,
      outside: true,
    },
    {
      icon: Wallet,
      title: L.qeur,
      value: `EUR ${fmtAmount(state.wallets['bitso-qeur'], 2)}`,
      sub: stage === 3 ? P.box.inTransit : WALLET_ADDRESS['bitso-qeur'],
      on: stage === 2 || stage === 3,
      outside: true,
    },
    {
      icon: Landmark,
      title: P.box.tok,
      value: last && stage === 4 ? `+ ${fmtEur(last.eur, 'EUR', 0)}` : '—',
      sub: P.box.tokSub,
      on: stage === 4,
      outside: false,
    },
  ];

  return (
    <div className="space-y-6">
      <JourneyHeader id="brazil" />

      <div className="flex items-center gap-2 text-[12.5px] text-muted">
        {P.also}
        {LATAM.map((l) => (
          <Button
            key={l.country}
            size="sm"
            variant={country === l.country ? 'new' : 'ghost'}
            onClick={() => setCountry(l.country)}
            aria-pressed={country === l.country}
          >
            {entityById(l.entity).country}
          </Button>
        ))}
      </div>

      <Card data-tour="brazil-pipeline">
        <CardHeader title={P.pipeTitle} eyebrow={P.pipeLead} />
        <div className="grid grid-cols-[1fr_20px_1fr_20px_1fr_20px_1fr] items-stretch gap-2">
          {boxes.map((b, i) => (
            <div key={i} className="contents">
              <div
                className={cn(
                  'rounded-2xl p-4 transition-colors',
                  b.outside
                    ? 'border border-dashed border-line-strong'
                    : 'border border-new/40 bg-new-soft',
                  b.on && 'ring-2 ring-new/60',
                )}
              >
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <b.icon className="size-4" /> {b.title}
                </div>
                {(i === 1 || i === 2) && (
                  <div className="mt-0.5 text-[10.5px] text-muted">{partner}</div>
                )}
                <div className={cn('tabular mt-2 text-[17px]', !b.outside && 'text-new')}>
                  {b.value}
                </div>
                <div className="mt-1 truncate font-mono text-[10.5px] text-muted">{b.sub}</div>
              </div>
              {i < boxes.length - 1 && <ArrowRight className="size-4 self-center text-muted" />}
            </div>
          ))}
        </div>
        <p className="mt-3 truncate text-[11.5px] text-muted">
          {L.master}: <span className="font-mono">{MASTER_ADDRESS}</span>
        </p>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card tone="new" className="col-span-12 xl:col-span-5">
          <CardHeader title={P.qualify.title} eyebrow={P.qualify.lead} />
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={P.qualify.title}>
            {(Object.keys(P.qualify.flows) as FlowKind[]).map((k) => (
              <Button
                key={k}
                size="sm"
                role="radio"
                aria-checked={flow === k}
                variant={flow === k ? 'new' : 'secondary'}
                onClick={() => {
                  setFlow(k);
                  setDocs({});
                }}
              >
                {P.qualify.flows[k].label}
              </Button>
            ))}
          </div>
          <ul className="mt-4 space-y-1.5">
            {[...P.qualify.flows[flow].docs, ...P.qualify.common].map((d) => (
              <li key={d}>
                <label className="flex cursor-pointer items-start gap-2 text-[12.5px]">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--new)]"
                    checked={!!docs[d]}
                    onChange={(e) => setDocs({ ...docs, [d]: e.target.checked })}
                  />
                  <span>{d}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className={cn('mt-2 text-[12px]', qualified ? 'text-new' : 'text-muted')}>
            {qualified ? P.qualify.ready : P.qualify.pending}
          </p>

          <div className="mb-2 mt-5 flex justify-between text-[12.5px]">
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
            <Row k={L.receive} v={<span className="text-[16px] text-new">{fmtEur(q.eur)}</span>} />
          </div>
          <div className="mt-3 rounded-xl border border-line px-4 py-2 text-[12.5px]">
            <div className="py-1 font-medium">{P.gap.title}</div>
            <Row k={P.gap.spread} v={fmtEur(gap.spread, 'EUR', 0)} />
            <Row k={P.gap.fees} v={fmtEur(gap.fees, 'EUR', 0)} />
            <Row k={P.gap.days} v={fmtEur(gap.days, 'EUR', 0)} />
            <Row
              k={<span className="text-fg">{P.gap.total}</span>}
              v={
                <span className="text-new">
                  {fmtEur(gap.spread + gap.fees + gap.days, 'EUR', 0)}
                </span>
              }
              className="border-t border-line"
            />
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[12px] text-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            {L.quoteLocked(CORRIDOR_PRICING.lockMinutes)} {P.weekend}
          </p>
          <ApprovalButton
            className="mt-4 w-full"
            size="lg"
            disabled={local <= 0 || !qualified}
            request={{
              title: P.approvalTitle(
                P.qualify.flows[flow].label,
                `${cfg.currency} ${fmtAmount(local)}`,
              ),
              detail: P.approvalDetail(fmtEur(q.eur, 'EUR', 0)),
              amountEur: q.eur,
              action: { kind: 'repatriate', country, local },
            }}
          >
            <Lock /> {L.lock}
          </ApprovalButton>
          <p className="mt-2 text-center text-[11.5px] text-muted">{P.hint}</p>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title={L.trackerTitle} />
          {mine.length === 0 && <p className="text-[13px] text-muted">{L.none}</p>}
          <div className="space-y-4">
            {[...mine].reverse().map((r) => (
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
          <details className="mt-5 rounded-xl border border-dashed border-line-strong px-4 py-3">
            <summary className="cursor-pointer text-[12.5px] font-medium">
              {L.complianceTitle}
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-muted">
              {L.compliance.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </details>
        </Card>
      </div>
    </div>
  );
}
