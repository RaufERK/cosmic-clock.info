/** Cosmic Clock hand math — Elizabeth & Mark Prophet theory.
 *  See docs/CLOCK_MATH.md. No ephemeris: start date → asOf only.
 */

export type CivilDate = {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
};

export type HandRotations = {
  /** Year hand degrees (0 = 12 o'clock). Cycle: 12 years. */
  year: number;
  /** Month hand degrees. Cycle: 12 months. */
  month: number;
  /** Day hand degrees. Cycle: 1 month-segment. */
  day: number;
  yearsElapsed: number;
  monthsElapsed: number;
  monthFraction: number;
};

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function clampDay(year: number, month: number, day: number): number {
  return Math.min(Math.max(1, day), daysInMonth(year, month));
}

export function civilDate(
  year: number,
  month: number,
  day: number,
): CivilDate {
  return { year, month, day: clampDay(year, month, day) };
}

export function todayCivil(now = new Date()): CivilDate {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function toUtcNoonMs(date: CivilDate): number {
  return Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0);
}

export function compareCivil(a: CivilDate, b: CivilDate): number {
  return toUtcNoonMs(a) - toUtcNoonMs(b);
}

export function addMonths(start: CivilDate, months: number): CivilDate {
  const zeroBased = start.month - 1 + months;
  const year = start.year + Math.floor(zeroBased / 12);
  const month = ((zeroBased % 12) + 12) % 12 + 1;
  return civilDate(year, month, start.day);
}

function addYears(start: CivilDate, years: number): CivilDate {
  return civilDate(start.year + years, start.month, start.day);
}

function segmentFraction(
  last: CivilDate,
  next: CivilDate,
  asOf: CivilDate,
): number {
  const lastMs = toUtcNoonMs(last);
  const nextMs = toUtcNoonMs(next);
  const asOfMs = toUtcNoonMs(asOf);
  const span = nextMs - lastMs;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (asOfMs - lastMs) / span));
}

/** Fractional years since start (anniversary-based). */
export function yearsElapsed(start: CivilDate, asOf: CivilDate): number {
  if (compareCivil(asOf, start) <= 0) return 0;

  let years = asOf.year - start.year;
  let last = addYears(start, years);
  if (compareCivil(last, asOf) > 0) {
    years -= 1;
    last = addYears(start, years);
  }
  if (years < 0) return 0;

  const next = addYears(start, years + 1);
  return years + segmentFraction(last, next, asOf);
}

/** Fractional months since start (monthly anniversary, day clamped). */
export function monthsElapsed(start: CivilDate, asOf: CivilDate): number {
  if (compareCivil(asOf, start) <= 0) return 0;

  let months =
    (asOf.year - start.year) * 12 + (asOf.month - start.month);
  let last = addMonths(start, months);
  if (compareCivil(last, asOf) > 0) {
    months -= 1;
    last = addMonths(start, months);
  }
  if (months < 0) return 0;

  const next = addMonths(start, months + 1);
  return months + segmentFraction(last, next, asOf);
}

function normalizeDegrees(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Hand rotations for a card start date as of `asOf` (default: today). */
export function computeHandRotations(
  start: CivilDate,
  asOf: CivilDate = todayCivil(),
): HandRotations {
  const years = yearsElapsed(start, asOf);
  const months = monthsElapsed(start, asOf);

  const wholeMonths = Math.floor(months);
  const lastMonthAnn = addMonths(start, wholeMonths);
  const nextMonthAnn = addMonths(start, wholeMonths + 1);
  const monthFraction =
    compareCivil(asOf, start) <= 0
      ? 0
      : segmentFraction(lastMonthAnn, nextMonthAnn, asOf);

  return {
    year: normalizeDegrees((years % 12) * 30),
    month: normalizeDegrees((months % 12) * 30),
    day: normalizeDegrees(monthFraction * 360),
    yearsElapsed: years,
    monthsElapsed: months,
    monthFraction,
  };
}

export function getSector(rotation: number): number {
  return Math.floor(normalizeDegrees(rotation) / 30);
}

/** Index 0–11 for dial sector (0 = 12 o'clock / God Power … 11 = God Victory). */
export function getHandHourIndex(rotation: number): number {
  return getSector(rotation);
}

/** Coarse stage label: sector 0 → 12, else 1–11. */
export function getHandHour(rotation: number): number {
  const sector = getSector(rotation);
  return sector === 0 ? 12 : sector;
}

/** @deprecated Placeholder from Figma prototype — do not use for product math. */
export function yearHandRotation(year: number): number {
  return (year % 100) * 3.6;
}

/** @deprecated Placeholder from Figma prototype — do not use for product math. */
export function monthHandRotation(month: number): number {
  return (month - 1) * 30;
}

/** @deprecated Placeholder from Figma prototype — do not use for product math. */
export function dayHandRotation(day: number): number {
  return (day - 1) * (360 / 31);
}
