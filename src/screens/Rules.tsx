import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { useApp, useCounters, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { DEFAULT_RULES, FORECAST_NEEDS } from '@/data/rules';
import { ENTITIES } from '@/data/entities';
import { M } from '@/engine/ops';
import { at, formatDate, MIN_PER_DAY } from '@/engine/clock';
import { fmtEur, fmtM, fmtMinutes } from '@/engine/format';
import {
  previewFunding,
  previewLadder,
  previewNightSweep,
  previewRelease,
  previewSweep,
} from '@/engine/preview';
import { BRAZIL_BID_BOND } from '@/engine/scenario';
import { Card, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { LayerTag, PageHeader } from '@/components/Page';
import { cn } from '@/lib/utils';

const R = en.rulesScreen;

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2.5">
      <div className="mb-2 flex items-baseline justify-between text-[13px]">
        <span className="text-muted">{label}</span>
        {value && <span className="tabular">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5 text-[13px]">
      <span className="text-muted">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl bg-new-soft px-4 py-3">
      <div className="eyebrow mb-1 !text-new">{R.preview}</div>
      <div className="text-[13.5px] leading-relaxed">{children}</div>
    </div>
  );
}

function RuleCard({
  title,
  enabled,
  onEnabled,
  json,
  children,
  className,
}: {
  title: string;
  enabled: boolean;
  onEnabled: (v: boolean) => void;
  json: unknown;
  children: React.ReactNode;
  className?: string;
}) {
  const openHood = useApp((s) => s.openHood);
  return (
    <Card tone={enabled ? 'new' : 'default'} className={cn('flex flex-col', className)}>
      <CardHeader
        title={title}
        aside={
          <label className="flex items-center gap-2 text-[12px] text-muted">
            {enabled ? R.on : R.off}
            <Switch checked={enabled} onCheckedChange={onEnabled} aria-label={title} />
          </label>
        }
      />
      <div className={cn('flex-1 transition-opacity', !enabled && 'grayscale')}>{children}</div>
      <details className="group mt-4 border-t border-line pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] text-muted hover:text-fg">
          <span className="flex items-center gap-1.5">
            <Wrench className="size-3.5" /> {R.json}
          </span>
        </summary>
        <pre className="scrollbar-thin mt-3 max-h-56 overflow-auto rounded-xl bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-muted">
          {JSON.stringify({ ...(json as object), enabled }, null, 2)}
        </pre>
        <button
          type="button"
          onClick={() => openHood('orchestration')}
          className="mt-2 cursor-pointer text-[12px] text-new hover:underline"
        >
          {R.log} →
        </button>
      </details>
    </Card>
  );
}

export function Rules() {
  const { tl } = useSim();
  const c = useCounters();
  const [sweep, setSweep] = useState({ ...DEFAULT_RULES.sweep });
  const [night, setNight] = useState({
    ...DEFAULT_RULES.nightSweep,
    banks: DEFAULT_RULES.nightSweep.banks.map((b) => ({ ...b })),
  });
  const [overnight, setOvernight] = useState({ ...DEFAULT_RULES.overnight });
  const [ret, setRet] = useState({ ...DEFAULT_RULES.ret });
  const [ladder, setLadder] = useState({ ...DEFAULT_RULES.ladder });
  const [funding, setFunding] = useState({ ...DEFAULT_RULES.funding });
  const [release, setRelease] = useState({ ...DEFAULT_RULES.release });

  const sw = previewSweep(tl, sweep.thresholdWeekday, sweep.thresholdFriday);
  const balances: Record<string, number> = { 'hsbc-paris': 60 * M, 'db-munich': 45 * M };
  const ns = previewNightSweep(
    night.banks.map((b) => ({ floor: b.floor, balance: balances[b.account] })),
  );
  const ld = previewLadder(tl, ladder.above, ladder.tenors);
  const fd = previewFunding(4 * M, 555);
  const rl = previewRelease(tl, BRAZIL_BID_BOND, at(2, '11:00'), at(6, '19:00'));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={R.eyebrow}
        title={R.title}
        lead={R.lead}
        aside={<LayerTag layer="new" />}
      />

      <div className="grid grid-cols-12 gap-6">
        <RuleCard
          className="col-span-12 xl:col-span-7"
          title={R.sweep.title}
          enabled={sweep.enabled}
          onEnabled={(v) => setSweep({ ...sweep, enabled: v })}
          json={sweep}
        >
          <div className="grid grid-cols-2 gap-6">
            <Field label={R.sweep.threshold} value={fmtM(sweep.thresholdWeekday, 'EUR', 0)}>
              <Slider
                aria-label={R.sweep.threshold}
                min={0}
                max={80 * M}
                step={5 * M}
                value={[sweep.thresholdWeekday]}
                onValueChange={([v]) => setSweep({ ...sweep, thresholdWeekday: v })}
              />
            </Field>
            <Field label={R.sweep.friday} value={fmtM(sweep.thresholdFriday, 'EUR', 0)}>
              <Slider
                aria-label={R.sweep.friday}
                min={0}
                max={40 * M}
                step={5 * M}
                value={[sweep.thresholdFriday]}
                onValueChange={([v]) => setSweep({ ...sweep, thresholdFriday: v })}
              />
            </Field>
          </div>
          <p className="text-[12.5px] text-muted">{R.sweep.runs}</p>
          <table className="mt-3 w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-muted">
                {R.sweep.nightsCols.map((h, i) => (
                  <th key={h} className={cn('pb-1.5 font-normal', i > 0 && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {sw.rows.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <td className="py-1.5">{r.label}</td>
                  <td className="py-1.5 text-right">{fmtM(r.swept)}</td>
                  <td className="py-1.5 text-right">{r.hours.toFixed(1)} h</td>
                  <td className="py-1.5 text-right text-new">{fmtEur(r.unitInterest, 'EUR', 0)}</td>
                  <td className="py-1.5 text-right text-muted">−{fmtEur(r.sightLost, 'EUR', 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Preview>{R.sweep.gainLine(fmtEur(sweep.enabled ? sw.gain : 0, 'EUR', 0))}</Preview>
        </RuleCard>

        <RuleCard
          className="col-span-12 xl:col-span-5"
          title={R.night.title}
          enabled={night.enabled}
          onEnabled={(v) => setNight({ ...night, enabled: v })}
          json={night}
        >
          {night.banks.map((b, i) => (
            <Field
              key={b.account}
              label={`${b.bank} · ${b.cutoff} · ${R.night.floor}`}
              value={fmtM(b.floor, 'EUR', 0)}
            >
              <Slider
                aria-label={`${b.bank} ${R.night.floor}`}
                min={0}
                max={balances[b.account]}
                step={1 * M}
                value={[b.floor]}
                onValueChange={([v]) =>
                  setNight({
                    ...night,
                    banks: night.banks.map((x, j) => (j === i ? { ...x, floor: v } : x)),
                  })
                }
              />
            </Field>
          ))}
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{R.night.rail}</p>
          <Preview>
            {R.night.gainLine(
              fmtEur(night.enabled ? ns.gain : 0, 'EUR', 0),
              fmtM(night.enabled ? ns.swept : 0, 'EUR', 0),
            )}
          </Preview>
        </RuleCard>

        <RuleCard
          className="col-span-12 md:col-span-6 xl:col-span-4"
          title={R.overnight.title}
          enabled={overnight.enabled}
          onEnabled={(v) => setOvernight({ ...overnight, enabled: v })}
          json={overnight}
        >
          <p className="text-[13px] leading-relaxed text-muted">{R.overnight.text}</p>
          <Toggle
            label={R.overnight.friday}
            checked={overnight.fridayThreeDay}
            onChange={(v) => setOvernight({ ...overnight, fridayThreeDay: v })}
          />
          <Toggle
            label={R.overnight.blocked}
            checked={overnight.includeBlocked}
            onChange={(v) => setOvernight({ ...overnight, includeBlocked: v })}
          />
          <Preview>
            {R.overnight.gainLine(fmtEur(overnight.enabled ? c.newParts.units : 0, 'EUR', 0))}
          </Preview>
        </RuleCard>

        <RuleCard
          className="col-span-12 md:col-span-6 xl:col-span-4"
          title={R.ret.title}
          enabled={ret.enabled}
          onEnabled={(v) => setRet({ ...ret, enabled: v })}
          json={ret}
        >
          <p className="text-[13px] leading-relaxed text-muted">{R.ret.text}</p>
          <p className="mt-3 text-[12.5px] text-muted">{R.ret.source}</p>
        </RuleCard>

        <RuleCard
          className="col-span-12 md:col-span-6 xl:col-span-4"
          title={R.ladder.title}
          enabled={ladder.enabled}
          onEnabled={(v) => setLadder({ ...ladder, enabled: v })}
          json={ladder}
        >
          <p className="text-[13px] leading-relaxed text-muted">{R.ladder.text}</p>
          <Field label={R.ladder.above} value={fmtM(ladder.above, 'EUR', 0)}>
            <Slider
              aria-label={R.ladder.above}
              min={0}
              max={100 * M}
              step={5 * M}
              value={[ladder.above]}
              onValueChange={([v]) => setLadder({ ...ladder, above: v })}
            />
          </Field>
          <Preview>{R.ladder.gainLine(fmtM(ld.amount), fmtEur(ld.perYear, 'EUR', 0))}</Preview>
        </RuleCard>

        <RuleCard
          className="col-span-12 md:col-span-6"
          title={R.funding.title}
          enabled={funding.enabled}
          onEnabled={(v) => setFunding({ ...funding, enabled: v })}
          json={funding}
        >
          <div className="grid grid-cols-2 gap-x-6">
            <Field label={R.funding.entity}>
              <select
                aria-label={R.funding.entity}
                value={funding.entity}
                onChange={(e) => setFunding({ ...funding, entity: e.target.value })}
                className="h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px]"
              >
                {ENTITIES.filter((e) => e.id !== 'paris').map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.city}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={R.funding.hours}>
              <select
                aria-label={R.funding.hours}
                value={funding.hours}
                onChange={(e) =>
                  setFunding({ ...funding, hours: e.target.value as 'any' | 'business' })
                }
                className="h-9 w-full rounded-lg border border-line-strong bg-surface px-2 text-[13px]"
              >
                <option value="any">{R.funding.any}</option>
                <option value="business">{R.funding.business}</option>
              </select>
            </Field>
          </div>
          <Toggle
            label={R.funding.fx}
            checked={funding.fxAllowed}
            onChange={(v) => setFunding({ ...funding, fxAllowed: v })}
          />
          <Toggle
            label={R.funding.credit}
            checked={funding.preferCredit}
            onChange={(v) => setFunding({ ...funding, preferCredit: v })}
          />
          <Preview>
            {R.funding.gainLine(fmtMinutes(555), fmtEur(fd.toMinute), fmtEur(fd.fullDay))}
          </Preview>
        </RuleCard>

        <RuleCard
          className="col-span-12 md:col-span-6"
          title={R.release.title}
          enabled={release.enabled}
          onEnabled={(v) => setRelease({ ...release, enabled: v })}
          json={release}
        >
          <Field label={R.release.event}>
            <div className="flex gap-2" role="radiogroup" aria-label={R.release.event}>
              {(['expiry', 'document', 'tender'] as const).map((k) => (
                <Button
                  key={k}
                  size="sm"
                  role="radio"
                  aria-checked={release.event === k}
                  variant={release.event === k ? 'new' : 'secondary'}
                  onClick={() => setRelease({ ...release, event: k })}
                >
                  {R.release.events[k]}
                </Button>
              ))}
            </div>
          </Field>
          <Preview>{R.release.gainLine(fmtEur(rl.kept))}</Preview>
        </RuleCard>
      </div>

      <Card>
        <CardHeader
          title={R.forecast.title}
          eyebrow={R.forecast.lead}
          aside={<LayerTag layer="traditional" />}
        />
        <div className="grid grid-cols-6 gap-4">
          {Object.entries(FORECAST_NEEDS).map(([d, v]) => (
            <div key={d} className="rounded-xl bg-grey-soft px-4 py-3">
              <div className="text-[12px] text-muted">{formatDate(Number(d) * MIN_PER_DAY)}</div>
              <div className="tabular mt-1 text-[18px]">{fmtM(v.current, 'EUR', 0)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
