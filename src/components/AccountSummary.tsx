import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { RATES } from '@/data/rates';
import { integrateMinutes } from '@/engine/accrual';
import { fmtEur, fmtM, fmtPct } from '@/engine/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Animated } from '@/components/Animated';
import { MinuteRing } from '@/components/MinuteRing';
import { Stat } from '@/components/Page';

const A = en.accountSummary;

/** The tokenised account at this minute: where the money is and what it has earned this week. */
export function AccountSummary() {
  const { t, tl, state } = useSim();
  const inUnits = state.units.filter((u) => u.currency === 'EUR');
  const unitTotal = inUnits.filter((u) => !u.blocked).reduce((a, u) => a + u.amount, 0);
  const flagged = inUnits.filter((u) => u.blocked).reduce((a, u) => a + u.amount, 0);
  const earned = integrateMinutes(
    tl.snaps,
    0,
    t,
    (s) =>
      (Math.max(0, s.bal['tok-paris']) + s.blocked + s.earmarked) * RATES.tokenised +
      s.units.filter((u) => u.currency === 'EUR').reduce((a, u) => a + u.amount * u.rate, 0),
  );
  return (
    <Card tone="new" className="grid grid-cols-12 items-center gap-6">
      <div className="col-span-12 flex items-center gap-5 xl:col-span-4">
        <MinuteRing size={72} progress={(t % 60) / 60}>
          <span className="tabular text-[11px] text-muted">
            {String(Math.floor(t % 60)).padStart(2, '0')}
          </span>
        </MinuteRing>
        <div>
          <div className="text-[12.5px] text-new">{A.earned}</div>
          <div
            className="tabular whitespace-nowrap font-serif text-[32px] leading-none text-new"
            aria-live="polite"
          >
            <Animated value={earned} format={(v) => fmtEur(v)} />
          </div>
          <div className="mt-1 text-[12px] text-muted">
            {A.rates(fmtPct(RATES.tokenised), fmtPct(RATES.current), fmtPct(RATES.overnightUnit))}
          </div>
        </div>
      </div>
      <div className="col-span-12 grid grid-cols-3 gap-6 xl:col-span-6">
        <Stat label={A.free} value={fmtM(state.bal['tok-paris'])} tone="new" />
        <Stat
          label={A.blocked}
          value={fmtM(state.blocked + state.earmarked + flagged)}
          sub={A.blockedSub}
        />
        <Stat label={A.inUnit} value={fmtM(unitTotal)} tone="amber" sub={A.inUnitSub} />
      </div>
      <div className="col-span-12 xl:col-span-2 xl:text-right">
        <Button asChild variant="ghost" size="sm">
          <Link to="/accounts/tok-paris">
            {A.open} <ArrowRight />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
