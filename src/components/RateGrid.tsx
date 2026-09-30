import { en } from '@/i18n/en';
import { fmtPct } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';

/** One grid of rates, used everywhere a rate is quoted. */
export function RateGrid({ className }: { className?: string }) {
  const C = en.cockpit;
  return (
    <Card className={className}>
      <CardHeader title={C.ratesTitle} />
      <table className="w-full text-[13px]">
        <tbody>
          {C.rates.map((r) => (
            <tr key={r.k} className="border-t border-line first:border-0 align-top">
              <td className="py-2 pr-3">{r.k}</td>
              <td className="tabular whitespace-nowrap py-2 pr-3 text-right">
                {fmtPct(r.v)}
                {'v2' in r && r.v2 ? `–${fmtPct(r.v2)}` : ''}
              </td>
              <td className="py-2 text-[12px] text-muted">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
