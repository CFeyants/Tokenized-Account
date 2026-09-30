/** Number formatting shared by the engine (memos) and the UI. Tabular figures are set in CSS. */

const nf = (min: number, max: number) =>
  new Intl.NumberFormat('en-GB', { minimumFractionDigits: min, maximumFractionDigits: max });

const nf0 = nf(0, 0);
const nf1 = nf(1, 1);
const nf2 = nf(2, 2);

/** 101500000 → "EUR 101.5m" */
export function fmtM(v: number, ccy = 'EUR', digits = 1): string {
  const m = v / 1_000_000;
  const s = digits === 2 ? nf2.format(m) : digits === 0 ? nf0.format(m) : nf1.format(m);
  return `${ccy} ${s}m`;
}

/** Plain millions number without currency: 101.5 */
export function numM(v: number, digits = 1): string {
  const m = v / 1_000_000;
  return digits === 2 ? nf2.format(m) : digits === 0 ? nf0.format(m) : nf1.format(m);
}

/** 1234.5 → "EUR 1,234.50" */
export function fmtEur(v: number, ccy = 'EUR', digits = 2): string {
  const sign = v < 0 ? '−' : '';
  return `${sign}${ccy} ${nf(digits, digits).format(Math.abs(v))}`;
}

export function fmtAmount(v: number, digits = 0): string {
  const sign = v < 0 ? '−' : '';
  return `${sign}${nf(digits, digits).format(Math.abs(v))}`;
}

export function fmtPct(r: number, digits = 2): string {
  return `${nf(digits, digits).format(r * 100)}%`;
}

export function fmtMinutes(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h < 48) return r ? `${h} h ${r} min` : `${h} h`;
  const d = Math.floor(h / 24);
  const hh = h % 24;
  return `${d} d ${hh} h${r ? ` ${r} min` : ''}`;
}

export function fmtHours(min: number): string {
  return `${nf0.format(min / 60)} h`;
}
