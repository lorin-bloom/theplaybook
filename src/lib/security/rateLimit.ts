/** Simple in-memory fixed-window rate limiter (per process). Use Redis for multi-instance deployments. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export class RateLimitError extends Error {}

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) {
    const secs = Math.ceil((b.resetAt - now) / 1000);
    throw new RateLimitError(`Too many requests. Try again in ${secs}s.`);
  }
}
