import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatTokens,
  formatCost,
  formatRelativeDate,
  getStatusColor,
} from "@/lib/dashboard-utils";

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe("formatDuration", () => {
  it("returns ms suffix for values under 1000ms", () => {
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("returns seconds for values between 1000ms and 59999ms", () => {
    expect(formatDuration(1000)).toBe("1s");
    expect(formatDuration(5500)).toBe("5s");
    expect(formatDuration(59999)).toBe("59s");
  });

  it("returns minutes and seconds for values over 60 seconds", () => {
    expect(formatDuration(60000)).toBe("1m 0s");
    expect(formatDuration(90000)).toBe("1m 30s");
    expect(formatDuration(3661000)).toBe("61m 1s");
  });

  it("handles exact minute boundaries without leftover seconds", () => {
    expect(formatDuration(120000)).toBe("2m 0s");
  });
});

// ---------------------------------------------------------------------------
// formatTokens
// ---------------------------------------------------------------------------

describe("formatTokens", () => {
  it("returns raw number as string for values under 1000", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(999)).toBe("999");
  });

  it("returns K-suffix with one decimal for thousands", () => {
    expect(formatTokens(1000)).toBe("1.0K");
    expect(formatTokens(1500)).toBe("1.5K");
    expect(formatTokens(999999)).toBe("1000.0K");
  });

  it("returns M-suffix with one decimal for millions", () => {
    expect(formatTokens(1_000_000)).toBe("1.0M");
    expect(formatTokens(2_500_000)).toBe("2.5M");
  });

  it("M-suffix takes precedence over K at 1M boundary", () => {
    // 1_000_000 must yield M, not K
    const result = formatTokens(1_000_000);
    expect(result).toContain("M");
    expect(result).not.toContain("K");
  });
});

// ---------------------------------------------------------------------------
// formatCost
// ---------------------------------------------------------------------------

describe("formatCost", () => {
  it("formats zero cost as $0.00", () => {
    expect(formatCost(0)).toBe("$0.00");
  });

  it("always shows exactly two decimal places", () => {
    expect(formatCost(1)).toBe("$1.00");
    expect(formatCost(0.5)).toBe("$0.50");
    expect(formatCost(0.1234)).toBe("$0.12");
  });

  it("rounds to two decimal places", () => {
    expect(formatCost(0.999)).toBe("$1.00");
    expect(formatCost(0.004)).toBe("$0.00");
    expect(formatCost(0.005)).toBe("$0.01");
  });

  it("formats large values correctly", () => {
    expect(formatCost(1000.5)).toBe("$1000.50");
  });
});

// ---------------------------------------------------------------------------
// formatRelativeDate
// ---------------------------------------------------------------------------

describe("formatRelativeDate", () => {
  function isoSecondsAgo(seconds: number): string {
    return new Date(Date.now() - seconds * 1000).toISOString();
  }

  it("returns 'just now' for dates less than 1 minute ago", () => {
    expect(formatRelativeDate(isoSecondsAgo(30))).toBe("just now");
  });

  it("returns minutes-ago label for dates 1-59 minutes ago", () => {
    const result = formatRelativeDate(isoSecondsAgo(90)); // 1.5 minutes
    expect(result).toMatch(/^\d+m ago$/);
    expect(result).toBe("1m ago");
  });

  it("returns hours-ago label for dates 1-23 hours ago", () => {
    const result = formatRelativeDate(isoSecondsAgo(3600 * 2)); // 2 hours
    expect(result).toBe("2h ago");
  });

  it("returns days-ago label for dates 1-29 days ago", () => {
    const result = formatRelativeDate(isoSecondsAgo(86400 * 5)); // 5 days
    expect(result).toBe("5d ago");
  });

  it("falls back to toLocaleDateString for dates 30+ days ago", () => {
    const old = new Date(Date.now() - 86400 * 1000 * 35).toISOString();
    const result = formatRelativeDate(old);
    // Should not match relative-time patterns
    expect(result).not.toMatch(/ago$/);
    // Should be a non-empty formatted date string
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getStatusColor
// ---------------------------------------------------------------------------

describe("getStatusColor", () => {
  it("returns green class for success status", () => {
    expect(getStatusColor("success")).toBe("text-green-400");
  });

  it("returns red class for failed status", () => {
    expect(getStatusColor("failed")).toBe("text-red-400");
  });

  it("returns blue class for running status", () => {
    expect(getStatusColor("running")).toBe("text-kova-blue");
  });

  it("returns dim silver class for pending status", () => {
    expect(getStatusColor("pending")).toBe("text-kova-silver-dim");
  });

  it("returns dim silver class for unknown status", () => {
    expect(getStatusColor("unknown")).toBe("text-kova-silver-dim");
    expect(getStatusColor("")).toBe("text-kova-silver-dim");
  });
});
