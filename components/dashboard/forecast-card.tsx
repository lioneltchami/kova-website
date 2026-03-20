"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ForecastResult } from "@/lib/forecasting";

interface ForecastCardProps {
  forecast: ForecastResult;
  dataPointCount: number;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High confidence";
  if (confidence >= 0.5) return "Moderate confidence";
  return "Low confidence";
}

export function ForecastCard({ forecast, dataPointCount }: ForecastCardProps) {
  const { projectedMonthlyTotal, dailyTrend, trendPercent, confidence } =
    forecast;

  const trendIcon =
    dailyTrend === "up" ? (
      <TrendingUp size={16} className="text-amber-400" />
    ) : dailyTrend === "down" ? (
      <TrendingDown size={16} className="text-green-400" />
    ) : (
      <Minus size={16} className="text-kova-silver-dim" />
    );

  const trendBadgeClass =
    dailyTrend === "up"
      ? "bg-amber-500/20 text-amber-400"
      : dailyTrend === "down"
        ? "bg-green-500/20 text-green-400"
        : "bg-kova-charcoal-light text-kova-silver-dim";

  const trendSign = trendPercent > 0 ? "+" : "";

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
      <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
        Projected This Month
      </p>
      <div className="flex items-center gap-2 mt-2">
        <p className="text-3xl font-bold text-white">
          {formatCost(projectedMonthlyTotal)}
        </p>
        {trendIcon}
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${trendBadgeClass}`}
        >
          {dailyTrend === "stable"
            ? "Stable"
            : `${trendSign}${trendPercent.toFixed(1)}%/day`}
        </span>
        <span className="text-xs text-kova-silver-dim">
          Based on {dataPointCount} days of data ({confidenceLabel(confidence)})
        </span>
      </div>
    </div>
  );
}
