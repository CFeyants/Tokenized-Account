import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { bankById, entityById } from '@/data/entities';
import { ACCOUNTS } from '@/data/accounts';
import { accountRows } from '@/engine/selectors';
import { fmtAmount } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/Page';
import { HorizonTag } from '@/components/Journey';
import { cn } from '@/lib/utils';

const T = en.tms;

const API = `POST /v1/rules
Authorization: Bearer <TMS client credentials>
Content-Type: application/json

{
  "type": "just-in-time-funding",
  "target": { "entity": "Lefèvre Japan KK", "account": "JP 0403 0001 7788 1200", "currency": "JPY" },
  "source": { "account": "tokenised-account/lefevre-industries-sa", "currency": "EUR" },
  "trigger": { "forecast": "tms:cash-forecast/tokyo", "leadMinutes": 5 },
  "hours": "any",
  "limits": { "perNightEur": 15000000 },
  "initiator": "marie.lefevre"
}

→ 202 Accepted  { "rule": "RULE-JIT-TOKYO", "status": "awaiting-second-signature" }`;

const STMT = `<Ntry>
  <Amt Ccy="EUR">101500000.00</Amt>
  <CdtDbtInd>CRDT</CdtDbtInd>
  <Sts><Cd>BOOK</Cd></Sts>
  <BookgDt><DtTm>2026-10-06T07:00:00+02:00</DtTm></BookgDt>
  <ValDt><Dt>2026-10-06</Dt></ValDt>
  <BkTxCd><Domn><Cd>CAMT</Cd><Fmly><Cd>ACCB</Cd><SubFmlyCd>SWEP</SubFmlyCd></Fmly></Domn></BkTxCd>
  <NtryDtls><TxDtls>
    <Refs><EndToEndId>RULE-OVERNIGHT-U-004</EndToEndId></Refs>
    <AddtlTxInf>Overnight unit unwound — 1.80% × 750 min, interest in MINT line</AddtlTxInf>
  </TxDtls></NtryDtls>
</Ntry>`;

export function Tms() {
  const { t, state } = useSim();
  const rows = accountRows(state, t).filter(
    (r) => r.balance !== 0 || r.inUnit !== 0 || r.blocked !== 0,
  );
  return (
    <div className="space-y-6">
      <PageHeader title={T.title} lead={T.lead} aside={<HorizonTag id="tms" />} />

      <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2 text-[12px] text-muted">
          <span className="size-2.5 rounded-full bg-red/70" />
          <span className="size-2.5 rounded-full bg-amber/70" />
          <span className="size-2.5 rounded-full bg-new/70" />
          <span className="ml-3">{T.frame}</span>
        </div>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              {T.cols.map((c, i) => (
                <th key={c} className={cn('px-4 py-2 font-medium', i === 3 && 'text-right')}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const b = bankById(r.def.bank);
              return (
                <tr key={r.def.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 font-mono text-[11.5px]">
                    {b.name} · {ACCOUNTS.find((a) => a.id === r.def.id)!.iban.slice(-8)}
                    {r.def.type === 'tokenised' && (
                      <span className="ml-2 font-sans text-[11px] text-muted">
                        ({T.subBalances})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{entityById(r.def.entity).name}</td>
                  <td className="px-4 py-2">{r.def.currency}</td>
                  <td className="tabular px-4 py-2 text-right">
                    {fmtAmount(r.balance + r.blocked + r.inUnit, 2)}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {b.ours ? (r.def.type === 'tokenised' ? T.intraday : T.eod) : T.other}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader eyebrow={T.apiLead} title={T.apiTitle} />
          <pre className="scrollbar-thin overflow-auto rounded-xl bg-surface-2 p-4 font-mono text-[11px] leading-relaxed">
            {API}
          </pre>
          <p className="mt-2 text-[12px] text-muted">{T.responseNote}</p>
        </Card>
        <Card>
          <CardHeader eyebrow={T.stmtLead} title={T.stmtTitle} />
          <pre className="scrollbar-thin overflow-auto rounded-xl bg-surface-2 p-4 font-mono text-[11px] leading-relaxed">
            {STMT}
          </pre>
        </Card>
      </div>

      <Card>
        <CardHeader title={T.onboardingTitle} />
        <ul className="grid grid-cols-2 gap-3">
          {T.onboarding.map((o) => (
            <li key={o.k} className="flex items-start gap-3 rounded-xl border border-line p-3.5">
              {o.s === 'done' ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-new" />
              ) : o.s === 'progress' ? (
                <CircleDot className="mt-0.5 size-4 shrink-0 text-amber" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-[13.5px] font-medium">
                  {o.k}
                  <Chip tone={o.s === 'done' ? 'new' : o.s === 'progress' ? 'amber' : 'outside'}>
                    {T.status[o.s as 'done' | 'progress' | 'todo']}
                  </Chip>
                </div>
                <p className="mt-0.5 text-[12.5px] text-muted">{o.v}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
