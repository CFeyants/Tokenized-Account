import { cn } from '@/lib/utils';

/**
 * The motif: a thin ring of 60 ticks around anything counted to the minute.
 * `progress` (0–1) fills the ring, e.g. the minute of the hour on the clock.
 */
export function MinuteRing({
  size = 44,
  progress = 0,
  className,
  children,
  tone = 'new',
}: {
  size?: number;
  progress?: number;
  className?: string;
  children?: React.ReactNode;
  tone?: 'new' | 'muted' | 'amber';
}) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  const tick = c / 60;
  const colour = tone === 'new' ? 'var(--new)' : tone === 'amber' ? 'var(--amber)' : 'var(--muted)';
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={1}
          strokeDasharray={`${tick * 0.28} ${tick * 0.72}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0.001, progress) * c} ${c}`}
          style={{ transition: 'stroke-dasharray 250ms linear' }}
        />
      </svg>
      {children}
    </span>
  );
}
