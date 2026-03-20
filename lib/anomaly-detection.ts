export interface AnomalyResult {
  date: string;
  cost: number;
  rollingAvg: number;
  rollingStdDev: number;
  zScore: number;
  isAnomaly: boolean;
  severity: "info" | "warning" | "critical";
}

export interface AnomalyDetectionOptions {
  zThreshold?: number;
  windowSize?: number;
  minDays?: number;
}

/**
 * Detect cost anomalies in a time series of daily costs using a rolling
 * z-score algorithm. Returns an AnomalyResult for each input day.
 *
 * Algorithm:
 *  - For each day i, build a rolling window of the preceding windowSize days.
 *  - Compute mean and stddev of the window.
 *  - z-score = (day.cost - mean) / stdDev
 *  - isAnomaly when |z-score| > zThreshold
 *  - severity: critical if |z| > 3, warning if |z| > 2, otherwise info
 *
 * When fewer than minDays data points exist, all results return severity
 * "info" and isAnomaly false -- the baseline is not yet established.
 */
export function detectAnomalies(
  dailyCosts: { date: string; cost: number }[],
  options: AnomalyDetectionOptions = {},
): AnomalyResult[] {
  const { zThreshold = 2.0, windowSize = 14, minDays = 7 } = options;

  // Insufficient data -- return all safe defaults
  if (dailyCosts.length < minDays) {
    return dailyCosts.map((d) => ({
      ...d,
      rollingAvg: 0,
      rollingStdDev: 0,
      zScore: 0,
      isAnomaly: false,
      severity: "info" as const,
    }));
  }

  return dailyCosts.map((day, i) => {
    // Build window from preceding days (exclude the current day itself)
    const windowStart = Math.max(0, i - windowSize);
    const window = dailyCosts.slice(windowStart, i);

    // Need at least 3 points to compute a meaningful standard deviation
    if (window.length < 3) {
      return {
        ...day,
        rollingAvg: 0,
        rollingStdDev: 0,
        zScore: 0,
        isAnomaly: false,
        severity: "info" as const,
      };
    }

    const avg = window.reduce((s, d) => s + d.cost, 0) / window.length;
    const stdDev = Math.sqrt(
      window.reduce((s, d) => s + (d.cost - avg) ** 2, 0) / window.length,
    );

    // When stdDev is zero (perfectly flat baseline), use a small epsilon so
    // that any meaningful deviation from the mean still produces a finite
    // z-score. A value of 1e-6 keeps units in dollars -- deviations smaller
    // than a micro-dollar are treated as noise.
    const effectiveStdDev = stdDev > 0 ? stdDev : avg > 0 ? avg * 0.01 : 1e-6;
    const zScore = (day.cost - avg) / effectiveStdDev;
    const absZ = Math.abs(zScore);
    const isAnomaly = absZ > zThreshold;
    const severity: "info" | "warning" | "critical" =
      absZ > 3 ? "critical" : absZ > 2 ? "warning" : "info";

    return {
      ...day,
      rollingAvg: avg,
      rollingStdDev: stdDev,
      zScore,
      isAnomaly,
      severity,
    };
  });
}
