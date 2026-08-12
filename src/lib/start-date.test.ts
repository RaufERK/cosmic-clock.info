import { describe, expect, it } from "vitest";
import {
  isDaySelectable,
  isValidCalendarDay,
  isYearMonthNotFuture,
  validateStartDate,
} from "@/lib/start-date";

const today = { year: 2026, month: 8, day: 12 };

describe("validateStartDate", () => {
  it("accepts today and past dates", () => {
    expect(validateStartDate(2026, 8, 12, today)).toBeNull();
    expect(validateStartDate(1958, 8, 7, today)).toBeNull();
    expect(validateStartDate(0, 1, 1, today)).toBeNull();
  });

  it("rejects future, bad day, bad year", () => {
    expect(validateStartDate(2026, 8, 13, today)).toBe("future");
    expect(validateStartDate(2026, 2, 31, today)).toBe("invalid_day");
    expect(validateStartDate(-1, 1, 1, today)).toBe("year");
    expect(validateStartDate(2027, 1, 1, today)).toBe("year");
  });

  it("rejects incomplete month/day", () => {
    expect(validateStartDate(2020, 0, 1, today)).toBe("incomplete");
    expect(validateStartDate(2020, 13, 1, today)).toBe("incomplete");
    expect(validateStartDate(2020, 5, 0, today)).toBe("incomplete");
  });
});

describe("calendar helpers", () => {
  it("isValidCalendarDay", () => {
    expect(isValidCalendarDay(2024, 2, 29)).toBe(true);
    expect(isValidCalendarDay(2023, 2, 29)).toBe(false);
  });

  it("isYearMonthNotFuture / isDaySelectable", () => {
    expect(isYearMonthNotFuture(2026, 8, today)).toBe(true);
    expect(isYearMonthNotFuture(2026, 9, today)).toBe(false);
    expect(isDaySelectable(2026, 8, 12, today)).toBe(true);
    expect(isDaySelectable(2026, 8, 13, today)).toBe(false);
  });
});
