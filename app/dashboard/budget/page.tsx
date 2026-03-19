import { Suspense } from "react";
import { BudgetForm } from "@/components/dashboard/budget-form";
import { BudgetVsActualChart } from "@/components/dashboard/budget-vs-actual-chart";
import { formatCost, formatRelativeDate } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Budget",
};

export default async function BudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch budgets
  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, period, amount_usd, warn_at_percent, is_active, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const monthlyBudget = budgets?.find((b) => b.period === "monthly") ?? null;
  const dailyBudget = budgets?.find((b) => b.period === "daily") ?? null;

  // Current month spend
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: monthlyRecords } = await supabase
    .from("usage_records")
    .select("cost_usd")
    .eq("user_id", user.id)
    .gte("recorded_at", monthStart.toISOString());

  const currentMonthSpend =
    monthlyRecords?.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0) ?? 0;

  // Today's spend
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayRecords } = await supabase
    .from("usage_records")
    .select("cost_usd")
    .eq("user_id", user.id)
    .gte("recorded_at", todayStart.toISOString());

  const todaySpend =
    todayRecords?.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0) ?? 0;

  // Budget alerts (last 30)
  const { data: alerts } = await supabase
    .from("budget_alerts")
    .select(
      "id, triggered_at, alert_type, threshold_pct, current_spend, budget_amount, budget_id",
    )
    .order("triggered_at", { ascending: false })
    .limit(30);

  // Last 6 months of actual spend for chart
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const { data: historicalRecords } = await supabase
    .from("usage_records")
    .select("recorded_at, cost_usd")
    .eq("user_id", user.id)
    .gte("recorded_at", sixMonthsAgo.toISOString())
    .order("recorded_at", { ascending: true });

  // Aggregate by month
  const monthlySpendMap: Record<string, number> = {};
  historicalRecords?.forEach((r) => {
    const month = r.recorded_at.slice(0, 7); // YYYY-MM
    monthlySpendMap[month] =
      (monthlySpendMap[month] ?? 0) + Number(r.cost_usd ?? 0);
  });

  // Build last 6 months labels
  const budgetChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    return {
      month: label,
      actual: Number((monthlySpendMap[key] ?? 0).toFixed(4)),
      budget: monthlyBudget ? Number(monthlyBudget.amount_usd) : null,
    };
  });

  // Budget progress helpers
  const monthlyBudgetAmount = monthlyBudget
    ? Number(monthlyBudget.amount_usd)
    : null;
  const monthlyUsedPct =
    monthlyBudgetAmount && monthlyBudgetAmount > 0
      ? Math.min(100, (currentMonthSpend / monthlyBudgetAmount) * 100)
      : null;

  const dailyBudgetAmount = dailyBudget ? Number(dailyBudget.amount_usd) : null;
  const dailyUsedPct =
    dailyBudgetAmount && dailyBudgetAmount > 0
      ? Math.min(100, (todaySpend / dailyBudgetAmount) * 100)
      : null;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Budget</h1>
        <p className="text-sm text-kova-silver-dim mt-0.5">
          Manage spend limits and alert thresholds
        </p>
      </div>

      {/* Budget Progress Section */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Current Period Spend
        </h2>

        {/* Monthly progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-kova-silver-dim">This month</span>
            <span className="text-sm text-kova-silver font-medium">
              {formatCost(currentMonthSpend)}
              {monthlyBudgetAmount && (
                <span className="text-kova-silver-dim">
                  {" "}
                  / {formatCost(monthlyBudgetAmount)}
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-kova-charcoal-light overflow-hidden">
            {monthlyUsedPct !== null ? (
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  monthlyUsedPct >= 90
                    ? "bg-red-500"
                    : monthlyUsedPct >= 75
                      ? "bg-amber-500"
                      : "bg-kova-blue",
                )}
                style={{ width: `${monthlyUsedPct}%` }}
              />
            ) : (
              <div
                className="h-full rounded-full bg-kova-blue/40"
                style={{ width: "100%" }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-kova-silver-dim">
              {monthlyUsedPct !== null
                ? `${monthlyUsedPct.toFixed(1)}% used`
                : "No monthly budget set"}
            </span>
            {monthlyBudget &&
              monthlyUsedPct !== null &&
              monthlyUsedPct >= 75 && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    monthlyUsedPct >= 90 ? "text-red-400" : "text-amber-400",
                  )}
                >
                  {monthlyUsedPct >= 90 ? "Critical" : "Warning"}
                </span>
              )}
          </div>
        </div>

        {/* Daily progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-kova-silver-dim">Today</span>
            <span className="text-sm text-kova-silver font-medium">
              {formatCost(todaySpend)}
              {dailyBudgetAmount && (
                <span className="text-kova-silver-dim">
                  {" "}
                  / {formatCost(dailyBudgetAmount)}
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-kova-charcoal-light overflow-hidden">
            {dailyUsedPct !== null ? (
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  dailyUsedPct >= 90
                    ? "bg-red-500"
                    : dailyUsedPct >= 75
                      ? "bg-amber-500"
                      : "bg-kova-blue",
                )}
                style={{ width: `${dailyUsedPct}%` }}
              />
            ) : (
              <div
                className="h-full rounded-full bg-kova-blue/40"
                style={{ width: "100%" }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-kova-silver-dim">
              {dailyUsedPct !== null
                ? `${dailyUsedPct.toFixed(1)}% used`
                : "No daily budget set"}
            </span>
          </div>
        </div>
      </section>

      {/* Budget Settings */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-white mb-3">
          Budget Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BudgetForm
            budget={
              monthlyBudget
                ? {
                    id: monthlyBudget.id,
                    amount_usd: Number(monthlyBudget.amount_usd),
                    warn_at_percent: monthlyBudget.warn_at_percent,
                    period: "monthly",
                  }
                : null
            }
            period="monthly"
            label="Monthly Budget"
          />
          <BudgetForm
            budget={
              dailyBudget
                ? {
                    id: dailyBudget.id,
                    amount_usd: Number(dailyBudget.amount_usd),
                    warn_at_percent: dailyBudget.warn_at_percent,
                    period: "daily",
                  }
                : null
            }
            period="daily"
            label="Daily Budget"
          />
        </div>
      </section>

      {/* Budget vs Actual Chart */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-1">
          Budget vs Actual
        </h2>
        <p className="text-xs text-kova-silver-dim mb-4">
          Last 6 months of spend compared to monthly budget
        </p>
        <Suspense
          fallback={
            <div className="h-56 bg-kova-charcoal-light/20 rounded animate-pulse" />
          }
        >
          <BudgetVsActualChart data={budgetChartData} />
        </Suspense>
      </section>

      {/* Alert History */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Alert History
        </h2>
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-kova-silver-dim text-sm">
              No budget alerts triggered yet.
            </p>
            <p className="text-xs text-kova-silver-dim mt-1">
              Alerts fire when your spend reaches the configured threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border">
                  <th className="pb-3 pr-4">When</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Threshold</th>
                  <th className="pb-3 pr-4">Spend at Trigger</th>
                  <th className="pb-3">Budget</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
                  >
                    <td className="py-3 pr-4 text-kova-silver-dim text-sm whitespace-nowrap">
                      {formatRelativeDate(alert.triggered_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          alert.alert_type === "critical"
                            ? "bg-red-900/30 text-red-400"
                            : "bg-amber-900/30 text-amber-400",
                        )}
                      >
                        {alert.alert_type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-kova-silver-dim text-sm">
                      {alert.threshold_pct}%
                    </td>
                    <td className="py-3 pr-4 text-kova-silver text-sm">
                      {formatCost(Number(alert.current_spend))}
                    </td>
                    <td className="py-3 text-kova-silver-dim text-sm">
                      {formatCost(Number(alert.budget_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
