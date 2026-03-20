"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BudgetVsActualData {
  month: string;
  actual: number;
  budget: number | null;
}

interface BudgetVsActualChartProps {
  data: BudgetVsActualData[];
}

const KOVA_BLUE = "#4361EE";
const KOVA_BORDER = "#2A2A45";
const KOVA_SILVER = "#C0C0C8";
const KOVA_SILVER_DIM = "#8A8A94";
const AMBER = "#FBBF24";

const tooltipStyle = {
  backgroundColor: "#16162A",
  border: `1px solid ${KOVA_BORDER}`,
  borderRadius: "8px",
  color: KOVA_SILVER,
  fontSize: "12px",
};

const labelStyle = { color: KOVA_SILVER_DIM, fontSize: "11px" };

export function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-kova-silver-dim text-sm">
        No monthly data available
      </div>
    );
  }

  const hasBudget = data.some((d) => d.budget !== null);

  return (
    <div role="img" aria-label="Chart comparing budget versus actual spending">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={KOVA_BORDER}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={labelStyle}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={labelStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            width={50}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              `$${Number(value).toFixed(2)}`,
              name === "actual" ? "Actual Spend" : "Budget",
            ]}
          />
          <Legend wrapperStyle={labelStyle} />
          <Bar
            dataKey="actual"
            fill={KOVA_BLUE}
            radius={[4, 4, 0, 0]}
            name="actual"
            fillOpacity={0.85}
          />
          {hasBudget && (
            <Line
              type="monotone"
              dataKey="budget"
              stroke={AMBER}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              name="budget"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
