import { describe, expect, it } from "vitest";
import {
  ADMIN_STATS_DAYS,
  addUtcDays,
  countOnUtcDay,
  fillDailyBuckets,
  utcDateKey,
  utcDayStart,
} from "@/lib/admin-day-buckets";

const end = new Date("2026-08-13T15:00:00.000Z");

describe("utcDateKey", () => {
  it("uses UTC calendar day", () => {
    expect(utcDateKey(new Date("2026-08-13T00:30:00+03:00"))).toBe("2026-08-12");
    expect(utcDateKey(new Date("2026-08-13T15:00:00.000Z"))).toBe("2026-08-13");
  });
});

describe("fillDailyBuckets", () => {
  it("fills zeros for a 30-day window ending on rangeEnd", () => {
    const days = fillDailyBuckets(end, ADMIN_STATS_DAYS, []);
    expect(days).toHaveLength(30);
    expect(days[0]?.date).toBe("2026-07-15");
    expect(days[29]?.date).toBe("2026-08-13");
    expect(days.every((d) => d.count === 0)).toBe(true);
  });

  it("counts timestamps inside the window and ignores outsiders", () => {
    const days = fillDailyBuckets(end, ADMIN_STATS_DAYS, [
      new Date("2026-07-14T23:59:59.000Z"),
      new Date("2026-07-15T00:00:00.000Z"),
      new Date("2026-08-13T23:00:00.000Z"),
      new Date("2026-08-13T12:00:00.000Z"),
      new Date("2026-08-14T00:00:00.000Z"),
    ]);
    expect(days[0]).toEqual({ date: "2026-07-15", count: 1 });
    expect(days[29]).toEqual({ date: "2026-08-13", count: 2 });
    expect(days.reduce((sum, d) => sum + d.count, 0)).toBe(3);
  });
});

describe("countOnUtcDay", () => {
  it("counts only that UTC day", () => {
    const stamps = [
      new Date("2026-08-13T00:00:00.000Z"),
      new Date("2026-08-13T23:59:59.000Z"),
      new Date("2026-08-14T00:00:00.000Z"),
    ];
    expect(countOnUtcDay(stamps, end)).toBe(2);
    expect(countOnUtcDay(stamps, addUtcDays(utcDayStart(end), 1))).toBe(1);
  });
});
