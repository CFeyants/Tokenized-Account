import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useSim } from '@/app/store';
import { computeCounters } from '@/engine/counters';
import { en } from '@/i18n/en';
import { ACCOUNTS } from '@/data/accounts';
import { RATES } from '@/data/rates';
import { MIN_PER_DAY, formatDate, hhmmss, isoStamp, at } from '@/engine/clock';
import { integrateMinutes, snapshotAt } from '@/engine/accrual';
import { drawers, shortUnitsTotal } from '@/engine/selectors';
import { fmtAmount, fmtEur, fmtM } from '@/engine/format';
import type { State } from '@/engine/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayerTag, PageHeader, Row } from '@/components/Page';
import { cn } from '@/lib/utils';

const S = en.statements;
type Acc = 'cur-paris' | 'tok-paris';

const bookBal = (s: State, a: Acc) =>
  a === 'tok-paris' ? s.bal['tok-paris'] + s.blocked : s.bal['cur-paris'];
const inUnit = (s: State) =>
  s.units.filter((u) => u.currency === 'EUR').reduce((x, u) => x + u.amount, 0);
const amt = (v: number) => v.toFixed(2);

function Viewer() {
  const { t, tl } = useSim();
  const [acc, setAcc] = useState<Acc>('tok-paris');
  const completed = Math.floor(t / MIN_PER_DAY);
  const [dayPick, setDay] = useState<number | null>(null);
  const day = Math.min(dayPick ?? completed - 1, completed - 1);
  const def = ACCOUNTS.find((a) => a.id === acc)!;

  if (completed < 1) {
    return (
      <Card className="col-span-12 xl:col-span-8">
        <CardHeader title={S.viewer} aside={<LayerTag layer="traditional" />} />
        <p className="text-[13.5px] text-muted">{S.noDay}</p>
      </Card>
    );
  }
  const start = day * MIN_PER_DAY;
  const end = start + MIN_PER_DAY;
  const open = snapshotAt(tl.snaps, start - 1e-6).state;
  const close = snapshotAt(tl.snaps, end - 1e-6).state;
  const entries = tl.ledger.filter(
    (l) => l.account === acc && l.t >= start && l.t < end && l.amount !== 0,
  );
  const interest =
    acc === 'tok-paris'
      ? integrateMinutes(
          tl.snaps,
          start,
          end,
          (s) =>
            (Math.max(0, s.bal['tok-paris']) + s.blocked) * RATES.tokenised +
            s.units.filter((u) => u.currency === 'EUR').reduce((x, u) => x + u.amount * u.rate, 0),
        )
      : (Math.max(0, close.bal['cur-paris']) * RATES.current) / 360;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr><MsgId>STMT-${acc.toUpperCase()}-${day}</MsgId><CreDtTm>${isoStamp(end)}</CreDtTm></GrpHdr>
    <Stmt>
      <Id>${acc}-${formatDate(start).replace(/ /g, '')}</Id>
      <Acct><Id><IBAN>${def.iban.replace(/ /g, '')}</IBAN></Id><Ccy>EUR</Ccy></Acct>
      <Bal><Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">${amt(bookBal(open, acc))}</Amt></Bal>
      <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">${amt(bookBal(close, acc))}</Amt></Bal>${
        acc === 'tok-paris'
          ? `
      <!-- Added for the tokenised account -->
      <Bal><Tp><CdOrPrtry><Prtry>FREE</Prtry></CdOrPrtry></Tp><Amt Ccy="EUR">${amt(close.bal['tok-paris'])}</Amt></Bal>
      <Bal><Tp><CdOrPrtry><Prtry>BLCK</Prtry></CdOrPrtry></Tp><Amt Ccy="EUR">${amt(close.blocked)}</Amt></Bal>
      <Bal><Tp><CdOrPrtry><Prtry>UNIT</Prtry></CdOrPrtry></Tp><Amt Ccy="EUR">${amt(inUnit(close))}</Amt></Bal>
      <Ntry><Amt Ccy="EUR">${amt(interest)}</Amt><CdtDbtInd>CRDT</CdtDbtInd><BkTxCd><Prtry><Cd>MINT</Cd></Prtry></BkTxCd><AddtlNtryInf>Interest accrued to the minute</AddtlNtryInf></Ntry>`
          : ''
      }${entries
        .map(
          (l) => `
      <Ntry><Amt Ccy="EUR">${amt(Math.abs(l.amount))}</Amt><CdtDbtInd>${l.amount > 0 ? 'CRDT' : 'DBIT'}</CdtDbtInd><Sts><Cd>BOOK</Cd></Sts><BookgDt><DtTm>${isoStamp(l.t)}</DtTm></BookgDt><AddtlNtryInf>${l.memo}</AddtlNtryInf></Ntry>`,
        )
        .join('')}
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

  return (
    <Card className="col-span-12 xl:col-span-8">
      <CardHeader title={S.viewer} aside={<LayerTag layer="traditional" />} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="text-[12px] text-muted">
          {S.account}
          <select
            value={acc}
            onChange={(e) => setAcc(e.target.value as Acc)}
            className="ml-2 h-9 rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-fg"
          >
            <option value="tok-paris">{en.product.name} · Paris</option>
            <option value="cur-paris">{en.accounts.currentOf('Paris')}</option>
          </select>
        </label>
        <label className="text-[12px] text-muted">
          {S.day}
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="ml-2 h-9 rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-fg"
          >
            {Array.from({ length: completed }, (_, d) => (
              <option key={d} value={d}>
                {formatDate(d * MIN_PER_DAY)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Tabs defaultValue="formatted">
        <TabsList>
          <TabsTrigger value="formatted">{S.formatted}</TabsTrigger>
          <TabsTrigger value="xml">{S.xml}</TabsTrigger>
        </TabsList>
        <TabsContent value="formatted">
          <Row k={S.opening} v={fmtEur(bookBal(open, acc))} />
          <Row k={S.closing} v={fmtEur(bookBal(close, acc))} className="border-b border-line" />
          {acc === 'tok-paris' && (
            <div className="my-3 rounded-xl bg-new-soft px-4 py-2">
              <div className="eyebrow !text-new pt-1">{S.added}</div>
              <Row k={S.subFree} v={fmtEur(close.bal['tok-paris'])} />
              <Row k={S.subBlocked} v={fmtEur(close.blocked)} />
              <Row k={S.subUnit} v={fmtEur(inUnit(close))} />
              <Row k={S.interestLine} v={<span className="text-new">+{fmtEur(interest)}</span>} />
            </div>
          )}
          <div className="mt-4 text-[13px] font-medium">{S.entries}</div>
          {entries.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted">{S.noEntries}</p>
          ) : (
            <table className="mt-2 w-full text-[12.5px]">
              <thead className="sr-only">
                <tr>
                  <th>{en.hood.cols.time}</th>
                  <th>{en.hood.cols.memo}</th>
                  <th>{en.hood.cols.finality}</th>
                  <th>{en.hood.cols.amount}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="tabular py-1.5 pr-3 text-muted">{hhmmss(l.t)}</td>
                    <td className="py-1.5">{l.memo}</td>
                    <td className="py-1.5 text-muted">{l.amount > 0 ? 'CRDT' : 'DBIT'}</td>
                    <td className={cn('tabular py-1.5 text-right', l.amount > 0 && 'text-new')}>
                      {fmtAmount(l.amount, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-4 text-[12px] text-muted">{S.camt054}</p>
        </TabsContent>
        <TabsContent value="xml">
          <pre className="scrollbar-thin max-h-[440px] overflow-auto rounded-xl bg-surface-2 p-4 font-mono text-[11px] leading-relaxed text-muted">
            {xml}
          </pre>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function Ias7() {
  const { state } = useSim();
  const d = drawers(state);
  const overnight = shortUnitsTotal(state);
  const blockedInUnits = state.units.filter((u) => u.blocked).reduce((a, u) => a + u.amount, 0);
  const cashEq = d.current + Math.max(0, d.tokFree) + overnight - blockedInUnits;
  const other = d.termUnits - (overnight - blockedInUnits) + d.fund + d.usdUnitsEur;
  return (
    <Card>
      <CardHeader eyebrow={S.ias7Lead} title={S.ias7} />
      <Row
        k={
          <>
            <div>{S.cashEq}</div>
            <div className="text-[11.5px]">{S.cashEqNote}</div>
          </>
        }
        v={fmtM(cashEq)}
      />
      <Row
        k={
          <>
            <div>{S.restricted}</div>
            <div className="text-[11.5px]">{S.restrictedNote}</div>
          </>
        }
        v={fmtM(d.tokBlocked)}
      />
      <Row
        k={
          <>
            <div>{S.shortInv}</div>
            <div className="text-[11.5px]">{S.shortInvNote}</div>
          </>
        }
        v={fmtM(other)}
      />
    </Card>
  );
}

function Weekly() {
  const { t, tl } = useSim();
  const c = computeCounters(tl, at(7, '07:00'));
  const ready = t >= at(7, '07:00');
  const W = S.weeklyRows;
  return (
    <Card tone={ready ? 'new' : 'default'}>
      <CardHeader eyebrow={ready ? S.weeklyLead : S.weeklyPending} title={S.weekly} />
      {ready ? (
        <>
          <Row k={W.current} v={fmtEur(c.newParts.current)} />
          <Row k={W.tokenised} v={fmtEur(c.newParts.tokenised)} />
          <Row k={W.units} v={fmtEur(c.newParts.units)} />
          <Row k={W.fund} v={fmtEur(c.newParts.fund)} />
          <Row k={W.jit} v={`−${fmtEur(c.newParts.jitCost)}`} />
          {c.newParts.spread > 0 && <Row k={W.spread} v={`−${fmtEur(c.newParts.spread)}`} />}
          <Row
            k={en.counters.newShort}
            v={<span className="text-new">{fmtEur(c.newTotal)}</span>}
            className="border-t border-line"
          />
        </>
      ) : (
        <p className="text-[13px] text-muted">—</p>
      )}
    </Card>
  );
}

export function Statements() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={S.eyebrow} title={S.title} lead={S.lead} />
      <div className="card flex items-center gap-3 px-5 py-3.5" role="note">
        <ShieldCheck className="size-5 text-muted" />
        <p className="text-[14px]">{S.banner}</p>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <Viewer />
        <div className="col-span-12 space-y-6 xl:col-span-4">
          <Weekly />
          <Ias7 />
        </div>
      </div>
    </div>
  );
}
