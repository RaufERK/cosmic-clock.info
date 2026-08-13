import { describe, expect, it } from "vitest";
import { GUEST_EXAMPLE_SEED } from "@/lib/cards";
import { shouldReportGuestCardCreate } from "@/lib/guest-card-stats";

describe("shouldReportGuestCardCreate", () => {
  it("skips the Summit seed date", () => {
    expect(shouldReportGuestCardCreate(GUEST_EXAMPLE_SEED)).toBe(false);
  });

  it("allows a real guest create", () => {
    expect(
      shouldReportGuestCardCreate({ year: 1995, month: 5, day: 15 }),
    ).toBe(true);
  });
});
