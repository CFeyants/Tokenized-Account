import * as React from 'react';
import { cn } from '@/lib/utils';

export type ChipTone =
  | 'new'
  | 'traditional'
  | 'outside'
  | 'amber'
  | 'red'
  | 'neutral'
  | 'rule'
  | 'marie'
  | 'event'
  | 'notYet';

const tones: Record<ChipTone, string> = {
  new: 'bg-new-soft text-new border-new/25',
  traditional: 'bg-grey-soft text-muted border-transparent',
  outside: 'border-dashed border-line-strong text-muted',
  amber: 'bg-amber-soft text-amber border-amber/25',
  red: 'bg-red/10 text-red border-red/25',
  neutral: 'bg-surface-2 text-fg border-line',
  rule: 'bg-new-soft text-new border-new/30',
  marie: 'bg-primary/15 text-fg border-primary/40',
  event: 'bg-grey-soft text-fg border-line',
  notYet: 'border-dashed border-line-strong text-muted',
};

export function Chip({
  tone = 'neutral',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11.5px] font-medium [&_svg]:size-3',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
