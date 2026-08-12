import { describe, expect, it } from "vitest";
import {
  GUEST_EXAMPLE_SEED,
  isGuestExampleSeedDate,
  parseCardSortOrder,
  sortCardsByCreatedAt,
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
