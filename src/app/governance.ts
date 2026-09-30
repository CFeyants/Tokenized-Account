/**
 * Maker / checker. Every action on the ledger — deploy a rule, lock a rate, pre-validate, fund —
 * is initiated by one person and approved by a second signatory within their mandate. Nothing
 * reaches the ledger before the second signature. Everything is written to a timestamped audit
 * trail. Standing rules are recorded here once approved.
 */
import { create } from 'zustand';
import { at, type SimTime } from '@/engine/clock';
import type { NewUserAction } from '@/engine/userActions';
import { useApp } from './store';

export interface Person {
  name: string;
  role: string;
  /** Maximum amount this person can approve alone as second signatory, EUR. */
  mandate: number;
}

export const PEOPLE = {
  marie: { name: 'Marie Lefèvre', role: 'Group Treasurer', mandate: 50e6 },
  thomas: { name: 'Thomas Garnier', role: 'Deputy Group Treasurer', mandate: 50e6 },
  claire: { name: 'Claire Dumas', role: 'Chief Financial Officer', mandate: Infinity },
  kenji: { name: 'Kenji Sato', role: 'Treasurer, Lefèvre Japan', mandate: 5e6 },
  lukas: { name: 'Lukas Weber', role: 'Finance, Lefèvre GmbH', mandate: 2e6 },
} satisfies Record<string, Person>;

export type PersonId = keyof typeof PEOPLE;

export interface StandingRule {
  id: string;
  kind: 'jit' | 'mmf' | 'repatriation' | 'contract';
  name: string;
  params: string[];
  since: SimTime;
  approvedBy: string;
}

export interface Approval {
  id: string;
  title: string;
  detail: string;
  amountEur: number;
  maker: PersonId;
  checker: PersonId;
  submittedAt: SimTime;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: SimTime;
  /** What reaches the ledger on approval. */
  action?: NewUserAction;
  /** Scheduled minute (e.g. the minute of need); defaults to the approval minute. */
  at?: SimTime;
  rule?: Omit<StandingRule, 'id' | 'since' | 'approvedBy'>;
}

export interface AuditEntry {
  t: SimTime;
  who: string;
  what: string;
  ref: string;
}

/** The second signatory required for an amount initiated by `maker`. */
export function checkerFor(maker: PersonId, amountEur: number): PersonId {
  if (maker !== 'marie') return 'marie';
  return amountEur > PEOPLE.thomas.mandate ? 'claire' : 'thomas';
}

interface Gov {
  approvals: Approval[];
  audit: AuditEntry[];
  rules: StandingRule[];
  submit: (
    a: Omit<Approval, 'id' | 'status' | 'submittedAt' | 'checker' | 'maker'> & { maker?: PersonId },
  ) => string;
  approve: (id: string) => void;
  reject: (id: string) => void;
  reset: () => void;
}

let seq = 0;
const nextId = (p: string) => `${p}-${String(++seq).padStart(3, '0')}`;
const who = (p: PersonId) => `${PEOPLE[p].name} (${PEOPLE[p].role})`;

/** Two requests waiting for Marie on Monday morning. */
function seeds(): Approval[] {
  return [
    {
      id: 'APR-TOKYO',
      title: 'Standing just-in-time rule — Lefèvre Japan',
      detail:
        'Fund Tokyo from the group euro balance at the minute of need, any hour, JPY, up to EUR 15m per night. Removes the EUR 8m local buffer.',
      amountEur: 15e6,
      maker: 'kenji',
      checker: 'marie',
      submittedAt: at(0, '07:52'),
      status: 'pending',
      rule: {
        kind: 'jit',
        name: 'Just in time — Tokyo',
        params: [
          'Source: group euro balance',
          'Target: Norvane Bank Tokyo, JPY',
          'Trigger: forecast need, T−5 min',
          'Hours: any',
          'Cap: EUR 15m per night',
        ],
      },
    },
    {
      id: 'APR-MUNICH',
      title: 'Intragroup funding — Lefèvre GmbH, EUR 2m',
      detail: 'Munich covers a supplier run this afternoon. On the ledger, final at once.',
      amountEur: 2e6,
      maker: 'lukas',
      checker: 'marie',
      submittedAt: at(0, '08:05'),
      status: 'pending',
      action: { kind: 'jit', to: 'tok-munich', source: 'EUR', amountEur: 2e6 },
    },
  ];
}

export const useGov = create<Gov>((set, get) => ({
  approvals: seeds(),
  audit: [
    {
      t: at(0, '07:52'),
      who: who('kenji'),
      what: 'Submitted: standing just-in-time rule, Tokyo',
      ref: 'APR-TOKYO',
    },
    {
      t: at(0, '08:05'),
      who: who('lukas'),
      what: 'Submitted: intragroup funding EUR 2m',
      ref: 'APR-MUNICH',
    },
  ],
  rules: [],
  submit: (a) => {
    const maker = a.maker ?? 'marie';
    const id = nextId('APR');
    const t = useApp.getState().t;
    const approval: Approval = {
      ...a,
      id,
      maker,
      checker: checkerFor(maker, a.amountEur),
      submittedAt: t,
      status: 'pending',
    };
    set({
      approvals: [approval, ...get().approvals],
      audit: [{ t, who: who(maker), what: `Submitted: ${a.title}`, ref: id }, ...get().audit],
    });
    return id;
  },
  approve: (id) => {
    const a = get().approvals.find((x) => x.id === id && x.status === 'pending');
    if (!a) return;
    const t = useApp.getState().t;
    if (a.action)
      useApp.getState().addAction(a.action, a.at !== undefined ? Math.max(a.at, t) : undefined);
    const rules = a.rule
      ? [{ ...a.rule, id: nextId('RULE'), since: t, approvedBy: who(a.checker) }, ...get().rules]
      : get().rules;
    set({
      approvals: get().approvals.map((x) =>
        x.id === id ? { ...x, status: 'approved', decidedAt: t } : x,
      ),
      audit: [
        { t, who: who(a.checker), what: `Approved (second signature): ${a.title}`, ref: id },
        ...get().audit,
      ],
      rules,
    });
  },
  reject: (id) => {
    const a = get().approvals.find((x) => x.id === id && x.status === 'pending');
    if (!a) return;
    const t = useApp.getState().t;
    set({
      approvals: get().approvals.map((x) =>
        x.id === id ? { ...x, status: 'rejected', decidedAt: t } : x,
      ),
      audit: [{ t, who: who(a.checker), what: `Rejected: ${a.title}`, ref: id }, ...get().audit],
    });
  },
  reset: () => set({ approvals: seeds(), rules: [] }),
}));

export const personLabel = who;
