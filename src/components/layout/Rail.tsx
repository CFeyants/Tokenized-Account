import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpenText,
  Briefcase,
  CalendarRange,
  ChevronDown,
  CreditCard,
  FileText,
  Globe2,
  Gauge,
  Landmark,
  Lock,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Repeat,
  Route,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Timer,
  TrendingUp,
  Workflow,
  Zap,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { useGov } from '@/app/governance';
import { en } from '@/i18n/en';
import { cn } from '@/lib/utils';
import { Tip } from '@/components/ui/tooltip';

type Item = { to: string; label: string; icon: LucideIcon; end?: boolean; n?: number };

const JOURNEY_ICONS: Record<string, LucideIcon> = {
  contracts: Workflow,
  brazil: Globe2,
  sweep: Repeat,
  work: Lock,
  prevalidation: ShieldCheck,
  jit: Zap,
  us: DollarSign,
};

export const TOP: Item[] = [
  { to: '/', label: en.nav.home, icon: Gauge, end: true },
  { to: '/approvals', label: en.nav.approvals, icon: PenLine },
];

export const JOURNEYS: Item[] = en.journeys.list.map((j, i) => ({
  to: j.path,
  label: j.short,
  icon: JOURNEY_ICONS[j.id],
  n: i + 1,
}));

export const CONTROL: Item[] = [
  { to: '/tms', label: en.nav.tms, icon: MonitorSmartphone },
  { to: '/incidents', label: en.nav.incidents, icon: Siren },
  { to: '/business-case', label: en.nav.businessCase, icon: Briefcase },
];

export const EVERYDAY: Item[] = [
  { to: '/week', label: en.nav.week, icon: CalendarRange },
  { to: '/accounts', label: en.nav.accounts, icon: Landmark },
  { to: '/payments', label: en.nav.payments, icon: CreditCard },
  { to: '/placements', label: en.nav.placements, icon: TrendingUp },
  { to: '/guarantees', label: en.nav.guarantees, icon: ShieldCheck },
  { to: '/statements', label: en.nav.statements, icon: FileText },
  { to: '/rules', label: en.nav.rules, icon: SlidersHorizontal },
  { to: '/corridors', label: en.corridors.nav, icon: Route },
  { to: '/minute', label: en.minute.nav, icon: Timer },
];

function NavItem({ item, expanded, badge }: { item: Item; expanded: boolean; badge?: number }) {
  const { to, label, icon: Icon, end, n } = item;
  const link = (
    <NavLink
      to={{ pathname: to }}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex h-9 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors',
          isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2/60 hover:text-fg',
          !expanded && 'justify-center px-0',
        )
      }
    >
      <Icon className="size-[18px] shrink-0" aria-hidden />
      {expanded ? (
        <span className="flex flex-1 items-center justify-between gap-2">
          <span className="truncate">{label}</span>
          {n !== undefined && <span className="tabular text-[11px] text-muted">{n}</span>}
          {badge ? (
            <span className="tabular rounded-full bg-amber-soft px-1.5 text-[11px] text-amber">
              {badge}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </NavLink>
  );
  return (
    <li>
      {expanded ? (
        link
      ) : (
        <Tip content={label} side="right">
          {link}
        </Tip>
      )}
    </li>
  );
}

function Section({
  title,
  items,
  expanded,
  badges,
}: {
  title: string;
  items: Item[];
  expanded: boolean;
  badges?: Record<string, number>;
}) {
  return (
    <>
      {expanded && <div className="eyebrow mb-1 mt-4 px-3">{title}</div>}
      <ul className={cn('flex flex-col gap-0.5', !expanded && 'mt-3')}>
        {items.map((i) => (
          <NavItem key={i.to} item={i} expanded={expanded} badge={badges?.[i.to]} />
        ))}
      </ul>
    </>
  );
}

export function Rail() {
  const expanded = useApp((s) => s.railExpanded);
  const toggle = useApp((s) => s.toggleRail);
  const { pathname } = useLocation();
  const pending = useGov(
    (s) => s.approvals.filter((a) => a.status === 'pending' && a.checker === 'marie').length,
  );
  const inEveryday = EVERYDAY.some((i) => pathname.startsWith(i.to)) || pathname === '/about';
  const [open, setOpen] = useState(inEveryday);
  const showEveryday = open || inEveryday;

  return (
    <nav
      aria-label="Main"
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-300',
        expanded ? 'w-[240px]' : 'w-[72px]',
      )}
    >
      <div
        className={cn('flex h-[64px] items-center gap-3 px-5', !expanded && 'justify-center px-0')}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="var(--new)"
            strokeWidth="1.2"
            strokeDasharray="1 1.7"
          />
          <path
            d="M16 8v8l5 3.5"
            stroke="var(--new)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        {expanded && (
          <div className="leading-tight">
            <div className="font-serif text-[16px]">{en.product.bank}</div>
            <div className="text-[11px] text-muted">{en.nav.portal}</div>
          </div>
        )}
      </div>
      <div className="scrollbar-thin mt-1 flex-1 overflow-y-auto px-3 pb-3">
        <ul className="flex flex-col gap-0.5">
          {TOP.map((i) => (
            <NavItem
              key={i.to}
              item={i}
              expanded={expanded}
              badge={i.to === '/approvals' ? pending : undefined}
            />
          ))}
        </ul>
        <Section title={en.journeys.section} items={JOURNEYS} expanded={expanded} />
        <Section title={en.nav.control} items={CONTROL} expanded={expanded} />
        <button
          type="button"
          onClick={() => setOpen(!showEveryday)}
          aria-expanded={showEveryday}
          className={cn(
            'mt-4 flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-muted hover:text-fg',
            !expanded && 'justify-center px-0',
          )}
        >
          {expanded ? (
            <span className="eyebrow">{en.journeys.more}</span>
          ) : (
            <Landmark className="size-4" />
          )}
          {expanded && (
            <ChevronDown
              className={cn('size-3.5 transition-transform', showEveryday && 'rotate-180')}
            />
          )}
        </button>
        {showEveryday && (
          <ul className="flex flex-col gap-0.5">
            {EVERYDAY.map((i) => (
              <NavItem key={i.to} item={i} expanded={expanded} />
            ))}
            <NavItem
              item={{ to: '/about', label: en.nav.about, icon: BookOpenText }}
              expanded={expanded}
            />
          </ul>
        )}
      </div>
      <div className={cn('border-t border-line p-3', !expanded && 'flex flex-col items-center')}>
        {expanded && (
          <div className="mb-2 flex items-center gap-3 px-2 py-1">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary font-serif text-[14px] text-primary-fg">
              ML
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px]">{en.nav.persona}</div>
              <div className="truncate text-[11px] text-muted">{en.nav.personaRole}</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={expanded ? en.nav.collapse : en.nav.expand}
          className="flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[12px] text-muted hover:bg-surface-2 hover:text-fg"
        >
          {expanded ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          {expanded && en.nav.collapse}
        </button>
      </div>
    </nav>
  );
}
