import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Repeat } from 'lucide-react';
import { en } from '@/i18n/en';
import { MARKET, SPREADS } from '@/data/rates';
import { US_ENTITY, usClientValue } from '@/data/tmmf';
import { fmtAmount, fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Slider } from '@/components/ui/slider';
import { InfoTip } from '@/components/ui/tooltip';
import { HorizonTag, JourneyHeader } from '@/components/Journey';
import { LayerTag, Row } from '@/components/Page';
import { ApprovalButton } from '@/components/ApprovalButton';

const U = en.us;
const M = 1_000_000;
const usd = (v: number, d = 1) => `USD ${fmtAmount(v / M, d)}m`;
const usdK = (v: number) => `USD ${fmtAmount(v)}`;

export function UsSurplus() {
  const [target, setTarget] = useState(US_ENTITY.targetUsd / M);
  const [sofr, setSofr] = useState(Math.round(MARKET.sofr * 10_000) / 100);
  const fundYield = sofr / 100 + SPREADS.mmfNet;
  const surplus = Math.max(0, US_ENTITY.surplusUsd + US_ENTITY.targetUsd - target * M);
  const v = usClientValue(surplus, fundYield);

  return (
    <div className="space-y-6">
      <JourneyHeader id="us" />
      <p className="text-[13px] text-muted">{U.entity}</p>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title={U.todayTitle} aside={<LayerTag layer="traditional" />} />
          <p className="text-[13px] leading-relaxed text-muted">{U.todayLead}</p>
          <ol className="mt-4 space-y-1.5">
            {U.todayFlow.map((s, i) => (
              <li key={s}>
                <div className="rounded-xl bg-surface-2 px-3 py-2 text-[12.5px] text-muted">
                  {s}
                </div>
                {i < U.todayFlow.length - 1 && (
                  <ArrowDown className="mx-auto my-1 size-3.5 text-muted" />
                )}
              </li>
            ))}
          </ol>
          <ul className="mt-4 space-y-1.5 text-[12.5px] text-muted">
            {U.consequences.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-grey" />
                {c}
              </li>
            ))}
          </ul>
        </Card>

        <Card tone="new" className="col-span-12 xl:col-span-7" data-tour="us-rule">
          <CardHeader
            title={U.ledgerTitle}
            eyebrow={U.ledgerLead}
            aside={
              <span className="flex gap-1.5">
                <LayerTag layer="new" />
                <HorizonTag id="us" />
              </span>
            }
          />
          <ol className="space-y-2">
            {U.steps.map((s, i) => (
              <li key={s.k} className="flex gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-new-soft text-[12px] text-new">
                  {String.fromCharCode(97 + i)}
                </span>
                <span className="text-[12.5px]">
                  <span className="font-medium">{s.k}</span>
                  <span className="block text-muted">{s.v}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11.5px] text-muted">{U.badge}</p>
          <div className="mb-2 mt-5 flex justify-between text-[13px]">
            <span className="text-muted">{U.threshold}</span>
            <span className="tabular">{usd(target * M, 0)}</span>
          </div>
          <Slider
            aria-label={U.threshold}
            min={5}
            max={40}
            step={5}
            value={[target]}
            onValueChange={([x]) => setTarget(x)}
          />
          <Row k={U.surplus} v={usd(surplus)} className="mt-2" />
          <div className="mt-4 flex flex-wrap gap-2">
            <ApprovalButton
              request={{
                title: U.ruleTitle,
                detail: U.ruleDetail(usd(target * M, 0)),
                amountEur: 0,
                rule: { kind: 'mmf', name: U.ruleTitle, params: U.ruleParams(usd(target * M, 0)) },
              }}
            >
              <Repeat /> {U.setRule}
            </ApprovalButton>
            <Button asChild variant="secondary">
              <Link to="/just-in-time?preset=tokyo&source=fund">
                {U.toJit} <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/settle-fund">
                {U.toSettle} <ArrowRight />
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      <Card tone="new">
        <CardHeader title={U.cashLegTitle} />
        <p className="max-w-[900px] text-[13.5px] leading-relaxed">{U.cashLeg}</p>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-6">
          <CardHeader
            title={U.valueTitle}
            aside={<Chip tone="outside">{en.value.illustrative}</Chip>}
          />
          <div className="mb-2 flex justify-between text-[12.5px]">
            <span className="text-muted">{U.rateParam}</span>
            <span className="tabular">{fmtPct(sofr / 100)}</span>
          </div>
          <Slider
            aria-label={U.rateParam}
            min={2.5}
            max={4.5}
            step={0.05}
            value={[sofr]}
            onValueChange={([x]) => setSofr(x)}
          />
          <Row className="mt-3" k={U.valueRows.fund(fmtPct(fundYield))} v={usdK(v.fund)} />
          <Row k={U.valueRows.ecr(fmtPct(US_ENTITY.ecr))} v={`− ${usdK(v.ecrLost)}`} />
          <Row
            k={<span className="text-fg">{U.valueRows.pickup}</span>}
            v={<span className="font-serif text-[20px] text-new">{usdK(v.pickup)}</span>}
            className="border-t border-line"
          />
          <ul className="mt-3 space-y-1 text-[12px] text-muted">
            <li>{U.valueRows.mobility}</li>
            <li>{U.valueRows.visibility}</li>
          </ul>
        </Card>
        <Card className="col-span-12 border-dashed xl:col-span-6">
          <CardHeader title={U.honestTitle} eyebrow={en.sweep.caveatTitle} />
          <ul className="space-y-2.5">
            {U.honest.map((h) => (
              <li key={h.k} className="text-[12.5px]">
                <span className="flex items-center gap-1 font-medium">
                  {h.k}
                  {h.tip && <InfoTip content={h.tip} />}
                </span>
                <span className="text-muted">{h.v}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
