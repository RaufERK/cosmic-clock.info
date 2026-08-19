/**
 * In-memory auth attempt limiter (single Node process / PM2 fork).
 * Key = `auth:${ip}` from getClientIp(). Resets on process restart.
 */

export function authRateKey(ip: string): string {
  return `auth:${ip}`;
}

export const AUTH_RATE_LIMIT_MAX = 10;
export const AUTH_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type Bucket = {
  /** Successful consumption timestamps within the window. */
  hits: number[];
};

const buckets = new Map<string, Bucket>();

function prune(hits: number[], now: number): number[] {
  const cutoff = now - AUTH_RATE_LIMIT_WINDOW_MS;
  return hits.filter((t) => t > cutoff);
}

export type AuthRateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/** Record one attempt. Returns blocked if over the limit. */
export function consumeAuthAttempt(
  key: string,
  now = Date.now(),
): AuthRateLimitResult {
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = prune(bucket.hits, now);

  if (bucket.hits.length >= AUTH_RATE_LIMIT_MAX) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + AUTH_RATE_LIMIT_WINDOW_MS - now) / 1000),
    );
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: AUTH_RATE_LIMIT_MAX - bucket.hits.length,
  };
}

/** True when the next consume would be blocked. Does not record a hit. */
export function isAuthRateLimited(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  return prune(bucket.hits, now).length >= AUTH_RATE_LIMIT_MAX;
}

/** Clear after successful login/register (same IP can try again freely). */
export function clearAuthAttempts(key: string): void {
  buckets.delete(key);
}

/** Test helper — empty all buckets. */
export function resetAuthRateLimitForTests(): void {
  buckets.clear();
}
