import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: string; description?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          'card fixed left-1/2 top-1/2 z-[61] max-h-[88vh] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-7 outline-none',
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="pr-8 font-serif text-[22px]">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className={description ? 'mt-1.5 text-[13.5px] text-muted' : 'sr-only'}>
          {description ?? title}
        </DialogPrimitive.Description>
        <div className="mt-5">{children}</div>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 cursor-pointer rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Close"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Right-hand slide-over (used by "Under the hood"). Non-modal so the screen stays usable. */
export function SheetContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Content
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          'fixed bottom-0 right-0 top-0 z-[55] flex w-[min(620px,58vw)] flex-col border-l border-line-strong bg-surface outline-none',
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
