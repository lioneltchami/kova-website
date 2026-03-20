import { describe, expect, it } from "vitest";
import { forecastCosts } from "@/lib/forecasting";

// Helper to build N days of daily cost data starting from a base date
function makeDays(
  n: number,
  costFn: (i: number) => number,
): { date: string; cost: number }[] {
  const result = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(2026, 0, i + 1); // Jan 1..N 2026
    result.push({
      date: d.toISOString().slice(0, 10),
      cost: costFn(i),
    });
  }
  return result;
}

describe("forecastCosts", () => {
  it("returns null when fewer than 14 days of data are provided", () => {
    const data = makeDays(13, () => 5.0);
    expect(forecastCosts(data)).toBeNull();
  });

  it("returns null for 0 days of data", () => {
    expect(forecastCosts([])).toBeNull();
  });

  it("flat daily cost forecasts near the same amount per day", () => {
    // 20 days at exactly $5.00/day
    const data = makeDays(20, () => 5.0);
    const result = forecastCosts(data, 30);

    expect(result).not.toBeNull();

    // With a flat series, each projected day should be close to $5.00
    result!.projectedDays.forEach((day) => {
      expect(day.projected).toBeCloseTo(5.0, 0); // within $1 tolerance
    });

    // Total for 30 projected days should be near 30 * $5 = $150
    expect(result!.projectedMonthlyTotal).toBeCloseTo(150, 0);
  });

  it("increasing daily costs forecast higher values", () => {
    // 20 days with linearly increasing cost: $1, $2, ..., $20
    const data = makeDays(20, (i) => i + 1);
    const result = forecastCosts(data, 30);

    expect(result).not.toBeNull();

    // With an upward trend, the projected days should be above the last observed value ($20)
    const firstProjected = result!.projectedDays[0]!.projected;
    expect(firstProjected).toBeGreaterThan(20);

    // The trend should be "up"
    expect(result!.dailyTrend).toBe("up");

    // trendPercent should be positive
    expect(result!.trendPercent).toBeGreaterThan(0);
  });

  it("decreasing daily costs forecast lower values", () => {
    // 20 days with linearly decreasing cost: $20, $19, ..., $1
    const data = makeDays(20, (i) => Math.max(0.01, 20 - i));
    const result = forecastCosts(data, 30);

    expect(result).not.toBeNull();
    expect(result!.dailyTrend).toBe("down");
    expect(result!.trendPercent).toBeLessThan(0);
  });

  it("confidence increases with more data points", () => {
    const data14 = makeDays(14, () => 3.0);
    const data30 = makeDays(30, () => 3.0);

    const result14 = forecastCosts(data14, 30);
    const result30 = forecastCosts(data30, 30);

    expect(result14).not.toBeNull();
    expect(result30).not.toBeNull();

    // More data = higher confidence
    expect(result30!.confidence).toBeGreaterThanOrEqual(result14!.confidence);

    // 30 days should hit max confidence (1.0)
    expect(result30!.confidence).toBeCloseTo(1.0, 1);

    // 14 days is at the minimum threshold -- confidence should be near 0
    expect(result14!.confidence).toBeCloseTo(0, 1);
  });

  it("projected days has correct count matching forecastDays parameter", () => {
    const data = makeDays(20, () => 5.0);

    const result10 = forecastCosts(data, 10);
    const result30 = forecastCosts(data, 30);
    const result60 = forecastCosts(data, 60);

    expect(result10!.projectedDays).toHaveLength(10);
    expect(result30!.projectedDays).toHaveLength(30);
    expect(result60!.projectedDays).toHaveLength(60);
  });

  it("projected dates are sequential starting the day after last historical date", () => {
    const data = makeDays(20, () => 5.0);
    const result = forecastCosts(data, 5);

    expect(result).not.toBeNull();
    const days = result!.projectedDays;

    // Last historical date is Jan 20 2026, so projections start Jan 21
    expect(days[0]!.date).toBe("2026-01-21");
    expect(days[1]!.date).toBe("2026-01-22");
    expect(days[4]!.date).toBe("2026-01-25");
  });

  it("confidence band: lower <= projected <= upper for all projected days", () => {
    const data = makeDays(25, (i) => 2.0 + Math.sin(i) * 0.5); // noisy data
    const result = forecastCosts(data, 30);

    expect(result).not.toBeNull();
    result!.projectedDays.forEach((day) => {
      expect(day.lower).toBeLessThanOrEqual(day.projected + 1e-9);
      expect(day.upper).toBeGreaterThanOrEqual(day.projected - 1e-9);
    });
  });

  it("projected values are never negative", () => {
    // Aggressively decreasing costs that might trend negative
    const data = makeDays(20, (i) => Math.max(0, 10 - i * 0.8));
    const result = forecastCosts(data, 30);

    expect(result).not.toBeNull();
    result!.projectedDays.forEach((day) => {
      expect(day.projected).toBeGreaterThanOrEqual(0);
      expect(day.lower).toBeGreaterThanOrEqual(0);
    });
  });

  it("projectedMonthlyTotal is the sum of all projected day amounts", () => {
    const data = makeDays(20, () => 5.0);
    const result = forecastCosts(data, 30);

    expect(result).not.toBeNull();
    const manualSum = result!.projectedDays.reduce(
      (s, d) => s + d.projected,
      0,
    );
    expect(result!.projectedMonthlyTotal).toBeCloseTo(manualSum, 6);
  });
});
