import type { CardFormValues } from "@/components/CardForm";

export type CardData = CardFormValues & {
  id: string;
  /** User-facing list order (0 = first). New cards go to the end. */
  sortIndex: number;
  /** ISO timestamp of card creation; audit only — not UI order. */
  createdAt?: string;
  /** ISO timestamp; used for merge freshness (localStorage + DB). */
  updatedAt?: string;
};

/** @deprecated Legacy guest/user preference; used only to backfill sortIndex once. */
export type CardSortOrder = "newest" | "oldest";

export function isCardSortOrder(value: unknown): value is CardSortOrder {
  return value === "newest" || value === "oldest";
}

export function parseCardSortOrder(
  value: unknown,
  fallback: CardSortOrder = "newest",
): CardSortOrder {
  return isCardSortOrder(value) ? value : fallback;
}

/** Single guest seed: The Summit Lighthouse founded 7 Aug 1958. Name from i18n. */
export const GUEST_EXAMPLE_SEED = {
  id: "example-summit",
  day: 7,
  month: 8,
  year: 1958,
} as const;

export const MAX_CARDS_PER_USER = 100;

export function isExampleCardId(id: string): boolean {
  return id.startsWith("example-");
}

/** Guest demo date only — never migrate into a signed-in account. */
export function isGuestExampleSeedDate(card: {
  year: number;
  month: number;
  day: number;
}): boolean {
  return (
    card.year === GUEST_EXAMPLE_SEED.year &&
    card.month === GUEST_EXAMPLE_SEED.month &&
    card.day === GUEST_EXAMPLE_SEED.day
  );
}

export function cardDateKey(card: {
  year: number;
  month: number;
  day: number;
}): string {
  return `${card.year}-${card.month}-${card.day}`;
}

/** Milliseconds for display sort; missing createdAt falls back to updatedAt, then 0. */
export function cardCreatedAtMs(card: {
  createdAt?: string;
  updatedAt?: string;
}): number {
  const raw = card.createdAt ?? card.updatedAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? 0 : ms;
}

/** Display order by card creation time (not start date). Edits must not change createdAt. */
export function compareCardsByCreatedAt(
  a: { createdAt?: string; updatedAt?: string },
  b: { createdAt?: string; updatedAt?: string },
): number {
  return cardCreatedAtMs(a) - cardCreatedAtMs(b);
}

export function sortCardsByCreatedAt<
  T extends { createdAt?: string; updatedAt?: string },
>(cards: T[], order: CardSortOrder = "newest"): T[] {
  const sorted = [...cards].sort(compareCardsByCreatedAt);
  return order === "newest" ? sorted.reverse() : sorted;
}

export function sortCardsBySortIndex<T extends { sortIndex: number; id?: string }>(
  cards: T[],
): T[] {
  return [...cards].sort((a, b) => {
    if (a.sortIndex !== b.sortIndex) return a.sortIndex - b.sortIndex;
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
}

export function nextSortIndex(cards: { sortIndex: number }[]): number {
  if (cards.length === 0) return 0;
  return Math.max(...cards.map((c) => c.sortIndex)) + 1;
}

export function withDenseSortIndex<T extends { sortIndex: number }>(
  cards: T[],
): T[] {
  return cards.map((card, index) => ({ ...card, sortIndex: index }));
}

export function moveCardInList<T>(cards: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= cards.length ||
    to >= cards.length
  ) {
    return cards;
  }
  const next = [...cards];
  const [card] = next.splice(from, 1);
  if (card === undefined) return cards;
  next.splice(to, 0, card);
  return next;
}

/** One-time: number cards as they appeared under the old createdAt sort. */
export function assignSortIndexFromCreatedAt<
  T extends { createdAt?: string; updatedAt?: string },
>(cards: T[], order: CardSortOrder = "newest"): Array<T & { sortIndex: number }> {
  return sortCardsByCreatedAt(cards, order).map((card, index) => ({
    ...card,
    sortIndex: index,
  }));
}

/** Display order: older start dates first. */
export function compareCardsByStartDate(
  a: { year: number; month: number; day: number },
  b: { year: number; month: number; day: number },
): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function sortCardsByStartDate<
  T extends { year: number; month: number; day: number },
>(cards: T[]): T[] {
  return [...cards].sort(compareCardsByStartDate);
}
