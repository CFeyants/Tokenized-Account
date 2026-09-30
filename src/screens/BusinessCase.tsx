import { useState } from 'react';
import { useApp } from '@/app/store';
import { en } from '@/i18n/en';
import { MARKET } from '@/data/rates';
import { HORIZONS } from '@/data/horizons';
import {
  ASSUMPTIONS,
  PROFILES,
  bankView,
  clientValue,
  sensitivity,
  type ProfileId,
} from '@/engine/businessCase';
import { fmtEur, fmtM, fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Tip, InfoTip } from '@/components/ui/tooltip';
import { PageHeader, Row } from '@/components/Page';
import { HorizonTag } from '@/components/Journey';
import { cn } from '@/lib/utils';

const B = en.bc;
const eur = (v: number) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${fmtEur(Math.abs(v), 'EUR', 0)}`;
const FTPS = [0.01, 0.02, MARKET.estr, 0.025];

const CASES: { id: string; label: string }[] = [
  ...en.journeys.list.map((j) => ({ id: j.id, label: j.title })),
  { id: 'prevalidationLedger', label: en.funding.large.laterTitle },
  { id: 'tms', label: en.tms.title },
];

export function BusinessCase() {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const [ftp, setFtp] = useState(MARKET.estr);
  const p = PROFILES[profile];
  const c = clientValue(p);
  const b = bankView(p, ftp);
  const sens = sensitivity(p, FTPS);

  return (
    <div className="space-y-6">
      <PageHeader title={B.title} lead={B.lead} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12.5px] text-muted">{B.profile}</span>
        {(Object.keys(PROFILES) as ProfileId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            aria-pressed={profile === id}
            variant={profile === id ? 'new' : 'secondary'}
            onClick={() => setProfile(id)}
          >
            {en.value.profiles[id]}
          </Button>
        ))}
        <span className="ml-4 mr-1 text-[12.5px] text-muted">{B.ftp}</span>
        {FTPS.map((f) => (
          <Button
            key={f}
            size="sm"
            aria-pressed={ftp === f}
            variant={ftp === f ? 'new' : 'secondary'}
            onClick={() => setFtp(f)}
          >
            {fmtPct(f)}
            {f === MARKET.estr ? ' (€STR)' : ''}
          </Button>
        ))}
        <Chip tone="outside" className="ml-auto">
          {B.illustrative}
        </Chip>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card tone="new" className="col-span-12 xl:col-span-5">
          <CardHeader title={B.clientTitle} />
          <Row
            k={`${B.lines.buffers} — ${fmtM(c.buffers, 'EUR', 0)}`}
            v={fmtEur(c.buffersInterest, 'EUR', 0)}
          />
          <Row
            k={`${B.lines.hours} — ${Math.round(c.hours)} h, ${c.fte.toFixed(1)} FTE`}
            v={fmtEur(c.hoursValue, 'EUR', 0)}
          />
          <Row
            k={
              <span className="flex items-center gap-1">
                {B.lines.failures} — {c.failures}
                <InfoTip content={B.failureTypes(ASSUMPTIONS.failureTypes)} />
              </span>
            }
            v={fmtEur(c.failuresValue, 'EUR', 0)}
          />
          <Row
            k={<span className="text-fg">{B.lines.total}</span>}
            v={<span className="font-serif text-[22px] text-new">{fmtEur(c.total, 'EUR', 0)}</span>}
            className="border-t border-line"
          />
          <div className="mt-3 border-t border-line pt-2 text-[12.5px]">
            <Row k={B.eurPickup} v={fmtEur(c.eurPickup, 'EUR', 0)} />
            <p className="text-[12px] text-muted">{B.usdPickup}</p>
          </div>
        </Card>

        <Card className="col-span-12 xl:col-span-7" data-tour="bc-net">
          <CardHeader title={B.bankTitle} />
          {b.lines.map((l) => (
            <Row
              key={l.key}
              className={cn(l.key === 'defended' && 'rounded-lg bg-new-soft px-2')}
              k={
                l.base !== undefined && l.rate !== undefined ? (
                  <Tip content={B.lineTip(fmtM(l.base), fmtPct(l.rate))}>
                    <span
                      tabIndex={0}
                      className="cursor-help underline decoration-dotted underline-offset-4"
                    >
                      {B.lineLabels[l.key as keyof typeof B.lineLabels]}
                    </span>
                  </Tip>
                ) : (
                  B.lineLabels[l.key as keyof typeof B.lineLabels]
                )
              }
              v={<span className={cn(l.value < 0 ? 'text-red' : 'text-new')}>{eur(l.value)}</span>}
            />
          ))}
          <Row
            k={<span className="font-medium text-fg">{B.netWithout}</span>}
            v={
              <span
                className={cn('font-serif text-[20px]', b.netWithout < 0 ? 'text-red' : 'text-new')}
              >
                {eur(b.netWithout)}
              </span>
            }
            className="border-t border-line"
          />
          <Row
            k={
              <Tip
                content={B.nightFxTip(
                  fmtM(p.nightFxIncremental, 'EUR', 0),
                  `${ASSUMPTIONS.nightFxNetBps} bps`,
                )}
              >
                <span
                  tabIndex={0}
                  className="cursor-help underline decoration-dotted underline-offset-4"
                >
                  {B.nightFxLine}
                </span>
              </Tip>
            }
            v={eur(b.nightFx)}
          />
          <Row
            k={<span className="font-medium text-fg">{B.netWith}</span>}
            v={
              <span className={cn('font-serif text-[20px]', b.net < 0 ? 'text-red' : 'text-new')}>
                {eur(b.net)}
              </span>
            }
          />
          <p className="mt-3 text-[12px] leading-relaxed text-muted">{B.niiNote}</p>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title={B.sensTitle} eyebrow={B.ftpNote} />
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] text-muted">
                {B.sensCols.map((h, i) => (
                  <th key={h} className={cn('pb-2 font-normal', i && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {sens.map((s) => (
                <tr
                  key={s.ftp}
                  className={cn('border-t border-line', s.ftp === ftp && 'bg-new-soft')}
                >
                  <td className="py-1.5">{fmtPct(s.ftp)}</td>
                  <td className={cn('py-1.5 text-right', s.netWithout < 0 && 'text-red')}>
                    {eur(s.netWithout)}
                  </td>
                  <td className={cn('py-1.5 text-right', s.net < 0 && 'text-red')}>{eur(s.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title={B.sourcesTitle} />
          {(Object.keys(b.sources) as (keyof typeof b.sources)[]).map((k) => (
            <Row key={k} k={B.sources[k]} v={fmtM(b.sources[k])} />
          ))}
          <Row
            k={<span className="text-fg">{B.sources.total}</span>}
            v={
              <span className="text-new">
                {fmtM(b.captured)} ·{' '}
                {fmtEur(b.captured * (ftp - ASSUMPTIONS.paidOnCaptured), 'EUR', 0)}
              </span>
            }
            className="border-t border-line"
          />
        </Card>
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title={B.bridgeTitle} eyebrow={B.bridgeLead} />
          {(Object.keys(b.bridge) as (keyof typeof b.bridge)[]).map((k) => (
            <Row
              key={k}
              k={B.bridge[k]}
              v={fmtM(b.bridge[k])}
              className={cn(k === 'released' && 'font-medium', k === 'captured' && 'text-new')}
            />
          ))}
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-6">
          <CardHeader title={B.lcrTitle} eyebrow={B.lcr} />
          <Row k={B.lcrRows.operational} v={`${fmtM(b.lcr.operational)} × 25%`} />
          <Row k={B.lcrRows.nonOperational} v={`${fmtM(b.lcr.nonOperational)} × 40%`} />
          <Row k={B.lcrRows.hqla} v={fmtM(b.lcr.hqlaWith)} className="border-t border-line" />
          <Row k={B.lcrRows.saved} v={<span className="text-new">{fmtM(b.lcr.hqlaSaved)}</span>} />
          <Row
            k={B.lcrRows.value(fmtPct(ASSUMPTIONS.hqlaCarry))}
            v={fmtEur(b.lcr.hqlaValue, 'EUR', 0)}
          />
        </Card>
        <div className="col-span-12 space-y-6 xl:col-span-6">
          <Card tone="new">
            <CardHeader title={B.keepTitle} />
            <p className="text-[13px] leading-relaxed">{B.keep}</p>
          </Card>
          <Card>
            <CardHeader title={B.competitionTitle} />
            <p className="text-[13px] leading-relaxed text-muted">{B.competition}</p>
          </Card>
        </div>
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
