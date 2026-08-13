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
