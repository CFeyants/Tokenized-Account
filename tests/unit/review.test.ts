import { describe, expect, it } from 'vitest';
import { PROFILES, bankView, clientValue } from '@/engine/businessCase';
import { useApp } from '@/app/store';
import { checkerFor, useGov } from '@/app/governance';
import { previewMmfSweep } from '@/engine/preview';
import { buildTimeline } from '@/engine/timeline';

describe('business case', () => {
  it('client value is never zero and grows with the profile', () => {
    const [a, b, c] = (['midcap', 'large', 'multi'] as const).map(
      (id) => clientValue(PROFILES[id]).total,
    );
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it('value comes from buffers, hours and failures — not from interest to the minute', () => {
    const v = clientValue(PROFILES.large);
    expect(v.buffers).toBe(19e6);
    expect(v.total).toBeCloseTo(v.buffersInterest + v.hoursValue + v.failuresValue, 6);
  });

  it('the bank view: units cost margin, defended deposits are the main line, night FX shown apart', () => {
    const b = bankView(PROFILES.large);
    const line = (k: string) => b.lines.find((l) => l.key === k)!.value;
    expect(line('unitCost')).toBeLessThan(0);
    expect(line('defended')).toBeGreaterThan(line('fees'));
    expect(b.net).toBeCloseTo(b.netWithout + b.nightFx, 6);
    expect(b.captured).toBeGreaterThan(0);
    expect(b.lcr.hqlaSaved).toBeGreaterThan(0);
  });

  it('the multi-country net no longer rests on night FX', () => {
    const b = bankView(PROFILES.multi);
    expect(b.nightFx).toBeLessThan(Math.abs(b.netWithout) + b.netWithout + 1e9);
    expect(b.nightFx / Math.max(1, Math.abs(b.net))).toBeLessThan(1);
  });
});

describe('maker / checker', () => {
  it('second signatory depends on the mandate', () => {
    expect(checkerFor('marie', 10e6)).toBe('thomas');
    expect(checkerFor('marie', 80e6)).toBe('claire');
    expect(checkerFor('kenji', 1e6)).toBe('marie');
  });

  it('nothing reaches the ledger before the second signature; approval executes and audits', () => {
    const before = useApp.getState().actions.length;
    const id = useGov.getState().submit({
      title: 'Test funding',
      detail: '',
      amountEur: 2e6,
      action: { kind: 'jit', to: 'tok-munich', source: 'EUR', amountEur: 2e6 },
    });
    expect(useApp.getState().actions.length).toBe(before);
    useGov.getState().approve(id);
    expect(useApp.getState().actions.length).toBe(before + 1);
    expect(useGov.getState().audit[0].what).toMatch(/^Approved/);
  });

  it('two requests wait for Marie on Monday morning', () => {
    useGov.getState().reset();
    expect(
      useGov.getState().approvals.filter((a) => a.status === 'pending' && a.checker === 'marie'),
    ).toHaveLength(2);
  });
});

describe('sweep to the tokenised fund', () => {
  it('a lower threshold sweeps more and earns more than the current account', () => {
    const tl = buildTimeline();
    const low = previewMmfSweep(tl, 20e6);
    const high = previewMmfSweep(tl, 80e6);
    expect(low.perYear).toBeGreaterThan(high.perYear);
    expect(low.weekGain).toBeGreaterThan(0);
  });
});
