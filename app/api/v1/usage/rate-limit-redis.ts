// Redis-backed rate limiter using Upstash.
//
// Falls back to the in-memory implementation when UPSTASH_REDIS_REST_URL /
// UPSTASH_REDIS_REST_TOKEN are not configured. This allows the app to run
// without Redis in local dev while automatically gaining global rate limiting
// in production.
//
// Limit: 100 requests per 60-second sliding window per API key prefix.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  checkRateLimit as checkMemoryRateLimit,
  pruneStaleEntries,
  type RateLimitResult,
} from "./rate-limit";

let redisRatelimit: Ratelimit | null = null;

function getRedisRatelimit(): Ratelimit | null {
  if (redisRatelimit) return redisRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redisRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    prefix: "kova:usage",
  });

  return redisRatelimit;
}

export async function checkRateLimit(
  keyPrefix: string,
): Promise<RateLimitResult> {
  const rl = getRedisRatelimit();

  if (!rl) {
    // Redis not configured -- fall back to the per-process in-memory limiter.
    pruneStaleEntries();
    return checkMemoryRateLimit(keyPrefix);
  }

  const { success, remaining, reset } = await rl.limit(keyPrefix);

  return {
    allowed: success,
    remaining,
    resetAt: reset,
  };
}
