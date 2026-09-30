import { useState } from 'react';
import { ArrowDown, Check, Send, ShieldAlert, X } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { ORACLE_ENDPOINT, ORACLES, TEMPLATES } from '@/data/escrow';
import { ACCOUNTS } from '@/data/accounts';
import { MIN_PER_DAY, formatDateTime, isoStamp } from '@/engine/clock';
import { ledgerOpportunity } from '@/engine/markets';
import { fmtEur, fmtM, fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { LayerTag, PageHeader, Row } from '@/components/Page';
import { MinuteRing } from '@/components/MinuteRing';
import { cn } from '@/lib/utils';

const E = en.escrow;
const oracleFor = (milestone: string) => ORACLES.find((o) => o.milestones.includes(milestone))!;

function ruleText(tplId: string, id: string, expiry: number) {
  const tpl = TEMPLATES.find((x) => x.id === tplId)!;
  const iban = ACCOUNTS.find((a) => a.id === 'tok-paris')!.iban;
  const lines = [
    `escrow "${id}" {`,
    `  amount    EUR ${tpl.amount.toLocaleString('en-GB')} on tokenised account ${iban}`,
    `  purpose   "${tpl.purpose}"`,
    `  payees    only [${tpl.payees.map((p) => `"${p}"`).join(', ')}]`,
    ...tpl.milestones.map(
      (m) =>
        `  when ${oracleFor(m.key).id}.${m.key.padEnd(12)} -> release ${String(Math.round(m.share * 100)).padStart(3)}% to payees[0]`,
    ),
    `  on expiry ${isoStamp(expiry).slice(0, 10)} -> return remainder to "${tpl.returnTo}"`,
    `  interest  to the minute -> buyer`,
    `  at night  flagged overnight unit (not transferable)`,
    `}`,
  ];
  return lines.join('\n');
}

function Setup() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const [tplId, setTpl] = useState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find((x) => x.id === tplId)!;
  const deployed = state.conditional.some(
    (c) => c.kind === 'escrow' && c.escrow?.template === tplId,
  );
  const previewId = `ESC-${tpl.id.toUpperCase()}`;
  const expiry = t + tpl.expiryDays * MIN_PER_DAY;
  const first = tpl.milestones.find((m) => m.share > 0) ?? tpl.milestones[0];
  const payload = JSON.stringify(
    {
      escrow: previewId,
      milestone: first.key,
      document: 'sha256:9f2c…e81a',
      occurredAt: isoStamp(t).slice(0, 16) + '+02:00',
    },
    null,
    2,
  );

  return (
    <Card tone="new" className="col-span-12 xl:col-span-7">
      <CardHeader title={E.setup} aside={<LayerTag layer="new" />} />
      <div className="flex gap-2" role="radiogroup" aria-label={E.template}>
        {TEMPLATES.map((x) => (
          <Button
            key={x.id}
            size="sm"
            role="radio"
            aria-checked={x.id === tplId}
            variant={x.id === tplId ? 'new' : 'secondary'}
            onClick={() => setTpl(x.id)}
          >
            {x.name}
          </Button>
        ))}
      </div>

      <div className="mt-6 text-[13px] font-medium">{E.step1}</div>
      <div className="mt-2 rounded-xl bg-surface-2 px-4 py-2">
        <Row k={E.purpose} v={tpl.purpose} />
        <Row k={E.payees} v={tpl.payees.join(', ')} />
        <Row k={en.guarantees.amount} v={fmtM(tpl.amount, 'EUR', 0)} />
        <Row k={E.returnTo} v={tpl.returnTo} />
        <Row k={E.expiry} v={formatDateTime(expiry)} />
      </div>

      <div className="mt-5 text-[13px] font-medium">{E.step2}</div>
      <table className="mt-2 w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-1.5 font-normal">{E.milestone}</th>
            <th className="pb-1.5 font-normal">{E.source}</th>
            <th className="pb-1.5 text-right font-normal">{E.share}</th>
          </tr>
        </thead>
        <tbody>
          {tpl.milestones.map((m) => (
            <tr key={m.key} className="border-t border-line">
              <td className="py-2">{m.label}</td>
              <td className="py-2 text-muted">{oracleFor(m.key).provider}</td>
              <td className="tabular py-2 text-right">{fmtPct(m.share, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 text-[13px] font-medium">{E.step3}</div>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-surface-2 px-4 py-2 text-[12.5px]">
          <Row
            k={E.endpoint}
            v={
              <span className="font-mono text-[11px]">POST …/escrow/v1/{'{id}'}/oracle-events</span>
            }
          />
          {[...new Set(tpl.milestones.map((m) => oracleFor(m.key).id))].map((o) => (
            <Row
              key={o}
              k={ORACLES.find((x) => x.id === o)!.name}
              v={
                <span className="text-[11.5px] text-muted">
                  {ORACLES.find((x) => x.id === o)!.auth}
                </span>
              }
            />
          ))}
        </div>
        <div>
          <div className="mb-1 text-[11.5px] text-muted">{E.payload}</div>
          <pre className="scrollbar-thin overflow-auto rounded-xl bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
            {payload}
          </pre>
        </div>
      </div>

      <div className="mt-5 text-[13px] font-medium">{E.ruleTitle}</div>
      <pre className="scrollbar-thin mt-2 overflow-auto rounded-xl border border-new/30 bg-surface-2 p-4 font-mono text-[11.5px] leading-relaxed">
        {ruleText(tplId, previewId, expiry)}
      </pre>
      <p className="mt-2 text-[11.5px] text-muted">{E.ruleNote}</p>

      <Button
        className="mt-5 w-full"
        variant="primary"
        disabled={deployed}
        onClick={() => addAction({ kind: 'escrow', template: tplId })}
      >
        {deployed ? (
          <>
            <Check /> {E.deployed}
          </>
        ) : (
          E.deploy
        )}
      </Button>
    </Card>
  );
}

function Live() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const escrows = state.conditional.filter((c) => c.kind === 'escrow');
  return (
    <Card className="col-span-12 xl:col-span-5">
      <CardHeader title={E.live} />
      {escrows.length === 0 && <p className="text-[13px] text-muted">{E.none}</p>}
      <div className="space-y-5">
        {escrows.map((c) => {
          const released = c.released ?? 0;
          let interest = ledgerOpportunity(c.amount, c.since, t);
          for (const ev of c.events ?? []) {
            if (!ev.accepted) continue;
            const m = c.escrow!.milestones.find((x) => x.key === ev.milestone);
            if (m) interest -= ledgerOpportunity(c.amount * m.share, ev.t, t);
          }
          return (
            <div key={c.id} className="rounded-xl border border-new/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-muted">{c.id}</div>
                  <div className="text-[14px] font-medium">
                    {TEMPLATES.find((x) => x.id === c.escrow!.template)!.name}
                  </div>
                </div>
                <Chip tone={c.status === 'released' ? 'neutral' : 'new'}>
                  {c.status === 'released' ? E.releasedLabel : E.active}
                </Chip>
              </div>
              <Row k={E.held} v={fmtM(c.amount - released, 'EUR', 2)} />
              <Row k={E.releasedLabel} v={fmtM(released, 'EUR', 2)} />
              <Row
                k={
                  <span className="flex items-center gap-2">
                    <MinuteRing size={14} progress={(t % 60) / 60} />
                    {E.interest}
                  </span>
                }
                v={<span className="text-new">{fmtEur(interest)}</span>}
              />
              <ul className="mt-3 space-y-2">
                {c.escrow!.milestones.map((m) => (
                  <li key={m.key} className="flex items-center gap-3 text-[12.5px]">
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border',
                        m.done ? 'border-new bg-new text-bg' : 'border-line-strong',
                      )}
                    >
                      {m.done && <Check className="size-3" />}
                    </span>
                    <span className="flex-1">
                      {m.label} <span className="text-muted">· {fmtPct(m.share, 0)}</span>
                    </span>
                    {!m.done && (
                      <span className="flex gap-1">
                        <Button
                          size="sm"
                          variant="new"
                          onClick={() =>
                            addAction({
                              kind: 'oracle',
                              target: c.id,
                              milestone: m.key,
                              valid: true,
                            })
                          }
                          aria-label={`${E.sendOk}: ${m.label}`}
                        >
                          <Send /> {E.sendOk}
                        </Button>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          onClick={() =>
                            addAction({
                              kind: 'oracle',
                              target: c.id,
                              milestone: m.key,
                              valid: false,
                            })
                          }
                          aria-label={`${E.sendBad}: ${m.label}`}
                          title={E.sendBad}
                        >
                          <ShieldAlert />
                        </Button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-[12px] font-medium">{E.log}</div>
              {(c.events ?? []).length === 0 ? (
                <p className="mt-1 text-[12px] text-muted">{E.noEvents}</p>
              ) : (
                <ul className="mt-1.5 space-y-1.5">
                  {[...(c.events ?? [])].reverse().map((ev, i) => (
                    <li key={i} className="rounded-lg bg-surface-2 px-3 py-2 text-[11.5px]">
                      <div className="flex items-center justify-between">
                        <span className="tabular text-muted">
                          {formatDateTime(ev.t)} · {ev.source}
                        </span>
                        <span
                          className={cn(
                            'flex items-center gap-1',
                            ev.accepted ? 'text-new' : 'text-red',
                          )}
                        >
                          {ev.accepted ? <Check className="size-3" /> : <X className="size-3" />}
                          {ev.accepted ? E.accepted : E.rejected}
                        </span>
                      </div>
                      <div className="mt-0.5">{ev.outcome}</div>
                      <code className="mt-1 block truncate font-mono text-[10.5px] text-muted">
                        {ev.payload}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 truncate font-mono text-[10.5px] text-muted">
                POST {ORACLE_ENDPOINT(c.id)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-[12px] leading-relaxed text-muted">{E.alm}</p>
    </Card>
  );
}

export function Escrow() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={E.eyebrow} title={E.title} lead={E.lead} />
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader title={E.linkTitle} />
          <ol className="space-y-1">
            {E.link.map((l, i) => (
              <li key={l.k}>
                <div
                  className={cn('rounded-xl px-4 py-2.5', i === 0 ? 'bg-new-soft' : 'bg-surface-2')}
                >
                  <div className={cn('text-[13.5px] font-medium', i === 0 && 'text-new')}>
                    {l.k}
                  </div>
                  <div className="text-[12.5px] text-muted">{l.v}</div>
                </div>
                {i < E.link.length - 1 && (
                  <ArrowDown className="mx-auto my-0.5 size-3.5 text-muted" />
                )}
              </li>
            ))}
          </ol>
        </Card>
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title={E.tradTitle} aside={<LayerTag layer="traditional" />} />
          <p className="text-[13.5px] leading-relaxed text-muted">{E.trad}</p>
        </Card>
        <Setup />
        <Live />
      </div>
    </div>
  );
}
