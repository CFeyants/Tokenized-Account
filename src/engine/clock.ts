/**
 * Simulated time. A SimTime is a number of minutes since Monday 5 October 2026, 00:00,
 * Paris wall-clock time (labelled CET in the UI). Using plain minutes keeps every
 * computation free of time-zone and daylight-saving surprises.
 */
export type SimTime = number;

export const MIN_PER_DAY = 1440;
export const MIN_PER_HOUR = 60;
export const WEEK_START_ISO = '2026-10-05';
export const WEEK_START_DATE = { year: 2026, month: 10, day: 5 };

/** Real milliseconds for one simulated hour at speed 1. */
export const REAL_MS_PER_SIM_HOUR = 1500;

export const OPENING = 7 * 60; // 07:00 — overnight units unwound, return rule runs
export const BUSINESS_START = 9 * 60; // 09:00
export const LAST_CUTOFF = 18 * 60; // 18:00
export const FUND_OPEN = 9 * 60; // 09:00
export const FUND_CUTOFF = 15 * 60; // 15:00

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Build a SimTime from a day index (0 = Mon 5 Oct) and "HH:MM". */
export function at(day: number, hhmm: string): SimTime {
  const [h, m] = hhmm.split(':').map(Number);
  return day * MIN_PER_DAY + h * 60 + m;
}

export const SIM_START = at(0, '09:00');
export const SIM_END = at(7, '21:00');

export const dayIndex = (t: SimTime): number => Math.floor(t / MIN_PER_DAY);
export const minuteOfDay = (t: SimTime): number => t - dayIndex(t) * MIN_PER_DAY;
/** 0 = Monday … 6 = Sunday. */
export const weekday = (t: SimTime): number => ((dayIndex(t) % 7) + 7) % 7;
export const isWeekend = (t: SimTime): boolean => weekday(t) >= 5;
export const isFriday = (t: SimTime): boolean => weekday(t) === 4;

/** Mon–Fri 09:00–18:00. */
export function isBusinessHours(t: SimTime): boolean {
  if (isWeekend(t)) return false;
  const m = minuteOfDay(t);
  return m >= BUSINESS_START && m < LAST_CUTOFF;
}

export function isFundHours(t: SimTime): boolean {
  if (isWeekend(t)) return false;
  const m = minuteOfDay(t);
  return m >= FUND_OPEN && m < FUND_CUTOFF;
}

export type DayPhase = 'business' | 'evening' | 'night' | 'weekend';

export function dayPhase(t: SimTime): DayPhase {
  if (isWeekend(t)) return 'weekend';
  const m = minuteOfDay(t);
  if (m >= BUSINESS_START && m < LAST_CUTOFF) return 'business';
  if (m >= LAST_CUTOFF && m < 22 * 60) return 'evening';
  if (m >= OPENING && m < BUSINESS_START) return 'evening';
  return 'night';
}

/** Next business opening (07:00) strictly after t — Friday evening gives Monday 07:00. */
export function nextOpening(t: SimTime): SimTime {
  let d = dayIndex(t);
  if (minuteOfDay(t) >= OPENING) d += 1;
  while (weekday(d * MIN_PER_DAY) >= 5) d += 1;
  return d * MIN_PER_DAY + OPENING;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function hhmm(t: SimTime): string {
  const m = Math.floor(minuteOfDay(t));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function hhmmss(t: SimTime): string {
  const m = minuteOfDay(t);
  const s = Math.floor((m - Math.floor(m)) * 60);
  return `${hhmm(t)}:${pad(s)}`;
}

export const dayShort = (t: SimTime): string => DAY_SHORT[weekday(t)];
export const dayLong = (t: SimTime): string => DAY_LONG[weekday(t)];

/** Calendar date of a SimTime (the scenario week never crosses a month end). */
export function calendarDate(t: SimTime): { year: number; month: number; day: number } {
  const base = Date.UTC(WEEK_START_DATE.year, WEEK_START_DATE.month - 1, WEEK_START_DATE.day);
  const d = new Date(base + dayIndex(t) * 86_400_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function formatClock(t: SimTime): string {
  return `${dayShort(t)} ${hhmm(t)}`;
}

export function formatDate(t: SimTime): string {
  const c = calendarDate(t);
  return `${dayShort(t)} ${c.day} ${MONTH_SHORT[c.month - 1]}`;
}

export function formatDateTime(t: SimTime): string {
  return `${formatDate(t)}, ${hhmm(t)}`;
}

/** ISO-like stamp to the second, used in ledger entries. */
export function isoStamp(t: SimTime): string {
  const c = calendarDate(t);
  return `${c.year}-${pad(c.month)}-${pad(c.day)}T${hhmmss(t)}`;
}

/** Parse "2026-10-05T18:30" (the ?t= query parameter). Returns null when out of the week. */
export function parseParam(v: string | null | undefined): SimTime | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const base = Date.UTC(WEEK_START_DATE.year, WEEK_START_DATE.month - 1, WEEK_START_DATE.day);
  const day = Math.round((Date.UTC(y, mo - 1, d) - base) / 86_400_000);
  const t = day * MIN_PER_DAY + h * 60 + mi;
  if (Number.isNaN(t) || t < 0 || t > SIM_END) return null;
  return t;
}

export function toParam(t: SimTime): string {
  const c = calendarDate(t);
  return `${c.year}-${pad(c.month)}-${pad(c.day)}T${hhmm(t)}`;
}

/** Minutes outside business hours between a and b. */
export function offHoursMinutes(a: SimTime, b: SimTime): number {
  if (b <= a) return 0;
  let total = 0;
  let cur = a;
  while (cur < b) {
    const dayStart = dayIndex(cur) * MIN_PER_DAY;
    const segEnd = Math.min(b, dayStart + MIN_PER_DAY);
    if (isWeekend(cur)) {
      total += segEnd - cur;
    } else {
      const bs = dayStart + BUSINESS_START;
      const be = dayStart + LAST_CUTOFF;
      const overlap = Math.max(0, Math.min(segEnd, be) - Math.max(cur, bs));
      total += segEnd - cur - overlap;
    }
    cur = segEnd;
  }
  return total;
}
