import { describe, expect, it } from "vitest";
import { isJwtInvalidatedByPasswordChange } from "@/lib/session-invalidation";

describe("isJwtInvalidatedByPasswordChange", () => {
  it("keeps sessions when the password was never changed", () => {
    expect(isJwtInvalidatedByPasswordChange(1_700_000_000, null)).toBe(false);
    expect(isJwtInvalidatedByPasswordChange(undefined, null)).toBe(false);
  });

  it("drops tokens issued before the password change", () => {
    const changedAt = new Date("2026-08-19T12:00:10.400Z");
    const changedSec = Math.floor(changedAt.getTime() / 1000);
    expect(
      isJwtInvalidatedByPasswordChange(changedSec - 1, changedAt),
    ).toBe(true);
  });

  it("keeps a token re-issued in the same second as the change", () => {
    const changedAt = new Date("2026-08-19T12:00:10.400Z");
    const changedSec = Math.floor(changedAt.getTime() / 1000);
    expect(isJwtInvalidatedByPasswordChange(changedSec, changedAt)).toBe(
      false,
    );
  });

  it("drops tokens that have no iat after a password change", () => {
    expect(
      isJwtInvalidatedByPasswordChange(
        undefined,
        new Date("2026-08-19T12:00:10.400Z"),
      ),
    ).toBe(true);
  });
});
