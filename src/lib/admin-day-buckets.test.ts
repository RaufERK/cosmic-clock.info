import { describe, expect, it } from "vitest";
import {
  ADMIN_STATS_DAYS,
  addUtcDays,
  countOnUtcDay,
  fillDailyBuckets,
  formatHistogramDate,
  histogramAxisTicks,
  histogramValueScale,
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

describe("formatHistogramDate", () => {
  it("formats UTC calendar day without shifting", () => {
    expect(formatHistogramDate("2026-07-15")).toBe("15 Jul");
    expect(formatHistogramDate("2026-08-13", true)).toBe("13 Aug 2026");
  });
});

describe("histogramAxisTicks", () => {
  it("includes first, last, and evenly spaced labels", () => {
    const dates = fillDailyBuckets(end, ADMIN_STATS_DAYS, []).map((d) => d.date);
    const ticks = histogramAxisTicks(dates);
    expect(ticks[0]).toEqual({ index: 0, label: "15 Jul" });
    expect(ticks[ticks.length - 1]).toEqual({ index: 29, label: "13 Aug" });
    expect(ticks.length).toBe(6);
  });

  it("shows year when the window crosses a year boundary", () => {
    const dates = ["2025-12-20", "2025-12-25", "2026-01-18"];
    const ticks = histogramAxisTicks(dates, 3);
    expect(ticks.map((t) => t.label)).toEqual([
      "20 Dec 2025",
      "25 Dec 2025",
      "18 Jan 2026",
    ]);
  });
});

describe("histogramValueScale", () => {
  it("uses a 0–1 scale when all days are empty", () => {
    expect(histogramValueScale(0)).toEqual({ top: 1, ticks: [0, 1] });
  });

  it("keeps small integer tops", () => {
    expect(histogramValueScale(1)).toEqual({ top: 1, ticks: [0, 1] });
    expect(histogramValueScale(3)).toEqual({
      top: 3,
      ticks: [0, 1, 2, 3],
    });
    expect(histogramValueScale(7)).toEqual({
      top: 10,
      ticks: [0, 2, 4, 6, 8, 10],
    });
  });

  it("rounds larger counts to a nice ceiling", () => {
    expect(histogramValueScale(12)).toEqual({
      top: 15,
      ticks: [0, 5, 10, 15],
    });
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
