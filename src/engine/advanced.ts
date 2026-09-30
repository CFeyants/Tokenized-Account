/**
 * Actions added on top of the week: just-in-time funding in JPY / SAR / SGD from EUR or USD,
 * pre-validation of large payments, escrow with purpose-bound money driven by oracles, payments
 * through corridors (interbank tokenised deposits or traditional rails, from the current or the
 * tokenised account) and repatriation from Latin America through the stablecoin corridor.
 */
import { NIGHT_FX_LIMIT_EUR, FX_MID, PRICING } from '@/data/rates';
import { CORRIDOR_PRICING, LATAM, PAYEES, type LatamConfig } from '@/data/corridors';
import { ORACLE_ENDPOINT, ORACLES, TEMPLATES } from '@/data/escrow';
import { en } from '@/i18n/en';
import {
  MIN_PER_DAY,
  dayIndex,
  isBusinessHours,
  minuteOfDay,
  nextOpening,
  weekday,
  type SimTime,
} from './clock';
import { book, buyUnit, move, nextId, partialUnwind, unwindEarmarkUnits } from './ops';
import { unitSaleQuote } from './pricing';
import { screeningCheck } from './rules';
import { WINDOWS, isOpen, nextOpen } from './markets';
import { fmtM } from './format';
import type { AccountId, Ctx, LatamCountry, SimEvent, State } from './types';

const A = en.adv;
const R = en.rulesNames;

export type JitTarget = 'tok-jpy-tokyo' | 'tok-sar-riyadh' | 'tok-sgd-singapore' | 'tok-munich';
export const JIT_TARGET: Record<JitTarget, { ccy: string; bank: string; entity: string }> = {
  'tok-jpy-tokyo': { ccy: 'JPY', bank: 'BNP Paribas Tokyo', entity: 'tokyo' },
  'tok-sar-riyadh': { ccy: 'SAR', bank: 'BNP Paribas Riyadh', entity: 'riyadh' },
  'tok-sgd-singapore': { ccy: 'SGD', bank: 'BNP Paribas Singapore', entity: 'singapore' },
  'tok-munich': { ccy: 'EUR', bank: 'BNP Paribas SA', entity: 'munich' },
};

export type AdvancedAction =
  | { kind: 'jit'; id: string; t: SimTime; to: JitTarget; source: 'EUR' | 'USD'; amountEur: number }
  | {
      kind: 'prevalidate';
      id: string;
      t: SimTime;
      category: 'equipment' | 'mna';
      payee: string;
      amount: number;
      condition: string;
      onLedger: boolean;
    }
  | { kind: 'release'; id: string; t: SimTime; target: string }
  | { kind: 'escrow'; id: string; t: SimTime; template: string }
  | { kind: 'oracle'; id: string; t: SimTime; target: string; milestone: string; valid: boolean }
  | {
      kind: 'corridorPay';
      id: string;
      t: SimTime;
      payee: string;
      amount: number;
      from: 'cur-paris' | 'tok-paris';
      rail: 'interbank' | 'traditional';
    }
  | { kind: 'repatriate'; id: string; t: SimTime; country: LatamCountry; local: number };

type C = Ctx;

// ─── helpers ────────────────────────────────────────────────────────────────
function ensureTok(s: State, c: C, amount: number) {
  const missing = amount - Math.max(0, s.bal['tok-paris']);
  if (missing > 0) partialUnwind(s, c, missing);
}

/** USD liquidity: the USD tokenised account, then part of the USD unit sold to the bank. */
function ensureUsd(s: State, c: C, usd: number) {
  let missing = usd - Math.max(0, s.bal['tok-usd-chicago']);
  for (const u of s.units.filter((x) => x.currency === 'USD' && !x.blocked)) {
    if (missing <= 0) break;
    const take = Math.min(missing, u.amount);
    const q = unitSaleQuote(u, take, c.t);
    u.amount -= take;
    missing -= take;
    c.post({
      account: `unit:${u.id}`,
      currency: 'USD',
      amount: -take,
      finality: 'final',
      unitId: u.id,
      memo: en.ledger.unitSale,
    });
    book(s, c, 'tok-usd-chicago', take, en.ledger.unitSale);
    s.realised.unitSaleAccrued += q.accrued / FX_MID.USD;
    s.realised.unitSaleSpread += q.spread / FX_MID.USD;
  }
  s.units = s.units.filter((x) => x.amount > 0.005);
}

