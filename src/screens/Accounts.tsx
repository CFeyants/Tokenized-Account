import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { accountRows } from '@/engine/selectors';
import { bankById, entityById } from '@/data/entities';
import { FX_MID, RATES } from '@/data/rates';
import { fmtAmount, fmtEur, numM } from '@/engine/format';
import { minuteAccrual, dailyAccrual } from '@/engine/accrual';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { InfoTip, Tip } from '@/components/ui/tooltip';
import { LayerTag, PageHeader } from '@/components/Page';
import { MinuteRing } from '@/components/MinuteRing';
import { cn } from '@/lib/utils';

const A = en.accounts;
const DETAIL = new Set(['cur-paris', 'tok-paris', 'tok-munich', 'tok-usd-chicago', 'tok-sgd-singapore']);

export function FinalityChip({ f }: { f: 'final' | 'pendingCover' | 'valueTomorrow' }) {
  const chip = (
    <Chip tone={f === 'final' ? 'neutral' : 'amber'} className="cursor-help" tabIndex={0}>
      <span className={cn('size-1.5 rounded-full', f === 'final' ? 'bg-new' : 'bg-amber')} />
      {A.finality[f]}
    </Chip>
  );
  return <Tip content={f === 'pendingCover' ? en.tips.pendingCover : en.tips.final}>{chip}</Tip>;
}

function SameEuro() {
  const cur = dailyAccrual(1_000_000, RATES.current);
  const tok = minuteAccrual(1_000_000, RATES.overnightUnit, 12 * 60) + minuteAccrual(1_000_000, RATES.tokenised, 120);
  return (
    <Card>
      <CardHeader eyebrow={A.sameEuroLead} title={A.sameEuro} aside={<InfoTip content={en.tips.lateCash} />} />
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl bg-grey-soft p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">{A.sameCurrent}</span>
            <LayerTag layer="traditional" />
          </div>
          <div className="tabular mt-3 font-serif text-[40px] leading-none text-muted">{fmtEur(cur)}</div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{A.sameCurrentHow}</p>
        </div>
        <div className="rounded-2xl bg-new-soft p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-new">{A.sameTok}</span>
            <LayerTag layer="new" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <MinuteRing size={34} progress={14 / 24} />
            <span className="tabular font-serif text-[40px] leading-none text-new">{fmtEur(tok)}</span>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{A.sameTokHow}</p>
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-muted">{A.dayConvention}</p>
    </Card>
  );
}

export function Accounts() {
  const { state, t } = useSim();
  const navigate = useNavigate();
  const rows = accountRows(state, t);
  const C = A.cols;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={A.eyebrow} title={A.title} lead={A.lead} />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-line text-left text-[11.5px] text-muted">
              <th className="px-6 py-3 font-medium">{C.entity}</th>
              <th className="px-3 py-3 font-medium">{C.bank}</th>
              <th className="px-3 py-3 font-medium">{C.type}</th>
              <th className="px-3 py-3 text-right font-medium">{C.balance}</th>
              <th className="px-3 py-3 text-right font-medium">{C.eur}</th>
              <th className="px-3 py-3 font-medium">{C.finality}</th>
              <th className="px-3 py-3 font-medium">{C.cutoff}</th>
              <th className="px-3 py-3 font-medium">{C.night}</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const e = entityById(r.def.entity);
              const b = bankById(r.def.bank);
              const outside = !b.ours;
              const clickable = DETAIL.has(r.def.id);
              const onBank = r.balance + r.blocked + r.inUnit;
              return (
                <tr
                  key={r.def.id}
                  onClick={clickable ? () => navigate(`/accounts/${r.def.id}`) : undefined}
                  onKeyDown={clickable ? (ev) => ev.key === 'Enter' && navigate(`/accounts/${r.def.id}`) : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  className={cn('border-b border-line last:border-0', clickable && 'cursor-pointer hover:bg-surface-2/60', outside && 'text-muted')}
                >
                  <td className="px-6 py-3.5">
                    <div className={cn(!outside && 'text-fg')}>{e.city}</div>
                    <div className="text-[11.5px] text-muted">{e.name}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={cn(outside && 'rounded-md border border-dashed border-line-strong px-1.5 py-0.5')}>{b.name}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <Chip tone={r.def.type === 'tokenised' ? 'new' : r.def.type === 'current' ? 'traditional' : 'outside'}>
                      {A.types[r.def.type]}
                    </Chip>
                  </td>
                  <td className="tabular px-3 py-3.5 text-right">
                    <span className={cn(r.balance < 0 && 'text-red')}>
                      {r.def.currency} {fmtAmount(r.balance)}
                    </span>
                    {(r.blocked > 0 || r.inUnit > 0) && (
                      <div className="text-[11px] text-muted">
                        {r.blocked > 0 && <span className="text-new">{numM(r.blocked)}m {A.subBlocked.toLowerCase()} · </span>}
                        {r.inUnit > 0 && <span className="text-amber">{numM(r.inUnit)}m {A.subInUnit.toLowerCase()}</span>}
                      </div>
                    )}
                    {r.pending > 0 && <div className="text-[11px] text-amber">+ {numM(r.pending)}m {A.finality.pendingCover.toLowerCase()}</div>}
                  </td>
                  <td className="tabular px-3 py-3.5 text-right text-muted">{numM(onBank / FX_MID[r.def.currency])}m</td>
                  <td className="px-3 py-3.5">
                    <FinalityChip f={r.finality} />
                  </td>
                  <td className="tabular px-3 py-3.5 text-muted">{r.def.cutoff === 'none' ? A.noCutoff : r.def.cutoff}</td>
                  <td className="px-3 py-3.5 text-[12.5px] text-muted">{A.night[r.def.night]}</td>
                  <td className="pr-4">{clickable && <ChevronRight className="size-4 text-muted" aria-label={A.open} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <SameEuro />
        </div>
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title={A.poolingTitle} aside={<LayerTag layer="traditional" />} />
          <p className="text-[13.5px] leading-relaxed text-muted">{A.poolingText}</p>
        </Card>
      </div>
    </div>
  );
}
