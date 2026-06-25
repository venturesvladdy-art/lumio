/**
 * Minimal in-memory fixed-window rate limiter (Proposal §5 / Phase 6).
 * Single-instance best-effort — fine for one server / low traffic. For real
 * multi-instance serverless protection, swap the store for Upstash Redis
 * (drop-in: same `rateLimit` signature, backed by `INCR`+`EXPIRE`).
 */

interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

/** Returns true if the action is allowed; false if the window limit is exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/** Best-effort client IP from common proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}
