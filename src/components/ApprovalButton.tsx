import { useState } from 'react';
import { Check, PenLine, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useGov, PEOPLE, checkerFor, personLabel, type Approval } from '@/app/governance';
import { en } from '@/i18n/en';
import { fmtM } from '@/engine/format';
import { formatDateTime } from '@/engine/clock';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Row } from '@/components/Page';
import { cn } from '@/lib/utils';

const G = en.gov;

type Req = Omit<Approval, 'id' | 'status' | 'submittedAt' | 'checker' | 'maker'>;

/**
 * An action button that goes through maker / checker: Marie initiates, a second signatory within
 * mandate approves, and only then does anything reach the ledger. In the demo the second
 * signature can be given on the spot.
 */
export function ApprovalButton({
  request,
  children,
  className,
  variant = 'primary',
  size,
  disabled,
}: {
  request: Req;
  children: React.ReactNode;
  className?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  disabled?: boolean;
}) {
  const submit = useGov((s) => s.submit);
  const approve = useGov((s) => s.approve);
  const reject = useGov((s) => s.reject);
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const approval = useGov((s) => s.approvals.find((a) => a.id === id));
  const checker = PEOPLE[checkerFor('marie', request.amountEur)];

  const status = approval?.status;
  return (
    <>
      <Button
        className={className}
        variant={status === 'approved' ? 'new' : variant}
        size={size}
        disabled={disabled || status === 'approved'}
        onClick={() => setOpen(true)}
      >
        {status === 'approved' ? (
          <>
            <Check /> {G.done}
          </>
        ) : status === 'pending' ? (
          <>
            <PenLine /> {G.waiting(checker.name)}
          </>
        ) : (
          children
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={request.title} description={request.detail}>
          <div className="rounded-xl bg-surface-2 px-4 py-2">
            <Row k={G.maker} v={personLabel('marie')} />
            <Row k={G.checker} v={`${checker.name} (${checker.role})`} />
            {request.amountEur > 0 && <Row k={G.amount} v={fmtM(request.amountEur, 'EUR', 1)} />}
            <Row
              k={G.mandate}
              v={
                <span
                  className={cn(request.amountEur <= checker.mandate ? 'text-new' : 'text-red')}
                >
                  {checker.mandate === Infinity ? G.unlimited : fmtM(checker.mandate, 'EUR', 0)}
                </span>
              }
            />
            {request.at !== undefined && <Row k={G.scheduled} v={formatDateTime(request.at)} />}
          </div>
          <ol className="mt-4 space-y-2 text-[13px]">
            <li className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full',
                  approval ? 'bg-new text-bg' : 'border border-line-strong',
                )}
              >
                {approval && <Check className="size-3" />}
              </span>
              {G.step1}
            </li>
            <li className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full',
                  status === 'approved' ? 'bg-new text-bg' : 'border border-line-strong',
                )}
              >
                {status === 'approved' && <Check className="size-3" />}
              </span>
              {G.step2(checker.name)}
            </li>
            <li className="flex items-center gap-2 text-muted">
              <ShieldCheck className="size-4" /> {G.step3}
            </li>
          </ol>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {!approval && (
              <Button variant="primary" onClick={() => setId(submit(request))}>
                <PenLine /> {G.submit}
              </Button>
            )}
            {status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    reject(approval!.id);
                    setOpen(false);
                  }}
                >
                  <X /> {G.reject}
                </Button>
                <Button
                  variant="new"
                  onClick={() => {
                    approve(approval!.id);
                    setOpen(false);
                  }}
                >
                  <UserCheck /> {G.approveAs(checker.name)}
                </Button>
              </>
            )}
            {status && status !== 'pending' && (
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {G.close}
              </Button>
            )}
          </div>
          <p className="mt-3 text-[11.5px] text-muted">{G.demoNote}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
