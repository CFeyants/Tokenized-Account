import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            'z-[80] max-w-[340px] rounded-xl border border-line-strong bg-surface-2 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-fg shadow-lg',
            className,
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/** A small (i) button that explains something on hover or keyboard focus. */
export function InfoTip({ content, label = 'More information' }: { content: React.ReactNode; label?: string }) {
  return (
    <Tip content={content}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted hover:text-fg"
      >
        <Info className="size-3.5" />
      </button>
    </Tip>
  );
}
