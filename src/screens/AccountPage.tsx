import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { ACCOUNTS } from '@/data/accounts';
import { bankById, entityById } from '@/data/entities';
import { FX_MID, RATES } from '@/data/rates';
import { MIN_PER_DAY, dayIndex, formatDate, hhmm, hhmmss, formatDateTime } from '@/engine/clock';
import { eodPostings, integrateMinutes, snapshotAt } from '@/engine/accrual';
import { fmtAmount, fmtEur, fmtPct, numM } from '@/engine/format';
import type { AccountId, State } from '@/engine/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { InfoTip, Tip } from '@/components/ui/tooltip';
import { LayerTag, PageHeader, Row, Stat } from '@/components/Page';
import { MinuteRing } from '@/components/MinuteRing';
import { Animated } from '@/components/Animated';
import { IntradayChart, type IntradayPoint } from '@/components/charts/IntradayChart';
import { cn } from '@/lib/utils';

const A = en.accounts;

function unitsOf(s: State, id: AccountId) {
  if (id === 'tok-paris') return s.units.filter((u) => u.currency === 'EUR');
  if (id === 'tok-usd-chicago') return s.units.filter((u) => u.currency === 'USD');
  return [];
}

function totalOf(s: State, id: AccountId): number {
  const blocked = id === 'tok-paris' ? s.blocked : 0;
  return s.bal[id] + blocked + unitsOf(s, id).reduce((a, u) => a + u.amount, 0);
}

function useIntraday(id: AccountId): IntradayPoint[] {
  const { t, tl } = useSim();
  const day = dayIndex(t);
  const minute = Math.floor(t);
  return useMemo(() => {
    const start = day * MIN_PER_DAY;
    const pts: IntradayPoint[] = [];
    for (let m = start; m <= minute; m += 5) pts.push({ m: m - start, total: totalOf(snapshotAt(tl.snaps, m).state, id) });
    // Exact points at every event of the day, so the steps land on the right minute.
    for (const s of tl.snaps) if (s.t >= start && s.t <= minute) pts.push({ m: s.t - start, total: totalOf(s.state, id) });
    pts.push({ m: minute - start, total: totalOf(snapshotAt(tl.snaps, minute).state, id) });
    return pts.sort((a, b) => a.m - b.m);
  }, [tl, id, day, minute]);
}

