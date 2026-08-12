import { describe, expect, it } from "vitest";
import {
  civilDate,
  compareCivil,
  computeHandRotations,
  daysInMonth,
  getHandHour,
  getHandHourIndex,
  monthsElapsed,
  yearsElapsed,
} from "@/lib/cosmic-clock-math";

describe("daysInMonth / civilDate", () => {
  it("handles leap and short months", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2024, 4)).toBe(30);
    expect(civilDate(2023, 2, 31).day).toBe(28);
  });
});

describe("hand math at start", () => {
  it("all hands at 12 (0°) on the start date", () => {
    const start = civilDate(2000, 1, 1);
    const hands = computeHandRotations(start, start);
    expect(hands.year).toBe(0);
    expect(hands.month).toBe(0);
    expect(hands.day).toBe(0);
    expect(hands.yearsElapsed).toBe(0);
    expect(hands.monthsElapsed).toBe(0);
    expect(getHandHour(hands.year)).toBe(12);
    expect(getHandHourIndex(hands.year)).toBe(0);
  });

  it("before start yields zero elapsed", () => {
    const start = civilDate(2000, 6, 15);
    const asOf = civilDate(2000, 6, 14);
    expect(yearsElapsed(start, asOf)).toBe(0);
    expect(monthsElapsed(start, asOf)).toBe(0);
  });
});

describe("year / month anniversaries", () => {
  it("one year later year hand is at hour 1 (30°)", () => {
    const start = civilDate(2010, 3, 10);
    const asOf = civilDate(2011, 3, 10);
    const hands = computeHandRotations(start, asOf);
    expect(hands.yearsElapsed).toBe(1);
    expect(hands.year).toBe(30);
    expect(getHandHour(hands.year)).toBe(1);
  });

  it("twelve years later year hand back at 12", () => {
    const start = civilDate(2000, 1, 1);
    const asOf = civilDate(2012, 1, 1);
    const hands = computeHandRotations(start, asOf);
    expect(hands.yearsElapsed).toBe(12);
    expect(hands.year).toBe(0);
    expect(getHandHour(hands.year)).toBe(12);
  });

  it("one month later month hand is at hour 1", () => {
    const start = civilDate(2020, 1, 15);
    const asOf = civilDate(2020, 2, 15);
    const hands = computeHandRotations(start, asOf);
    expect(hands.monthsElapsed).toBe(1);
    expect(hands.month).toBe(30);
    expect(hands.day).toBe(0);
  });
});

describe("day hand within month-segment", () => {
  it("midway through a month-segment is near 180°", () => {
    const start = civilDate(2020, 1, 1);
    // From Jan 1 → Feb 1 segment; Jan 16 is roughly half of 31 days
    const asOf = civilDate(2020, 1, 16);
    const hands = computeHandRotations(start, asOf);
    expect(hands.day).toBeGreaterThan(160);
    expect(hands.day).toBeLessThan(200);
    expect(hands.monthFraction).toBeGreaterThan(0.4);
    expect(hands.monthFraction).toBeLessThan(0.6);
  });
});

describe("compareCivil", () => {
  it("orders dates", () => {
    expect(compareCivil(civilDate(2020, 1, 1), civilDate(2020, 1, 2))).toBeLessThan(
      0,
    );
    expect(compareCivil(civilDate(2020, 1, 1), civilDate(2020, 1, 1))).toBe(0);
  });
});
