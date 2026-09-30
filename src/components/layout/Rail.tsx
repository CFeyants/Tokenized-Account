import { NavLink } from 'react-router-dom';
import {
  BookOpenText,
  CreditCard,
  FileText,
  Gauge,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { en } from '@/i18n/en';
import { cn } from '@/lib/utils';
import { Tip } from '@/components/ui/tooltip';

export const NAV = [
  { to: '/', label: en.nav.home, icon: Gauge, end: true },
  { to: '/accounts', label: en.nav.accounts, icon: Landmark },
  { to: '/payments', label: en.nav.payments, icon: CreditCard },
  { to: '/rules', label: en.nav.rules, icon: SlidersHorizontal },
  { to: '/placements', label: en.nav.placements, icon: TrendingUp },
  { to: '/guarantees', label: en.nav.guarantees, icon: ShieldCheck },
  { to: '/statements', label: en.nav.statements, icon: FileText },
  { to: '/about', label: en.nav.about, icon: BookOpenText },
];

export function Rail() {
  const expanded = useApp((s) => s.railExpanded);
  const toggle = useApp((s) => s.toggleRail);
  return (
    <nav
      aria-label="Main"
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-300',
        expanded ? 'w-[240px]' : 'w-[72px]',
      )}
    >
      <div className={cn('flex h-[64px] items-center gap-3 px-5', !expanded && 'justify-center px-0')}>
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="13" fill="none" stroke="var(--new)" strokeWidth="1.2" strokeDasharray="1 1.7" />
          <path d="M16 8v8l5 3.5" stroke="var(--new)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        {expanded && (
          <div className="leading-tight">
            <div className="font-serif text-[16px]">{en.product.bank}</div>
            <div className="text-[11px] text-muted">Corporate eBanking</div>
          </div>
        )}
      </div>
      <ul className="mt-4 flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => {
          const link = (
            <NavLink
              to={{ pathname: to }}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors',
                  isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2/60 hover:text-fg',
                  !expanded && 'justify-center px-0',
                )
              }
            >
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {expanded ? <span>{label}</span> : <span className="sr-only">{label}</span>}
            </NavLink>
          );
          return <li key={to}>{expanded ? link : <Tip content={label} side="right">{link}</Tip>}</li>;
        })}
      </ul>
      <div className={cn('border-t border-line p-3', !expanded && 'flex flex-col items-center')}>
        {expanded && (
          <div className="mb-2 flex items-center gap-3 px-2 py-1.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary font-serif text-[14px] text-primary-fg">ML</div>
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
          className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[12px] text-muted hover:bg-surface-2 hover:text-fg"
        >
          {expanded ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          {expanded && en.nav.collapse}
        </button>
      </div>
    </nav>
  );
}
