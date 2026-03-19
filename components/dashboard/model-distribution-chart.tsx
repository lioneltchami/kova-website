"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ModelData {
  name: string;
  value: number;
  percent: number;
}

interface ModelDistributionChartProps {
  data: ModelData[];
}

const KOVA_BORDER = "#2A2A45";
const KOVA_SILVER = "#C0C0C8";
const KOVA_SILVER_DIM = "#8A8A94";

const COLORS = [
  "#4361EE",
  "#A78BFA",
  "#4ADE80",
  "#FBBF24",
  "#F87171",
  "#38BDF8",
  "#FB923C",
];

const tooltipStyle = {
  backgroundColor: "#16162A",
  border: `1px solid ${KOVA_BORDER}`,
  borderRadius: "8px",
  color: KOVA_SILVER,
  fontSize: "12px",
};

const labelStyle = { color: KOVA_SILVER_DIM, fontSize: "11px" };

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

function CustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomLabelProps) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ModelDistributionChart({ data }: ModelDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-kova-silver-dim text-sm">
        No model data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          dataKey="value"
          nameKey="name"
          labelLine={false}
          label={CustomLabel as unknown as boolean}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => [
            `${value} sessions (${data.find((d) => d.name === name)?.percent.toFixed(1)}%)`,
            name,
          ]}
        />
        <Legend wrapperStyle={labelStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
