// In-memory sliding-window rate limiter keyed by the first 8 characters of an API key.
//
// IMPORTANT: This is a per-process store. On Vercel (and other serverless platforms),
// each function invocation may run in a separate cold-started process, so this limiter
// does NOT enforce a global rate across all instances. For true global rate limiting,
// replace this store with a Redis/Upstash-backed implementation.
//
// Current limit: 100 requests per 60-second sliding window per key prefix.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;
const PRUNE_THRESHOLD = 1_000; // prune when store grows beyond this size

interface WindowEntry {
  timestamps: number[]; // epoch-ms of each request within the current window
}

const store = new Map<string, WindowEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch-ms when the oldest in-window request expires
}

/**
 * Check and record a request for the given key prefix.
 * Mutates the store by appending the current timestamp and dropping stale ones.
 */
export function checkRateLimit(keyPrefix: string): RateLimitResult {
  if (store.size > PRUNE_THRESHOLD) {
    pruneStaleEntries();
  }

  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const entry = store.get(keyPrefix) ?? { timestamps: [] };

  // Drop timestamps outside the sliding window
  const active = entry.timestamps.filter((t) => t > cutoff);

  if (active.length >= MAX_REQUESTS) {
    // Oldest active timestamp determines when the window resets for this key
    const resetAt = active[0] + WINDOW_MS;
    store.set(keyPrefix, { timestamps: active });
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Record this request
  active.push(now);
  store.set(keyPrefix, { timestamps: active });

  const resetAt = active[0] + WINDOW_MS;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - active.length,
    resetAt,
  };
}

/**
 * Remove entries whose entire timestamp window has expired.
 * Called lazily when the store exceeds PRUNE_THRESHOLD entries to avoid unbounded growth.
 */
export function pruneStaleEntries(): void {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, entry] of store.entries()) {
    const hasActive = entry.timestamps.some((t) => t > cutoff);
    if (!hasActive) {
      store.delete(key);
    }
  }
}
