import { Suspense } from "react";
import { CostTrendChart } from "@/components/dashboard/cost-trend-chart";
import {
  type DateRange,
  DateRangePicker,
  getDateRangeStart,
} from "@/components/dashboard/date-range-picker";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import { ForecastChart } from "@/components/dashboard/forecast-chart";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ToolComparisonChart } from "@/components/dashboard/tool-comparison-chart";
import { forecastCosts } from "@/lib/forecasting";
import {
  formatCost,
  formatRelativeDate,
  formatTokens,
} from "@/lib/dashboard-utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Dashboard Overview",
};

function CardSkeleton() {
  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6 animate-pulse">
      <div className="h-4 w-24 bg-kova-charcoal-light rounded mb-3" />
      <div className="h-8 w-32 bg-kova-charcoal-light rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6 animate-pulse">
      <div className="h-4 w-32 bg-kova-charcoal-light rounded mb-6" />
      <div className="h-48 bg-kova-charcoal-light/40 rounded" />
    </div>
  );
}

interface DashboardOverviewProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function DashboardOverview({
  searchParams,
}: DashboardOverviewProps) {
  const params = await searchParams;
  const range = (params.range as DateRange) ?? "30d";
  const since = getDateRangeStart(range);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Current month boundaries for budget calculation
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // Previous month boundaries
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 10);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .slice(0, 10);

  // Range boundaries for trend/tool data
  const sinceDate = since.toISOString().slice(0, 10);
  const todayDate = now.toISOString().slice(0, 10);

  // --- Rollup queries (dramatically fewer rows than raw usage_records) ---

  // Current month KPI: use daily rollups grouped by day in the month
  const { data: thisMonthRollup } = await supabase
    .from("usage_daily_rollups")
    .select("total_cost_usd, total_sessions, tool, date")
    .eq("user_id", user.id)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  // Previous month KPI: use daily rollups for month-over-month comparison
  const { data: prevMonthRollup } = await supabase
    .from("usage_daily_rollups")
    .select("total_cost_usd")
    .eq("user_id", user.id)
    .gte("date", prevMonthStart)
    .lte("date", prevMonthEnd);

  // Range data for trend chart and tool comparison: use daily rollups
  const { data: rangeRollup } = await supabase
    .from("usage_daily_rollups")
    .select(
      "date, tool, total_cost_usd, total_sessions, total_input_tokens, total_output_tokens",
    )
    .eq("user_id", user.id)
    .gte("date", sinceDate)
    .lte("date", todayDate);

  // Fetch active monthly budget
  const { data: budget } = await supabase
    .from("budgets")
    .select("amount_usd")
    .eq("user_id", user.id)
    .eq("period", "monthly")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Recent raw records (last 20) -- kept on usage_records because rollups
  // don't have project/model/session_id granularity needed for the table
  const { data: recentRecords } = await supabase
    .from("usage_records")
    .select(
      "recorded_at, tool, cost_usd, input_tokens, output_tokens, model, project, session_id",
    )
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(20);

  // --- Compute KPI values from rollup data ---
  const totalSpendThisMonth =
    thisMonthRollup?.reduce((s, r) => s + Number(r.total_cost_usd ?? 0), 0) ??
    0;

  const prevMonthSpend =
    prevMonthRollup?.reduce((s, r) => s + Number(r.total_cost_usd ?? 0), 0) ??
    0;

  // Daily burn rate from range rollup
  const rangeMs = now.getTime() - since.getTime();
  const rangeDays = Math.max(1, rangeMs / (1000 * 60 * 60 * 24));
  const rangeTotalCost =
    rangeRollup?.reduce((s, r) => s + Number(r.total_cost_usd ?? 0), 0) ?? 0;
  const dailyBurnRate = rangeTotalCost / rangeDays;

  // Top tool by cost in range (from rollup)
  const toolCostMap: Record<string, number> = {};
  rangeRollup?.forEach((r) => {
    toolCostMap[r.tool] =
      (toolCostMap[r.tool] ?? 0) + Number(r.total_cost_usd ?? 0);
  });
  const toolCostEntries = Object.entries(toolCostMap).sort(
    ([, a], [, b]) => b - a,
  );
  const topTool = toolCostEntries[0]?.[0] ?? null;
  const topToolCost = toolCostEntries[0]?.[1] ?? 0;

  // Budget used percent
  const budgetAmount = budget ? Number(budget.amount_usd) : null;
  const budgetUsedPercent =
    budgetAmount !== null && budgetAmount > 0
      ? (totalSpendThisMonth / budgetAmount) * 100
      : null;

  // --- Daily cost trend data (from range rollup -- already per-day per-tool) ---
  const dailyMap: Record<string, number> = {};
  rangeRollup?.forEach((r) => {
    dailyMap[r.date] = (dailyMap[r.date] ?? 0) + Number(r.total_cost_usd ?? 0);
  });
  const costTrendData = Object.entries(dailyMap)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Forecasting: run on the daily cost trend series ---
  const forecast = forecastCosts(costTrendData, 30);
  const hasForecast = forecast !== null;

  // --- Tool comparison data (from range rollup) ---
  const toolComparisonData = toolCostEntries.map(([tool, cost]) => ({
    tool,
    cost,
  }));

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-sm text-kova-silver-dim mt-0.5">
            AI development cost summary
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangePicker />
        </Suspense>
      </div>

      {/* KPI Cards -- includes ForecastCard if data is sufficient */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <div className="mb-8">
          <KpiCards
            totalSpendThisMonth={totalSpendThisMonth}
            dailyBurnRate={dailyBurnRate}
            topTool={topTool}
            topToolCost={topToolCost}
            budgetAmount={budgetAmount}
            budgetUsedPercent={budgetUsedPercent}
            prevMonthSpend={prevMonthSpend}
          />

          {/* Forecast card added below existing KPI cards when data is available */}
          {hasForecast ? (
            <div className="mt-4">
              <ForecastCard
                forecast={forecast}
                dataPointCount={costTrendData.length}
              />
            </div>
          ) : (
            <div className="mt-4 bg-kova-surface border border-kova-border rounded-xl p-6">
              <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
                Projected This Month
              </p>
              <p className="text-sm text-kova-silver-dim mt-2">
                Need 14+ days of data for forecast
              </p>
            </div>
          )}
        </div>
      </Suspense>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Suspense fallback={<ChartSkeleton />}>
          <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">
              Daily Cost Trend
            </h2>
            <p className="text-xs text-kova-silver-dim mb-4">
              Spend over the selected period
            </p>
            {hasForecast ? (
              <ForecastChart
                historicalData={costTrendData}
                forecast={forecast}
              />
            ) : (
              <CostTrendChart data={costTrendData} />
            )}
          </div>
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">
              Spend by Tool
            </h2>
            <p className="text-xs text-kova-silver-dim mb-4">
              Cost breakdown per AI tool
            </p>
            <ToolComparisonChart data={toolComparisonData} />
          </div>
        </Suspense>
      </div>

      {/* Recent Usage Table */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Usage</h2>
        {!recentRecords || recentRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-kova-silver-dim">No usage records yet.</p>
            <p className="text-sm text-kova-silver-dim mt-2">
              Run <code className="text-kova-blue font-mono">kova sync</code> to
              upload your AI tool usage.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border">
                  <th className="pb-3 pr-4">Tool</th>
                  <th className="pb-3 pr-4">Model</th>
                  <th className="pb-3 pr-4">Project</th>
                  <th className="pb-3 pr-4">Tokens</th>
                  <th className="pb-3 pr-4">Cost</th>
                  <th className="pb-3">When</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((record) => (
                  <tr
                    key={`${record.session_id}-${record.recorded_at}`}
                    className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
                  >
                    <td className="py-3 pr-4 text-kova-silver text-sm font-medium">
                      {record.tool}
                    </td>
                    <td className="py-3 pr-4 text-kova-silver-dim text-sm font-mono">
                      {record.model}
                    </td>
                    <td className="py-3 pr-4 text-kova-silver-dim text-sm max-w-[140px] truncate">
                      {record.project ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-kova-silver-dim text-sm">
                      {formatTokens(
                        (record.input_tokens ?? 0) +
                          (record.output_tokens ?? 0),
                      )}
                    </td>
                    <td className="py-3 pr-4 text-kova-silver text-sm">
                      {formatCost(Number(record.cost_usd ?? 0))}
                    </td>
                    <td className="py-3 text-kova-silver-dim text-sm">
                      {formatRelativeDate(record.recorded_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
