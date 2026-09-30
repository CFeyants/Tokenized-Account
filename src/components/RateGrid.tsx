import { en } from '@/i18n/en';
import { MARKET, RATES } from '@/data/rates';
import { fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';

const VALUE: Record<string, string> = {
  current: fmtPct(RATES.current),
  tokenised: fmtPct(RATES.tokenised),
  overnightUnit: fmtPct(RATES.overnightUnit),
  units: `${fmtPct(RATES.unit1m)}–${fmtPct(RATES.unit12m)}`,
  mmf: fmtPct(RATES.mmf),
};

/** One grid of rates, read from the same parameters as the engine. */
export function RateGrid({ className }: { className?: string }) {
  const C = en.cockpit;
  return (
    <Card className={className}>
      <CardHeader
        title={C.ratesTitle}
        eyebrow={C.ratesRef(fmtPct(MARKET.estr), fmtPct(MARKET.dfr))}
      />
      <table className="w-full text-[13px]">
        <tbody>
          {C.rates.map((r) => (
            <tr key={r.key} className="border-t border-line align-top first:border-0">
              <td className="py-2 pr-3">{r.k}</td>
              <td className="tabular whitespace-nowrap py-2 pr-3 text-right">{VALUE[r.key]}</td>
              <td className="py-2 text-[12px] text-muted">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
