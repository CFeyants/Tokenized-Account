import { Check, X } from 'lucide-react';
import { useGov, personLabel } from '@/app/governance';
import { en } from '@/i18n/en';
import { formatDateTime } from '@/engine/clock';
import { fmtM } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/Page';

const G = en.gov;

export function Approvals() {
  const { approvals, audit, rules, approve, reject } = useGov();
  return (
    <div className="space-y-6">
      <PageHeader title={G.pageTitle} lead={G.pageLead} />
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title={G.queueTitle} />
          <ul className="space-y-3">
            {approvals.map((a) => (
              <li key={a.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-medium">{a.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {G.submittedBy} {personLabel(a.maker)} · {formatDateTime(a.submittedAt)}
                    </div>
                  </div>
                  <Chip
                    tone={
                      a.status === 'pending' ? 'amber' : a.status === 'approved' ? 'new' : 'red'
                    }
                  >
                    {G.status[a.status]}
                  </Chip>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{a.detail}</p>
                <div className="mt-2 flex items-center justify-between text-[12px] text-muted">
                  <span>
                    {G.checker}: {personLabel(a.checker)}
                    {a.decidedAt !== undefined && ` · ${formatDateTime(a.decidedAt)}`}
                  </span>
                  {a.amountEur > 0 && (
                    <span className="tabular">{fmtM(a.amountEur, 'EUR', 1)}</span>
                  )}
                </div>
                {a.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => approve(a.id)}>
                      <Check /> {G.approveAs(personLabel(a.checker).split(' (')[0])}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => reject(a.id)}>
                      <X /> {G.reject}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <div className="col-span-12 space-y-6 xl:col-span-5">
          <Card>
            <CardHeader title={G.rulesTitle} />
            {rules.length === 0 && <p className="text-[13px] text-muted">{G.rulesEmpty}</p>}
            <ul className="space-y-3">
              {rules.map((r) => (
                <li key={r.id} className="rounded-xl bg-new-soft p-3.5">
                  <div className="flex justify-between text-[13.5px] font-medium">
                    <span>{r.name}</span>
                    <span className="font-mono text-[11px] text-muted">{r.id}</span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-[12px] text-muted">
                    {r.params.map((p) => (
                      <li key={p}>· {p}</li>
                    ))}
                  </ul>
                  <div className="mt-1.5 text-[11.5px] text-muted">
                    {formatDateTime(r.since)} · {r.approvedBy}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title={G.auditTitle} />
            <ol className="space-y-2">
              {audit.map((e, i) => (
                <li key={i} className="grid grid-cols-[92px_1fr] gap-3 text-[12px]">
                  <span className="tabular text-muted">{formatDateTime(e.t)}</span>
                  <span>
                    {e.what}
                    <span className="block text-muted">
                      {e.who} · <span className="font-mono">{e.ref}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
