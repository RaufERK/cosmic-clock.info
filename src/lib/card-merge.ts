import { MAX_CARDS_PER_USER, cardDateKey } from "@/lib/cards";

export type MergeCard = {
  name: string;
  day: number;
  month: number;
  year: number;
  updatedAt: Date;
  /** Present for existing DB rows. */
  id?: string;
  /** Present for existing DB rows; kept on date merge so the card does not move. */
  sortIndex?: number;
};

export type MergeSummary = {
  cards: MergeCard[];
  mergedDates: number;
  truncated: number;
};

/**
 * One start date → one card. Newer updatedAt wins the name (and keeps DB id + sortIndex).
 * Then keep at most MAX_CARDS_PER_USER newest by updatedAt.
 * Surviving DB cards keep relative user order; new local dates append at the end.
 */
export function mergeCardsByDate(
  dbCards: MergeCard[],
  localCards: MergeCard[],
): MergeSummary {
  const byDate = new Map<string, MergeCard>();
  let mergedDates = 0;

  function consider(card: MergeCard) {
    const key = cardDateKey(card);
    const existing = byDate.get(key);
    if (!existing) {
      byDate.set(key, { ...card });
      return;
    }
    mergedDates += 1;
    const existingNewer =
      existing.updatedAt.getTime() >= card.updatedAt.getTime();
    const sortIndex = existing.sortIndex ?? card.sortIndex;
    if (existingNewer) {
      byDate.set(key, {
        ...existing,
        id: existing.id ?? card.id,
        sortIndex,
      });
      return;
    }
    byDate.set(key, {
      ...card,
      id: existing.id ?? card.id,
      sortIndex,
      name: card.name,
      updatedAt: card.updatedAt,
    });
  }

  for (const card of dbCards) consider(card);
  // Strip guest sortIndex so new dates append; same-date merges keep DB index.
  for (const card of localCards) {
    consider({ ...card, sortIndex: undefined });
  }

  const all = [...byDate.values()].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  const truncated = Math.max(0, all.length - MAX_CARDS_PER_USER);
  const kept = all.slice(0, MAX_CARDS_PER_USER);

  const dbIds = new Set(
    dbCards.map((c) => c.id).filter((id): id is string => Boolean(id)),
  );

  const localKeyOrder = localCards.map((c) => cardDateKey(c));
  const existing = kept
    .filter((c) => c.id !== undefined && dbIds.has(c.id))
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
  const newcomers = kept
    .filter((c) => !c.id || !dbIds.has(c.id))
    .sort(
      (a, b) =>
        localKeyOrder.indexOf(cardDateKey(a)) -
        localKeyOrder.indexOf(cardDateKey(b)),
    );

  const cards = [...existing, ...newcomers].map((card, index) => ({
    ...card,
    sortIndex: index,
  }));

  return { cards, mergedDates, truncated };
}
