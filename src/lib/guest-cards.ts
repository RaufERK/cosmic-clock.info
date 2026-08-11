import {
  GUEST_EXAMPLE_SEED,
  type CardData,
} from "@/lib/cards";
import { validateStartDate } from "@/lib/start-date";

const STORAGE_KEY = "cosmic-clock:guest-cards";

export type LocalCard = CardData & {
  createdAt: string;
  updatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function isLocalCard(value: unknown): value is LocalCard {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  if (
    typeof c.id !== "string" ||
    typeof c.name !== "string" ||
    typeof c.day !== "number" ||
    typeof c.month !== "number" ||
    typeof c.year !== "number" ||
    typeof c.updatedAt !== "string"
  ) {
    return false;
  }
  // Legacy guest rows may lack createdAt — normalize below.
  return true;
}

function normalizeLocalCard(value: unknown): LocalCard | null {
  if (!isLocalCard(value)) return null;
  const createdAt =
    typeof (value as { createdAt?: unknown }).createdAt === "string"
      ? (value as LocalCard).createdAt
      : value.updatedAt;
  return {
    id: value.id,
    name: value.name,
    day: value.day,
    month: value.month,
    year: value.year,
    createdAt,
    updatedAt: value.updatedAt,
  };
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
    return parsed
      .map(normalizeLocalCard)
      .filter((c): c is LocalCard => c !== null);
  } catch {
    return [];
  }
}

export function writeGuestCards(cards: LocalCard[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/**
 * After sync (or any signed-in visit): keep an empty list in storage.
 * Do NOT remove the key — otherwise logout looks like a first visit and re-seeds Summit.
 */
export function clearGuestCards(): void {
  writeGuestCards([]);
}

/**
 * First visit only (no storage key yet): seed Summit example.
 * Empty array `[]` means the user already used this device as guest / signed in — no re-seed.
 */
export function loadOrSeedGuestCards(exampleName: string): LocalCard[] {
  if (hasGuestStorage()) {
    return readGuestCards();
  }
  const stamped = nowIso();
  const seeded: LocalCard[] = [
    {
      id: GUEST_EXAMPLE_SEED.id,
      name: exampleName,
      day: GUEST_EXAMPLE_SEED.day,
      month: GUEST_EXAMPLE_SEED.month,
      year: GUEST_EXAMPLE_SEED.year,
      createdAt: stamped,
      updatedAt: stamped,
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
  const key = `${year}-${month}-${day}`;
  return cards.some(
    (c) =>
      `${c.year}-${c.month}-${c.day}` === key &&
      (!exceptId || c.id !== exceptId),
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
  const stamped = nowIso();
  const next: LocalCard = {
    id: `local-${crypto.randomUUID()}`,
    name: data.name.trim(),
    day: data.day,
    month: data.month,
    year: data.year,
    createdAt: stamped,
    updatedAt: stamped,
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
          // createdAt intentionally unchanged — sort stays stable on edit
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
