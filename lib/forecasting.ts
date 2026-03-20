export interface ForecastResult {
  projectedMonthlyTotal: number;
  dailyTrend: "up" | "down" | "stable";
  trendPercent: number;
  confidence: number;
  projectedDays: {
    date: string;
    projected: number;
    lower: number;
    upper: number;
  }[];
}

/**
 * Forecast future daily costs using ordinary least-squares linear regression
 * on historical daily cost data.
 *
 * Returns null when fewer than 14 data points are available (insufficient
 * baseline for a reliable regression).
 *
 * The confidence band uses 1.96 * standard error of residuals (approximately
 * the 95% confidence interval for the regression line).
 *
 * Confidence score scales linearly from 0 at 14 days to 1.0 at 30+ days.
 */
export function forecastCosts(
  dailyCosts: { date: string; cost: number }[],
  forecastDays: number = 30,
): ForecastResult | null {
  if (dailyCosts.length < 14) return null;

  const n = dailyCosts.length;
  const costs = dailyCosts.map((d) => d.cost);
  const xs = costs.map((_, i) => i);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = costs.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * costs[i]!, 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  // Guard against degenerate case (all x equal, which cannot happen for time series)
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Residual standard error (uses n-2 degrees of freedom)
  const predictions = xs.map((x) => slope * x + intercept);
  const residuals = costs.map((y, i) => y - predictions[i]!);
  const sse = residuals.reduce((s, r) => s + r * r, 0);
  // Avoid division by zero when n < 3 (already guarded by n >= 14 above)
  const stdError = n > 2 ? Math.sqrt(sse / (n - 2)) : 0;

  // Project forward from the last historical date
  const lastDate = new Date(dailyCosts[n - 1]!.date);
  const projectedDays: ForecastResult["projectedDays"] = [];

  for (let d = 1; d <= forecastDays; d++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + d);
    const x = n - 1 + d;
    const projected = Math.max(0, slope * x + intercept);
    projectedDays.push({
      date: futureDate.toISOString().slice(0, 10),
      projected,
      lower: Math.max(0, projected - 1.96 * stdError),
      upper: projected + 1.96 * stdError,
    });
  }

  const projectedMonthlyTotal = projectedDays.reduce(
    (s, d) => s + d.projected,
    0,
  );

  // Trend direction based on slope relative to recent 7-day average
  const recentCosts = costs.slice(-7);
  const recentAvg = recentCosts.reduce((a, b) => a + b, 0) / recentCosts.length;
  // trendPercent is the daily slope expressed as % of the recent average daily spend
  const trendPercent = recentAvg > 0 ? (slope / recentAvg) * 100 : 0;
  const dailyTrend: "up" | "down" | "stable" =
    Math.abs(trendPercent) < 1 ? "stable" : trendPercent > 0 ? "up" : "down";

  // Confidence increases with more data: 0 at 14 days, 1.0 at 30+ days
  const confidence = Math.min(1, (n - 14) / 16);

  return {
    projectedMonthlyTotal,
    dailyTrend,
    trendPercent,
    confidence,
    projectedDays,
  };
}
