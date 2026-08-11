import {
  daysInMonth,
  todayCivil,
  type CivilDate,
} from "@/lib/cosmic-clock-math";

export type StartDateError = "incomplete" | "invalid_day" | "year" | "future";

/** Compare civil dates: -1 if a < b, 0 if equal, 1 if a > b. */
export function compareCivilDate(a: CivilDate, b: CivilDate): number {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  return 0;
}

export function isValidCalendarDay(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

/**
 * Start-date doctrine: year >= 0, valid calendar day, date <= today.
 * Returns null when valid.
 */
export function validateStartDate(
  year: number,
  month: number,
  day: number,
  asOf: CivilDate = todayCivil(),
): StartDateError | null {
  if (!Number.isInteger(year) || year < 0 || year > asOf.year) {
    return "year";
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "incomplete";
  }
  if (!Number.isInteger(day) || day < 1) {
    return "incomplete";
  }
  if (day > daysInMonth(year, month)) {
    return "invalid_day";
  }
  if (compareCivilDate({ year, month, day }, asOf) > 0) {
    return "future";
  }
  return null;
}

/** True if year/month (without day) is not after asOf's year/month. */
export function isYearMonthNotFuture(
  year: number,
  month: number,
  asOf: CivilDate = todayCivil(),
): boolean {
  if (year < asOf.year) return true;
  if (year > asOf.year) return false;
  return month <= asOf.month;
}

/** True if the civil day is selectable (exists and not after asOf). */
export function isDaySelectable(
  year: number,
  month: number,
  day: number,
  asOf: CivilDate = todayCivil(),
): boolean {
  if (!isValidCalendarDay(year, month, day)) return false;
  return compareCivilDate({ year, month, day }, asOf) <= 0;
}
