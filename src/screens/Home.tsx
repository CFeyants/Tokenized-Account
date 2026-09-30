import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, PlayCircle, Timer, X } from 'lucide-react';
import { useTour } from '@/tour/useTour';
import { COCKPIT_START, useApp, useSim } from '@/app/store';
import { useGov, PEOPLE, personLabel } from '@/app/governance';
import { en } from '@/i18n/en';
import { bankById, entityById } from '@/data/entities';
import { FX_MID } from '@/data/rates';
import {
  MIN_PER_DAY,
  dayIndex,
  formatClock,
  formatDate,
  formatDateTime,
  hhmm,
  minuteOfDay,
  weekday,
} from '@/engine/clock';
import { WINDOWS, nextOpen } from '@/engine/markets';
import { accountRows, drawers } from '@/engine/selectors';
import { snapshotAt } from '@/engine/accrual';
import { fmtAmount, fmtM, fmtMinutes, numM } from '@/engine/format';
import type { State } from '@/engine/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { RateGrid } from '@/components/RateGrid';
import { cn } from '@/lib/utils';

const C = en.cockpit;
const G = en.gov;

/** Group cash in EUR, everywhere: at the bank, other banks, subsidiaries' ledger accounts. */
function groupCash(s: State) {
  const d = drawers(s);
  return (
    d.current +
    d.tokFree +
    d.tokBlocked +
    d.termUnits +
    d.fund +
    d.otherBanks +
    d.usdUnitsEur +
    d.tokOtherCcyEur
  );
}

const FORECAST = [
  { day: 0, closing: 301.5 },
  { day: 1, closing: 311.0 },
  { day: 7, closing: 352.0 },
];

function Alerts() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {C.alerts.map((a) => (
        <Card key={a.key} tone="new" className="flex flex-col p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" />
            <div className="text-[14.5px] font-medium leading-snug">{a.title}</div>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{a.text}</p>
          <div className="mt-3 text-[12.5px] text-new">{a.gain}</div>
          <Button asChild variant="primary" size="sm" className="mt-4 self-start">
            <Link to={a.path}>
              {a.action} <ArrowRight />
            </Link>
          </Button>
        </Card>
      ))}
    </div>
  );
}

