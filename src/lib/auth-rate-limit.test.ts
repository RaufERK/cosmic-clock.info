import { afterEach, describe, expect, it } from "vitest";
import {
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_MS,
  authRateKey,
  clearAuthAttempts,
  consumeAuthAttempt,
  isAuthRateLimited,
  resetAuthRateLimitForTests,
} from "@/lib/auth-rate-limit";

afterEach(() => {
  resetAuthRateLimitForTests();
});

describe("consumeAuthAttempt", () => {
  it(`allows ${AUTH_RATE_LIMIT_MAX} attempts then blocks`, () => {
    const key = "auth:1.2.3.4";
    const t0 = 1_000_000;

    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      const r = consumeAuthAttempt(key, t0 + i);
      expect(r.ok).toBe(true);
    }

    const blocked = consumeAuthAttempt(key, t0 + AUTH_RATE_LIMIT_MAX);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("clears after success so attempts resume", () => {
    const key = "auth:5.6.7.8";
    const t0 = 2_000_000;
    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      consumeAuthAttempt(key, t0 + i);
    }
    expect(consumeAuthAttempt(key, t0 + 50).ok).toBe(false);

    clearAuthAttempts(key);
    expect(consumeAuthAttempt(key, t0 + 51).ok).toBe(true);
  });

  it("expires hits after the window", () => {
    const key = "auth:9.9.9.9";
    const t0 = 3_000_000;
    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      consumeAuthAttempt(key, t0);
    }
    expect(consumeAuthAttempt(key, t0 + 1).ok).toBe(false);

    const later = t0 + AUTH_RATE_LIMIT_WINDOW_MS + 1;
    expect(consumeAuthAttempt(key, later).ok).toBe(true);
  });

  it("isolates keys by IP", () => {
    const t0 = 4_000_000;
    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      consumeAuthAttempt("auth:a", t0);
    }
    expect(consumeAuthAttempt("auth:a", t0 + 1).ok).toBe(false);
    expect(consumeAuthAttempt("auth:b", t0 + 1).ok).toBe(true);
  });
});

describe("isAuthRateLimited", () => {
  it("is false until the window is full, then true without consuming", () => {
    const key = authRateKey("10.0.0.1");
    const t0 = 5_000_000;
    expect(isAuthRateLimited(key, t0)).toBe(false);

    for (let i = 0; i < AUTH_RATE_LIMIT_MAX; i++) {
      consumeAuthAttempt(key, t0 + i);
    }

    expect(isAuthRateLimited(key, t0 + AUTH_RATE_LIMIT_MAX)).toBe(true);
    expect(isAuthRateLimited(key, t0 + AUTH_RATE_LIMIT_MAX)).toBe(true);
    expect(consumeAuthAttempt(key, t0 + AUTH_RATE_LIMIT_MAX).ok).toBe(false);
  });
});
