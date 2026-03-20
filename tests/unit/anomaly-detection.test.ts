import { describe, expect, it } from "vitest";
import { detectAnomalies } from "@/lib/anomaly-detection";

// Helper to build N days of flat daily cost data
function flatDays(
	n: number,
	costPerDay: number,
): { date: string; cost: number }[] {
	const result = [];
	for (let i = 0; i < n; i++) {
		const d = new Date(2026, 0, i + 1); // Jan 1..N 2026
		result.push({
			date: d.toISOString().slice(0, 10),
			cost: costPerDay,
		});
	}
	return result;
}

// Build N days starting with a flat baseline, then spike on the last day
function daysWithSpike(
	baselineDays: number,
	baselineCost: number,
	spikeCost: number,
): { date: string; cost: number }[] {
	const days = flatDays(baselineDays, baselineCost);
	const lastDate = new Date(2026, 0, baselineDays + 1);
	days.push({ date: lastDate.toISOString().slice(0, 10), cost: spikeCost });
	return days;
}

describe("detectAnomalies", () => {
	it("flat data with enough days produces no anomalies", () => {
		const data = flatDays(20, 5.0);
		const results = detectAnomalies(data);

		expect(results).toHaveLength(20);
		// All should be info and not anomalies because stdDev is 0 -> zScore 0
		results.forEach((r) => {
			expect(r.isAnomaly).toBe(false);
			expect(r.severity).toBe("info");
		});
	});

	it("spike at 3x normal is detected as warning or critical", () => {
		// 20 days at $1.00, then spike at $10.00 (10x)
		const data = daysWithSpike(20, 1.0, 10.0);
		const results = detectAnomalies(data);
		const spikeResult = results[results.length - 1]!;

		expect(spikeResult.isAnomaly).toBe(true);
		expect(["warning", "critical"]).toContain(spikeResult.severity);
		expect(spikeResult.zScore).toBeGreaterThan(2);
	});

	it("fewer than minDays returns all info severity and no anomalies", () => {
		const data = flatDays(4, 5.0); // below default minDays of 7
		const results = detectAnomalies(data, { minDays: 7 });

		expect(results).toHaveLength(4);
		results.forEach((r) => {
			expect(r.isAnomaly).toBe(false);
			expect(r.severity).toBe("info");
			expect(r.zScore).toBe(0);
		});
	});

	it("negative spike (drop to near zero) is also detected as anomaly", () => {
		// 20 days at $10.00, then drop to $0.10
		const data = daysWithSpike(20, 10.0, 0.1);
		const results = detectAnomalies(data);
		const dropResult = results[results.length - 1]!;

		expect(dropResult.isAnomaly).toBe(true);
		// A big drop should be a negative z-score
		expect(dropResult.zScore).toBeLessThan(-2);
	});

	it("window size is respected -- only preceding windowSize days used for rolling stats", () => {
		// Build 20 days with a windowSize of 5. The window for day 20 (index 19)
		// should only include days 14-19. With a spike at day 20, the window is
		// all $1.00 values and the spike at $100 stands out as an anomaly.
		const data = flatDays(19, 1.0);
		// Add a spike at day 20
		data.push({ date: "2026-01-20", cost: 100.0 });

		const results = detectAnomalies(data, { windowSize: 5, minDays: 7 });

		// The window for the last day contains 5 days of $1.00 data
		// z-score should be very high because cost is 100x the avg
		const spikeDay = results[results.length - 1]!;
		expect(spikeDay.isAnomaly).toBe(true);
		expect(spikeDay.zScore).toBeGreaterThan(2);

		// Rolling avg computed from only the previous 5 days at $1.00
		expect(spikeDay.rollingAvg).toBeCloseTo(1.0, 5);
	});

	it("severity is critical when |zScore| > 3", () => {
		// Build 20 days at $1 then spike at $100 to guarantee |z| > 3
		const data = daysWithSpike(20, 1.0, 100.0);
		const results = detectAnomalies(data);
		const spikeResult = results[results.length - 1]!;

		expect(spikeResult.severity).toBe("critical");
		expect(spikeResult.zScore).toBeGreaterThan(3);
	});

	it("rollingAvg and rollingStdDev are 0 for early days without sufficient window", () => {
		const data = flatDays(10, 2.0);
		const results = detectAnomalies(data, { minDays: 7, windowSize: 14 });

		// First 3 entries have window.length < 3 so stats are zeroed
		expect(results[0]!.rollingAvg).toBe(0);
		expect(results[0]!.rollingStdDev).toBe(0);
		expect(results[1]!.rollingAvg).toBe(0);
		expect(results[2]!.rollingAvg).toBe(0);

		// Day at index 3+ should have non-zero avg (window = preceding 3 days at $2)
		expect(results[3]!.rollingAvg).toBeGreaterThan(0);
	});
});
