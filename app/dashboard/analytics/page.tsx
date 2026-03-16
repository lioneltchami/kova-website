import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { formatCost, formatTokens } from "@/lib/dashboard-utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Last 30 days of builds
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: builds } = await supabase
    .from("builds")
    .select(
      "created_at, status, tokens_input, tokens_output, cost_usd, model_used, duration_ms",
    )
    .eq("user_id", user!.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  // Aggregate by day
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

  builds?.forEach((b) => {
    const day = b.created_at.slice(0, 10);
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
    if (b.status === "success") dailyMap[day].success++;
    if (b.status === "failed") dailyMap[day].failed++;
    dailyMap[day].tokens_input += b.tokens_input ?? 0;
    dailyMap[day].tokens_output += b.tokens_output ?? 0;
    dailyMap[day].cost += Number(b.cost_usd ?? 0);
  });

  const dailyData = Object.values(dailyMap).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Model distribution
  const modelMap: Record<string, number> = {};
  builds?.forEach((b) => {
    if (b.model_used) {
      modelMap[b.model_used] = (modelMap[b.model_used] ?? 0) + 1;
    }
  });
  const modelData = Object.entries(modelMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Summary stats
  const totalTokensIn =
    builds?.reduce((s, b) => s + (b.tokens_input ?? 0), 0) ?? 0;
  const totalTokensOut =
    builds?.reduce((s, b) => s + (b.tokens_output ?? 0), 0) ?? 0;
  const totalCost =
    builds?.reduce((s, b) => s + Number(b.cost_usd ?? 0), 0) ?? 0;
  const successCount =
    builds?.filter((b) => b.status === "success").length ?? 0;
  const totalCount = builds?.length ?? 0;
  const successRate =
    totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
      <p className="text-sm text-kova-silver-dim mb-6">
        Last 30 days of build activity
      </p>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
            Total Builds
          </p>
          <p className="text-2xl font-bold text-white">{totalCount}</p>
        </div>
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
            Success Rate
          </p>
          <p className="text-2xl font-bold text-white">{successRate}%</p>
        </div>
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
            Total Tokens
          </p>
          <p className="text-2xl font-bold text-white">
            {formatTokens(totalTokensIn + totalTokensOut)}
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
      </div>

      {/* Charts */}
      {totalCount === 0 ? (
        <div className="bg-kova-surface border border-kova-border rounded-xl p-16 text-center">
          <p className="text-kova-silver-dim">
            No build data for the last 30 days.
          </p>
          <p className="text-sm text-kova-silver-dim mt-2">
            Run <code className="text-kova-blue font-mono">kova build</code> to
            start collecting analytics.
          </p>
        </div>
      ) : (
        <AnalyticsCharts
          dailyData={dailyData}
          modelData={modelData}
          totalTokensIn={totalTokensIn}
          totalTokensOut={totalTokensOut}
        />
      )}
    </div>
  );
}