function Movements({ id }: { id: string }) {
  const { t, tl } = useSim();
  const start = dayIndex(t) * MIN_PER_DAY;
  const rows = tl.ledger.filter((l) => (l.account === id || l.account === `${id}:blocked`) && l.t >= start && l.t <= t && l.amount !== 0);
  return (
    <Card>
      <CardHeader title={A.movements} eyebrow={formatDate(t)} />
      {rows.length === 0 ? (
        <p className="text-[13.5px] text-muted">{A.noMovements}</p>
      ) : (
        <table className="w-full text-[13px]">
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0">
                <td className="tabular py-2 pr-3 text-muted">{hhmmss(l.t)}</td>
                <td className="py-2 pr-3">{l.memo}</td>
                <td className={cn('tabular py-2 text-right', l.amount > 0 && 'text-new')}>
                  {l.amount > 0 ? '+' : ''}
                  {fmtAmount(l.amount)}
                </td>
                <td className="py-2 pl-3 text-[11.5px] text-muted">{l.account.endsWith(':blocked') ? A.subBlocked.toLowerCase() : l.finality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function TokenisedPage({ id }: { id: AccountId }) {
  const { t, tl, state } = useSim();
  const openHood = useApp((s) => s.openHood);
  const def = ACCOUNTS.find((a) => a.id === id)!;
  const fx = FX_MID[def.currency];
  const units = unitsOf(state, id);
  const free = state.bal[id];
  const blocked = id === 'tok-paris' ? state.blocked : 0;
  const inUnit = units.reduce((a, u) => a + u.amount, 0);
  const onAccount = integrateMinutes(tl.snaps, 0, t, (s) => (Math.max(0, s.bal[id]) + (id === 'tok-paris' ? s.blocked : 0)) * RATES.tokenised) / fx;
  const inUnits = integrateMinutes(tl.snaps, 0, t, (s) => unitsOf(s, id).reduce((a, u) => a + u.amount * u.rate, 0)) / fx;
  const debit = integrateMinutes(tl.snaps, 0, t, (s) => Math.max(0, -s.bal[id]) * RATES.intradayDebit) / fx;
  const data = useIntraday(id);

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        <Card tone="new" className="col-span-12 xl:col-span-8">
          <CardHeader
            eyebrow={def.iban}
            title={`${en.product.name} · ${def.currency}`}
            aside={
              <Tip content={en.tips.minute}>
                <span tabIndex={0}>
                  <Chip tone="new" className="cursor-help">
                    <MinuteRing size={14} progress={1} />
                    {A.minuteBadge}
                  </Chip>
                </span>
              </Tip>
            }
          />
          <div className="grid grid-cols-3 gap-6">
            <Stat label={A.subFree} value={<span className={cn(free < 0 && 'text-red')}>{def.currency} {numM(free, 2)}m</span>} tone="new" sub={A.toMinute(fmtPct(free < 0 ? RATES.intradayDebit : RATES.tokenised))} />
            <Stat label={<span className="flex items-center gap-1">{A.subBlocked}<InfoTip content={en.tips.blockedEarns} /></span>} value={<span>{def.currency} {numM(blocked, 2)}m</span>} sub={blocked > 0 ? A.blockedSub : A.none} />
            <Stat label={<span className="flex items-center gap-1">{A.subInUnit}<InfoTip content={en.tips.lateCash} /></span>} value={<span>{def.currency} {numM(inUnit, 2)}m</span>} tone="amber" sub={units.length ? units.map((u) => u.tenor).join(', ') : A.none} />
          </div>
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] text-muted">{A.intraday}</span>
              <span className="text-[12px] text-muted">{formatDate(t)}</span>
            </div>
            <IntradayChart data={data} />
          </div>
        </Card>
        <Card className="col-span-12 flex flex-col xl:col-span-4">
          <CardHeader eyebrow={A.accrued} title={<span className="flex items-center gap-2">{A.accrued}<InfoTip content={en.tips.tokRate} /></span>} />
          <div className="flex items-center gap-4">
            <MinuteRing size={64} progress={(t % 60) / 60}>
              <span className="tabular text-[11px] text-muted">{hhmm(t).slice(3)}</span>
            </MinuteRing>
            <div className="tabular font-serif text-[40px] leading-none text-new" aria-live="polite">
              <Animated value={onAccount + inUnits - debit} format={(v) => fmtEur(v)} />
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-3">
            <Row k={A.accruedTok} v={fmtEur(onAccount)} />
            <Row k={A.accruedUnits} v={fmtEur(inUnits)} />
            {debit > 0 && <Row k={en.counters.jitTitle} v={<span className="text-red">−{fmtEur(debit)}</span>} />}
            <Row k={A.rate} v={A.vsCurrent(fmtPct(RATES.tokenised), fmtPct(RATES.current))} />
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">{en.tips.tokRate}</p>
          <Button variant="ghost" size="sm" className="mt-auto -ml-3 self-start" onClick={() => openHood('accrual', id)}>
            <Wrench /> {en.hood.accrualTitle}
          </Button>
        </Card>
      </div>
      {units.length > 0 && (
        <Card>
          <CardHeader title={A.unitsHere} aside={<LayerTag layer="new" />} />
          <table className="w-full text-[13px]">
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="py-2 font-mono text-[12px]">{u.id}</td>
                  <td className="py-2">{u.tenor}{u.blocked && <Chip tone="new" className="ml-2">{A.subBlocked.toLowerCase()}</Chip>}</td>
                  <td className="tabular py-2 text-right">{u.currency} {fmtAmount(u.amount)}</td>
                  <td className="tabular py-2 text-right text-amber">{fmtPct(u.rate)}</td>
                  <td className="tabular py-2 text-right text-muted">→ {formatDateTime(u.maturity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Movements id={id} />
    </>
  );
}

function CurrentPage() {
  const { t, tl, state } = useSim();
  const def = ACCOUNTS.find((a) => a.id === 'cur-paris')!;
  const data = useIntraday('cur-paris');
  const postings = eodPostings(tl.snaps, t, (s) => Math.max(0, s.bal['cur-paris']) * RATES.current);
  const total = postings.reduce((a, p) => a + p.amount, 0);
  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            eyebrow={def.iban}
            title={A.currentTitle}
            aside={
              <Tip content={en.tips.daily}>
                <span tabIndex={0}>
                  <Chip tone="traditional" className="cursor-help">{A.dailyBadge}</Chip>
                </span>
              </Tip>
            }
          />
          <div className="grid grid-cols-3 gap-6">
            <Stat label={en.accounts.cols.balance} value={`EUR ${numM(state.bal['cur-paris'], 2)}m`} />
            <Stat label={A.rate} value={fmtPct(RATES.current)} tone="muted" sub={en.tips.daily} />
            <Stat label={A.accrued} value={fmtEur(total)} tone="muted" sub={`${postings.length} × ${A.dailyPosting.toLowerCase()}`} />
          </div>
          <div className="mt-7">
            <div className="mb-2 text-[13px] text-muted">{A.intradayCurrent}</div>
            <IntradayChart data={data} tone="grey" />
          </div>
        </Card>
        <div className="col-span-12 space-y-6 xl:col-span-4">
          <Card>
            <CardHeader title={A.dailyPosting} aside={<LayerTag layer="traditional" />} />
            {postings.length === 0 ? (
              <p className="text-[13px] text-muted">{A.none}</p>
            ) : (
              postings.map((p) => {
                const eod = snapshotAt(tl.snaps, (p.day + 1) * MIN_PER_DAY - 1e-6).state.bal['cur-paris'];
                return <Row key={p.day} k={`${formatDate(p.day * MIN_PER_DAY)} · EOD ${numM(eod)}m`} v={fmtEur(p.amount)} />;
              })
            )}
          </Card>
          <Card>
            <CardHeader title={A.cutoffs} />
            <p className="text-[13px] leading-relaxed text-muted">{A.cutoffsText}</p>
            <div className="mt-4 text-[13px] font-medium">{A.valueDates}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{A.valueDatesText}</p>
          </Card>
        </div>
      </div>
      <Movements id="cur-paris" />
    </>
  );
}

export function AccountPage() {
  const { id } = useParams();
  const def = ACCOUNTS.find((a) => a.id === id);
  const back = (
    <Button asChild variant="ghost" size="sm">
      <Link to="/accounts">
        <ArrowLeft /> {A.back}
      </Link>
    </Button>
  );
  if (!def || !def.dynamic || def.type === 'otherBank') {
    return (
      <div>
        {back}
        <p className="mt-6 text-muted">{A.notFound}</p>
      </div>
    );
  }
  const e = entityById(def.entity);
  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        eyebrow={`${e.name} · ${bankById(def.bank).name}`}
        title={def.type === 'tokenised' ? `${en.product.name}, ${e.city}` : A.currentOf(e.city)}
        aside={<LayerTag layer={def.type === 'tokenised' ? 'new' : 'traditional'} />}
      />
      {def.type === 'tokenised' ? <TokenisedPage id={def.dynamic} /> : <CurrentPage />}
    </div>
  );
}
