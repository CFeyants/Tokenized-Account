import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { fmtEur, fmtM } from '@/engine/format';
import { weekMetrics } from '@/engine/weekMetrics';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader, Row } from '@/components/Page';

const T = en.tour;

export function TourRecap() {
  const { t, tl } = useSim();
  const actions = useApp((s) => s.actions);
  const m = weekMetrics(tl, t, actions);
  return (
    <div className="space-y-6">
      <PageHeader title={T.recapTitle} lead={T.recapLead} />
      <div className="grid grid-cols-2 gap-6" data-tour="tour-recap">
        <Card tone="new">
          <CardHeader title={T.recapClient} />
          <Row
            k={T.interest}
            v={<span className="text-new">{fmtEur(m.interestGain, 'EUR', 0)}</span>}
          />
          <Row k={en.counters.newShort} v={fmtEur(m.interestNew, 'EUR', 0)} />
          <Row k={en.counters.tradShort} v={fmtEur(m.interestTrad, 'EUR', 0)} />
          <Row
            k={T.buffers}
            v={<span className="text-new">{fmtM(m.buffersReleased, 'EUR', 0)}</span>}
          />
          <Row k={T.failures} v={<span className="text-new">{m.failuresAvoided}</span>} />
        </Card>
        <Card>
          <CardHeader title={T.recapBank} />
          <Row
            k={en.bc.bank.niiDelta}
            v={
              <span className={m.bankNii < 0 ? 'text-red' : 'text-new'}>
                {fmtEur(m.bankNii, 'EUR', 0)}
              </span>
            }
          />
          <Row k={en.bc.fxMarginWeek} v={fmtEur(m.bankFx, 'EUR', 0)} />
          <Row
            k={T.bankMargin}
            v={
              <span className={m.bankTotal < 0 ? 'text-red' : 'text-new'}>
                {fmtEur(m.bankTotal, 'EUR', 0)}
              </span>
            }
            className="border-t border-line"
          />
          <p className="mt-3 text-[12px] leading-relaxed text-muted">{en.bc.niiNote}</p>
        </Card>
      </div>
      <Card>
        <CardHeader title={T.recapWhere} />
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">
          {T.recapSources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <Button asChild variant="primary" className="mt-5">
          <Link to="/business-case">
            {T.finish} <ArrowRight />
          </Link>
        </Button>
      </Card>
    </div>
  );
}
