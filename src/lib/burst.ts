// Burst limiter — VOL-05 §5 (LOCKED contract, D-07 delta on storage).
// Spec storage is KV BURST with a 10 s TTL; until a deployment target is
// chosen (D-07), the sliding window lives in an in-process Map with the same
// semantics: 10 requests / 10 seconds per bearer or session.
// Decision recorded in docs/decisions.md (D-07 environment delta).

const WINDOW_MS = 10_000;
const MAX_REQUESTS = 10;

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Bound memory: drop stale buckets opportunistically.
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

/**
 * Consume one slot for `key`. Returns null when allowed, or the number of
 * seconds until the window frees a slot (drives `Retry-After`).
 */
export function burstCheck(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);

  if (bucket.hits.length >= MAX_REQUESTS) {
    const oldest = bucket.hits[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    buckets.set(key, bucket);
    return { ok: false, retryAfter };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true };
}
