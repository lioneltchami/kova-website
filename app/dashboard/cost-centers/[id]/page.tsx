import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCost } from "@/lib/dashboard-utils";
import { createAdminClient } from "@/lib/supabase-admin";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Cost Center",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const TOOL_COLORS: Record<string, string> = {
  cursor: "bg-kova-blue/20 text-kova-blue",
  copilot: "bg-purple-900/30 text-purple-400",
  windsurf: "bg-cyan-900/30 text-cyan-400",
  devin: "bg-amber-900/30 text-amber-400",
};

function toolColor(tool: string) {
  return (
    TOOL_COLORS[tool.toLowerCase()] ??
    "bg-kova-charcoal-light text-kova-silver-dim"
  );
}

export default async function CostCenterDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  // Verify membership
  const { data: membership } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const teamId = membership?.team_id ?? null;

  if (!teamId) return notFound();

  // Fetch cost center
  const { data: cc } = await admin
    .from("cost_centers")
    .select("id, name, budget_usd, created_at")
    .eq("id", id)
    .eq("team_id", teamId)
    .single();

  if (!cc) return notFound();

  // Current month bounds
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // Rollups for this cost center this month
  const { data: rollups } = await admin
    .from("usage_daily_rollups")
    .select(
      "tool, user_id, total_cost_usd, total_input_tokens, total_output_tokens, total_sessions",
    )
    .eq("team_id", teamId)
    .eq("cost_center_id", id)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  // Tool breakdown
  const toolMap: Record<string, number> = {};
  for (const row of rollups ?? []) {
    toolMap[row.tool] =
      (toolMap[row.tool] ?? 0) + Number(row.total_cost_usd ?? 0);
  }
  const toolBreakdown = Object.entries(toolMap)
    .map(([tool, cost]) => ({ tool, cost }))
    .sort((a, b) => b.cost - a.cost);

  const totalSpendMtd = toolBreakdown.reduce((s, t) => s + t.cost, 0);
  const maxToolCost = toolBreakdown[0]?.cost ?? 1;

  // Member cost breakdown
  const memberCostMap: Record<string, number> = {};
  for (const row of rollups ?? []) {
    memberCostMap[row.user_id] =
      (memberCostMap[row.user_id] ?? 0) + Number(row.total_cost_usd ?? 0);
  }

  // Fetch member profiles
  const memberUserIds = Object.keys(memberCostMap);
  const { data: profiles } = memberUserIds.length
    ? await admin
        .from("profiles")
        .select("id, email, username")
        .in("id", memberUserIds)
    : { data: [] };

  const profileMap: Record<string, { email: string; username: string | null }> =
    {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = { email: p.email, username: p.username };
  }

  const memberRows = Object.entries(memberCostMap)
    .map(([userId, cost]) => ({
      userId,
      email: profileMap[userId]?.email ?? userId,
      username: profileMap[userId]?.username ?? null,
      cost,
    }))
    .sort((a, b) => b.cost - a.cost);

  const budget = cc.budget_usd ? Number(cc.budget_usd) : null;
  const usedPct =
    budget && budget > 0 ? Math.min(100, (totalSpendMtd / budget) * 100) : null;

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard/cost-centers"
        className="inline-flex items-center gap-1.5 text-sm text-kova-silver-dim hover:text-kova-silver transition-colors mb-5"
      >
        <ArrowLeft size={14} />
        Cost Centers
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{cc.name}</h1>
        <p className="text-sm text-kova-silver-dim mt-0.5">
          Cost center detail &mdash; current month
        </p>
      </div>

      {/* Budget progress */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Budget Progress
          </h2>
          <span className="text-sm text-kova-silver">
            {formatCost(totalSpendMtd)}
            {budget ? (
              <span className="text-kova-silver-dim">
                {" "}
                / {formatCost(budget)}
              </span>
            ) : null}
          </span>
        </div>
        <div className="h-3 rounded-full bg-kova-charcoal-light overflow-hidden">
          {usedPct !== null ? (
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
          ) : (
            <div
              className="h-full rounded-full bg-kova-blue/40"
              style={{ width: "100%" }}
            />
          )}
        </div>
        <p className="text-xs text-kova-silver-dim mt-2">
          {usedPct !== null
            ? `${usedPct.toFixed(1)}% of budget used this month`
            : "No budget configured for this cost center"}
        </p>
      </section>

      {/* Tool breakdown */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Tool Breakdown
        </h2>
        {toolBreakdown.length === 0 ? (
          <p className="text-sm text-kova-silver-dim">
            No tool usage this month.
          </p>
        ) : (
          <div className="space-y-3">
            {toolBreakdown.map(({ tool, cost }) => {
              const barWidth = (cost / maxToolCost) * 100;
              return (
                <div key={tool} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider w-20 text-center flex-shrink-0",
                      toolColor(tool),
                    )}
                  >
                    {tool}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-kova-charcoal-light">
                    <div
                      className="h-full rounded-full bg-kova-blue"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-kova-silver w-16 text-right flex-shrink-0">
                    {formatCost(cost)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Member cost table */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Member Costs
        </h2>
        {memberRows.length === 0 ? (
          <p className="text-sm text-kova-silver-dim">
            No member activity this month.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border">
                  <th className="pb-3 pr-4">Member</th>
                  <th className="pb-3 text-right">Cost MTD</th>
                </tr>
              </thead>
              <tbody>
                {memberRows.map((member) => (
                  <tr
                    key={member.userId}
                    className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <p className="text-sm text-white">
                        {member.username ?? member.email}
                      </p>
                      {member.username && (
                        <p className="text-xs text-kova-silver-dim mt-0.5">
                          {member.email}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-sm text-kova-silver text-right">
                      {formatCost(member.cost)}
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
