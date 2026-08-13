import { describe, expect, it } from "vitest";
import {
  GUEST_EXAMPLE_SEED,
  assignSortIndexFromCreatedAt,
  isGuestExampleSeedDate,
  moveCardInList,
  nextSortIndex,
  parseCardSortOrder,
  sortCardsByCreatedAt,
  sortCardsBySortIndex,
  withDenseSortIndex,
} from "@/lib/cards";

describe("guest seed date", () => {
  it("matches Summit seed only", () => {
    expect(isGuestExampleSeedDate(GUEST_EXAMPLE_SEED)).toBe(true);
    expect(
      isGuestExampleSeedDate({ year: 1958, month: 8, day: 8 }),
    ).toBe(false);
  });
});

describe("sortCardsByCreatedAt", () => {
  const a = { id: "a", createdAt: "2024-01-01T00:00:00.000Z" };
  const b = { id: "b", createdAt: "2024-06-01T00:00:00.000Z" };
  const c = { id: "c", createdAt: "2025-01-01T00:00:00.000Z" };

  it("newest first by default", () => {
    expect(sortCardsByCreatedAt([a, c, b]).map((x) => x.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("oldest first when asked", () => {
    expect(
      sortCardsByCreatedAt([a, c, b], "oldest").map((x) => x.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("falls back to updatedAt when createdAt missing", () => {
    const old = { id: "old", updatedAt: "2020-01-01T00:00:00.000Z" };
    const neu = { id: "new", updatedAt: "2023-01-01T00:00:00.000Z" };
    expect(sortCardsByCreatedAt([old, neu], "newest").map((x) => x.id)).toEqual([
      "new",
      "old",
    ]);
  });
});

describe("parseCardSortOrder", () => {
  it("parses known values and falls back", () => {
    expect(parseCardSortOrder("oldest")).toBe("oldest");
    expect(parseCardSortOrder("nope")).toBe("newest");
    expect(parseCardSortOrder(null, "oldest")).toBe("oldest");
  });
});

describe("user order (sortIndex)", () => {
  it("sorts by sortIndex then id", () => {
    const cards = [
      { id: "b", sortIndex: 2 },
      { id: "a", sortIndex: 0 },
      { id: "c", sortIndex: 1 },
    ];
    expect(sortCardsBySortIndex(cards).map((x) => x.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("nextSortIndex appends after the current max", () => {
    expect(nextSortIndex([])).toBe(0);
    expect(nextSortIndex([{ sortIndex: 0 }, { sortIndex: 4 }])).toBe(5);
  });

  it("moveCardInList then dense indices matches drag to a new slot", () => {
    const cards = [
      { id: "a", sortIndex: 0 },
      { id: "b", sortIndex: 1 },
      { id: "c", sortIndex: 2 },
    ];
    const moved = withDenseSortIndex(moveCardInList(cards, 0, 2));
    expect(moved.map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(moved.map((x) => x.sortIndex)).toEqual([0, 1, 2]);
  });

  it("assignSortIndexFromCreatedAt preserves newest-first on-screen order", () => {
    const a = { id: "a", createdAt: "2024-01-01T00:00:00.000Z" };
    const b = { id: "b", createdAt: "2024-06-01T00:00:00.000Z" };
    const c = { id: "c", createdAt: "2025-01-01T00:00:00.000Z" };
    expect(
      assignSortIndexFromCreatedAt([a, c, b]).map((x) => x.id),
    ).toEqual(["c", "b", "a"]);
    expect(
      assignSortIndexFromCreatedAt([a, c, b], "oldest").map((x) => x.id),
    ).toEqual(["a", "b", "c"]);
  });
});
