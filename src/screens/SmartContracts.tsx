import { useState } from 'react';
import { ArrowRight, Check, Flag, OctagonX, Play, Send, ShieldAlert, X, Zap } from 'lucide-react';
import { ApprovalButton } from '@/components/ApprovalButton';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { ORACLE_ENDPOINT, ORACLES, TEMPLATES } from '@/data/escrow';
import { ACCOUNTS } from '@/data/accounts';
import { MIN_PER_DAY, formatDateTime, hhmm, isoStamp } from '@/engine/clock';
import { ledgerOpportunity } from '@/engine/markets';
import { fmtEur, fmtM } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Row } from '@/components/Page';
import { JourneyHeader } from '@/components/Journey';
import { MinuteRing } from '@/components/MinuteRing';
import { cn } from '@/lib/utils';

const E = en.escrow;
const S = en.contracts;
const oracleFor = (milestone: string) => ORACLES.find((o) => o.milestones.includes(milestone))!;

function ruleText(tplId: string, id: string, expiry: number) {
  const tpl = TEMPLATES.find((x) => x.id === tplId)!;
  const iban = ACCOUNTS.find((a) => a.id === 'tok-paris')!.iban;
  const lines = [
    `contract "${id}" {`,
    `  amount    EUR ${tpl.amount.toLocaleString('en-GB')} on tokenised account ${iban}`,
    `  payees    only [${tpl.payees.map((p) => `"${p}"`).join(', ')}]`,
    ...tpl.milestones.flatMap((m) =>
      m.payouts
        ? [
            `  when ${oracleFor(m.key).id}.${m.key} ->`,
            ...m.payouts.map(
              (p, i) =>
                `    ${i + 1}. pay ${String(Math.round(p.share * 100)).padStart(2)}% to "${p.payee}"`,
            ),
          ]
        : [
            `  when ${oracleFor(m.key).id}.${m.key} -> pay ${Math.round(m.share * 100)}% to payees[0]`,
          ],
    ),
    `  on expiry ${isoStamp(expiry).slice(0, 10)} -> return the rest to "${tpl.returnTo}"`,
    `  interest  to the minute -> ${tpl.returnTo.split(' —')[0]}`,
    `}`,
  ];
  return lines.join('\n');
}

