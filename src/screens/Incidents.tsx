import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, Siren } from 'lucide-react';
import { en } from '@/i18n/en';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/Page';

const I = en.incidents;

export function Incidents() {
  return (
    <div className="space-y-6">
      <PageHeader title={I.title} lead={I.lead} />
      {I.list.map((inc) => (
        <Card key={inc.key} className="grid grid-cols-12 gap-6" data-tour={`incident-${inc.key}`}>
          <div className="col-span-12 xl:col-span-7">
            <div className="flex items-center gap-3">
              <Siren className="size-5 text-red" />
              <h2 className="text-[20px]">{inc.title}</h2>
              <Chip tone="red">{inc.when}</Chip>
            </div>
            <ol className="relative ml-2 mt-5 border-l border-line-strong">
              {inc.steps.map((s, i) => (
                <li key={s} className="relative pb-4 pl-5 last:pb-0">
                  <span
                    className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ${i === inc.steps.length - 1 ? 'bg-new' : i === 1 ? 'bg-red' : 'bg-muted'}`}
                  />
                  <span className="tabular text-[12px] text-muted">{s.slice(0, 5)}</span>
                  <p className="text-[13.5px] leading-relaxed">{s.slice(6)}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="col-span-12 space-y-4 xl:col-span-5">
            <div>
              <div className="eyebrow mb-1.5 flex items-center gap-1.5">
                <BellRing className="size-3.5" />
                {I.who}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {inc.notified.map((n) => (
                  <Chip key={n} tone="neutral">
                    {n}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-surface-2 p-4">
              <div className="text-[12px] text-muted">{I.resolution}</div>
              <p className="mt-1 text-[13px] leading-relaxed">{inc.resolution}</p>
            </div>
            <div className="rounded-xl bg-new-soft p-4">
              <div className="text-[12px] text-new">{I.prevention}</div>
              <p className="mt-1 text-[13px] leading-relaxed">{inc.prevention}</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <Link to={inc.path}>
                {I.open} <ArrowRight />
              </Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
