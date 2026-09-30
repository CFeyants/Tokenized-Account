import { useApp } from '@/app/store';
import { en } from '@/i18n/en';
import { ASSUMPTIONS, PROFILES, clientValue, type ProfileId } from '@/engine/businessCase';
import { fmtEur, fmtM, fmtPct } from '@/engine/format';
import { Tip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const V = en.value;

function Col({ label, main, sub, tip }: { label: string; main: string; sub: string; tip: string }) {
  return (
    <Tip content={tip} side="bottom">
      <div
        tabIndex={0}
        className="min-w-0 cursor-help rounded-xl px-3 py-1.5 hover:bg-surface-2 focus-visible:bg-surface-2"
      >
        <div className="truncate text-[11px] text-muted">{label}</div>
        <div className="tabular truncate text-[17px] font-medium leading-6 text-new">{main}</div>
        <div className="truncate text-[11.5px] text-muted">{sub}</div>
      </div>
    </Tip>
  );
}

/** Annual value for the chosen client profile — always visible, never zero, assumptions on hover. */
export function ValueBanner() {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const p = PROFILES[profile];
  const v = clientValue(p);
  const A = ASSUMPTIONS;
  return (
    <div
      className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] items-center gap-2 px-6 pb-2"
      aria-label={V.title}
    >
      <div className="flex flex-col gap-1 pr-2">
        <span className="eyebrow">{V.title}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={V.profile}>
          {(Object.keys(PROFILES) as ProfileId[]).map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={profile === id}
              onClick={() => setProfile(id)}
              className={cn(
                'h-6 cursor-pointer rounded-full border px-2.5 text-[11px]',
                profile === id
                  ? 'border-new/50 bg-new-soft text-new'
                  : 'border-line text-muted hover:text-fg',
              )}
            >
              {V.profiles[id]}
            </button>
          ))}
        </div>
      </div>
      <Col
        label={V.buffers}
        main={fmtM(v.buffers, 'EUR', 0)}
        sub={V.buffersSub(fmtEur(v.buffersInterest, 'EUR', 0))}
        tip={V.buffersTip(
          p.farSubsidiaries,
          fmtM(p.bufferPerSub, 'EUR', 0),
          fmtPct(A.redeployRate),
        )}
      />
      <Col
        label={V.hours}
        main={V.hoursMain(Math.round(v.hours).toLocaleString('en-GB'), v.fte.toFixed(1))}
        sub={V.valueSub(fmtEur(v.hoursValue, 'EUR', 0))}
        tip={V.hoursTip(
          p.manualHours.toLocaleString('en-GB'),
          fmtPct(A.automatedShare, 0),
          A.hoursPerFte,
          fmtEur(A.fteCost, 'EUR', 0),
        )}
      />
      <Col
        label={V.failures}
        main={V.failuresMain(v.failures)}
        sub={V.valueSub(fmtEur(v.failuresValue, 'EUR', 0))}
        tip={V.failuresTip(
          p.failures,
          fmtPct(A.avoidedShare, 0),
          fmtEur(p.costPerFailure, 'EUR', 0),
        )}
      />
      <Col label={V.total} main={fmtEur(v.total, 'EUR', 0)} sub={V.illustrative} tip={V.totalTip} />
    </div>
  );
}
