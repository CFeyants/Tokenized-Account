import { Link } from 'react-router-dom';
import { ArrowRight, Landmark, Lock, Moon, Timer, Zap } from 'lucide-react';
import { ApprovalButton } from '@/components/ApprovalButton';
import { RateGrid } from '@/components/RateGrid';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { at } from '@/engine/clock';
import { collateralInterest } from '@/engine/counters';
import { waitingCase } from '@/engine/minuteCases';
import { shortUnitsTotal } from '@/engine/selectors';
import { BRAZIL_BID_BOND } from '@/engine/scenario';
import { fmtEur, fmtM, fmtMinutes } from '@/engine/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Row } from '@/components/Page';
import { JourneyHeader } from '@/components/Journey';
import { AccountSummary } from '@/components/AccountSummary';

const W = en.work;
const G = en.guarantees.brazil;
const M = 1_000_000;

export function PutToWork() {
  const { t, tl, state } = useSim();
  const col = state.collateral.find((c) => c.id === BRAZIL_BID_BOND);
  const since = at(2, '11:00');
  const end = Math.max(since, Math.min(t, col?.releasedAt ?? t));
  const ci = collateralInterest(tl, BRAZIL_BID_BOND, since, end);
  const w = waitingCase(tl, t);

  return (
    <div className="space-y-6">
      <JourneyHeader id="work" />
      <AccountSummary />
      <div className="grid grid-cols-3 gap-6">
        <Card tone="new" className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Lock className="size-5 text-new" />
                {W.collateralTitle}
              </span>
            }
          />
          <p className="text-[13px] leading-relaxed text-muted">{W.collateralLead}</p>
          <div className="mt-4">
            <Row k={G.minutes} v={col ? fmtMinutes(end - since) : '—'} />
            <Row k={G.byDay} v={fmtEur(ci.onAccount)} />
            <Row k={G.byNight} v={fmtEur(ci.inUnit)} />
            <Row k={G.total} v={<span className="text-new">{fmtEur(ci.total)}</span>} />
            <Row k={G.released} v={col?.releasedAt ? '✓' : G.pending} />
          </div>
          <ApprovalButton
            className="mt-auto w-full"
            variant="secondary"
            request={{
              title: W.blockTitle,
              detail: W.blockDetail,
              amountEur: 4 * M,
              action: { kind: 'block', amount: 4 * M, label: W.marginLabel },
            }}
          >
            {W.blockNow}
          </ApprovalButton>
        </Card>

        <Card tone="new" className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Zap className="size-5 text-new" />
                {W.bufferTitle}
              </span>
            }
          />
          <p className="text-[13px] leading-relaxed text-muted">{W.bufferLead}</p>
          <div className="mt-4">
            <Row k={W.bufferNow} v={fmtM(Math.max(0, state.bal['tok-paris']))} />
            {w.examples.map((e) => (
              <Row key={e.label} k={e.label} v={fmtEur((e.amount * 0.001 * e.minutes) / 518_400)} />
            ))}
            <Row
              k={en.minute.byMinute}
              v={<span className="text-new">{fmtEur(w.minuteInterest)}</span>}
            />
          </div>
          <Button asChild className="mt-auto w-full" variant="primary">
            <Link to="/just-in-time">
              {W.fund} <ArrowRight />
            </Link>
          </Button>
        </Card>

        <Card tone="new" className="flex flex-col">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Moon className="size-5 text-amber" />
                {W.nightTitle}
              </span>
            }
          />
          <p className="text-[13px] leading-relaxed text-muted">{W.nightLead}</p>
          <div className="mt-4">
            <Row
              k={W.nightNow}
              v={<span className="text-amber">{fmtM(shortUnitsTotal(state))}</span>}
            />
          </div>
          <p className="mt-auto rounded-xl bg-grey-soft p-3 text-[12.5px] text-muted">
            <span className="text-fg">{W.tradTitle}: </span>
            {W.trad}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Landmark className="size-5 text-muted" />
                {W.beneficiaryTitle}
              </span>
            }
          />
          <p className="text-[13px] leading-relaxed">{W.beneficiary}</p>
          <p className="mt-3 text-[12px] text-muted">{W.beneficiaryNote}</p>
        </Card>
        <Card>
          <CardHeader title={W.publishedTitle} />
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-muted">
                {W.publishedCols.map((c, j) => (
                  <th
                    key={c}
                    className={j ? 'pb-1.5 pl-4 text-right font-normal' : 'pb-1.5 font-normal'}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {W.publishedRows.map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  <td className="py-1.5">{row[0]}</td>
                  <td className="py-1.5 text-right">{row[1]}</td>
                  <td className="py-1.5 text-right">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[12px] text-muted">{W.publishedNote}</p>
        </Card>
        <Card tone="new">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Timer className="size-5 text-new" />
                {W.minuteTitle}
              </span>
            }
          />
          <p className="text-[13px] leading-relaxed">{W.minute}</p>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mt-3">
            <Link to="/minute">
              {W.minuteLink} <ArrowRight />
            </Link>
          </Button>
        </Card>
      </div>
      <RateGrid />
    </div>
  );
}
