import { useApp } from '@/app/store';
import { en } from '@/i18n/en';
import { PROFILES, bankView, clientValue, type ProfileId } from '@/engine/businessCase';
import { HORIZONS } from '@/data/horizons';
import { fmtEur, fmtM } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PageHeader, Row } from '@/components/Page';
import { HorizonTag } from '@/components/Journey';
import { cn } from '@/lib/utils';

const B = en.bc;
const eur = (v: number) => fmtEur(v, 'EUR', 0);

const CASES: { id: string; label: string }[] = [
  ...en.journeys.list.map((j) => ({ id: j.id, label: j.title })),
  { id: 'prevalidationLedger', label: en.funding.large.laterTitle },
  { id: 'tms', label: en.tms.title },
];

export function BusinessCase() {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const p = PROFILES[profile];
  const c = clientValue(p);
  const b = bankView(p);
  return (
    <div className="space-y-6">
      <PageHeader title={B.title} lead={B.lead} />
      <div className="flex items-center gap-2" role="radiogroup" aria-label={B.profile}>
        <span className="mr-2 text-[12.5px] text-muted">{B.profile}</span>
        {(Object.keys(PROFILES) as ProfileId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            role="radio"
            aria-checked={profile === id}
            variant={profile === id ? 'new' : 'secondary'}
            onClick={() => setProfile(id)}
          >
            {en.value.profiles[id]}
          </Button>
        ))}
        <Chip tone="outside" className="ml-auto">
          {B.illustrative}
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card tone="new">
          <CardHeader title={B.clientTitle} />
          <Row k={`${B.lines.buffers} — ${fmtM(c.buffers, 'EUR', 0)}`} v={eur(c.buffersInterest)} />
          <Row
            k={`${B.lines.hours} — ${Math.round(c.hours)} h, ${c.fte.toFixed(1)} FTE`}
            v={eur(c.hoursValue)}
          />
          <Row k={`${B.lines.failures} — ${c.failures}`} v={eur(c.failuresValue)} />
          <Row
            k={<span className="text-fg">{B.lines.total}</span>}
            v={<span className="font-serif text-[22px] text-new">{eur(c.total)}</span>}
            className="border-t border-line"
          />
        </Card>
        <Card>
          <CardHeader title={B.bankTitle} />
          <Row k={B.bank.retained} v={fmtM(b.retained, 'EUR', 0)} />
          <Row k={<span className="pl-4">{B.bank.captured}</span>} v={fmtM(b.captured, 'EUR', 0)} />
          <Row k={B.bank.remuneration} v={`−${eur(b.remunerationCost)}`} />
          <Row k={B.bank.niiToday} v={eur(b.niiToday)} />
          <Row k={B.bank.niiNew} v={eur(b.niiNew)} />
          <Row
            k={B.bank.niiDelta}
            v={
              <span className={cn(b.niiDelta < 0 ? 'text-red' : 'text-new')}>
                {b.niiDelta < 0 ? '−' : '+'}
                {eur(Math.abs(b.niiDelta))}
              </span>
            }
          />
          <Row k={B.bank.subscriptions} v={`+${eur(b.subscriptions)}`} />
          <Row k={B.bank.nightFx} v={`+${eur(b.nightFx)}`} />
          <Row k={B.bank.cannibalisation} v={`−${eur(b.cannibalisation)}`} />
          <Row
            k={<span className="text-fg">{B.bank.net}</span>}
            v={
              <span className={cn('font-serif text-[22px]', b.net < 0 ? 'text-red' : 'text-new')}>
                {b.net < 0 ? '−' : '+'}
                {eur(Math.abs(b.net))}
              </span>
            }
            className="border-t border-line"
          />
          <p className="mt-3 text-[12px] leading-relaxed text-muted">{B.niiNote}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader title={B.lcrTitle} />
          <p className="text-[13px] leading-relaxed text-muted">{B.lcr}</p>
        </Card>
        <Card tone="new">
          <CardHeader title={B.keepTitle} />
          <p className="text-[13px] leading-relaxed">{B.keep}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title={B.horizonsTitle} />
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted">
              {B.hcols.map((h) => (
                <th key={h} className="pb-2 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CASES.map((x) => (
              <tr key={x.id} className="border-t border-line align-top">
                <td className="py-2.5 pr-4">{x.label}</td>
                <td className="py-2.5 pr-4">
                  <HorizonTag id={x.id} />
                </td>
                <td className="py-2.5 text-[12.5px] text-muted">
                  {HORIZONS[x.id]?.dependencies.join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
