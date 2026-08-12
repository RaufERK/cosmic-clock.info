import { describe, expect, it } from "vitest";
import { MAX_CARDS_PER_USER } from "@/lib/cards";
import { mergeCardsByDate, type MergeCard } from "@/lib/card-merge";

function card(
  partial: Partial<MergeCard> &
    Pick<MergeCard, "name" | "day" | "month" | "year" | "updatedAt">,
): MergeCard {
  return { ...partial };
}

describe("mergeCardsByDate", () => {
  it("keeps distinct dates and counts no merges", () => {
    const result = mergeCardsByDate(
      [
        card({
          id: "db1",
          name: "A",
          day: 1,
          month: 1,
          year: 2000,
          updatedAt: new Date("2020-01-01"),
        }),
      ],
      [
        card({
          name: "B",
          day: 2,
          month: 1,
          year: 2000,
          updatedAt: new Date("2020-02-01"),
        }),
      ],
    );
    expect(result.cards).toHaveLength(2);
    expect(result.mergedDates).toBe(0);
    expect(result.truncated).toBe(0);
  });

  it("same date: newer updatedAt wins name and keeps DB id", () => {
    const result = mergeCardsByDate(
      [
        card({
          id: "db-old",
          name: "DB name",
          day: 7,
          month: 8,
          year: 1990,
          updatedAt: new Date("2020-01-01"),
        }),
      ],
      [
        card({
          name: "Local newer",
          day: 7,
          month: 8,
          year: 1990,
          updatedAt: new Date("2024-01-01"),
        }),
      ],
    );
    expect(result.mergedDates).toBe(1);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.name).toBe("Local newer");
    expect(result.cards[0]?.id).toBe("db-old");
  });

  it("same date: older local does not overwrite DB name", () => {
    const result = mergeCardsByDate(
      [
        card({
          id: "db",
          name: "Fresh DB",
          day: 1,
          month: 5,
          year: 2010,
          updatedAt: new Date("2025-01-01"),
        }),
      ],
      [
        card({
          name: "Stale local",
          day: 1,
          month: 5,
          year: 2010,
          updatedAt: new Date("2020-01-01"),
        }),
      ],
    );
    expect(result.cards[0]?.name).toBe("Fresh DB");
    expect(result.cards[0]?.id).toBe("db");
  });

  it(`truncates to ${MAX_CARDS_PER_USER} newest by updatedAt`, () => {
    const dbCards: MergeCard[] = [];
    for (let i = 0; i < MAX_CARDS_PER_USER + 5; i++) {
      dbCards.push(
        card({
          id: `id-${i}`,
          name: `C${i}`,
          day: (i % 28) + 1,
          month: (i % 12) + 1,
          year: 1900 + Math.floor(i / 12),
          updatedAt: new Date(2000, 0, 1 + i),
        }),
      );
    }
    const result = mergeCardsByDate(dbCards, []);
    expect(result.cards).toHaveLength(MAX_CARDS_PER_USER);
    expect(result.truncated).toBe(5);
    // Newest updatedAt first
    expect(result.cards[0]?.name).toBe(`C${MAX_CARDS_PER_USER + 4}`);
  });
});
