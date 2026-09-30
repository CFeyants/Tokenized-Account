import { cn } from '@/lib/utils';
import { Chip } from '@/components/ui/chip';
import { en } from '@/i18n/en';
import { Sparkles, Clock3, CircleDashed } from 'lucide-react';

export function PageHeader({
  eyebrow,
  title,
  lead,
  aside,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-8">
      <div className="max-w-[760px]">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[38px] leading-[1.1]">{title}</h1>
        {lead && <p className="mt-3 text-[15px] leading-relaxed text-muted">{lead}</p>}
      </div>
      {aside}
    </div>
  );
}

/** "New" (what the ledger adds), "Today" (already works), "Not yet" (interbank, 2028). */
export function LayerTag({
  layer,
  className,
}: {
  layer: 'new' | 'traditional' | 'notYet';
  className?: string;
}) {
  if (layer === 'new')
    return (
      <Chip tone="new" className={className}>
        <Sparkles />
        {en.layers.new}
      </Chip>
    );
  if (layer === 'traditional')
    return (
      <Chip tone="traditional" className={className}>
        <Clock3 />
        {en.home.trad}
      </Chip>
    );
  return (
    <Chip tone="notYet" className={className}>
      <CircleDashed />
      {en.layers.notYet}
    </Chip>
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
  tone,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  tone?: 'new' | 'muted' | 'amber' | 'red';
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] text-muted">{label}</div>
      <div
        className={cn(
          'tabular mt-1 text-[22px] leading-tight',
          tone === 'new' && 'text-new',
          tone === 'muted' && 'text-muted',
          tone === 'amber' && 'text-amber',
          tone === 'red' && 'text-red',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

export function Row({
  k,
  v,
  className,
}: {
  k: React.ReactNode;
  v: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-4 py-1.5 text-[13.5px]', className)}
    >
      <span className="text-muted">{k}</span>
      <span className="tabular shrink-0 whitespace-nowrap text-right">{v}</span>
    </div>
  );
}
