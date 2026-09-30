import { useState } from 'react';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { RATES } from '@/data/rates';
import { at, BUSINESS_START, LAST_CUTOFF, formatDateTime } from '@/engine/clock';
import { collateralInterest } from '@/engine/counters';
import { BRAZIL_BID_BOND } from '@/engine/scenario';
import { fmtEur, fmtM, fmtMinutes, fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import { InfoTip } from '@/components/ui/tooltip';
import { LayerTag, PageHeader, Row } from '@/components/Page';
import { MinuteRing } from '@/components/MinuteRing';
import { Animated } from '@/components/Animated';
import { cn } from '@/lib/utils';

const G = en.guarantees;
const M = 1_000_000;

/** Blended rate of a blocked amount over a week: 0.10% in business hours, overnight unit rate otherwise. */
const BUSINESS_H = 5 * ((LAST_CUTOFF - BUSINESS_START) / 60);
const BLENDED = (BUSINESS_H * RATES.tokenised + (168 - BUSINESS_H) * RATES.overnightUnit) / 168;

type Item = { key: keyof typeof G.items; amount: number; days: number; option: 'block' | 'pledge'; pledgeRate?: number };

const ITEMS: Item[] = [
  { key: 'perf', amount: 6 * M, days: 365, option: 'pledge', pledgeRate: RATES.unit12m },
  { key: 'margin', amount: 4 * M, days: 14, option: 'block' },
  { key: 'escrow', amount: 20 * M, days: 91, option: 'pledge', pledgeRate: RATES.unit3m },
];

function CompareCard({ item }: { item: Item }) {
  const [showNew, setShowNew] = useState(true);
  const g = G.items[item.key];
  const rate = item.option === 'pledge' ? item.pledgeRate! : BLENDED;
  const kept = (item.amount * rate * item.days) / 360;
  const lineFee = (item.amount * 0.006 * item.days) / 360;
  return (
    <Card tone={showNew ? 'new' : 'default'} className="flex flex-col">
      <CardHeader eyebrow={G.illustrative} title={g.title} aside={<LayerTag layer={showNew ? 'new' : 'traditional'} />} />
      <p className="text-[12.5px] text-muted">{g.who}</p>
      <div className="mt-4">
        <Row k={G.amount} v={fmtM(item.amount, 'EUR', 0)} />
        <Row k={G.duration} v={G.days(item.days)} />
        <Row k={G.releaseOn} v={g.release} />
      </div>
      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-surface-2 px-4 py-2.5 text-[13px]">
        <span className={cn(!showNew && 'text-fg', showNew && 'text-muted')}>{G.trad}</span>
        <Switch checked={showNew} onCheckedChange={setShowNew} aria-label={G.compare} />
        <span className={cn(showNew ? 'text-new' : 'text-muted')}>{en.layers.new}</span>
      </label>
      <div className="mt-auto pt-5">
        {showNew ? (
          <>
            <p className="text-[12.5px] leading-relaxed">{item.option === 'pledge' ? G.newPledge : G.newBlock}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[12px] text-muted">{G.kept}</span>
              <span className="tabular font-serif text-[28px] text-new">{fmtEur(kept, 'EUR', 0)}</span>
            </div>
            <p className="text-right text-[11.5px] text-muted">{item.option === 'pledge' ? fmtPct(rate) : G.blended(fmtPct(BLENDED))}</p>
          </>
        ) : (
          <>
            <p className="text-[12.5px] leading-relaxed text-muted">{G.tradGage}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[12px] text-muted">{G.kept}</span>
              <span className="tabular font-serif text-[28px] text-muted">{fmtEur(0, 'EUR', 0)}</span>
            </div>
            <p className="text-right text-[11.5px] text-muted">{G.tradLine}: −{fmtEur(lineFee, 'EUR', 0)}</p>
          </>
        )}
      </div>
    </Card>
  );
}

function Brazil() {
  const { t, tl, state } = useSim();
  const col = state.collateral.find((c) => c.id === BRAZIL_BID_BOND);
  const since = at(2, '11:00');
  const end = col?.releasedAt ?? t;
  const r = collateralInterest(tl, BRAZIL_BID_BOND, since, Math.max(since, Math.min(t, end)));
  const status = !col ? 'notYet' : col.status;
  const minutes = col ? Math.max(0, Math.min(t, end) - since) : 0;
  return (
    <Card tone="new">
      <CardHeader
        eyebrow={G.live}
        title={G.brazil.title}
        aside={
          <Chip tone={status === 'active' ? 'new' : status === 'released' ? 'neutral' : 'outside'}>
            {status === 'active' ? <Lock /> : status === 'released' ? <Unlock /> : null}
            {G.status[status]}
          </Chip>
        }
      />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5">
          <p className="text-[12.5px] text-muted">{G.items.bidBond.who}</p>
          <div className="mt-5 flex items-center gap-4">
            <MinuteRing size={64} progress={(t % 60) / 60}>
              <Lock className="size-4 text-new" />
            </MinuteRing>
            <div>
              <div className="text-[12px] text-muted">{G.brazil.total}</div>
              <div className="tabular font-serif text-[40px] leading-none text-new" aria-live="polite">
                <Animated value={r.total} format={(v) => fmtEur(v)} />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Row k={G.amount} v={fmtEur(15 * M, 'EUR', 0)} />
            <Row k={G.brazil.since} v={col ? formatDateTime(col.since) : '—'} />
            <Row k={G.brazil.minutes} v={fmtMinutes(minutes)} />
            <Row k={G.brazil.byDay} v={fmtEur(r.onAccount)} />
            <Row k={G.brazil.byNight} v={fmtEur(r.inUnit)} />
            <Row k={G.brazil.released} v={col?.releasedAt ? formatDateTime(col.releasedAt) : G.brazil.pending} />
          </div>
        </div>
        <div className="col-span-12 space-y-4 lg:col-span-7">
          <div className="rounded-2xl bg-grey-soft p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{G.trad}</span>
              <LayerTag layer="traditional" />
            </div>
            <div className="tabular mt-2 font-serif text-[30px] text-muted">{fmtEur(0)}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{G.brazil.tradSide}</p>
          </div>
          <div className={cn('rounded-2xl border p-5', col?.releasedAt ? 'border-new/40' : 'border-dashed border-line-strong')}>
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <CheckCircle2 className={cn('size-4', col?.releasedAt ? 'text-new' : 'text-muted')} />
              {G.brazil.event}
              <InfoTip content={en.tips.blockedEarns} />
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{G.brazil.eventText}</p>
          </div>
          <p className="text-[12px] text-muted">{G.pledgeFund}</p>
        </div>
      </div>
    </Card>
  );
}

export function Guarantees() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={G.eyebrow} title={G.title} lead={G.lead} />
      <Brazil />
      <div className="grid grid-cols-3 gap-6">
        {ITEMS.map((i) => (
          <CompareCard key={i.key} item={i} />
        ))}
      </div>
    </div>
  );
}
