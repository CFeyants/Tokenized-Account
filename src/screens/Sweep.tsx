import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowRightLeft, Repeat } from 'lucide-react';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { RATES } from '@/data/rates';
import { usClientValue } from '@/data/tmmf';
import { previewMmfSweep } from '@/engine/preview';
import { fmtAmount, fmtEur, fmtM, fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HorizonTag, JourneyHeader } from '@/components/Journey';
import { ApprovalButton } from '@/components/ApprovalButton';
import { RateGrid } from '@/components/RateGrid';
import { Row } from '@/components/Page';
import { cn } from '@/lib/utils';

const S = en.sweep;
const U = S.usd;
const M = 1_000_000;
const usd = (v: number) => `USD ${fmtAmount(v / M, 1)}m`;

function RuleLines({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="mt-5 space-y-2 text-[13px] leading-relaxed">
      {lines.map((l, i) => (
        <li key={l} className="flex gap-2">
          {i === 2 ? (
            <Repeat className="mt-0.5 size-4 shrink-0 text-new" />
          ) : (
            <ArrowRightLeft className="mt-0.5 size-4 shrink-0 text-new" />
          )}
          {l}
        </li>
      ))}
    </ul>
  );
}

function EurSweep() {
  const { tl } = useSim();
  const [threshold, setThreshold] = useState(40);
  const [fund, setFund] = useState(false);
  const rate = fund ? RATES.mmf : RATES.unit1m;
  const p = previewMmfSweep(tl, threshold * M, rate);
  return (
    <div className="grid grid-cols-12 gap-6">
      <Card tone="new" className="col-span-12 xl:col-span-5">
        <CardHeader title={S.rule} />
        <div className="mb-2 flex justify-between text-[13px]">
          <span className="text-muted">{S.threshold}</span>
          <span className="tabular">{fmtM(threshold * M, 'EUR', 0)}</span>
        </div>
        <Slider
          aria-label={S.threshold}
          min={10}
          max={100}
          step={5}
          value={[threshold]}
          onValueChange={([v]) => setThreshold(v)}
        />
        <div className="mt-5 text-[12px] text-muted">{S.dest}</div>
        <div className="mt-1 space-y-1.5" role="radiogroup" aria-label={S.dest}>
          {[false, true].map((v) => (
            <button
              key={String(v)}
              role="radio"
              aria-checked={fund === v}
              onClick={() => setFund(v)}
              className={cn(
                'w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-[12.5px]',
                fund === v ? 'border-new/50 bg-new-soft' : 'border-line hover:bg-surface-2',
              )}
            >
              <div className="font-medium">{v ? S.destFund : S.destUnit}</div>
              <div className="text-[11.5px] text-muted">
                {v ? S.destFundSub(fmtPct(RATES.mmf)) : S.destUnitSub(fmtPct(RATES.unit1m))}
              </div>
            </button>
          ))}
        </div>
        <RuleLines lines={fund ? S.ruleLines : S.ruleLinesUnit} />
        <div className="mt-6 grid gap-2">
          <ApprovalButton
            request={{
              title: S.ruleTitle,
              detail: S.ruleDetail(fmtM(threshold * M, 'EUR', 0)),
              amountEur: 0,
              rule: {
                kind: 'mmf',
                name: S.ruleTitle,
                params: [
                  `${S.threshold}: ${fmtM(threshold * M, 'EUR', 0)}`,
                  `${S.dest}: ${fund ? S.destFund : S.destUnit}`,
                  ...(fund ? S.ruleLines : S.ruleLinesUnit),
                ],
              },
            }}
          >
            {S.setRule}
          </ApprovalButton>
          <ApprovalButton
            variant="secondary"
            request={{
              title: S.onceTitle,
              detail: S.onceDetail,
              amountEur: 10 * M,
              action: { kind: 'fund', amount: 10 * M },
            }}
          >
            {S.runOnce(fmtM(10 * M, 'EUR', 0))}
          </ApprovalButton>
        </div>
      </Card>
      <Card className="col-span-12 xl:col-span-7">
        <CardHeader title={S.weekTitle} />
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted">
              {S.cols.map((c, i) => (
                <th key={c} className={i ? 'pb-2 text-right font-normal' : 'pb-2 font-normal'}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular">
            {p.rows.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <td className="py-2">{r.label}</td>
                <td className="py-2 text-right">{fmtM(r.swept)}</td>
                <td className="py-2 text-right">{r.days}</td>
                <td className="py-2 text-right text-new">{fmtEur(r.gain, 'EUR', 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 rounded-xl bg-new-soft px-4 py-3">
          <div className="text-[13.5px]">{S.weekGain(fmtEur(p.weekGain, 'EUR', 0))}</div>
          <div className="mt-1 font-serif text-[24px] text-new">
            {S.perYear(fmtEur(p.perYear, 'EUR', 0), fmtM(p.avgSwept), fmtPct(rate))}
          </div>
        </div>
        <details className="mt-5 rounded-xl border border-dashed border-line-strong px-4 py-3">
          <summary className="cursor-pointer text-[12.5px] font-medium">{S.caveatTitle}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-muted">
            {S.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      </Card>
    </div>
  );
}

function UsdSweep() {
  const v = usClientValue();
  return (
    <div className="grid grid-cols-12 gap-6">
      <Card tone="new" className="col-span-12 xl:col-span-7" data-tour="sweep-usd">
        <CardHeader
          title={en.journeys.list.find((j) => j.id === 'us')!.title}
          aside={<HorizonTag id="us" />}
        />
        <p className="text-[13px] leading-relaxed">{U.norm}</p>
        <Row className="mt-3" k={en.us.surplus} v={usd(v.surplus)} />
        <Row k={en.us.valueRows.pickup} v={`USD ${fmtAmount(v.pickup)}`} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="primary">
            <Link to="/us-surplus">
              {en.us.alert.action} <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/settle-fund">
              {en.settle.title} <ArrowRight />
            </Link>
          </Button>
        </div>
      </Card>
      <Card className="col-span-12 border-dashed xl:col-span-5">
        <CardHeader title={U.collateralTitle} aside={<HorizonTag id="tmmfCollateral" />} />
        <p className="text-[12.5px] leading-relaxed text-muted">{U.collateral}</p>
      </Card>
    </div>
  );
}

export function Sweep() {
  return (
    <div className="space-y-6">
      <JourneyHeader id="sweep" />
      <Tabs defaultValue="eur">
        <TabsList>
          <TabsTrigger value="eur">{S.tabs.eur}</TabsTrigger>
          <TabsTrigger value="usd">{S.tabs.usd}</TabsTrigger>
        </TabsList>
        <TabsContent value="eur" className="mt-6">
          <EurSweep />
        </TabsContent>
        <TabsContent value="usd" className="mt-6">
          <UsdSweep />
        </TabsContent>
      </Tabs>
      <RateGrid />
    </div>
  );
}
