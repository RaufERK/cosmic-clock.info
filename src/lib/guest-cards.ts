import {
  GUEST_EXAMPLE_SEED,
  assignSortIndexFromCreatedAt,
  nextSortIndex,
  parseCardSortOrder,
  sortCardsBySortIndex,
  type CardData,
  type CardSortOrder,
} from "@/lib/cards";
import { validateStartDate } from "@/lib/start-date";

const STORAGE_KEY = "cosmic-clock:guest-cards";
const SORT_STORAGE_KEY = "cosmic-clock:card-sort-order";

export type LocalCard = CardData & {
  sortIndex: number;
  createdAt: string;
  updatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function isLocalCard(value: unknown): value is Omit<LocalCard, "sortIndex"> & {
  sortIndex?: number;
} {
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
  // Legacy guest rows may lack createdAt / sortIndex — normalize below.
  return true;
}

function readLegacySortOrder(): CardSortOrder {
  if (typeof window === "undefined") return "newest";
  try {
    return parseCardSortOrder(window.localStorage.getItem(SORT_STORAGE_KEY));
  } catch {
    return "newest";
  }
}

function normalizeLocalCard(value: unknown): Omit<LocalCard, "sortIndex"> & {
  sortIndex?: number;
} | null {
  if (!isLocalCard(value)) return null;
  const createdAt =
    typeof (value as { createdAt?: unknown }).createdAt === "string"
      ? (value as LocalCard).createdAt
      : value.updatedAt;
  const sortIndexRaw = (value as { sortIndex?: unknown }).sortIndex;
  const sortIndex =
    typeof sortIndexRaw === "number" && Number.isInteger(sortIndexRaw)
      ? sortIndexRaw
      : undefined;
  return {
    id: value.id,
    name: value.name,
    day: value.day,
    month: value.month,
    year: value.year,
    createdAt,
    updatedAt: value.updatedAt,
    ...(sortIndex !== undefined ? { sortIndex } : {}),
  };
}

function ensureSortIndex(
  cards: Array<Omit<LocalCard, "sortIndex"> & { sortIndex?: number }>,
): LocalCard[] {
  const missing = cards.some((c) => typeof c.sortIndex !== "number");
  if (!missing) {
    return sortCardsBySortIndex(cards as LocalCard[]);
  }
  return assignSortIndexFromCreatedAt(cards, readLegacySortOrder());
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
    const normalized = parsed
      .map(normalizeLocalCard)
      .filter(
        (c): c is Omit<LocalCard, "sortIndex"> & { sortIndex?: number } =>
          c !== null,
      );
    const withIndex = ensureSortIndex(normalized);
    const hadMissing = normalized.some((c) => typeof c.sortIndex !== "number");
    if (hadMissing) writeGuestCards(withIndex);
    return withIndex;
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
      sortIndex: 0,
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
    sortIndex: nextSortIndex(cards),
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
          // sortIndex and createdAt unchanged — user order stays stable on edit
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

export function reorderGuestCards(
  cards: LocalCard[],
  orderedIds: string[],
): LocalCard[] | "invalid" {
  if (orderedIds.length !== cards.length) return "invalid";
  const byId = new Map(cards.map((c) => [c.id, c]));
  const next: LocalCard[] = [];
  for (const [index, id] of orderedIds.entries()) {
    const card = byId.get(id);
    if (!card) return "invalid";
    next.push({ ...card, sortIndex: index });
  }
  writeGuestCards(next);
  return next;
}