function Position() {
  const { t, tl, state } = useSim();
  const rows = accountRows(state, t).filter(
    (r) => r.balance !== 0 || r.inUnit !== 0 || r.blocked !== 0,
  );
  const eur = (r: (typeof rows)[number]) =>
    (r.balance + r.blocked + r.inUnit) / FX_MID[r.def.currency];
  const atBank = rows.filter((r) => bankById(r.def.bank).ours).reduce((a, r) => a + eur(r), 0);
  const total = groupCash(state);
  /** Why each balance last moved: the ledger entry, today. */
  const lastMove = (id: string) => {
    const e = [...tl.ledger]
      .reverse()
      .find(
        (l) => l.account === id && l.t <= t && l.amount !== 0 && l.t >= Math.floor(t / 1440) * 1440,
      );
    return e
      ? C.lastMove(
          `${e.amount > 0 ? '+' : '−'}${numM(Math.abs(e.amount))}m`,
          e.memo,
          formatClock(e.t),
        )
      : null;
  };
  return (
    <Card className="p-0" data-tour="cockpit-position">
      <div className="px-6 pt-6">
        <CardHeader eyebrow={C.positionLead} title={C.positionTitle} />
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-[11.5px] text-muted">
            {C.cols.map((c, i) => (
              <th key={c} className={cn('px-6 py-2 font-medium', i >= 3 && 'text-right')}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const b = bankById(r.def.bank);
            return (
              <tr
                key={r.def.id}
                className={cn('border-b border-line last:border-0', !b.ours && 'text-muted')}
              >
                <td className="px-6 py-2">{entityById(r.def.entity).city}</td>
                <td className="px-6 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        !b.ours && 'rounded-md border border-dashed border-line-strong px-1.5',
                      )}
                    >
                      {b.name}
                    </span>
                    {r.def.type === 'tokenised' && (
                      <Chip tone="new">
                        <Timer />
                        {C.minuteBadge}
                      </Chip>
                    )}
                  </span>
                </td>
                <td className="px-6 py-2">{r.def.currency}</td>
                <td className={cn('tabular px-6 py-2 text-right', r.balance < 0 && 'text-red')}>
                  {fmtAmount(r.balance + r.blocked + r.inUnit)}
                  {lastMove(r.def.id) && (
                    <div
                      className="max-w-[340px] truncate text-[11px] font-normal text-muted"
                      title={lastMove(r.def.id)!}
                    >
                      {lastMove(r.def.id)}
                    </div>
                  )}
                </td>
                <td className="tabular px-6 py-2 text-right">{numM(eur(r))}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-line-strong">
            <td className="px-6 py-3 font-medium" colSpan={3}>
              {C.total}
              <span className="ml-3 text-[12px] font-normal text-muted">
                {fmtM(atBank)} {C.atBank} · {fmtM(total - atBank)} {C.elsewhere}
              </span>
            </td>
            <td />
            <td className="tabular px-6 py-3 text-right font-serif text-[20px]">{numM(total)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

function Queue() {
  const all = useGov((s) => s.approvals);
  const approvals = all.filter((a) => a.status === 'pending' && a.checker === 'marie');
  const approve = useGov((s) => s.approve);
  const reject = useGov((s) => s.reject);
  return (
    <Card data-tour="cockpit-approvals">
      <CardHeader
        title={G.queueTitle}
        aside={<Chip tone={approvals.length ? 'amber' : 'neutral'}>{approvals.length}</Chip>}
      />
      {approvals.length === 0 && <p className="text-[13px] text-muted">{G.queueEmpty}</p>}
      <ul className="space-y-3">
        {approvals.map((a) => (
          <li key={a.id} className="rounded-xl border border-line p-3.5">
            <div className="text-[13.5px] font-medium">{a.title}</div>
            <div className="mt-0.5 text-[11.5px] text-muted">
              {G.from(personLabel(a.maker))} · {formatDateTime(a.submittedAt)}
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{a.detail}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="primary" onClick={() => approve(a.id)}>
                <Check /> {G.approve}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => reject(a.id)}>
                <X /> {G.reject}
              </Button>
              <span className="ml-auto self-center text-[11px] text-muted">
                {G.mandate}: {fmtM(PEOPLE.marie.mandate, 'EUR', 0)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <Link
        to="/approvals"
        className="mt-4 inline-flex items-center gap-1 text-[12.5px] text-new hover:underline"
      >
        {G.auditTitle} <ArrowRight className="size-3.5" />
      </Link>
    </Card>
  );
}

const CUTOFFS: { key: keyof typeof WINDOWS | 'sepa' | 'fund'; label: string }[] = [
  { key: 'tokyo', label: en.funding.rows.tokyo },
  { key: 'cls', label: en.funding.rows.cls },
  { key: 'fund', label: C.cutoffFund },
  { key: 'riyadh', label: en.funding.rows.riyadh },
  { key: 'corrCutoff', label: en.funding.rows.corrCutoff },
  { key: 't2', label: en.funding.rows.t2 },
  { key: 'sepa', label: C.cutoffSepa },
];

function Cutoffs() {
  const { t } = useSim();
  const win = (k: (typeof CUTOFFS)[number]['key']) =>
    k === 'sepa'
      ? { key: 'sepa', days: [0, 1, 2, 3, 4], from: 0, to: 18 * 60 }
      : k === 'fund'
        ? { key: 'fund', days: [0, 1, 2, 3, 4], from: 9 * 60, to: 15 * 60 }
        : WINDOWS[k];
  return (
    <Card>
      <CardHeader title={C.cutoffsTitle} />
      <ul className="space-y-2">
        {CUTOFFS.map(({ key, label }) => {
          const w = win(key);
          const m = minuteOfDay(t);
          const open = w.days.includes(weekday(t)) && m >= w.from && m < w.to;
          const end = dayIndex(t) * MIN_PER_DAY + w.to;
          return (
            <li key={key} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="flex items-center gap-2">
                <span className={cn('size-1.5 rounded-full', open ? 'bg-new' : 'bg-red')} />
                {label}
              </span>
              <span className="tabular text-[12px] text-muted">
                {open
                  ? C.closesIn(fmtMinutes(end - t))
                  : `${C.closed} · ${C.opensAt(`${formatDate(nextOpen(w, t)).slice(0, 3)} ${hhmm(nextOpen(w, t))}`)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Forecast() {
  const { t, tl } = useSim();
  return (
    <Card>
      <CardHeader eyebrow={C.forecastLead} title={C.forecastTitle} />
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11.5px] text-muted">
            {C.forecastCols.map((c, i) => (
              <th key={i} className={cn('pb-2 font-normal', i > 0 && 'text-right')}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular">
          {(['closing', 'actual', 'gap'] as const).map((row) => (
            <tr key={row} className="border-t border-line">
              <td className="py-2">{C.forecastRows[row]}</td>
              {FORECAST.map((f) => {
                const closed = t >= (f.day + 1) * MIN_PER_DAY;
                const actual = closed
                  ? groupCash(snapshotAt(tl.snaps, (f.day + 1) * MIN_PER_DAY - 1e-6).state) / 1e6
                  : null;
                const v =
                  row === 'closing'
                    ? f.closing
                    : row === 'actual'
                      ? actual
                      : actual === null
                        ? null
                        : actual - f.closing;
                return (
                  <td
                    key={f.day}
                    className={cn(
                      'py-2 text-right',
                      row === 'gap' &&
                        v !== null &&
                        (Math.abs(v) > 5 ? 'text-amber' : 'text-muted'),
                    )}
                  >
                    {v === null ? '—' : `${row === 'gap' && v > 0 ? '+' : ''}${v.toFixed(1)}`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function TourStart() {
  const start = useTour((s) => s.start);
  const toggleDemo = useApp((s) => s.toggleDemo);
  const demo = useApp((s) => s.demoMode);
  const TT = en.tour;
  return (
    <div className="card flex items-center gap-6 border-new/40 bg-new-soft p-5">
      <Button size="lg" variant="primary" onClick={() => start('full')} data-testid="tour-start">
        <PlayCircle /> {TT.start}
      </Button>
      <p className="flex-1 text-[13.5px] leading-relaxed">{TT.startSub}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => start('cfo')}>
          {TT.cfo}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => start('bank')}>
          {TT.bankTour}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => !demo && toggleDemo()}>
          {TT.explore}
        </Button>
      </div>
    </div>
  );
}

export function Home() {
  const { t } = useSim();
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-2">
            {t <= COCKPIT_START + 60 ? C.eyebrow : C.eyebrowLater} · {formatDateTime(t)}
          </div>
          <h1 className="text-[40px] leading-[1.05] tracking-tight">{C.title}</h1>
        </div>
        <p className="max-w-[360px] text-right font-serif text-[18px] text-new">{C.tagline}</p>
      </div>
      <TourStart />
      <section aria-label={C.alertsTitle}>
        <h2 className="eyebrow mb-3">{C.alertsTitle}</h2>
        <Alerts />
      </section>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-8">
          <Position />
          <Forecast />
        </div>
        <div className="col-span-12 space-y-6 xl:col-span-4">
          <Queue />
          <Cutoffs />
          <RateGrid />
        </div>
      </div>
    </div>
  );
}
