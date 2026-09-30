import { useEffect, useRef } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'framer-motion';

/**
 * A number that springs to its new value on clock ticks (300 ms). Rendered as text with
 * tabular figures so digits do not jump around.
 */
export function Animated({
  value,
  format,
  className,
  duration = 0.3,
}: {
  value: number;
  format: (v: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);
  const reduce = useReducedMotion();
  const fmt = useRef(format);
  fmt.current = format;

  useEffect(() => {
    const unsub = mv.on('change', (v) => {
      if (ref.current) ref.current.textContent = fmt.current(v);
    });
    return unsub;
  }, [mv]);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { type: 'spring', duration, bounce: 0 });
    return () => c.stop();
  }, [value, mv, reduce, duration]);

  return (
    <span ref={ref} className={`tabular ${className ?? ''}`}>
      {format(mv.get())}
    </span>
  );
}