/** Event → payments, drawn as a flow: the event on the left, each payment in order. */
function Flow({ tplId }: { tplId: string }) {
  const tpl = TEMPLATES.find((x) => x.id === tplId)!;
  return (
    <div className="space-y-3">
      {tpl.milestones.map((m) => {
        const pays = m.payouts ?? (m.share > 0 ? [{ payee: tpl.payees[0], share: m.share }] : []);
        return (
          <div key={m.key} className="grid grid-cols-[1fr_24px_1.4fr] items-center gap-2">
            <div className="rounded-xl border border-new/40 bg-new-soft px-3 py-2.5">
              <div className="text-[12px] text-new">{S.when}</div>
              <div className="text-[13px] font-medium">{m.label}</div>
              <div className="text-[11px] text-muted">{oracleFor(m.key).provider}</div>
            </div>
            <ArrowRight className="size-4 text-muted" />
            <div className="space-y-1.5">
              {pays.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line-strong px-3 py-2 text-[12px] text-muted">
                  {S.gate}
                </div>
              ) : (
                pays.map((p, i) => (
                  <div
                    key={p.payee + i}
                    className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[12.5px]"
                  >
                    <span className="min-w-0 truncate">
                      {pays.length > 1 && <span className="mr-1.5 text-muted">{i + 1}.</span>}
                      {p.payee}
                    </span>
                    <span className="tabular shrink-0">{fmtM(tpl.amount * p.share, 'EUR', 2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Build() {
  const { t, state } = useSim();
  const [tplId, setTpl] = useState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find((x) => x.id === tplId)!;
  const deployed = state.conditional.some(
    (c) => c.kind === 'escrow' && c.escrow?.template === tplId,
  );
  const expiry = t + tpl.expiryDays * MIN_PER_DAY;
  const first = tpl.milestones.find((m) => m.share > 0) ?? tpl.milestones[0];
  const payload = JSON.stringify(
    {
      contract: `SC-${tpl.id.toUpperCase()}`,
      event: first.key,
      document: 'sha256:9f2c…e81a',
      occurredAt: isoStamp(t).slice(0, 16) + '+02:00',
    },
    null,
    2,
  );
  const sources = [...new Set(tpl.milestones.map((m) => oracleFor(m.key).id))].map((id) =>
    ORACLES.find((o) => o.id === id)!,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label={E.template}>
        {TEMPLATES.map((x) => (
          <button
            key={x.id}
            role="radio"
            aria-checked={x.id === tplId}
            onClick={() => setTpl(x.id)}
            className={cn(
              'card cursor-pointer p-5 text-left transition-colors',
              x.id === tplId ? 'border-new/60' : 'hover:border-line-strong',
            )}
          >
            <div className="text-[12px] text-muted">{S.kinds[x.id as keyof typeof S.kinds]}</div>
            <div className="mt-1 text-[15px] font-medium leading-snug">{x.name}</div>
            <div className="tabular mt-2 text-[13px] text-muted">{fmtM(x.amount, 'EUR', 0)}</div>
          </button>
        ))}
      </div>

      <Card tone="new">
        <CardHeader eyebrow={tpl.purpose} title={S.flowTitle} />
        <Flow tplId={tplId} />
        <div className="mt-5 grid grid-cols-3 gap-4 text-[12.5px]">
          <div className="rounded-xl bg-surface-2 px-4 py-3">
            <div className="text-muted">{S.where}</div>
            <div className="mt-0.5">{S.whereText}</div>
          </div>
          <div className="rounded-xl bg-surface-2 px-4 py-3">
            <div className="text-muted">{S.only}</div>
            <div className="mt-0.5">{S.onlyText}</div>
          </div>
          <div className="rounded-xl bg-surface-2 px-4 py-3">
            <div className="text-muted">{S.ifNot}</div>
            <div className="mt-0.5">{S.ifNotText(formatDateTime(expiry))}</div>
          </div>
        </div>
        <details className="mt-5 rounded-xl border border-line px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-medium">{S.forIt}</summary>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="text-[12px]">
              <Row
                k={E.endpoint}
                v={
                  <span className="font-mono text-[11px]">POST …/contracts/v1/{'{id}'}/events</span>
                }
              />
              {sources.map((o) => (
                <Row
                  key={o.id}
                  k={o.name}
                  v={<span className="text-[11.5px] text-muted">{o.auth}</span>}
                />
              ))}
              <div className="mb-1 mt-3 text-muted">{E.payload}</div>
              <pre className="overflow-auto rounded-xl bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
                {payload}
              </pre>
            </div>
            <div>
              <div className="mb-1 text-[12px] text-muted">{E.ruleTitle}</div>
              <pre className="scrollbar-thin overflow-auto rounded-xl bg-surface-2 p-3 font-mono text-[11px] leading-relaxed">
                {ruleText(tplId, `SC-${tpl.id.toUpperCase()}`, expiry)}
              </pre>
              <p className="mt-2 text-[11.5px] text-muted">{E.ruleNote}</p>
            </div>
          </div>
        </details>
        <div className="mt-5 rounded-xl border border-line p-4">
          <div className="text-[13px] font-medium">{S.guardTitle}</div>
          <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px]">
            <li>
              <span className="text-muted">{S.guard.cap}: </span>
              {fmtM(tpl.capPerDay, 'EUR', 0)}
            </li>
            <li>
              <span className="text-muted">{S.guard.window}: </span>
              {S.guard.windowV}
            </li>
            <li>
              <span className="text-muted">{S.guard.kill}: </span>
              {S.guard.killV}
            </li>
            <li>
              <span className="text-muted">{S.guard.oracle}: </span>
              {S.guard.oracleV}
            </li>
            <li className="col-span-2">
              <span className="text-muted">{S.guard.accounting}: </span>
              {S.guard.accountingV}
            </li>
          </ul>
        </div>
        <ApprovalButton
          className="mt-5 w-full"
          size="lg"
          disabled={deployed}
          request={{
            title: S.deployTitle(tpl.name),
            detail: tpl.purpose,
            amountEur: tpl.amount,
            action: { kind: 'escrow', template: tplId },
          }}
        >
          {deployed ? (
            <>
              <Check /> {E.deployed}
            </>
          ) : (
            <>
              <Zap /> {S.deploy(fmtM(tpl.amount, 'EUR', 0))}
            </>
          )}
        </ApprovalButton>
      </Card>
    </div>
  );
}

function Live() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const contracts = state.conditional.filter((c) => c.kind === 'escrow');
  if (contracts.length === 0) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-[24px]">{S.liveTitle}</h2>
      {contracts.map((c) => {
        const tpl = TEMPLATES.find((x) => x.id === c.escrow!.template)!;
        const released = c.released ?? 0;
        let interest = ledgerOpportunity(c.amount, c.since, t);
        for (const m of c.escrow!.milestones)
          if (m.paid && m.payAt !== undefined)
            interest -= ledgerOpportunity(c.amount * m.share, m.payAt, t);
        return (
          <Card key={c.id} className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[16px] font-medium">{tpl.name}</div>
                <span className="flex items-center gap-2">
                  <Chip tone={c.paused ? 'red' : c.status === 'released' ? 'neutral' : 'new'}>
                    {c.paused ? S.pausedChip : c.status === 'released' ? E.releasedLabel : E.active}
                  </Chip>
                  {c.status !== 'released' && (
                    <Button
                      size="sm"
                      variant={c.paused ? 'new' : 'danger'}
                      onClick={() =>
                        addAction({ kind: 'contractPause', target: c.id, paused: !c.paused })
                      }
                    >
                      {c.paused ? <Play /> : <OctagonX />} {c.paused ? S.resume : S.pause}
                    </Button>
                  )}
                </span>
              </div>
              <Row k={E.held} v={fmtM(c.amount - released, 'EUR', 2)} className="mt-2" />
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
              <div className="mt-4 space-y-2">
                {c.escrow!.milestones.map((m) => (
                  <div key={m.key} className="flex items-center gap-3 text-[13px]">
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border',
                        m.paid
                          ? 'border-new bg-new text-bg'
                          : m.done
                            ? 'border-amber'
                            : 'border-line-strong',
                      )}
                    >
                      {m.paid && <Check className="size-3" />}
                    </span>
                    <span className="flex-1">
                      {m.label}
                      {m.done && !m.paid && (
                        <span
                          className={cn(
                            'block text-[11.5px]',
                            m.contested ? 'text-red' : 'text-amber',
                          )}
                        >
                          {m.contested ? S.contested : S.inWindow(hhmm(m.payAt ?? t))}
                        </span>
                      )}
                    </span>
                    {m.done && !m.paid && !m.contested && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          addAction({ kind: 'contest', target: c.id, milestone: m.key })
                        }
                      >
                        <Flag /> {S.contest}
                      </Button>
                    )}
                    {!m.done && (
                      <>
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
                          <Send /> {S.simulate}
                        </Button>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          title={E.sendBad}
                          onClick={() =>
                            addAction({
                              kind: 'oracle',
                              target: c.id,
                              milestone: m.key,
                              valid: false,
                            })
                          }
                          aria-label={`${E.sendBad}: ${m.label}`}
                        >
                          <ShieldAlert />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 xl:col-span-7">
              <div className="text-[13px] font-medium">{S.whatHappened}</div>
              {(c.events ?? []).length === 0 ? (
                <p className="mt-2 text-[12.5px] text-muted">{S.waiting}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {[...(c.events ?? [])].reverse().map((ev, i) => {
                    const m = c.escrow!.milestones.find((x) => x.key === ev.milestone);
                    const pays =
                      ev.accepted && m && ev.source === en.adv.escrowRule
                        ? (m.payouts ??
                          (m.share > 0 ? [{ payee: tpl.payees[0], share: m.share }] : []))
                        : [];
                    return (
                      <li key={i} className="rounded-xl bg-surface-2 px-4 py-3 text-[12.5px]">
                        <div className="flex items-center justify-between">
                          <span className="tabular text-muted">
                            {formatDateTime(ev.t)} · {m?.label ?? ev.milestone}
                          </span>
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              ev.accepted ? 'text-new' : 'text-red',
                            )}
                          >
                            {ev.accepted ? (
                              <Check className="size-3.5" />
                            ) : (
                              <X className="size-3.5" />
                            )}
                            {ev.accepted ? E.accepted : E.rejected}
                          </span>
                        </div>
                        <div className="mt-1 text-muted">{ev.outcome}</div>
                        {pays.length > 0 && (
                          <ol className="mt-2 space-y-1">
                            {pays.map((p, j) => (
                              <li key={j} className="flex justify-between">
                                <span>
                                  {pays.length > 1 ? `${j + 1}. ` : ''}
                                  {p.payee}
                                </span>
                                <span className="tabular text-new">
                                  {fmtM(c.amount * p.share, 'EUR', 2)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-3 truncate font-mono text-[10.5px] text-muted">
                POST {ORACLE_ENDPOINT(c.id)}
              </div>
            </div>
          </Card>
        );
      })}
      <p className="text-[12px] text-muted">{E.alm}</p>
    </div>
  );
}

export function SmartContracts() {
  return (
    <div className="space-y-8">
      <JourneyHeader id="contracts" />
      <Build />
      <Live />
    </div>
  );
}
