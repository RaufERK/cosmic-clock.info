import {
  GUEST_EXAMPLE_SEED,
  type CardData,
  cardDateKey,
} from "@/lib/cards";
import { validateStartDate } from "@/lib/start-date";

const STORAGE_KEY = "cosmic-clock:guest-cards";

export type LocalCard = CardData & { updatedAt: string };

function isLocalCard(value: unknown): value is LocalCard {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.day === "number" &&
    typeof c.month === "number" &&
    typeof c.year === "number" &&
    typeof c.updatedAt === "string"
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

/** True if the storage key was never written (first visit). */
export function hasGuestStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}

export function readGuestCards(): LocalCard[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalCard);
  } catch {
    return [];
  }
}

export function writeGuestCards(cards: LocalCard[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function clearGuestCards(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** First visit only: seed Summit example. Empty array after user deletes is kept. */
export function loadOrSeedGuestCards(exampleName: string): LocalCard[] {
  if (hasGuestStorage()) {
    return readGuestCards();
  }
  const seeded: LocalCard[] = [
    {
      id: GUEST_EXAMPLE_SEED.id,
      name: exampleName,
      day: GUEST_EXAMPLE_SEED.day,
      month: GUEST_EXAMPLE_SEED.month,
      year: GUEST_EXAMPLE_SEED.year,
      updatedAt: nowIso(),
    },
  ];
  writeGuestCards(seeded);
  return seeded;
}

export function guestHasDate(
  cards: LocalCard[],
  year: number,
  month: number,
  day: number,
  exceptId?: string,
): boolean {
  const key = cardDateKey({ year, month, day });
  return cards.some(
    (c) => cardDateKey(c) === key && (!exceptId || c.id !== exceptId),
  );
}

export function addGuestCard(
  cards: LocalCard[],
  data: { name: string; day: number; month: number; year: number },
): LocalCard[] | "duplicate" | "invalid" {
  if (validateStartDate(data.year, data.month, data.day) !== null) {
    return "invalid";
  }
  if (guestHasDate(cards, data.year, data.month, data.day)) {
    return "duplicate";
  }
  const next: LocalCard = {
    id: `local-${crypto.randomUUID()}`,
    name: data.name.trim(),
    day: data.day,
    month: data.month,
    year: data.year,
    updatedAt: nowIso(),
  };
  const updated = [...cards, next];
  writeGuestCards(updated);
  return updated;
}

export function updateGuestCard(
  cards: LocalCard[],
  id: string,
  data: { name: string; day: number; month: number; year: number },
): LocalCard[] | "duplicate" | "invalid" | "not_found" {
  if (validateStartDate(data.year, data.month, data.day) !== null) {
    return "invalid";
  }
  if (guestHasDate(cards, data.year, data.month, data.day, id)) {
    return "duplicate";
  }
  const index = cards.findIndex((c) => c.id === id);
  if (index < 0) return "not_found";
  const updated = cards.map((c) =>
    c.id === id
      ? {
          ...c,
          name: data.name.trim(),
          day: data.day,
          month: data.month,
          year: data.year,
          updatedAt: nowIso(),
        }
      : c,
  );
  writeGuestCards(updated);
  return updated;
}

export function removeGuestCard(cards: LocalCard[], id: string): LocalCard[] {
  const updated = cards.filter((c) => c.id !== id);
  writeGuestCards(updated);
  return updated;
}
