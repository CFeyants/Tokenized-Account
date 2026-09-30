/**
 * Local buffers subsidiaries keep today "just in case" the Paris desk is closed when they need cash.
 * One source for the JIT page, the value banner, the tour and the business case (large industrial
 * profile = Lefèvre Industries). Illustrative.
 */
export interface LocalBuffer {
  entity: string;
  city: string;
  ccy: string;
  eur: number;
}

export const LOCAL_BUFFERS: LocalBuffer[] = [
  { entity: 'tokyo', city: 'Tokyo', ccy: 'JPY', eur: 8e6 },
  { entity: 'riyadh', city: 'Riyadh', ccy: 'SAR', eur: 5e6 },
  { entity: 'singapore', city: 'Singapore', ccy: 'SGD', eur: 6e6 },
];

export const bufferOf = (entity: string) =>
  LOCAL_BUFFERS.find((b) => b.entity === entity)?.eur ?? 0;
export const TOTAL_BUFFERS = LOCAL_BUFFERS.reduce((a, b) => a + b.eur, 0);
