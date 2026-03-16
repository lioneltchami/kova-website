"use client";

import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface DailyData {
	date: string;
	builds: number;
	success: number;
	failed: number;
	tokens_input: number;
	tokens_output: number;
	cost: number;
}

interface ModelData {
	name: string;
	value: number;
}

interface AnalyticsChartsProps {
	dailyData: DailyData[];
	modelData: ModelData[];
	totalTokensIn: number;
	totalTokensOut: number;
}

const KOVA_BLUE = "#4361EE";
const KOVA_SILVER = "#C0C0C8";
const KOVA_SILVER_DIM = "#8A8A94";
const KOVA_BORDER = "#2A2A45";
const GREEN = "#4ADE80";
const RED = "#F87171";
const PURPLE = "#A78BFA";
const AMBER = "#FBBF24";

const MODEL_COLORS: Record<string, string> = {
	haiku: KOVA_BLUE,
	sonnet: KOVA_SILVER,
	opus: PURPLE,
	mixed: AMBER,
	unknown: KOVA_SILVER_DIM,
};

function getModelColor(name: string, index: number): string {
	const colors = [KOVA_BLUE, KOVA_SILVER, PURPLE, AMBER, GREEN];
	return MODEL_COLORS[name.toLowerCase()] ?? colors[index % colors.length];
}

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
	return `$${value.toFixed(2)}`;
}

function formatTokenTick(value: number) {
	if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
	return String(value);
}

export function AnalyticsCharts({
	dailyData,
	modelData,
	totalTokensIn,
	totalTokensOut,
}: AnalyticsChartsProps) {
	const chartData = dailyData.map((d) => ({
		...d,
		date: formatDate(d.date),
		cost: Number(d.cost.toFixed(4)),
	}));

	return (
		<div className="space-y-6">
			{/* Builds per day: success vs failed stacked area */}
			<div className="bg-kova-surface border border-kova-border rounded-xl p-6">
				<h2 className="text-base font-semibold text-white mb-1">
					Builds per Day
				</h2>
				<p className="text-xs text-kova-silver-dim mb-4">
					Success vs failed over time
				</p>
				<ResponsiveContainer width="100%" height={220}>
					<AreaChart data={chartData}>
						<defs>
							<linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={GREEN} stopOpacity={0.3} />
								<stop offset="95%" stopColor={GREEN} stopOpacity={0} />
							</linearGradient>
							<linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={RED} stopOpacity={0.3} />
								<stop offset="95%" stopColor={RED} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke={KOVA_BORDER} />
						<XAxis
							dataKey="date"
							tick={labelStyle}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							tick={labelStyle}
							axisLine={false}
							tickLine={false}
							allowDecimals={false}
						/>
						<Tooltip contentStyle={tooltipStyle} />
						<Legend wrapperStyle={labelStyle} />
						<Area
							type="monotone"
							dataKey="success"
							stackId="1"
							stroke={GREEN}
							fill="url(#successGrad)"
							strokeWidth={2}
							name="Success"
						/>
						<Area
							type="monotone"
							dataKey="failed"
							stackId="1"
							stroke={RED}
							fill="url(#failedGrad)"
							strokeWidth={2}
							name="Failed"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			{/* Token usage: input vs output line */}
			<div className="bg-kova-surface border border-kova-border rounded-xl p-6">
				<h2 className="text-base font-semibold text-white mb-1">Token Usage</h2>
				<p className="text-xs text-kova-silver-dim mb-4">
					Input ({Math.round(totalTokensIn / 1000)}K) vs Output (
					{Math.round(totalTokensOut / 1000)}K) tokens per day
				</p>
				<ResponsiveContainer width="100%" height={220}>
					<AreaChart data={chartData}>
						<defs>
							<linearGradient id="inputGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={KOVA_BLUE} stopOpacity={0.3} />
								<stop offset="95%" stopColor={KOVA_BLUE} stopOpacity={0} />
							</linearGradient>
							<linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor={KOVA_SILVER} stopOpacity={0.3} />
								<stop offset="95%" stopColor={KOVA_SILVER} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke={KOVA_BORDER} />
						<XAxis
							dataKey="date"
							tick={labelStyle}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							tick={labelStyle}
							axisLine={false}
							tickLine={false}
							tickFormatter={formatTokenTick}
						/>
						<Tooltip contentStyle={tooltipStyle} />
						<Legend wrapperStyle={labelStyle} />
						<Area
							type="monotone"
							dataKey="tokens_input"
							stroke={KOVA_BLUE}
							fill="url(#inputGrad)"
							strokeWidth={2}
							name="Input Tokens"
						/>
						<Area
							type="monotone"
							dataKey="tokens_output"
							stroke={KOVA_SILVER}
							fill="url(#outputGrad)"
							strokeWidth={2}
							name="Output Tokens"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			{/* Cost per day bar chart + model distribution side by side */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-kova-surface border border-kova-border rounded-xl p-6">
					<h2 className="text-base font-semibold text-white mb-1">
						Cost per Day
					</h2>
					<p className="text-xs text-kova-silver-dim mb-4">USD spend per day</p>
					<ResponsiveContainer width="100%" height={200}>
						<BarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" stroke={KOVA_BORDER} />
							<XAxis
								dataKey="date"
								tick={labelStyle}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={labelStyle}
								axisLine={false}
								tickLine={false}
								tickFormatter={formatCostTick}
							/>
							<Tooltip
								contentStyle={tooltipStyle}
								formatter={(value) => [`$${Number(value).toFixed(4)}`, "Cost"]}
							/>
							<Bar
								dataKey="cost"
								fill={KOVA_BLUE}
								radius={[4, 4, 0, 0]}
								name="Cost"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>

				{modelData.length > 0 && (
					<div className="bg-kova-surface border border-kova-border rounded-xl p-6">
						<h2 className="text-base font-semibold text-white mb-1">
							Model Distribution
						</h2>
						<p className="text-xs text-kova-silver-dim mb-4">
							Builds by model used
						</p>
						<ResponsiveContainer width="100%" height={200}>
							<PieChart>
								<Pie
									data={modelData}
									cx="50%"
									cy="50%"
									innerRadius={55}
									outerRadius={80}
									dataKey="value"
									nameKey="name"
								>
									{modelData.map((entry, index) => (
										<Cell
											key={entry.name}
											fill={getModelColor(entry.name, index)}
										/>
									))}
								</Pie>
								<Tooltip contentStyle={tooltipStyle} />
								<Legend wrapperStyle={labelStyle} />
							</PieChart>
						</ResponsiveContainer>
					</div>
				)}
			</div>
		</div>
	);
}
