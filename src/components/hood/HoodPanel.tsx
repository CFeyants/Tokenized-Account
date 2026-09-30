import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FxTab } from './FxTab';
import { Check, ChevronDown, CircleDashed, X } from 'lucide-react';
import { useApp, useSim, type HoodTab } from '@/app/store';
import { en } from '@/i18n/en';
import { RATES } from '@/data/rates';
import {
  MIN_PER_DAY,
  dayIndex,
  formatDate,
  formatDateTime,
  hhmm,
  hhmmss,
  formatClock,
} from '@/engine/clock';
import { integrateMinutes, minuteAccrual, snapshotAt } from '@/engine/accrual';
import { drawers } from '@/engine/selectors';
import { fmtAmount, fmtEur, fmtM, fmtPct } from '@/engine/format';
import type { State } from '@/engine/types';
import { Dialog, SheetContent } from '@/components/ui/dialog';
import { Chip } from '@/components/ui/chip';
import { Row } from '@/components/Page';
import { InfoTip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const H = en.hood;
const TABS: HoodTab[] = ['ledger', 'orchestration', 'accrual', 'alm', 'fx', 'intragroup', 'notYet'];

function LedgerTab() {
  const { t, tl } = useSim();
  const [today, setToday] = useState(false);
  const start = today ? dayIndex(t) * MIN_PER_DAY : -1;
  const rows = tl.ledger
    .filter((l) => l.t < Math.floor(t) + 1 && l.t >= start)
    .slice(-250)
    .reverse();
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12.5px] text-muted">{H.ledgerLead}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setToday(false)}
            className={cn(
              'cursor-pointer rounded-full px-2.5 py-1 text-[11.5px]',
              !today ? 'bg-surface-2 text-fg' : 'text-muted',
            )}
          >
            {H.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setToday(true)}
            className={cn(
              'cursor-pointer rounded-full px-2.5 py-1 text-[11.5px]',
              today ? 'bg-surface-2 text-fg' : 'text-muted',
            )}
          >
            {H.filterToday}
          </button>
        </div>
      </div>
      <table className="w-full font-mono text-[11px]">
        <thead className="sticky top-0 bg-surface">
          <tr className="text-left text-muted">
            <th className="py-1.5 font-normal">{H.cols.time}</th>
            <th className="py-1.5 font-normal">{H.cols.account}</th>
            <th className="py-1.5 text-right font-normal">{H.cols.amount}</th>
            <th className="py-1.5 pl-3 font-normal">{H.cols.finality}</th>
            <th className="py-1.5 pl-2 font-normal">{H.cols.unit}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-t border-line align-top" title={l.memo}>
              <td className="whitespace-nowrap py-1.5 pr-2 text-muted">
                {formatDate(l.t).slice(0, 3)} {hhmmss(l.t)}
              </td>
              <td className="py-1.5 pr-2">
                {l.account}
                <div className="font-sans text-[10.5px] text-muted">{l.memo}</div>
              </td>
              <td
                className={cn(
                  'whitespace-nowrap py-1.5 text-right',
                  l.amount > 0 ? 'text-new' : '',
                )}
              >
                {l.currency} {fmtAmount(l.amount)}
              </td>
              <td
                className={cn(
                  'py-1.5 pl-3',
                  l.finality === 'pending' ? 'text-amber' : 'text-muted',
                )}
              >
                {l.finality}
              </td>
              <td className="whitespace-nowrap py-1.5 pl-2 text-muted">{l.unitId ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrchTab() {
  const { t, tl } = useSim();
  const rows = tl.orch
    .filter((o) => o.t <= t)
    .slice(-60)
    .reverse();
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted">{H.orchLead}</p>
      {rows.map((o, i) => (
        <div key={i} className="rounded-xl border border-line p-3.5">
          <div className="flex items-center justify-between text-[11.5px] text-muted">
            <span className="tabular">{formatClock(o.t)}</span>
            <Chip tone="rule">{o.rule}</Chip>
          </div>
          <div className="mt-2 grid grid-cols-[88px_1fr] gap-y-1 text-[12.5px]">
            <span className="text-muted">{H.labels.decision}</span>
            <span>{o.decision}</span>
            <span className="text-muted">{H.labels.instrument}</span>
            <span>{o.instrument}</span>
            <span className="text-muted">{H.labels.rail}</span>
            <span>{o.rail}</span>
          </div>
          <ul className="mt-2 space-y-1">
            {o.checks.map((c, j) => (
              <li key={j} className="flex items-start gap-2 text-[11.5px]">
                {c.ok ? (
                  <Check className="mt-0.5 size-3 shrink-0 text-new" />
                ) : (
                  <X className="mt-0.5 size-3 shrink-0 text-amber" />
                )}
                <span className="text-muted">
                  <span className="text-fg">{c.name}</span> — {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

type Target = {
  id: string;
  label: string;
  weight: (s: State) => number;
  bal: (s: State) => number;
  rate: (s: State) => number;
};

function useTargets(state: State): Target[] {
  const base: Target[] = [
    {
      id: 'tok-paris',
      label: `${en.product.name} · Paris`,
      bal: (s) => s.bal['tok-paris'] + s.blocked,
      rate: () => RATES.tokenised,
      weight: (s) => (Math.max(0, s.bal['tok-paris']) + s.blocked) * RATES.tokenised,
    },
    {
      id: 'tok-munich',
      label: `${en.product.name} · Munich`,
      bal: (s) => s.bal['tok-munich'],
      rate: (s) => (s.bal['tok-munich'] < 0 ? RATES.intradayDebit : RATES.tokenised),
      weight: (s) =>
        s.bal['tok-munich'] < 0
          ? s.bal['tok-munich'] * RATES.intradayDebit
          : s.bal['tok-munich'] * RATES.tokenised,
    },
    {
      id: 'cur-paris',
      label: en.accounts.currentOf('Paris'),
      bal: (s) => s.bal['cur-paris'],
      rate: () => RATES.current,
      weight: (s) => s.bal['cur-paris'] * RATES.current,
    },
  ];
  const units: Target[] = state.units.map((u) => ({
    id: u.id,
    label: `${H.labels.unit} ${u.id} · ${u.tenor} · ${u.currency}`,
    bal: (s) => s.units.find((x) => x.id === u.id)?.amount ?? 0,
    rate: () => u.rate,
    weight: (s) => {
      const x = s.units.find((y) => y.id === u.id);
      return x ? x.amount * x.rate : 0;
    },
  }));
  return [...base, ...units];
}

function AccrualTab() {
  const { t, tl, state } = useSim();
  const target = useApp((s) => s.accrualTarget);
  const setTarget = (v: string) => useApp.setState({ accrualTarget: v });
  const [open, setOpen] = useState(true);
  const targets = useTargets(state);
  const tg = targets.find((x) => x.id === target) ?? targets[0];
  const now = Math.floor(t);
  const daily = tg.id === 'cur-paris';
  const minutes = useMemo(() => {
    const rows = [];
    let cum = integrateMinutes(tl.snaps, 0, now - 30, tg.weight);
    for (let m = now - 29; m <= now; m++) {
      const s = snapshotAt(tl.snaps, m - 1).state;
      const acc = tg.weight(s) / 518_400;
      cum += acc;
      rows.push({ m, bal: tg.bal(s), rate: tg.rate(s), acc, cum });
    }
    return rows.reverse();
  }, [tl, tg, now]);
  const days = [];
  for (let d = 0; d <= dayIndex(t); d++) {
    const a = d * MIN_PER_DAY;
    const b = Math.min(t, a + MIN_PER_DAY);
    days.push({
      d,
      amount: daily
        ? b === a + MIN_PER_DAY
          ? tg.weight(snapshotAt(tl.snaps, b - 1e-6).state) / 360
          : 0
        : integrateMinutes(tl.snaps, a, b, tg.weight),
      partial: b < a + MIN_PER_DAY,
    });
  }
  return (
    <div>
      <p className="mb-3 text-[12.5px] text-muted">{H.accrualLead}</p>
      <label className="block text-[12px] text-muted">
        {H.target}
        <select
          value={tg.id}
          onChange={(e) => setTarget(e.target.value)}
          className="ml-2 h-8 rounded-lg border border-line-strong bg-surface px-2 text-[12.5px] text-fg"
        >
          {targets.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 rounded-xl bg-surface-2 p-3.5 text-[12px] leading-relaxed">
        <div className="mb-1 font-medium">{H.formula}</div>
        <span className="text-muted">{daily ? en.tips.daily : H.formulaText}</span>
      </div>
      {!daily && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="mt-4 inline-flex cursor-pointer items-center gap-1 text-[12px] text-new"
          >
            <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
            {open ? H.hideTable : H.showTable} · {H.lastMinutes}
          </button>
          {open && (
            <table className="mt-2 w-full font-mono text-[11px]">
              <thead>
                <tr className="text-left text-muted">
                  {H.labels.minCols.map((c, i) => (
                    <th key={c} className={cn('py-1 font-normal', i > 0 && 'text-right')}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {minutes.map((r) => (
                  <tr key={r.m} className="border-t border-line">
                    <td className="py-1 text-muted">{hhmm(r.m)}</td>
                    <td className={cn('py-1 text-right', r.bal < 0 && 'text-red')}>
                      {fmtAmount(r.bal)}
                    </td>
                    <td className="py-1 text-right text-muted">{fmtPct(r.rate)}</td>
                    <td className="py-1 text-right text-new">{r.acc.toFixed(4)}</td>
                    <td className="py-1 text-right">{r.cum.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <div className="mt-5 text-[12.5px] font-medium">{H.posted}</div>
      {days.map((d) => (
        <Row
          key={d.d}
          k={`${formatDate(d.d * MIN_PER_DAY)}${d.partial ? ' ' + H.labels.soFar : ''}`}
          v={fmtEur(d.amount)}
        />
      ))}
    </div>
  );
}

function AlmTab() {
  const { state } = useSim();
  const d = drawers(state);
  const byTenor = new Map<string, number>();
  for (const u of state.units.filter((x) => !x.blocked)) {
    const k =
      u.tenor === 'overnight' || u.tenor === 'weekend'
        ? 'overnight / weekend'
        : `${u.tenor}${u.currency === 'USD' ? ' (USD, EUR eq.)' : ''}`;
    byTenor.set(k, (byTenor.get(k) ?? 0) + (u.currency === 'USD' ? u.amount / 1.08 : u.amount));
  }
  const pureOvernight = byTenor.get('overnight / weekend') ?? 0;
  const col = state.collateral.filter((c) => c.status === 'active');
  const bar = (v: number, cls: string) => (
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn('h-full', cls)}
        style={{ width: `${Math.min(100, (v / 200e6) * 100)}%` }}
      />
    </div>
  );
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-muted">{H.almLead}</p>
      <div>
        <Row k={H.alm.operational} v={fmtM(d.current)} />
        {bar(d.current, 'bg-grey')}
      </div>
      <div>
        <Row k={H.alm.tokSight} v={fmtM(d.tokFree)} />
        {bar(Math.max(0, d.tokFree), 'bg-new')}
      </div>
      <div>
        <Row k={H.alm.units} v={fmtM(d.termUnits + d.usdUnitsEur)} />
        {[...byTenor.entries()].map(([k, v]) => (
          <Row
            key={k}
            k={<span className="pl-4">· {k}</span>}
            v={fmtM(v)}
            className="text-[12px]"
          />
        ))}
      </div>
      <div>
        <Row k={H.alm.blocked} v={fmtM(d.tokBlocked)} />
        {col.map((c) => (
          <Row
            key={c.id}
            k={
              <span className="pl-4">
                · {c.id} — {H.alm.lock} {formatDateTime(c.since)}
              </span>
            }
            v={
              <span className="text-[12px] text-muted">
                {H.alm.release} {c.releaseEvent}
              </span>
            }
            className="text-[12px]"
          />
        ))}
      </div>
      <div>
        <Row k={H.alm.overnight} v={fmtM(pureOvernight)} />
        {bar(pureOvernight, 'bg-amber-fill')}
      </div>
      <div>
        <Row k={H.alm.fund} v={fmtM(d.fund)} />
      </div>
      <p className="rounded-xl bg-surface-2 p-3.5 text-[12px] leading-relaxed text-muted">
        {H.almNote}
      </p>
    </div>
  );
}

function IntragroupTab() {
  const { t, state } = useSim();
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1 text-[12.5px] text-muted">
        {H.igLead}
        <InfoTip content={en.tips.mirror} />
      </p>
      {state.mirrors.length === 0 && <p className="text-[13px] text-muted">{H.igEmpty}</p>}
      {state.mirrors.map((m) => (
        <div key={m.id} className="rounded-xl border border-new/30 p-4">
          <div className="flex items-center justify-between text-[11.5px] text-muted">
            <span className="font-mono">{m.id}</span>
            <span className="tabular">{formatDateTime(m.t)}:00</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px]">
            <span className="rounded-lg bg-surface-2 px-2 py-1">{m.debtorBank}</span>
            <span className="text-muted">{H.labels.owes}</span>
            <span className="rounded-lg bg-surface-2 px-2 py-1">{m.creditorBank}</span>
          </div>
          <Row k={m.currency} v={`${m.currency} ${fmtAmount(m.amount)}`} />
          <Row k={H.labels.eurEq} v={fmtEur(m.eur, 'EUR', 0)} />
          <Row
            k={`${fmtPct(RATES.overnightUnit)} · ${H.igAccrued}`}
            v={
              <span className="text-new">
                {fmtEur(minuteAccrual(m.eur, RATES.overnightUnit, Math.max(0, t - m.t)))}
              </span>
            }
          />
          <p className="mt-1 text-[11.5px] text-muted">{m.memo}</p>
        </div>
      ))}
    </div>
  );
}

function NotYetTab() {
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-muted">{H.notYetLead}</p>
      {H.notYetItems.map((i) => (
        <div
          key={i.title}
          className="flex items-start gap-3 rounded-xl border border-dashed border-line-strong p-4"
        >
          <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px]">{i.title}</div>
            <p className="mt-0.5 text-[12px] text-muted">{i.text}</p>
          </div>
          <span className="tabular font-serif text-[16px] text-muted">{i.year}</span>
        </div>
      ))}
    </div>
  );
}

export function HoodPanel() {
  const open = useApp((s) => s.hoodOpen);
  const tab = useApp((s) => s.hoodTab);
  const setOpen = useApp((s) => s.setHoodOpen);
  const setTab = useApp((s) => s.setHoodTab);
  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <SheetContent title={H.title} data-testid="hood-panel">
        <div className="flex items-start justify-between border-b border-line px-6 pb-4 pt-5">
          <div>
            <h2 className="text-[22px]">{H.title}</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">{H.lead}</p>
            <Link
              to="/business-case"
              onClick={() => setOpen(false)}
              className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] text-new hover:underline"
            >
              {H.bankView} →
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={H.close}
            className="cursor-pointer rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <div
          className="flex flex-wrap gap-1 border-b border-line px-5 py-2.5"
          role="tablist"
          aria-label={H.title}
        >
          {TABS.map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                'h-8 cursor-pointer rounded-full px-3 text-[12.5px]',
                tab === k ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {H.tabs[k]}
            </button>
          ))}
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5" role="tabpanel">
          {tab === 'ledger' && <LedgerTab />}
          {tab === 'orchestration' && <OrchTab />}
          {tab === 'accrual' && <AccrualTab />}
          {tab === 'alm' && <AlmTab />}
          {tab === 'intragroup' && <IntragroupTab />}
          {tab === 'fx' && <FxTab />}
          {tab === 'notYet' && <NotYetTab />}
        </div>
      </SheetContent>
    </Dialog>
  );
}
