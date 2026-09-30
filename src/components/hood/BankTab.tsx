import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';
import { en } from '@/i18n/en';
import { cn } from '@/lib/utils';

const S = en.settle;

/** Bank view: who captures the US subsidiary, and what fund settlement does to our balance sheet. */
export function BankTab() {
  const setHoodOpen = useApp((s) => s.setHoodOpen);
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-[13.5px] font-medium">{S.competitionTitle}</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[12px]">
            <thead>
              <tr className="text-left text-[11px] text-muted">
                {S.competitionCols.map((c) => (
                  <th key={c} className="pb-2 pr-3 font-normal">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {S.competition.map((row) => (
                <tr
                  key={row[0]}
                  className={cn(
                    'border-t border-line align-top',
                    row[0] === 'Norvane Bank' && 'bg-new-soft',
                  )}
                >
                  {row.map((cell, i) => (
                    <td key={i} className={cn('py-2 pr-3', i === 0 ? 'font-medium' : 'text-muted')}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-serif text-[16px] text-new">{S.competitionEdge}</p>
        <p className="text-[11.5px] text-muted">{S.competitionNote}</p>
      </div>
      <div className="rounded-xl border border-line p-4">
        <div className="mb-2 text-[13.5px] font-medium">
          {S.title} — {S.bankTitle.toLowerCase()}
        </div>
        <ul className="space-y-1 text-[12.5px]">
          <li className="text-muted">{S.bankA}</li>
          <li>{S.bankB}</li>
          <li className="text-muted">{S.bankRevenues}</li>
          <li className="text-muted">{S.bankCosts}</li>
        </ul>
        <Link
          to="/settle-fund"
          onClick={() => setHoodOpen(false)}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] text-new hover:underline"
        >
          {S.title} <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
