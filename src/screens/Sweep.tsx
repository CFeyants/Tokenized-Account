import { useState } from 'react';
import { ArrowRightLeft, Repeat } from 'lucide-react';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { previewMmfSweep } from '@/engine/preview';
import { fmtEur, fmtM } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { JourneyHeader } from '@/components/Journey';
import { ApprovalButton } from '@/components/ApprovalButton';
import { RateGrid } from '@/components/RateGrid';

const S = en.sweep;
const M = 1_000_000;

export function Sweep() {
  const { tl } = useSim();
  const [threshold, setThreshold] = useState(40);
  const p = previewMmfSweep(tl, threshold * M);
  return (
    <div className="space-y-6">
      <JourneyHeader id="sweep" />
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
          <ul className="mt-5 space-y-2 text-[13px] leading-relaxed">
            {S.ruleLines.map((l, i) => (
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
          <div className="mt-6 grid gap-2">
            <ApprovalButton
              request={{
                title: S.ruleTitle,
                detail: S.ruleDetail(fmtM(threshold * M, 'EUR', 0)),
                amountEur: 0,
                rule: {
                  kind: 'mmf',
                  name: S.ruleTitle,
                  params: [`${S.threshold}: ${fmtM(threshold * M, 'EUR', 0)}`, ...S.ruleLines],
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
              {S.perYear(fmtEur(p.perYear, 'EUR', 0), fmtM(p.avgSwept))}
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
      <RateGrid />
    </div>
  );
}
