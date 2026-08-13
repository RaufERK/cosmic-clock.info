import { afterEach, describe, expect, it } from "vitest";
import {
  STAT_RATE_LIMIT_MAX,
  STAT_RATE_LIMIT_WINDOW_MS,
  consumeStatAttempt,
  resetStatRateLimitForTests,
} from "@/lib/stat-rate-limit";

afterEach(() => {
  resetStatRateLimitForTests();
});

describe("consumeStatAttempt", () => {
  it(`allows ${STAT_RATE_LIMIT_MAX} attempts then blocks`, () => {
    const key = "stat:1.2.3.4";
    const t0 = 1_000_000;

    for (let i = 0; i < STAT_RATE_LIMIT_MAX; i += 1) {
      expect(consumeStatAttempt(key, t0 + i).ok).toBe(true);
    }

    const blocked = consumeStatAttempt(key, t0 + STAT_RATE_LIMIT_MAX);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("expires hits after the window", () => {
    const key = "stat:9.9.9.9";
    const t0 = 3_000_000;
    for (let i = 0; i < STAT_RATE_LIMIT_MAX; i += 1) {
      consumeStatAttempt(key, t0);
    }
    expect(consumeStatAttempt(key, t0 + 1).ok).toBe(false);

    const later = t0 + STAT_RATE_LIMIT_WINDOW_MS + 1;
    expect(consumeStatAttempt(key, later).ok).toBe(true);
  });
});