function earmark(s: State, c: C, amount: number, memo: string) {
  ensureTok(s, c, amount);
  s.bal['tok-paris'] -= amount;
  s.earmarked += amount;
  c.post({ account: 'tok-paris', currency: 'EUR', amount: -amount, finality: 'final', memo });
  c.post({ account: 'tok-paris:earmarked', currency: 'EUR', amount, finality: 'final', memo });
}

function payOutEarmarked(s: State, c: C, amount: number, memo: string) {
  if (s.earmarked < amount - 0.01) unwindEarmarkUnits(s, c);
  s.earmarked -= amount;
  c.post({
    account: 'tok-paris:earmarked',
    currency: 'EUR',
    amount: -amount,
    finality: 'final',
    memo,
  });
}

/** Quote for a JIT conversion: day desk mid ± 5 bps, out of hours ± 10 bps. */
export function jitQuote(ccy: string, source: 'EUR' | 'USD', amountEur: number, t: SimTime) {
  const bps = isBusinessHours(t) ? 5 : PRICING.fxNightBps;
  const midPerSource = source === 'EUR' ? FX_MID[ccy] : FX_MID[ccy] / FX_MID.USD;
  const sourceAmount = source === 'EUR' ? amountEur : amountEur * FX_MID.USD;
  const rate = midPerSource * (1 - bps / 10_000);
  return { bps, midPerSource, rate, sourceAmount, foreign: sourceAmount * rate };
}

export function repatriationQuote(cfg: LatamConfig, local: number) {
  const mid = FX_MID[cfg.currency];
  const gross = local / mid;
  const fee = gross * (CORRIDOR_PRICING.partnerBps / 10_000) + CORRIDOR_PRICING.networkFeeEur;
  const trad = gross * (CORRIDOR_PRICING.tradBps / 10_000) + CORRIDOR_PRICING.tradFeesEur;
  return {
    mid,
    rate: mid * (1 + CORRIDOR_PRICING.partnerBps / 10_000),
    eur: gross - fee,
    fee,
    tradEur: gross - trad,
    tradFee: trad,
  };
}

function railOpen(cfg: LatamConfig, t: SimTime): boolean {
  if (!cfg.railWindow) return true;
  const m = minuteOfDay(t);
  return weekday(t) < 5 && m >= cfg.railWindow.from && m < cfg.railWindow.to;
}

function nextRail(cfg: LatamConfig, t: SimTime): SimTime {
  if (railOpen(cfg, t)) return t;
  for (let d = dayIndex(t); d < dayIndex(t) + 8; d++) {
    const start = d * MIN_PER_DAY + cfg.railWindow!.from;
    if (weekday(d * MIN_PER_DAY) < 5 && start >= t) return start;
  }
  return t;
}

/** Credit EUR to the tokenised account; outside business hours it goes into a unit that minute. */
function creditLateCash(s: State, c: C, eur: number, memo: string) {
  book(s, c, 'tok-paris', eur, memo);
  if (
    !isBusinessHours(c.t) &&
    (minuteOfDay(c.t) >= 18 * 60 + 30 || minuteOfDay(c.t) < 7 * 60 || weekday(c.t) >= 5)
  ) {
    buyUnit(s, c, {
      currency: 'EUR',
      amount: eur,
      tenor: weekday(c.t) >= 4 ? 'weekend' : 'overnight',
      maturity: nextOpening(c.t),
      origin: 'rule',
      memo: en.ledger.buyOvernight,
    });
  }
}

