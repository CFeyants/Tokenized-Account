import { useState } from 'react';
import { ArrowRightLeft, Check, Clock3 } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { RATES, UNIT_RATE, type UnitTenor } from '@/data/rates';
import { formatDateTime, isFundHours } from '@/engine/clock';
import { minuteAccrual } from '@/engine/accrual';
import { classicBreakCost, unitSaleQuote } from '@/engine/pricing';
import { fmtAmount, fmtEur, fmtM, fmtMinutes, fmtPct, numM } from '@/engine/format';
import type { Unit } from '@/engine/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { InfoTip, Tip } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { LayerTag, PageHeader, Row } from '@/components/Page';
import { MinuteRing } from '@/components/MinuteRing';
import { Animated } from '@/components/Animated';
import { cn } from '@/lib/utils';

const P = en.placements;
const M = 1_000_000;

const LADDER_RATE: Record<string, number> = {
  tok: RATES.tokenised,
  cur: RATES.current,
  on: RATES.overnightUnit,
  mmf: RATES.mmf,
  '1m': RATES.unit1m,
  '3m': RATES.unit3m,
  '6m': RATES.unit6m,
  '12m': RATES.unit12m,
};

function YieldLadder() {
  const max = RATES.unit12m;
  return (
    <Card>
      <CardHeader
        eyebrow={P.ladderLead}
        title={P.ladderTitle}
        aside={<InfoTip content={en.tips.tokRate} />}
      />
      <div className="grid h-[230px] grid-cols-8 items-end gap-4" role="list">
        {P.ladder.map((l) => {
          const r = LADDER_RATE[l.key];
          const isTok = l.key === 'tok';
          const isUnit = !['tok', 'cur', 'mmf'].includes(l.key);
          return (
            <div key={l.key} role="listitem" className="flex h-full flex-col justify-end">
              <div
                className={cn(
                  'tabular mb-2 text-center text-[15px]',
                  isUnit ? 'text-amber' : isTok ? 'text-new' : 'text-muted',
                )}
              >
                {fmtPct(r)}
              </div>
              <div
                className={cn(
                  'w-full rounded-t-lg transition-all',
                  isTok && 'border border-new/60 bg-new-soft',
                  l.key === 'cur' && 'bg-grey',
                  l.key === 'mmf' && 'border-2 border-amber-fill bg-amber-soft',
                  isUnit && 'bg-amber-fill',
                )}
                style={{ height: `${Math.max(3, (r / max) * 150)}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-8 gap-4 border-t border-line pt-3">
        {P.ladder.map((l) => (
          <div key={l.key} className="text-center">
            <div className="text-[12.5px] leading-tight">{l.label}</div>
            <div className="mt-1 text-[11px] text-muted">
              {P.avail[l.avail as keyof typeof P.avail]}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ClassicColumn() {
  const c = classicBreakCost(20 * M, RATES.classicTD['3m'], 4);
  return (
    <Card className="flex flex-col">
      <CardHeader title={P.classic.title} aside={<LayerTag layer="traditional" />} />
      <p className="text-[13.5px] leading-relaxed text-muted">{P.classic.text}</p>
      <div className="mt-3 text-[13px] text-muted">{P.classic.rates}</div>
      <div className="mt-auto pt-6">
        <div className="mb-2 text-[12.5px] font-medium">{P.classic.example}</div>
        <Row k={P.classic.forfeited} v={fmtEur(c.forfeited)} />
        <Row k={P.classic.fee} v={fmtEur(c.fee)} />
        <Row
          k={P.classic.total}
          v={<span className="text-red">−{fmtEur(c.total)}</span>}
          className="border-t border-line"
        />
      </div>
    </Card>
  );
}

function UnitsColumn() {
  const addAction = useApp((s) => s.addAction);
  const [tenor, setTenor] = useState<UnitTenor>('1m');
  const [amount, setAmount] = useState(10);
  const [done, setDone] = useState(false);
  return (
    <Card tone="new" className="flex flex-col">
      <CardHeader
        title={P.units.title}
        aside={
          <Tip content={en.tips.unitSold}>
            <span tabIndex={0}>
              <LayerTag layer="new" />
            </span>
          </Tip>
        }
      />
      <p className="text-[13.5px] leading-relaxed text-muted">{P.units.text}</p>
      <div className="mt-auto pt-6">
        <div className="mb-2 text-[12.5px] font-medium">{P.units.buy}</div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={P.units.tenor}>
          {(['overnight', '1m', '3m', '6m', '12m'] as UnitTenor[]).map((k) => (
            <Button
              key={k}
              size="sm"
              role="radio"
              aria-checked={tenor === k}
              variant={tenor === k ? 'new' : 'secondary'}
              onClick={() => setTenor(k)}
            >
              {k} · {fmtPct(UNIT_RATE[k])}
            </Button>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-[13px]">
            <span className="text-muted">{P.units.amount}</span>
            <span className="tabular">{amount}</span>
          </div>
          <Slider
            aria-label={P.units.amount}
            min={1}
            max={40}
            step={1}
            value={[amount]}
            onValueChange={([v]) => {
              setAmount(v);
              setDone(false);
            }}
          />
        </div>
        <p className="mt-3 text-[12px] text-muted">{P.units.from}</p>
        <Button
          variant="primary"
          className="mt-3 w-full"
          onClick={() => {
            addAction({ kind: 'buyUnit', tenor, amount: amount * M });
            setDone(true);
          }}
        >
          {done ? <Check /> : null}
          {done ? P.units.bought : `${P.units.confirm} ${fmtM(amount * M, 'EUR', 0)} · ${tenor}`}
        </Button>
      </div>
    </Card>
  );
}

function FundColumn() {
  const { t, state } = useSim();
  const addAction = useApp((s) => s.addAction);
  const [amount, setAmount] = useState(5);
  const open = isFundHours(t);
  const queued = state.fundOrders.filter((o) => o.status === 'queued');
  return (
    <Card className="flex flex-col">
      <CardHeader
        title={P.fund.title}
        aside={
          <span className="flex gap-1.5">
            <LayerTag layer="traditional" />
            <LayerTag layer="new" />
          </span>
        }
      />
      <p className="text-[13.5px] leading-relaxed text-muted">{P.fund.text}</p>
      <ul className="mt-4 space-y-2 text-[12.5px]">
        <li className="flex gap-2 text-muted">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" />
          {P.fund.trad}
        </li>
        <li className="flex gap-2 text-new">
          <ArrowRightLeft className="mt-0.5 size-3.5 shrink-0" />
          {P.fund.tok}
        </li>
      </ul>
      <div className="mt-auto pt-6">
        <Row k={P.fund.held} v={`EUR ${numM(state.fundUnits)}m`} />
        <Row k={P.fund.nav} v={fmtPct(RATES.mmf)} />
        {queued.map((o) => (
          <Tip key={o.id} content={en.tips.fundQueued}>
            <div
              tabIndex={0}
              className="my-1 flex cursor-help items-center justify-between rounded-lg bg-amber-soft px-3 py-2 text-[12.5px] text-amber"
            >
              <span>{P.queuedSince(fmtM(o.amount), formatDateTime(o.placedAt))}</span>
              <Clock3 className="size-3.5" />
            </div>
          </Tip>
        ))}
        <div className="mt-3 mb-2 flex justify-between text-[13px]">
          <span className="text-muted">{P.units.amount}</span>
          <span className="tabular">{amount}</span>
        </div>
        <Slider
          aria-label={P.units.amount}
          min={1}
          max={20}
          step={1}
          value={[amount]}
          onValueChange={([v]) => setAmount(v)}
        />
        <p className={cn('mt-3 text-[12px]', open ? 'text-muted' : 'text-amber')}>
          {open ? P.fund.openNote : P.fund.queuedNote}
        </p>
        <Button
          variant="new"
          className="mt-3 w-full"
          onClick={() => addAction({ kind: 'fund', amount: amount * M })}
        >
          {P.fund.subscribe} {fmtM(amount * M, 'EUR', 0)}
        </Button>
        <p className="mt-2 text-[11.5px] text-muted">{P.fund.pledge}</p>
      </div>
    </Card>
  );
}

function SellDialog({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { t } = useSim();
  const addAction = useApp((s) => s.addAction);
  const [nominal, setNominal] = useState(Math.min(20, Math.floor(unit.amount / M)));
  const q = unitSaleQuote(unit, nominal * M, t);
  const days = Math.max(1, Math.ceil((t - unit.start) / 1440));
  const brk = classicBreakCost(nominal * M, unit.rate, days);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={P.sellTitle} description={P.sellDesc}>
        <div className="mb-2 flex justify-between text-[13px]">
          <span className="text-muted">{P.nominal}</span>
          <span className="tabular">{nominal}</span>
        </div>
        <Slider
          aria-label={P.nominal}
          min={1}
          max={Math.max(1, Math.floor(unit.amount / M))}
          step={1}
          value={[nominal]}
          onValueChange={([v]) => setNominal(v)}
        />
        <div className="mt-5 rounded-xl bg-surface-2 px-4 py-2">
          <Row k={P.par} v={fmtEur(q.nominal)} />
          <Row
            k={
              <span className="flex items-center gap-2">
                <MinuteRing size={14} progress={1} />
                {P.accrued} · {fmtMinutes(q.minutes)}
              </span>
            }
            v={<span className="text-new">+{fmtEur(q.accrued)}</span>}
          />
          <Row k={P.spread} v={`−${fmtEur(q.spread)}`} />
          <Row
            k={<span className="text-fg">{P.price}</span>}
            v={<span className="text-[16px]">{fmtEur(q.price)}</span>}
            className="border-t border-line"
          />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line px-4 py-2.5 text-[13px]">
          <span className="text-muted">{P.vsBreak}</span>
          <span className="tabular text-red">−{fmtEur(brk.total)}</span>
        </div>
        <div className="mt-5 text-[12.5px] font-medium">{P.transferTitle}</div>
        <ul className="mt-1.5 space-y-1 text-[12.5px] text-muted">
          <li>· {P.transferGroup}</li>
          <li>· {P.transferClient}</li>
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {P.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              addAction({ kind: 'sellUnit', unitId: unit.id, amount: nominal * M });
              onClose();
            }}
          >
            {P.confirmSell}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Positions() {
  const { t, state } = useSim();
  const [selling, setSelling] = useState<Unit | null>(null);
  const units = state.units;
  return (
    <Card>
      <CardHeader
        eyebrow={P.positionsLead}
        title={P.positions}
        aside={
          <Tip content={en.tips.unitSold}>
            <span tabIndex={0}>
              <LayerTag layer="new" />
            </span>
          </Tip>
        }
      />
      {units.length === 0 ? (
        <p className="text-[13.5px] text-muted">{P.noUnits}</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted">
              {P.cols.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    'pb-2 font-normal',
                    i >= 2 && i !== 4 && i !== 5 && 'text-right',
                    i === 4 && 'pl-4',
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const acc = minuteAccrual(u.amount, u.rate, t - u.start);
              return (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2.5 font-mono text-[12px]">{u.id}</td>
                  <td className="py-2.5">
                    {u.tenor} {u.currency !== 'EUR' && <Chip tone="neutral">{u.currency}</Chip>}
                    {u.blocked && (
                      <Chip tone="new" className="ml-1.5">
                        {P.blockedNote}
                      </Chip>
                    )}
                  </td>
                  <td className="tabular py-2.5 text-right">
                    {u.currency} {fmtAmount(u.amount)}
                  </td>
                  <td className="tabular py-2.5 text-right text-amber">{fmtPct(u.rate)}</td>
                  <td className="tabular py-2.5 pl-4 text-muted">{formatDateTime(u.start)}</td>
                  <td className="tabular py-2.5 text-muted">{formatDateTime(u.maturity)}</td>
                  <td className="py-2.5 text-right text-new">
                    <span className="inline-flex items-center gap-2">
                      <MinuteRing size={14} progress={(t % 60) / 60} />
                      <Animated value={acc} format={(v) => `${u.currency} ${fmtAmount(v, 2)}`} />
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    {!u.blocked && u.currency === 'EUR' && u.origin === 'marie' && (
                      <Button size="sm" variant="secondary" onClick={() => setSelling(u)}>
                        {P.sell}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {selling && <SellDialog unit={selling} onClose={() => setSelling(null)} />}
    </Card>
  );
}

export function Placements() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={P.eyebrow} title={P.title} lead={P.lead} />
      <div className="grid grid-cols-3 gap-6">
        <ClassicColumn />
        <UnitsColumn />
        <FundColumn />
      </div>
      <YieldLadder />
      <Positions />
    </div>
  );
}
