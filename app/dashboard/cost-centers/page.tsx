import { Plus } from "lucide-react";
import Link from "next/link";
import { formatCost } from "@/lib/dashboard-utils";
import { createAdminClient } from "@/lib/supabase-admin";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Cost Centers",
};

export default async function CostCentersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  // Get user's team
  const { data: membership } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const teamId = membership?.team_id ?? null;

  // Fetch cost centers for this team
  const { data: costCenters } = teamId
    ? await admin
        .from("cost_centers")
        .select("id, name, budget_usd, created_at")
        .eq("team_id", teamId)
        .order("name", { ascending: true })
    : { data: [] };

  // Current month date range
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // Fetch usage rollups grouped by cost_center_id
  const { data: rollups } = teamId
    ? await admin
        .from("usage_daily_rollups")
        .select("cost_center_id, total_cost_usd")
        .eq("team_id", teamId)
        .gte("date", monthStart)
        .lte("date", monthEnd)
    : { data: [] };

  const spendByCostCenter: Record<string, number> = {};
  for (const row of rollups ?? []) {
    if (row.cost_center_id) {
      spendByCostCenter[row.cost_center_id] =
        (spendByCostCenter[row.cost_center_id] ?? 0) +
        Number(row.total_cost_usd ?? 0);
    }
  }

  // Fetch member counts per cost center
  const { data: memberRows } = teamId
    ? await admin
        .from("cost_center_members")
        .select("cost_center_id")
        .eq("team_id", teamId)
    : { data: [] };

  const memberCountByCostCenter: Record<string, number> = {};
  for (const row of memberRows ?? []) {
    memberCountByCostCenter[row.cost_center_id] =
      (memberCountByCostCenter[row.cost_center_id] ?? 0) + 1;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cost Centers</h1>
          <p className="text-sm text-kova-silver-dim mt-0.5">
            Track spend by organizational unit
          </p>
        </div>
        <Link
          href="/dashboard/cost-centers/new"
          className="flex items-center gap-2 px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
        >
          <Plus size={14} />
          Create Cost Center
        </Link>
      </div>

      {!costCenters || costCenters.length === 0 ? (
        <div className="bg-kova-surface border border-kova-border rounded-xl p-16 text-center">
          <p className="text-kova-silver-dim">No cost centers yet.</p>
          <p className="text-sm text-kova-silver-dim mt-2">
            Create a cost center to start tracking spend by department or
            project group.
          </p>
          <Link
            href="/dashboard/cost-centers/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
          >
            <Plus size={14} />
            Create Cost Center
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {costCenters.map((cc) => {
            const spendMtd = spendByCostCenter[cc.id] ?? 0;
            const budget = cc.budget_usd ? Number(cc.budget_usd) : null;
            const usedPct =
              budget && budget > 0
                ? Math.min(100, (spendMtd / budget) * 100)
                : null;
            const memberCount = memberCountByCostCenter[cc.id] ?? 0;

            return (
              <Link
                key={cc.id}
                href={`/dashboard/cost-centers/${cc.id}`}
                className="bg-kova-surface border border-kova-border rounded-xl p-5 hover:border-kova-blue/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white group-hover:text-kova-blue transition-colors">
                    {cc.name}
                  </h3>
                  <span className="text-xs text-kova-silver-dim">
                    {memberCount} member{memberCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-2xl font-bold text-white mb-0.5">
                  {formatCost(spendMtd)}
                </p>
                <p className="text-xs text-kova-silver-dim mb-3">
                  spend MTD
                  {budget ? <span> / {formatCost(budget)} budget</span> : null}
                </p>

                {usedPct !== null ? (
                  <>
                    <div className="h-1.5 rounded-full bg-kova-charcoal-light overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          usedPct >= 90
                            ? "bg-red-500"
                            : usedPct >= 75
                              ? "bg-amber-500"
                              : "bg-kova-blue",
                        )}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-kova-silver-dim mt-1.5">
                      {usedPct.toFixed(1)}% used
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-kova-silver-dim">No budget set</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
