"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnomalyResult } from "@/lib/anomaly-detection";

interface AnomalyChartProps {
  data: AnomalyResult[];
}

const KOVA_BLUE = "#4361EE";
const KOVA_BORDER = "#2A2A45";
const KOVA_SILVER = "#C0C0C8";
const KOVA_SILVER_DIM = "#8A8A94";
const KOVA_WARNING = "#F59E0B";
const KOVA_CRITICAL = "#EF4444";

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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: AnomalyResult & { formattedDate: string };
  }>;
  label?: string;
}

function AnomalyTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  if (!entry) return null;

  const data = entry.payload;

  const deviationPct =
    data.rollingAvg > 0
      ? (((data.cost - data.rollingAvg) / data.rollingAvg) * 100).toFixed(1)
      : null;

  const expectedLow = Math.max(0, data.rollingAvg - data.rollingStdDev).toFixed(
    4,
  );
  const expectedHigh = (data.rollingAvg + data.rollingStdDev).toFixed(4);

  return (
    <div style={tooltipStyle} className="px-3 py-2 space-y-1">
      <p className="font-semibold" style={{ color: KOVA_SILVER }}>
        {data.formattedDate}
      </p>
      <p style={{ color: KOVA_BLUE }}>Cost: ${data.cost.toFixed(4)}</p>
      {data.rollingAvg > 0 && (
        <>
          <p style={{ color: KOVA_SILVER_DIM }}>
            Expected: ${expectedLow} - ${expectedHigh}
          </p>
          {deviationPct && (
            <p
              style={{
                color: data.isAnomaly
                  ? data.severity === "critical"
                    ? KOVA_CRITICAL
                    : KOVA_WARNING
                  : KOVA_SILVER_DIM,
              }}
            >
              Deviation: {Number(deviationPct) > 0 ? "+" : ""}
              {deviationPct}%
            </p>
          )}
        </>
      )}
      {data.isAnomaly && (
        <p
          style={{
            color: data.severity === "critical" ? KOVA_CRITICAL : KOVA_WARNING,
            fontWeight: 600,
          }}
        >
          Anomaly ({data.severity})
        </p>
      )}
    </div>
  );
}

export function AnomalyChart({ data }: AnomalyChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-kova-silver-dim text-sm">
        No data for this period
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    formattedDate: formatDate(d.date),
    costDisplay: Number(d.cost.toFixed(4)),
  }));

  const anomalies = data.filter((d) => d.isAnomaly);

  return (
    <div role="img" aria-label="Chart highlighting cost anomalies over time">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={KOVA_BLUE} stopOpacity={0.3} />
              <stop offset="95%" stopColor={KOVA_BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={KOVA_BORDER} />
          <XAxis
            dataKey="formattedDate"
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
          <Tooltip content={<AnomalyTooltip />} />
          <Area
            type="monotone"
            dataKey="costDisplay"
            stroke={KOVA_BLUE}
            fill="url(#anomalyGrad)"
            strokeWidth={2}
            name="Cost"
            dot={false}
            activeDot={{ r: 4, fill: KOVA_BLUE }}
          />
          {/* Overlay red/amber dots on anomaly days */}
          {anomalies.map((anomaly) => (
            <ReferenceDot
              key={anomaly.date}
              x={formatDate(anomaly.date)}
              y={Number(anomaly.cost.toFixed(4))}
              r={6}
              fill={
                anomaly.severity === "critical" ? KOVA_CRITICAL : KOVA_WARNING
              }
              stroke="none"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
