import { useState } from 'react';
import { ArrowRight, Check, Landmark, Lock, Wallet } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { CORRIDOR_PRICING, LATAM, MASTER_ADDRESS, WALLET_ADDRESS } from '@/data/corridors';
import { entityById } from '@/data/entities';
import { FX_MID } from '@/data/rates';
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
  const addAction = useApp((s) => s.addAction);
  const [country, setCountry] = useState<LatamCountry>('BR');
  const [share, setShare] = useState(50);
  const cfg = LATAM.find((l) => l.country === country)!;
  const e = entityById(cfg.entity);
  const balance = state.bal[cfg.account];
  const local = Math.max(0, (balance * share) / 100);
  const q = repatriationQuote(cfg, local);
  const digits = cfg.currency === 'COP' || cfg.currency === 'CLP' ? 0 : 4;
  const mine = state.repatriations.filter((r) => r.country === country);
  const last = mine[mine.length - 1];
  const stage = !last
    ? -1
    : ['locked', 'inWallet', 'converted', 'inTransit', 'credited'].indexOf(last.status);

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

      <Card>
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
          <CardHeader title={L.decideTitle} />
          <div className="mb-2 flex justify-between text-[12.5px]">
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
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
            <Lock className="size-3.5" />
            {L.quoteLocked(CORRIDOR_PRICING.lockMinutes)}
          </p>
          <p className="mt-3 text-[12.5px] text-muted">
            {P.vsTrad(fmtEur(q.tradEur), fmtEur(q.eur - q.tradEur))}
          </p>
          <Button
            className="mt-5 w-full"
            size="lg"
            variant="primary"
            disabled={local <= 0}
            onClick={() => addAction({ kind: 'repatriate', country, local })}
          >
            <Lock /> {L.lock}
          </Button>
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