// ─── events ─────────────────────────────────────────────────────────────────
export function advancedToEvents(a: AdvancedAction): SimEvent[] {
  const base = { id: a.id, t: a.t, actor: 'marie' as const, kind: 'user' as const };
  switch (a.kind) {
    case 'jit': {
      const tgt = JIT_TARGET[a.to];
      return [
        {
          ...base,
          layer: 'new',
          title: A.jitTitle(fmtM(a.amountEur), tgt.ccy, a.source),
          detail: A.jitDetail(tgt.bank),
          apply: (s, c) => {
            const q = jitQuote(tgt.ccy, a.source, a.amountEur, c.t);
            if (a.source === 'EUR') {
              ensureTok(s, c, a.amountEur);
              if (tgt.ccy === 'EUR') {
                move(s, c, 'tok-paris', a.to, a.amountEur, A.jitMemo('EUR'));
                return;
              }
              book(s, c, 'tok-paris', -a.amountEur, A.fxMemo('EUR', tgt.ccy, isBusinessHours(c.t)));
            } else {
              ensureUsd(s, c, q.sourceAmount);
              book(
                s,
                c,
                'tok-usd-chicago',
                -q.sourceAmount,
                A.fxMemo('USD', tgt.ccy, isBusinessHours(c.t)),
              );
            }
            book(s, c, a.to, q.foreign, A.jitMemo(tgt.ccy));
            if (!isBusinessHours(c.t)) s.fxNightUsed += a.amountEur;
            s.mirrors.push({
              id: nextId(s, 'IG'),
              t: c.t,
              debtorBank: a.source === 'USD' ? 'BNP Paribas New York' : 'BNP Paribas SA',
              creditorBank: tgt.bank,
              currency: tgt.ccy as never,
              amount: q.foreign,
              eur: a.amountEur,
              memo: A.mirrorMemo,
            });
            c.orchestrate({
              rule: R.funding,
              decision: A.jitDecision(a.source, tgt.ccy, q.rate.toFixed(4), q.bps),
              instrument: `${tgt.bank} — tokenised account`,
              rail: A.ledgerRail,
              checks: [
                screeningCheck,
                {
                  name: en.checks.limit,
                  ok: s.fxNightUsed <= NIGHT_FX_LIMIT_EUR,
                  detail: en.checks.fxLimit(
                    fmtM(s.fxNightUsed, 'EUR', 0),
                    fmtM(NIGHT_FX_LIMIT_EUR, 'EUR', 0),
                  ),
                },
                { name: A.purposeCheck, ok: true, detail: A.purposeOk },
              ],
            });
          },
        },
      ];
    }
    case 'prevalidate':
      return [
        {
          ...base,
          layer: 'new',
          title: A.preTitle(fmtM(a.amount), a.payee),
          detail: A.preDetail(a.condition),
          apply: (s, c) => {
            earmark(s, c, a.amount, A.preMemo(a.payee));
            const checks = A.preChecks(a.category, a.onLedger).map(([name, detail]) => ({
              name,
              ok: true,
              detail,
            }));
            s.conditional.push({
              id: a.id,
              kind: 'large',
              payee: a.payee,
              amount: a.amount,
              condition: a.condition,
              since: c.t,
              status: 'waiting',
              checks,
            });
            c.orchestrate({
              rule: R.marie,
              decision: A.preDecision,
              instrument: A.earmarkInstrument,
              rail: a.onLedger ? A.ledgerRail : 'T2 (RTGS) on release',
              checks,
            });
          },
        },
      ];
    case 'release':
      return [
        {
          ...base,
          layer: 'new',
          title: A.releaseTitle,
          detail: A.releaseDetail,
          apply: (s, c) => {
            const p = s.conditional.find((x) => x.id === a.target && x.status === 'waiting');
            if (!p) return;
            const onLedger = p.checks?.some((k) => k.name === A.onLedgerCheck) ?? false;
            if (!onLedger && !isOpen(WINDOWS.t2, c.t)) {
              p.status = 'awaitingRail';
              c.orchestrate({
                rule: R.release,
                decision: A.awaitT2(fmtM(p.amount)),
                instrument: A.earmarkInstrument,
                rail: 'T2',
                checks: [{ name: 'T2', ok: false, detail: A.t2Closed }],
              });
              return;
            }
            payOutEarmarked(s, c, p.amount, A.releasedMemo(p.payee));
            p.status = 'released';
            p.releasedAt = c.t;
            c.orchestrate({
              rule: R.release,
              decision: A.releasedNow,
              instrument: p.payee,
              rail: onLedger ? A.ledgerRail : 'T2',
              checks: [{ name: A.alreadyScreened, ok: true, detail: A.noRecheck }],
            });
          },
        },
        ...(() => {
          const t2 = nextOpen(WINDOWS.t2, a.t);
          if (t2 <= a.t) return [];
          return [
            {
              ...base,
              id: `${a.id}-t2`,
              t: t2,
              actor: 'rule' as const,
              layer: 'traditional' as const,
              title: A.t2OpenTitle,
              detail: A.t2OpenDetail,
              apply: (s: State, c: C) => {
                const p = s.conditional.find(
                  (x) => x.id === a.target && x.status === 'awaitingRail',
                );
                if (!p) return;
                payOutEarmarked(s, c, p.amount, A.releasedMemo(p.payee));
                p.status = 'released';
                p.releasedAt = c.t;
              },
            },
          ];
        })(),
      ];
    case 'escrow': {
      const tpl = TEMPLATES.find((x) => x.id === a.template)!;
      const oracle = ORACLES.find((o) => o.id === tpl.oracle)!;
      return [
        {
          ...base,
          layer: 'new',
          title: A.escrowTitle(fmtM(tpl.amount), tpl.name),
          detail: A.escrowDetail,
          apply: (s, c) => {
            earmark(s, c, tpl.amount, A.escrowMemo(tpl.name));
            s.conditional.push({
              id: a.id,
              kind: 'escrow',
              payee: tpl.payees[0],
              amount: tpl.amount,
              condition: tpl.milestones.map((m) => m.label).join(' → '),
              since: c.t,
              status: 'waiting',
              released: 0,
              events: [],
              escrow: {
                purpose: tpl.purpose,
                payees: tpl.payees,
                expiry: c.t + tpl.expiryDays * MIN_PER_DAY,
                returnTo: tpl.returnTo,
                template: tpl.id,
                oracle: oracle.name,
                endpoint: ORACLE_ENDPOINT(a.id),
                milestones: tpl.milestones.map((m) => ({ ...m, done: false })),
              },
            });
            c.orchestrate({
              rule: A.escrowRule,
              decision: A.escrowDecision,
              instrument: A.pbmInstrument,
              rail: 'Internal ledger',
              checks: [
                screeningCheck,
                { name: A.payeeWhitelist, ok: true, detail: tpl.payees.join(', ') },
              ],
            });
          },
        },
      ];
    }
    case 'oracle':
      return [
        {
          ...base,
          actor: 'event',
          layer: 'new',
          title: A.oracleTitle(a.milestone, a.valid),
          detail: a.valid ? A.oracleOk : A.oracleRejected,
          apply: (s, c) => {
            const p = s.conditional.find((x) => x.id === a.target && x.kind === 'escrow');
            if (!p || !p.escrow) return;
            const m = p.escrow.milestones.find((x) => x.key === a.milestone);
            const payload = JSON.stringify({
              escrow: p.id,
              milestone: a.milestone,
              at: c.t,
              signature: a.valid ? 'ES256:valid' : 'ES256:invalid',
            });
            if (!a.valid || !m || m.done) {
              p.events!.push({
                t: c.t,
                source: p.escrow.oracle,
                milestone: a.milestone,
                payload,
                outcome: a.valid ? A.duplicate : A.badSignature,
                accepted: false,
              });
              c.orchestrate({
                rule: A.escrowRule,
                decision: A.oracleRejectedDecision,
                instrument: p.id,
                rail: '—',
                checks: [
                  {
                    name: A.signatureCheck,
                    ok: false,
                    detail: a.valid ? A.duplicate : A.badSignature,
                  },
                ],
              });
              return;
            }
            m.done = true;
            const amt = p.amount * m.share;
            if (amt > 0) payOutEarmarked(s, c, amt, A.escrowPaid(m.label));
            p.released = (p.released ?? 0) + amt;
            if (p.escrow.milestones.every((x) => x.done)) {
              p.status = 'released';
              p.releasedAt = c.t;
            }
            p.events!.push({
              t: c.t,
              source: p.escrow.oracle,
              milestone: a.milestone,
              payload,
              outcome: amt > 0 ? A.paidOut(fmtM(amt, 'EUR', 2)) : A.conditionMet,
              accepted: true,
            });
            c.orchestrate({
              rule: A.escrowRule,
              decision: amt > 0 ? A.paidOut(fmtM(amt, 'EUR', 2)) : A.conditionMet,
              instrument: p.id,
              rail: A.ledgerRail,
              checks: [
                { name: A.signatureCheck, ok: true, detail: 'ES256' },
                { name: A.payeeWhitelist, ok: true, detail: p.escrow.payees[0] },
              ],
            });
          },
        },
      ];
    case 'corridorPay': {
      const payee = PAYEES.find((p) => p.id === a.payee)!;
      return [
        {
          ...base,
          layer: a.rail === 'interbank' ? 'new' : 'traditional',
          title: A.corridorTitle(fmtM(a.amount), payee.name, a.rail),
          detail: A.corridorDetail(a.from === 'tok-paris', a.rail),
          apply: (s, c) => {
            if (a.from === 'tok-paris') ensureTok(s, c, a.amount);
            book(s, c, a.from, -a.amount, A.corridorMemo(payee.name, payee.bank, a.rail));
            if (a.rail === 'interbank')
              c.post({
                account: `interbank:${payee.bank}`,
                currency: 'EUR',
                amount: a.amount,
                finality: 'final',
                memo: A.interbankLeg,
              });
            c.orchestrate({
              rule: R.marie,
              decision: A.corridorTitle(fmtM(a.amount), payee.name, a.rail),
              instrument: a.from === 'tok-paris' ? en.product.name : en.accounts.types.current,
              rail: a.rail === 'interbank' ? A.interbankRail : 'SCT Inst / T2',
              checks: [screeningCheck],
            });
          },
        },
      ];
    }
    case 'repatriate': {
      const cfg = LATAM.find((l) => l.country === a.country)!;
      const q = repatriationQuote(cfg, a.local);
      const t1 = nextRail(cfg, a.t + 1);
      const steps = { lock: a.t, wallet: t1, convert: t1 + 1, send: t1 + 2, credit: t1 + 4 };
      const find = (s: State) => s.repatriations.find((r) => r.id === a.id)!;
      const ev = (
        key: keyof typeof steps,
        actor: 'marie' | 'event' | 'rule',
        title: string,
        apply: (s: State, c: C) => void,
      ): SimEvent => ({
        ...base,
        id: `${a.id}-${key}`,
        t: steps[key],
        actor,
        layer: 'new',
        title,
        detail: A.repDetail(cfg.currency),
        apply,
      });
      return [
        ev(
          'lock',
          'marie',
          A.repLock(
            fmtM(a.local, cfg.currency),
            q.rate.toFixed(cfg.currency === 'COP' || cfg.currency === 'CLP' ? 0 : 4),
          ),
          (s) => {
            s.repatriations.push({
              id: a.id,
              country: a.country,
              currency: cfg.currency,
              local: a.local,
              rate: q.rate,
              lockedAt: a.t,
              lockUntil: a.t + CORRIDOR_PRICING.lockMinutes,
              eur: q.eur,
              fee: q.fee,
              status: 'locked',
              steps: Object.entries(steps).map(([key, at]) => ({ key, at })),
            });
          },
        ),
        ev('wallet', 'event', A.repWallet(cfg.localRail), (s, c) => {
          book(s, c, cfg.account as AccountId, -a.local, A.repWalletMemo(cfg.localRail));
          s.wallets[cfg.wallet] += a.local;
          c.post({
            account: `wallet:${cfg.wallet}`,
            currency: cfg.currency,
            amount: a.local,
            finality: 'final',
            memo: A.repWalletMemo(cfg.localRail),
          });
          find(s).status = 'inWallet';
        }),
        ev('convert', 'rule', A.repConvert, (s, c) => {
          s.wallets[cfg.wallet] -= a.local;
          s.wallets['bitso-qeur'] += q.eur;
          c.post({
            account: `wallet:${cfg.wallet}`,
            currency: cfg.currency,
            amount: -a.local,
            finality: 'final',
            memo: A.repConvert,
          });
          c.post({
            account: 'wallet:bitso-qeur',
            currency: 'QEUR',
            amount: q.eur,
            finality: 'final',
            memo: A.repConvert,
          });
          find(s).status = 'converted';
        }),
        ev('send', 'rule', A.repSend, (s, c) => {
          s.wallets['bitso-qeur'] -= q.eur;
          c.post({
            account: 'wallet:bitso-qeur',
            currency: 'QEUR',
            amount: -q.eur,
            finality: 'pending',
            memo: A.repSend,
          });
          find(s).status = 'inTransit';
        }),
        ev('credit', 'event', A.repCredit, (s, c) => {
          creditLateCash(s, c, q.eur, A.repCredit);
          find(s).status = 'credited';
          c.orchestrate({
            rule: A.corridorRule,
            decision: A.repCreditDecision(fmtM(q.eur, 'EUR', 2)),
            instrument: en.product.name,
            rail: A.stablecoinRail,
            checks: [
              screeningCheck,
              { name: A.travelRule, ok: true, detail: A.travelRuleOk },
              { name: en.checks.finality, ok: true, detail: A.redeemedAtPar },
            ],
          });
        }),
      ];
    }
  }
}
