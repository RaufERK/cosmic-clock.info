/** Date → cosmic clock hand rotations (degrees). Matches CCLOCK prototype. */

export function yearHandRotation(year: number): number {
  return (year % 100) * 3.6;
}

export function monthHandRotation(month: number): number {
  return (month - 1) * 30;
}

export function dayHandRotation(day: number): number {
  return (day - 1) * (360 / 31);
}

export function getSector(rotation: number): number {
  return Math.floor((((rotation % 360) + 360) % 360) / 30);
}

/** Map rotation to clock face hour 1–12 (sector 0 → 12). */
export function getHandHour(rotation: number): number {
  const sector = getSector(rotation);
  return sector === 0 ? 12 : sector;
}
