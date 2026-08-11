import { MAX_CARDS_PER_USER, cardDateKey } from "@/lib/cards";

export type MergeCard = {
  name: string;
  day: number;
  month: number;
  year: number;
  updatedAt: Date;
  /** Present for existing DB rows. */
  id?: string;
};

export type MergeSummary = {
  cards: MergeCard[];
  mergedDates: number;
  truncated: number;
};

/**
 * One start date → one card. Newer updatedAt wins the name (and keeps DB id if any).
 * Then keep at most MAX_CARDS_PER_USER newest by updatedAt.
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
    if (existingNewer) {
      byDate.set(key, {
        ...existing,
        id: existing.id ?? card.id,
      });
      return;
    }
    byDate.set(key, {
      ...card,
      id: existing.id ?? card.id,
      name: card.name,
      updatedAt: card.updatedAt,
    });
  }

  for (const card of dbCards) consider(card);
  for (const card of localCards) consider(card);

  const all = [...byDate.values()].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  const truncated = Math.max(0, all.length - MAX_CARDS_PER_USER);
  const cards = all.slice(0, MAX_CARDS_PER_USER);

  return { cards, mergedDates, truncated };
}
