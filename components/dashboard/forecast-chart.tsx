"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastResult } from "@/lib/forecasting";

interface ForecastChartProps {
  historicalData: { date: string; cost: number }[];
  forecast: ForecastResult;
}

const KOVA_BLUE = "#4361EE";
const KOVA_BLUE_LIGHT = "#6B84F1";
const KOVA_BORDER = "#2A2A45";
const KOVA_SILVER = "#C0C0C8";
const KOVA_SILVER_DIM = "#8A8A94";
const KOVA_FORECAST = "#7B61FF";

const tooltipStyle = {
  backgroundColor: "#16162A",
  border: `1px solid ${KOVA_BORDER}`,
  borderRadius: "8px",
  color: KOVA_SILVER,
  fontSize: "12px",
};

const labelStyle = { color: KOVA_SILVER_DIM, fontSize: "11px" };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCostTick(value: number) {
  if (value === 0) return "$0";
  if (value >= 1) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
}

interface ChartDataPoint {
  date: string;
  actual?: number;
  projected?: number;
  lower?: number;
  upper?: number;
  isForecast: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: ChartDataPoint }>;
  label?: string;
}

function ForecastTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const isForecast = payload[0]?.payload.isForecast ?? false;

  const actual = payload.find((p) => p.dataKey === "actual")?.value;
  const projected = payload.find((p) => p.dataKey === "projected")?.value;
  const lower = payload[0]?.payload.lower;
  const upper = payload[0]?.payload.upper;

  return (
    <div style={tooltipStyle} className="px-3 py-2 space-y-1">
      <p className="font-semibold" style={{ color: KOVA_SILVER }}>
        {label}
      </p>
      {actual !== undefined && (
        <p style={{ color: KOVA_BLUE }}>Actual: ${actual.toFixed(4)}</p>
      )}
      {projected !== undefined && (
        <>
          <p style={{ color: KOVA_FORECAST }}>
            {isForecast ? "Forecast" : "Trend"}: ${projected.toFixed(4)}
          </p>
          {lower !== undefined && upper !== undefined && isForecast && (
            <p style={{ color: KOVA_SILVER_DIM }}>
              Range: ${lower.toFixed(4)} - ${upper.toFixed(4)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function ForecastChart({
  historicalData,
  forecast,
}: ForecastChartProps) {
  // Merge historical and projected data into a single series
  const historicalPoints: ChartDataPoint[] = historicalData.map((d) => ({
    date: formatDate(d.date),
    actual: Number(d.cost.toFixed(4)),
    isForecast: false,
  }));

  const projectedPoints: ChartDataPoint[] = forecast.projectedDays.map((d) => ({
    date: formatDate(d.date),
    projected: Number(d.projected.toFixed(4)),
    lower: Number(d.lower.toFixed(4)),
    upper: Number(d.upper.toFixed(4)),
    isForecast: true,
  }));

  // Combine: last historical point bridges into the forecast
  const bridgePoint: ChartDataPoint = {
    date: historicalPoints[historicalPoints.length - 1]?.date ?? "",
    actual: historicalPoints[historicalPoints.length - 1]?.actual,
    projected: historicalPoints[historicalPoints.length - 1]?.actual,
    isForecast: false,
  };

  const chartData = [
    ...historicalPoints.slice(0, -1),
    bridgePoint,
    ...projectedPoints,
  ];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-kova-silver-dim text-sm">
        No data available
      </div>
    );
  }

  // Find the index where forecast starts (for the label)
  const forecastStartIdx = historicalPoints.length - 1;

  return (
    <div className="relative">
      {/* Forecast label overlay */}
      <div className="absolute top-1 right-2 flex items-center gap-1.5 text-xs text-kova-silver-dim">
        <span
          className="inline-block w-3 h-0.5 rounded"
          style={{ backgroundColor: KOVA_BLUE }}
        />
        Actual
        <span
          className="inline-block w-3 h-0.5 rounded border-dashed border-t"
          style={{ borderColor: KOVA_FORECAST }}
        />
        Forecast
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={KOVA_BLUE} stopOpacity={0.3} />
              <stop offset="95%" stopColor={KOVA_BLUE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={KOVA_FORECAST} stopOpacity={0.2} />
              <stop offset="95%" stopColor={KOVA_FORECAST} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={KOVA_BORDER} />
          <XAxis
            dataKey="date"
            tick={labelStyle}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={labelStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCostTick}
            width={50}
          />
          <Tooltip content={<ForecastTooltip />} />
          {/* Historical actual cost */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke={KOVA_BLUE}
            fill="url(#actualGrad)"
            strokeWidth={2}
            name="Actual"
            dot={false}
            activeDot={{ r: 4, fill: KOVA_BLUE }}
            connectNulls={false}
          />
          {/* Projected / forecast -- dashed line */}
          <Area
            type="monotone"
            dataKey="projected"
            stroke={KOVA_FORECAST}
            fill="url(#forecastGrad)"
            strokeWidth={2}
            strokeDasharray="5 3"
            name="Forecast"
            dot={false}
            activeDot={{ r: 4, fill: KOVA_FORECAST }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
