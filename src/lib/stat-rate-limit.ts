/**
 * In-memory limiter for public stats POSTs (single Node process / PM2 fork).
 * Tighter than login: guests can create several cards; bots should not flood.
 */

export const STAT_RATE_LIMIT_MAX = 30;
export const STAT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();

function prune(hits: number[], now: number): number[] {
  const cutoff = now - STAT_RATE_LIMIT_WINDOW_MS;
  return hits.filter((t) => t > cutoff);
}

export type StatRateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function consumeStatAttempt(
  key: string,
  now = Date.now(),
): StatRateLimitResult {
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = prune(bucket.hits, now);

  if (bucket.hits.length >= STAT_RATE_LIMIT_MAX) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + STAT_RATE_LIMIT_WINDOW_MS - now) / 1000),
    );
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: STAT_RATE_LIMIT_MAX - bucket.hits.length,
  };
}

/** Test helper — empty all buckets. */
export function resetStatRateLimitForTests(): void {
  buckets.clear();
}
