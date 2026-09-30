import { describe, expect, it } from 'vitest';
import { MOMENTS, clockOpen, exitOnBalanceSheet, sundayException } from '@/engine/fundSettlement';
import { US_ENTITY, usClientValue } from '@/data/tmmf';
import { PROFILES, bankView } from '@/engine/businessCase';

describe('settling a fund order', () => {
  it('tokenisation moves the register, not the other clocks: on Sunday only transfer and exit are open', () => {
    for (const ccy of ['EUR', 'USD'] as const) {
      expect(clockOpen('token', ccy, MOMENTS.sun)).toBe(true);
      expect(clockOpen('exit', ccy, MOMENTS.sun)).toBe(true);
      expect(clockOpen('order', ccy, MOMENTS.sun)).toBe(false);
      expect(exitOnBalanceSheet(ccy, MOMENTS.sun)).toBe(true);
    }
    expect(exitOnBalanceSheet('EUR', MOMENTS.fri)).toBe(true);
    expect(exitOnBalanceSheet('USD', MOMENTS.tue)).toBe(false);
  });

  it('Sunday USD 30m: above the cap waits in (A); our credit backed by units covers it in (B)', () => {
    const x = sundayException();
    expect(x.queued).toBe(5e6);
    expect(x.unitsPledged).toBeGreaterThan(x.amount);
    expect(x.cost).toBeGreaterThan(0);
  });
});

describe('keep the US surplus working', () => {
  it('pickup = fund yield minus the earnings credit given up', () => {
    const v = usClientValue();
    expect(v.surplus).toBe(US_ENTITY.surplusUsd);
    expect(v.pickup).toBeCloseTo(v.fund - v.ecrLost, 6);
    expect(v.pickup).toBeGreaterThan(0);
  });

  it('the business case shows US deposits retained, sweep captured and US costs', () => {
    const b = bankView(PROFILES.large);
    const keys = b.lines.map((l) => l.key);
    expect(keys).toEqual(expect.arrayContaining(['usRetained', 'usSweep', 'usCosts']));
    expect(keys).not.toContain('fxBrl');
  });
});
