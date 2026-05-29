// In-memory fixed-window rate limiter. No external dependency. Per-process, so on
// serverless it resets on cold start and isn't shared across instances — adequate
// as a demo abuse guard, NOT a hard cost ceiling. The real ceiling is the OpenAI
// account usage limit. For production, swap in Upstash/Redis.

type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();

// Coarse global per-process counter as a soft daily cap (also resets on cold start).
let globalCount = 0;
let globalResetAt = 0;
const GLOBAL_LIMIT = 500; // requests per window
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Stable-ish caller key from forwarded IP headers. */
export function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  const ip = xff?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip;
}

/**
 * Returns true if the request is allowed, false if the caller (or the process
 * globally) has exceeded the limit.
 */
export function checkRateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): boolean {
  const now = Date.now();

  // Global soft cap.
  if (now > globalResetAt) {
    globalCount = 0;
    globalResetAt = now + GLOBAL_WINDOW_MS;
  }
  if (globalCount >= GLOBAL_LIMIT) return false;

  // Per-key window.
  const w = buckets.get(key);
  if (!w || now > w.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    globalCount += 1;
    return true;
  }
  if (w.count >= limit) return false;
  w.count += 1;
  globalCount += 1;
  return true;
}
