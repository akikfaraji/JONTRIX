// Per-IP sliding-window rate limit for unauthenticated MCP routes —
// VOL-10 §4.2 (20 issue-requests/minute/IP) and §8.4 (poll ≤ 20/min/IP).
// In-process adaptation (D-07 ENV-2 pattern): same semantics, swaps to
// real KV at deploy.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

const buckets = new Map<string, number[]>();

function sweep(now: number): void {
  if (buckets.size < 5_000) return;
  for (const [key, hits] of buckets) {
    const alive = hits.filter((t) => now - t < WINDOW_MS);
    if (alive.length === 0) buckets.delete(key);
    else buckets.set(key, alive);
  }
}

export function ipLimit(ip: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((hits[0] + WINDOW_MS - now) / 1000));
    buckets.set(ip, hits);
    return { ok: false, retryAfter };
  }
  hits.push(now);
  buckets.set(ip, hits);
  return { ok: true };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}
