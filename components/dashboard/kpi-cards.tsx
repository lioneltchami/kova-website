import {
  Activity,
  DollarSign,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { formatCost } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

interface KpiCardsData {
  totalSpendThisMonth: number;
  dailyBurnRate: number;
  topTool: string | null;
  topToolCost: number;
  budgetAmount: number | null;
  budgetUsedPercent: number | null;
  prevMonthSpend: number;
}

function TrendBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        up ? "text-red-400" : "text-green-400",
      )}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function formatToolName(tool: string): string {
  const names: Record<string, string> = {
    claude_code: "Claude Code",
    cursor: "Cursor",
    copilot: "Copilot",
    windsurf: "Windsurf",
    devin: "Devin",
  };
  return names[tool] ?? tool;
}

export function KpiCards({
  totalSpendThisMonth,
  dailyBurnRate,
  topTool,
  topToolCost,
  budgetAmount,
  budgetUsedPercent,
  prevMonthSpend,
}: KpiCardsData) {
  const budgetDisplay =
    budgetAmount === null
      ? "No budget set"
      : budgetUsedPercent !== null
        ? `${budgetUsedPercent.toFixed(0)}% used`
        : "0% used";

  const budgetSubtitle =
    budgetAmount !== null
      ? `of ${formatCost(budgetAmount)} monthly`
      : "Set a budget in Budget settings";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Spend This Month */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-kova-blue/10">
            <DollarSign size={16} className="text-kova-blue" />
          </div>
          <TrendBadge current={totalSpendThisMonth} previous={prevMonthSpend} />
        </div>
        <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
          Spend This Month
        </p>
        <p className="text-3xl font-bold text-white">
          {formatCost(totalSpendThisMonth)}
        </p>
        {prevMonthSpend > 0 && (
          <p className="text-xs text-kova-silver-dim mt-1">
            vs {formatCost(prevMonthSpend)} last month
          </p>
        )}
      </div>

      {/* Daily Burn Rate */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-purple-900/20">
            <Activity size={16} className="text-purple-400" />
          </div>
        </div>
        <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
          Daily Burn Rate
        </p>
        <p className="text-3xl font-bold text-white">
          {formatCost(dailyBurnRate)}
        </p>
        <p className="text-xs text-kova-silver-dim mt-1">average per day</p>
      </div>

      {/* Top Tool by Cost */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-amber-900/20">
            <Zap size={16} className="text-amber-400" />
          </div>
        </div>
        <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
          Top Tool by Cost
        </p>
        <p className="text-3xl font-bold text-white">
          {topTool ? formatToolName(topTool) : "—"}
        </p>
        {topTool && (
          <p className="text-xs text-kova-silver-dim mt-1">
            {formatCost(topToolCost)} this period
          </p>
        )}
      </div>

      {/* Budget Status */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              budgetAmount === null
                ? "bg-kova-charcoal-light"
                : (budgetUsedPercent ?? 0) >= 90
                  ? "bg-red-900/20"
                  : (budgetUsedPercent ?? 0) >= 75
                    ? "bg-amber-900/20"
                    : "bg-green-900/20",
            )}
          >
            <Target
              size={16}
              className={cn(
                budgetAmount === null
                  ? "text-kova-silver-dim"
                  : (budgetUsedPercent ?? 0) >= 90
                    ? "text-red-400"
                    : (budgetUsedPercent ?? 0) >= 75
                      ? "text-amber-400"
                      : "text-green-400",
              )}
            />
          </div>
        </div>
        <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
          Budget Status
        </p>
        <p
          className={cn(
            "text-3xl font-bold",
            budgetAmount === null
              ? "text-kova-silver-dim"
              : (budgetUsedPercent ?? 0) >= 90
                ? "text-red-400"
                : (budgetUsedPercent ?? 0) >= 75
                  ? "text-amber-400"
                  : "text-white",
          )}
        >
          {budgetDisplay}
        </p>
        <p className="text-xs text-kova-silver-dim mt-1">{budgetSubtitle}</p>
      </div>
    </div>
  );
}
