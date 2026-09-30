/**
 * Rule executions. Each function mutates a draft State and records ledger + orchestration
 * entries through the Ctx. They are called by scenario events at fixed times, so the week is
 * fully deterministic.
 */
import { DEFAULT_RULES, FORECAST_NEEDS } from '@/data/rules';
import { en } from '@/i18n/en';
import { dayIndex, isFriday, nextOpening } from './clock';
import { book, buyUnit, move, unwindMatured } from './ops';
import type { Ctx, State } from './types';
import { fmtM } from './format';

const R = en.rulesNames;
const screening = { name: en.checks.screening, ok: true, detail: en.checks.screeningOk };

/** After the last cut-off: sweep the current account surplus above the threshold. */
export function runSurplusSweep(s: State, ctx: Ctx): number {
  const rule = DEFAULT_RULES.sweep;
  const threshold = isFriday(ctx.t) ? rule.thresholdFriday : rule.thresholdWeekday;
  const surplus = Math.max(0, s.bal['cur-paris'] - threshold);
  move(s, ctx, 'cur-paris', 'tok-paris', surplus, en.ledger.sweepToTok);
  ctx.orchestrate({
    rule: R.sweep,
    decision: `Surplus above ${fmtM(threshold)}: move ${fmtM(surplus)}`,
    instrument: 'Tokenised account',
    rail: 'Internal ledger (same legal entity)',
    checks: [
      {
        name: en.checks.balance,
        ok: true,
        detail: `Current ${fmtM(s.bal['cur-paris'] + surplus)} → ${fmtM(s.bal['cur-paris'])}`,
      },
      { name: en.checks.finality, ok: true, detail: en.checks.finalOk },
    ],
  });
  return surplus;
}

/** Sweep other banks' surplus above their next-day floor, by instant transfer. */
export function runNightSweep(s: State, ctx: Ctx): number {
  let total = 0;
  for (const b of DEFAULT_RULES.nightSweep.banks) {
    const amt = Math.max(0, s.bal[b.account] - b.floor);
    if (amt <= 0) continue;
    move(s, ctx, b.account, 'tok-paris', amt, en.ledger.nightSweep(b.bank));
    s.sweptTonight[b.account] += amt;
    s.sweptInTotal += amt;
    total += amt;
    ctx.orchestrate({
      rule: R.nightSweep,
      decision: `${b.bank}: surplus above next-day need ${fmtM(b.floor)} → ${fmtM(amt)}`,
      instrument: 'Tokenised account, then overnight unit',
      rail: 'SCT Inst (final at once)',
      checks: [
        { name: en.checks.finality, ok: true, detail: 'Instant transfer: final on receipt' },
        {
          name: 'Cut-off at sending bank',
          ok: true,
          detail: `${b.bank} cut-off ${b.cutoff} passed`,
        },
      ],
    });
  }
  return total;
}

/** Place every idle tokenised balance into an overnight unit (three-day unit on Friday). */
export function runOvernightUnit(s: State, ctx: Ctx): void {
  const friday = isFriday(ctx.t);
  const tenor = friday ? 'weekend' : 'overnight';
  const maturity = nextOpening(ctx.t);
  const memo = friday ? en.ledger.buyWeekend : en.ledger.buyOvernight;
  const free = Math.max(0, s.bal['tok-paris']);
  const u = buyUnit(s, ctx, {
    currency: 'EUR',
    amount: free,
    tenor,
    maturity,
    origin: 'rule',
    memo,
  });
  let blockedMsg = '';
  if (s.blocked > 0 && DEFAULT_RULES.overnight.includeBlocked) {
    const active = s.collateral.find((c) => c.status === 'active' && c.mode === 'blockOnAccount');
    blockedMsg = ` + ${fmtM(s.blocked)} blocked (not transferable)`;
    buyUnit(s, ctx, {
      currency: 'EUR',
      amount: s.blocked,
      tenor,
      maturity,
      blocked: true,
      collateralId: active?.id,
      origin: 'rule',
      memo: en.ledger.buyBlockedInUnit,
    });
  }
  if (s.earmarked > 0) {
    blockedMsg += ` + ${fmtM(s.earmarked)} earmarked for payments`;
    buyUnit(s, ctx, {
      currency: 'EUR',
      amount: s.earmarked,
      tenor,
      maturity,
      blocked: true,
      earmarkId: 'EARMARK',
      origin: 'rule',
      memo: en.ledger.buyBlockedInUnit,
    });
  }
  ctx.orchestrate({
    rule: R.overnight,
    decision: `${friday ? 'Three-day' : 'Overnight'} unit on idle ${fmtM(free)}${blockedMsg}`,
    instrument: u
      ? `Unit ${u.id}, ${friday ? 'three-day' : 'overnight'}, 1.80%`
      : 'No idle balance',
    rail: 'Internal ledger',
    checks: [
      { name: 'After last cut-off (18:00)', ok: true, detail: 'Late cash earns from this minute' },
    ],
  });
}

/** Before opening: unwind short units, give each bank what it needs today, keep the rest. */
export function runReturn(s: State, ctx: Ctx): void {
  const unwound = unwindMatured(s, ctx);
  const returns: string[] = [];
  for (const b of DEFAULT_RULES.nightSweep.banks) {
    const amt = Math.min(s.sweptTonight[b.account], Math.max(0, s.bal['tok-paris']));
    if (amt > 0) {
      book(s, ctx, 'tok-paris', -amt, en.ledger.returnBank(b.bank));
      book(s, ctx, b.account, amt, en.ledger.returnBank(b.bank));
      s.returnedTotal += amt;
      returns.push(`${b.bank} ${fmtM(amt)}`);
    }
    s.sweptTonight[b.account] = 0;
  }
  const need = FORECAST_NEEDS[dayIndex(ctx.t)]?.current ?? s.bal['cur-paris'];
  const toCurrent = Math.min(
    Math.max(0, need - s.bal['cur-paris']),
    Math.max(0, s.bal['tok-paris']),
  );
  move(s, ctx, 'tok-paris', 'cur-paris', toCurrent, en.ledger.returnCurrent);
  s.fxNightUsed = 0;
  ctx.orchestrate({
    rule: R.ret,
    decision: `Unwound ${fmtM(unwound)}. Current account to today's need ${fmtM(need)} (+${fmtM(toCurrent)}). ${returns.length ? 'Back to ' + returns.join(', ') + '. ' : ''}Keep ${fmtM(s.bal['tok-paris'])} as group buffer.`,
    instrument: 'Units → tokenised account → current account / other banks',
    rail: 'Internal ledger + SCT Inst',
    checks: [
      { name: 'Source of needs', ok: true, detail: 'Cash forecast (traditional tool)' },
      screening,
    ],
  });
}

export const screeningCheck = screening;
