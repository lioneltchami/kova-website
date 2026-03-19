import { Suspense } from "react";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import {
  type DateRange,
  DateRangePicker,
  getDateRangeStart,
} from "@/components/dashboard/date-range-picker";
import {
  type DeveloperRow,
  DeveloperTable,
} from "@/components/dashboard/developer-table";
import { ModelDistributionChart } from "@/components/dashboard/model-distribution-chart";
import { formatCost, formatTokens } from "@/lib/dashboard-utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Analytics",
};

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = await searchParams;
  const range = (params.range as DateRange) ?? "30d";
  const since = getDateRangeStart(range);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch usage records for range
  const { data: records } = await supabase
    .from("usage_records")
    .select(
      "recorded_at, tool, model, project, input_tokens, output_tokens, cost_usd, user_id, session_id",
    )
    .eq("user_id", user.id)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: true });

  // --- Model distribution ---
  const modelCostMap: Record<string, number> = {};
  records?.forEach((r) => {
    modelCostMap[r.model] = (modelCostMap[r.model] ?? 0) + 1;
  });
  const totalSessions = Object.values(modelCostMap).reduce((s, v) => s + v, 0);
  const modelData = Object.entries(modelCostMap)
    .map(([name, value]) => ({
      name,
      value,
      percent: totalSessions > 0 ? (value / totalSessions) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // --- Per project cost ---
  const projectCostMap: Record<string, number> = {};
  records?.forEach((r) => {
    const proj = r.project ?? "(no project)";
    projectCostMap[proj] =
      (projectCostMap[proj] ?? 0) + Number(r.cost_usd ?? 0);
  });
  const projectData = Object.entries(projectCostMap)
    .map(([project, cost]) => ({ project, cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  // --- Daily aggregation for token trend ---
  const dailyMap: Record<
    string,
    {
      date: string;
      builds: number;
      success: number;
      failed: number;
      tokens_input: number;
      tokens_output: number;
      cost: number;
    }
  > = {};

  records?.forEach((r) => {
    const day = r.recorded_at.slice(0, 10);
    if (!dailyMap[day]) {
      dailyMap[day] = {
        date: day,
        builds: 0,
        success: 0,
        failed: 0,
        tokens_input: 0,
        tokens_output: 0,
        cost: 0,
      };
    }
    dailyMap[day].builds++;
    dailyMap[day].tokens_input += r.input_tokens ?? 0;
    dailyMap[day].tokens_output += r.output_tokens ?? 0;
    dailyMap[day].cost += Number(r.cost_usd ?? 0);
  });

  const dailyData = Object.values(dailyMap).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // --- Per-developer table ---
  // Since RLS scopes to own user_id here, developer breakdown shows the current user only
  // In a team context, multiple users would appear
  const devMap: Record<
    string,
    {
      userId: string;
      email: string;
      totalCost: number;
      sessionCount: number;
      modelCounts: Record<string, number>;
      toolBreakdown: Record<string, number>;
    }
  > = {};

  records?.forEach((r) => {
    const uid = r.user_id;
    if (!devMap[uid]) {
      devMap[uid] = {
        userId: uid,
        email: user.email ?? uid,
        totalCost: 0,
        sessionCount: 0,
        modelCounts: {},
        toolBreakdown: {},
      };
    }
    devMap[uid].totalCost += Number(r.cost_usd ?? 0);
    devMap[uid].sessionCount += 1;
    devMap[uid].modelCounts[r.model] =
      (devMap[uid].modelCounts[r.model] ?? 0) + 1;
    devMap[uid].toolBreakdown[r.tool] =
      (devMap[uid].toolBreakdown[r.tool] ?? 0) + Number(r.cost_usd ?? 0);
  });

  const developerRows: DeveloperRow[] = Object.values(devMap).map((d) => {
    const topModel =
      Object.entries(d.modelCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
      "unknown";
    return {
      userId: d.userId,
      email: d.email,
      totalCost: d.totalCost,
      sessionCount: d.sessionCount,
      topModel,
      toolBreakdown: d.toolBreakdown,
    };
  });

  // --- Summary stats ---
  const totalCost =
    records?.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0) ?? 0;
  const totalTokensIn =
    records?.reduce((s, r) => s + (r.input_tokens ?? 0), 0) ?? 0;
  const totalTokensOut =
    records?.reduce((s, r) => s + (r.output_tokens ?? 0), 0) ?? 0;
  const totalCount = records?.length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-kova-silver-dim mt-0.5">
            Usage patterns and cost breakdown
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangePicker />
        </Suspense>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
            Total Sessions
          </p>
          <p className="text-2xl font-bold text-white">
            {totalCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
            Total Cost
          </p>
          <p className="text-2xl font-bold text-white">
            {formatCost(totalCost)}
          </p>
        </div>
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
            Input Tokens
          </p>
          <p className="text-2xl font-bold text-white">
            {formatTokens(totalTokensIn)}
          </p>
        </div>
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
            Output Tokens
          </p>
          <p className="text-2xl font-bold text-white">
            {formatTokens(totalTokensOut)}
          </p>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="bg-kova-surface border border-kova-border rounded-xl p-16 text-center">
          <p className="text-kova-silver-dim">No usage data for this period.</p>
          <p className="text-sm text-kova-silver-dim mt-2">
            Run <code className="text-kova-blue font-mono">kova sync</code> to
            upload your AI tool usage.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Model distribution + project cost side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model distribution donut */}
            <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-1">
                Model Distribution
              </h2>
              <p className="text-xs text-kova-silver-dim mb-4">
                % of sessions by model
              </p>
              <ModelDistributionChart data={modelData} />
            </div>

            {/* Per-project cost */}
            <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-1">
                Cost by Project
              </h2>
              <p className="text-xs text-kova-silver-dim mb-4">
                Top 10 projects by spend
              </p>
              {projectData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-kova-silver-dim text-sm">
                  No project data available
                </div>
              ) : (
                <div className="space-y-2">
                  {projectData.map((p) => {
                    const maxCost = projectData[0]?.cost ?? 1;
                    const barWidth = (p.cost / maxCost) * 100;
                    return (
                      <div key={p.project} className="flex items-center gap-3">
                        <span
                          className="text-xs text-kova-silver-dim min-w-0 flex-1 truncate"
                          title={p.project}
                        >
                          {p.project}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-24 h-1.5 rounded-full bg-kova-charcoal-light">
                            <div
                              className="h-full rounded-full bg-kova-blue"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs text-kova-silver w-16 text-right">
                            {formatCost(p.cost)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Token usage trend + cost per day (existing AnalyticsCharts) */}
          <AnalyticsCharts
            dailyData={dailyData}
            modelData={modelData.map((m) => ({ name: m.name, value: m.value }))}
            totalTokensIn={totalTokensIn}
            totalTokensOut={totalTokensOut}
          />

          {/* Per-developer table */}
          <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">
              Developer Breakdown
            </h2>
            <p className="text-xs text-kova-silver-dim mb-4">
              Spend and usage per team member
            </p>
            <DeveloperTable rows={developerRows} />
          </div>
        </div>
      )}
    </div>
  );
}
