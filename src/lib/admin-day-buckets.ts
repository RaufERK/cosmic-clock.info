export const ADMIN_STATS_DAYS = 30;

const UTC_DAY_MS = 24 * 60 * 60 * 1000;

export type DayCount = {
  date: string;
  count: number;
};

/** `YYYY-MM-DD` in UTC. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(dayStart: Date, days: number): Date {
  return new Date(dayStart.getTime() + days * UTC_DAY_MS);
}

/**
 * Inclusive window: `dayCount` UTC days ending on `rangeEnd`'s UTC day.
 * Timestamps outside the window are ignored. Empty days are 0.
 */
export function fillDailyBuckets(
  rangeEnd: Date,
  dayCount: number,
  timestamps: Date[],
): DayCount[] {
  const end = utcDayStart(rangeEnd);
  const start = addUtcDays(end, -(dayCount - 1));
  const counts = new Map<string, number>();

  for (let i = 0; i < dayCount; i += 1) {
    counts.set(utcDateKey(addUtcDays(start, i)), 0);
  }

  for (const ts of timestamps) {
    const key = utcDateKey(ts);
    const current = counts.get(key);
    if (current === undefined) continue;
    counts.set(key, current + 1);
  }

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

export function countOnUtcDay(timestamps: Date[], day: Date): number {
  const key = utcDateKey(utcDayStart(day));
  let n = 0;
  for (const ts of timestamps) {
    if (utcDateKey(ts) === key) n += 1;
  }
  return n;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** `YYYY-MM-DD` → `15 Jul` (UTC calendar, no timezone shift). */
export function formatHistogramDate(iso: string, showYear = false): string {
  const year = iso.slice(0, 4);
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  const monthLabel = MONTH_SHORT[month - 1];
  if (!monthLabel || !day) return iso;
  return showYear ? `${day} ${monthLabel} ${year}` : `${day} ${monthLabel}`;
}

export type HistogramAxisTick = {
  index: number;
  label: string;
};

/** First, last, and evenly spaced dates for the histogram X axis. */
export function histogramAxisTicks(
  dates: string[],
  targetCount = 6,
): HistogramAxisTick[] {
  const n = dates.length;
  if (n === 0) return [];

  const spanYears =
    n > 1 && dates[0]!.slice(0, 4) !== dates[n - 1]!.slice(0, 4);

  if (n === 1) {
    return [
      { index: 0, label: formatHistogramDate(dates[0]!, spanYears) },
    ];
  }

  const count = Math.min(Math.max(targetCount, 2), n);
  const indices = new Set<number>([0, n - 1]);
  for (let t = 1; t < count - 1; t += 1) {
    indices.add(Math.round((t / (count - 1)) * (n - 1)));
  }

  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      label: formatHistogramDate(dates[index]!, spanYears),
    }));
}

export type HistogramValueScale = {
  top: number;
  ticks: number[];
};

function niceCountCeiling(maxCount: number): number {
  const raw = Math.max(1, Math.ceil(maxCount));
  const exp = Math.floor(Math.log10(raw));
  const mag = 10 ** exp;
  const n = raw / mag;
  let nice: number;
  if (n <= 1) nice = 1;
  else if (n <= 1.5) nice = 1.5;
  else if (n <= 2) nice = 2;
  else if (n <= 3) nice = 3;
  else if (n <= 4) nice = 4;
  else if (n <= 5) nice = 5;
  else nice = 10;
  return nice * mag;
}

function valueTickStep(top: number): number {
  if (top <= 5) return 1;
  if (top <= 10) return 2;
  if (top <= 20) return 5;
  if (top <= 50) return 10;
  if (top <= 100) return 20;
  if (top <= 200) return 50;
  if (top <= 500) return 100;
  return Math.max(1, Math.round(top / 4));
}

/** Integer Y-axis: nice ceiling above `maxCount`, ticks from 0 to top. */
export function histogramValueScale(maxCount: number): HistogramValueScale {
  const top = niceCountCeiling(Math.max(0, maxCount));
  const step = valueTickStep(top);
  const ticks: number[] = [];
  for (let value = 0; value <= top + 1e-9; value += step) {
    ticks.push(Math.round(value));
  }
  if (ticks[ticks.length - 1] !== top) {
    ticks.push(top);
  }
  return { top, ticks };
}
