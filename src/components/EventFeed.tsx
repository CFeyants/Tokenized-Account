import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useApp, useSim } from '@/app/store';
import { en } from '@/i18n/en';
import { formatClock, hhmmss } from '@/engine/clock';
import { fmtAmount } from '@/engine/format';
import { Chip } from '@/components/ui/chip';
import { LayerTag } from '@/components/Page';
import { cn } from '@/lib/utils';

/** "What just happened": the last events up to now, each expandable to its ledger entries. */
export function EventFeed({ limit = 5 }: { limit?: number }) {
  const { t, tl } = useSim();
  const openHood = useApp((s) => s.openHood);
  const [open, setOpen] = useState<string | null>(null);
  const items = tl.events.filter((e) => e.t <= t && e.id !== 'e0').slice(-limit).reverse();

  if (items.length === 0) return <p className="py-6 text-[14px] text-muted">{en.home.feedEmpty}</p>;

  return (
    <ul className="divide-y divide-line">
      <AnimatePresence initial={false}>
        {items.map((e, i) => {
          const entries = tl.ledger.filter((l) => l.eventId === e.id && l.amount !== 0);
          const isOpen = open === e.id;
          return (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="py-3.5"
            >
              <div className="flex items-start gap-3">
                <Chip tone={e.actor} className={cn('mt-0.5 w-[62px] justify-center', i === 0 && e.actor === 'rule' && 'pulse-once')}>
                  {en.actors[e.actor]}
                </Chip>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11.5px] text-muted">
                    <span className="tabular">{formatClock(e.t)}</span>
                    {e.n !== undefined && <span>· #{e.n}</span>}
                    {e.kind === 'user' && <span className="text-amber">· {en.home.yours}</span>}
                  </div>
                  <div className="mt-0.5 text-[14px] leading-snug">{e.title}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{e.detail}</p>
                  {entries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : e.id)}
                      aria-expanded={isOpen}
                      className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-[12px] text-new hover:underline"
                    >
                      <ChevronDown className={cn('size-3.5 transition-transform', isOpen && 'rotate-180')} />
                      {isOpen ? en.home.hideEntries : `${en.home.showEntries} (${entries.length})`}
                    </button>
                  )}
                  {isOpen && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-line bg-surface-2/50">
                      <table className="w-full text-[11.5px]">
                        <tbody>
                          {entries.map((l) => (
                            <tr key={l.id} className="border-b border-line last:border-0">
                              <td className="tabular px-3 py-1.5 text-muted">{hhmmss(l.t)}</td>
                              <td className="px-2 py-1.5 font-mono text-[11px]">{l.account}</td>
                              <td className={cn('tabular px-3 py-1.5 text-right', l.amount < 0 ? 'text-fg' : 'text-new')}>
                                {l.currency} {fmtAmount(l.amount)}
                              </td>
                              <td className="px-2 py-1.5 text-muted">{l.finality === 'pending' ? 'pending' : 'final'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button
                        type="button"
                        onClick={() => openHood('ledger')}
                        className="w-full cursor-pointer border-t border-line py-1.5 text-[11.5px] text-muted hover:text-fg"
                      >
                        {en.shell.hood} →
                      </button>
                    </div>
                  )}
                </div>
                {e.layer !== 'none' && <LayerTag layer={e.layer} />}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
