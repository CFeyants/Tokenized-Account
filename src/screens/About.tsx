import { en } from '@/i18n/en';
import { Card, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/Page';

const A = en.about;

export function About() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={A.eyebrow} title={A.title} lead={A.lead} />
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title={A.doctrine} />
          <ol className="space-y-3">
            {A.doctrineLines.map((l, i) => (
              <li key={i} className="grid grid-cols-[28px_1fr] text-[14px] leading-relaxed">
                <span className="tabular text-muted">{i + 1}</span>
                <span>{l}</span>
              </li>
            ))}
          </ol>
        </Card>
        <div className="col-span-12 space-y-6 xl:col-span-5">
          <Card>
            <CardHeader title={A.how} />
            <ol className="list-decimal space-y-2 pl-5 text-[13.5px] leading-relaxed marker:text-muted">
              {A.howSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Card>
          <Card>
            <CardHeader title={A.legend} />
            <ul className="space-y-2.5 text-[13.5px]">
              <li className="flex items-center gap-3">
                <span className="size-3 rounded-[3px] bg-new" />
                {A.legendNew}
              </li>
              <li className="flex items-center gap-3">
                <span className="size-3 rounded-[3px] bg-grey" />
                {A.legendTrad}
              </li>
              <li className="flex items-center gap-3">
                <span className="size-3 rounded-[3px] border border-dashed border-muted" />
                {A.legendOut}
              </li>
              <li className="flex items-center gap-3">
                <span className="size-3 rounded-[3px] bg-amber-fill" />
                {A.legendAmber}
              </li>
            </ul>
          </Card>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader title={A.illustrative} />
          <p className="text-[13.5px] leading-relaxed text-muted">{A.illustrativeText}</p>
        </Card>
        <Card tone="outside">
          <CardHeader title={A.notBuilt} />
          <p className="text-[13.5px] leading-relaxed text-muted">{A.notBuiltText}</p>
        </Card>
        <Card tone="new">
          <CardHeader title={A.roadmap} />
          <ol className="space-y-4">
            {A.road.map((r) => (
              <li key={r.year}>
                <div className="tabular font-serif text-[20px] text-new">{r.year}</div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{r.text}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
