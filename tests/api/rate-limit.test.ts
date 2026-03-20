import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkRateLimit,
  pruneStaleEntries,
} from "@/app/api/v1/usage/rate-limit";

// The rate limiter uses a module-level Map as its store.
// We reset module state between tests by re-importing fresh instances via vi.resetModules().
// Because the store is module-level, we isolate tests by using unique key prefixes.

// Helper: generate a unique key prefix for each test to avoid cross-test pollution
let keyCounter = 0;
function uniqueKey(): string {
  return `testkey${++keyCounter}`;
}

describe("rate-limit: checkRateLimit", () => {
  it("allows the first request and returns remaining of 99", () => {
    const key = uniqueKey();
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it("allows 100 requests within the window", () => {
    const key = uniqueKey();
    let lastResult = checkRateLimit(key);
    for (let i = 1; i < 100; i++) {
      lastResult = checkRateLimit(key);
    }
    expect(lastResult.allowed).toBe(true);
    expect(lastResult.remaining).toBe(0);
  });

  it("blocks the 101st request", () => {
    const key = uniqueKey();
    for (let i = 0; i < 100; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const key = uniqueKey();
    const WINDOW_MS = 60_000;

    // Fill the window
    for (let i = 0; i < 100; i++) {
      checkRateLimit(key);
    }
    // Blocked now
    expect(checkRateLimit(key).allowed).toBe(false);

    // Fast-forward time past the window
    const originalDateNow = Date.now;
    try {
      const futureTime = originalDateNow() + WINDOW_MS + 1000;
      vi.spyOn(Date, "now").mockReturnValue(futureTime);

      const result = checkRateLimit(key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("different key prefixes have independent limits", () => {
    const keyA = uniqueKey();
    const keyB = uniqueKey();

    // Exhaust keyA
    for (let i = 0; i < 100; i++) {
      checkRateLimit(keyA);
    }
    expect(checkRateLimit(keyA).allowed).toBe(false);

    // keyB is unaffected
    const resultB = checkRateLimit(keyB);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(99);
  });

  it("resetAt is a future epoch-ms timestamp", () => {
    const key = uniqueKey();
    const before = Date.now();
    const result = checkRateLimit(key);
    expect(result.resetAt).toBeGreaterThan(before);
    // resetAt should be roughly 1 minute from now (within 5 seconds of tolerance)
    expect(result.resetAt).toBeLessThanOrEqual(before + 65_000);
  });
});

describe("rate-limit: pruneStaleEntries", () => {
  it("removes entries whose entire timestamp window has expired", () => {
    const WINDOW_MS = 60_000;
    const key = uniqueKey();

    // Make a request to populate the store
    checkRateLimit(key);

    // Fast-forward time past the window so the entry is stale
    const originalDateNow = Date.now;
    const futureTime = originalDateNow() + WINDOW_MS + 1000;
    vi.spyOn(Date, "now").mockReturnValue(futureTime);

    try {
      pruneStaleEntries();
      // After pruning, a new request for the same key should start fresh at 99 remaining
      const result = checkRateLimit(key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("preserves entries that still have active timestamps", () => {
    const key = uniqueKey();

    // Make requests to fill most of the window
    for (let i = 0; i < 50; i++) {
      checkRateLimit(key);
    }

    // Prune without advancing time -- entry should still be active
    pruneStaleEntries();

    const result = checkRateLimit(key);
    // 50 prior requests + this one = 51 used, 49 remaining
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(49);
  });
});
