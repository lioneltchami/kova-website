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

interface CostTrendData {
  date: string;
  cost: number;
}

interface CostTrendChartProps {
  data: CostTrendData[];
}

const KOVA_BLUE = "#4361EE";
const KOVA_BORDER = "#2A2A45";
const KOVA_SILVER = "#C0C0C8";
const KOVA_SILVER_DIM = "#8A8A94";

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

export function CostTrendChart({ data }: CostTrendChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    cost: Number(d.cost.toFixed(4)),
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-kova-silver-dim text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="Daily cost trend chart showing spend over the selected period"
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={KOVA_BLUE} stopOpacity={0.35} />
              <stop offset="95%" stopColor={KOVA_BLUE} stopOpacity={0} />
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
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`$${Number(value).toFixed(4)}`, "Cost"]}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke={KOVA_BLUE}
            fill="url(#costGrad)"
            strokeWidth={2}
            name="Cost"
            dot={false}
            activeDot={{ r: 4, fill: KOVA_BLUE }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
