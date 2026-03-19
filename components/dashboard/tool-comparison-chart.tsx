"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ToolData {
  tool: string;
  cost: number;
}

interface ToolComparisonChartProps {
  data: ToolData[];
}

const KOVA_BORDER = "#2A2A45";
const KOVA_SILVER = "#C0C0C8";
const KOVA_SILVER_DIM = "#8A8A94";

const TOOL_COLORS: Record<string, string> = {
  claude_code: "#4361EE",
  cursor: "#A78BFA",
  copilot: "#4ADE80",
  windsurf: "#38BDF8",
  devin: "#FBBF24",
};

function getToolColor(tool: string, index: number): string {
  const fallbacks = [
    "#4361EE",
    "#A78BFA",
    "#4ADE80",
    "#38BDF8",
    "#FBBF24",
    "#F87171",
  ];
  return TOOL_COLORS[tool] ?? fallbacks[index % fallbacks.length];
}

function formatToolName(tool: string): string {
  const names: Record<string, string> = {
    claude_code: "Claude",
    cursor: "Cursor",
    copilot: "Copilot",
    windsurf: "Windsurf",
    devin: "Devin",
  };
  return names[tool] ?? tool;
}

const tooltipStyle = {
  backgroundColor: "#16162A",
  border: `1px solid ${KOVA_BORDER}`,
  borderRadius: "8px",
  color: KOVA_SILVER,
  fontSize: "12px",
};

const labelStyle = { color: KOVA_SILVER_DIM, fontSize: "11px" };

export function ToolComparisonChart({ data }: ToolComparisonChartProps) {
  const chartData = data.map((d) => ({
    tool: formatToolName(d.tool),
    rawTool: d.tool,
    cost: Number(d.cost.toFixed(4)),
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-kova-silver-dim text-sm">
        No tool data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={KOVA_BORDER}
          vertical={false}
        />
        <XAxis
          dataKey="tool"
          tick={labelStyle}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={labelStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
          width={50}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`$${Number(value).toFixed(4)}`, "Cost"]}
        />
        <Bar dataKey="cost" radius={[4, 4, 0, 0]} name="Cost">
          {chartData.map((entry, index) => (
            <Cell
              key={entry.rawTool}
              fill={getToolColor(entry.rawTool, index)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
