import { useId } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { numM } from '@/engine/format';
import { en } from '@/i18n/en';

export interface IntradayPoint {
  m: number; // minute of day
  total: number;
  free?: number;
}

const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

/**
 * Balance over one day, stepwise at minute granularity. Green above zero, red below.
 * `tone="grey"` draws the traditional current account.
 */
export function IntradayChart({ data, tone = 'new', height = 240 }: { data: IntradayPoint[]; tone?: 'new' | 'grey'; height?: number }) {
  const id = useId().replace(/:/g, '');
  const vals = data.map((d) => d.total);
  const max = Math.max(0, ...vals);
  const min = Math.min(0, ...vals);
  const off = max - min === 0 ? 1 : max / (max - min);
  const colour = tone === 'new' ? 'var(--new)' : 'var(--grey)';
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`fill${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colour} stopOpacity={0.28} />
              <stop offset={off} stopColor={colour} stopOpacity={0.04} />
              <stop offset={off} stopColor="var(--red)" stopOpacity={0.08} />
              <stop offset="1" stopColor="var(--red)" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id={`line${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor={colour} />
              <stop offset={off} stopColor="var(--red)" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="m"
            type="number"
            domain={[0, 1440]}
            ticks={[0, 360, 720, 1080, 1440]}
            tickFormatter={hh}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--line)' }}
            tickLine={false}
          />
          <YAxis
            width={44}
            tickFormatter={(v: number) => numM(v, 0)}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={0} stroke="var(--line-strong)" />
          <ReferenceLine x={1080} stroke="var(--line-strong)" strokeDasharray="3 3" label={{ value: '18:00', fill: 'var(--muted)', fontSize: 10, position: 'insideTopRight' }} />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: 'var(--muted)' }}
            labelFormatter={(m) => hh(Number(m))}
            formatter={(v) => [`EUR ${numM(Number(v), 2)}m`, en.accounts.balanceLabel]}
          />
          <Area
            type="stepAfter"
            dataKey="total"
            stroke={`url(#line${id})`}
            strokeWidth={1.75}
            fill={`url(#fill${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
