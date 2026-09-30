import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { en } from '@/i18n/en';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { HorizonTag, JourneyHeader } from '@/components/Journey';
import { LargeTab } from '@/screens/Funding';
import { cn } from '@/lib/utils';

const S = en.stablecoinPv;

type Check = { k: string; v: string; partner?: boolean; pending?: boolean };

function CheckList({ items }: { items: readonly Check[] }) {
  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li
          key={c.k}
          className={cn(
            'flex items-start gap-3 rounded-xl px-3 py-2.5 text-[12.5px]',
            c.partner ? 'border border-dashed border-line-strong' : 'bg-surface-2',
          )}
        >
          {c.pending ? (
            <Clock3 className="mt-0.5 size-4 shrink-0 text-amber" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-new" />
          )}
          <span className="min-w-0 flex-1">
            <span className="font-medium">{c.k}</span>
            <span className="block text-muted">{c.v}</span>
          </span>
          {c.partner && <Chip tone="outside">{S.atPartner}</Chip>}
        </li>
      ))}
    </ul>
  );
}

/** Inbound stablecoin, Brazil: the checks that make "at any hour" possible. We hold the door. */
function StablecoinCorridor() {
  return (
    <Card tone="new" className="mb-8" data-tour="prevalidation-stablecoin">
      <CardHeader
        eyebrow={S.eyebrow}
        title={S.title}
        aside={
          <span className="flex gap-1.5">
            <Chip tone="new">
              <ShieldCheck /> {S.status}
            </Chip>
            <HorizonTag id="brazil" />
          </span>
        }
      />
      <p className="mb-5 max-w-[900px] text-[13.5px] leading-relaxed">{S.lead}</p>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-6">
          <div className="eyebrow mb-2">{S.onceTitle}</div>
          <CheckList items={S.once} />
          <Link
            to="/repatriation"
            className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-new hover:underline"
          >
            {S.toBrazil} <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <div className="eyebrow mb-2">{S.eachTitle}</div>
          <CheckList items={S.each} />
          <details className="mt-3 rounded-xl border border-line px-4 py-3 text-[12.5px]">
            <summary className="cursor-pointer font-medium">{S.evidenceTitle}</summary>
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-muted">
              {S.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ol>
          </details>
          <p className="mt-3 text-[12px] text-muted">{S.decision}</p>
        </div>
      </div>
    </Card>
  );
}

export function PreValidation() {
  return (
    <div>
      <JourneyHeader id="prevalidation" />
      <StablecoinCorridor />
      <LargeTab />
    </div>
  );
}
