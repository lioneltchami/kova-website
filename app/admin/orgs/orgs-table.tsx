"use client";

import { useRouter } from "next/navigation";

interface OrgRow {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  costMtd: number;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-kova-charcoal-light text-kova-silver-dim",
  pro: "bg-kova-blue/20 text-kova-blue",
  team: "bg-purple-900/30 text-purple-400",
  enterprise: "bg-amber-900/30 text-amber-400",
};

function formatCost(usd: number): string {
  if (usd < 0.01) return "$0.00";
  return `$${usd.toFixed(2)}`;
}

interface AdminOrgsTableProps {
  orgs: OrgRow[];
}

export function AdminOrgsTable({ orgs }: AdminOrgsTableProps) {
  const router = useRouter();

  function handlePlanOverride(orgId: string, name: string) {
    const newPlan = window.prompt(
      `Override plan for "${name}"?\nEnter: free, pro, team, enterprise`,
    );
    if (!newPlan) return;
    const valid = ["free", "pro", "team", "enterprise"];
    if (!valid.includes(newPlan)) {
      alert("Invalid plan. Must be: free, pro, team, or enterprise");
      return;
    }
    fetch("/api/admin/orgs/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, plan: newPlan }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          router.refresh();
        } else {
          alert("Failed: " + (data.error ?? "Unknown error"));
        }
      })
      .catch(() => alert("Request failed"));
  }

  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-kova-silver-dim uppercase tracking-wider border-b border-kova-border bg-kova-charcoal-light/30">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Members</th>
              <th className="px-4 py-3 font-medium">Cost MTD</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-kova-silver-dim"
                >
                  No organizations found
                </td>
              </tr>
            ) : (
              orgs.map((org) => (
                <tr
                  key={org.id}
                  className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-kova-silver font-medium">
                    {org.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        PLAN_COLORS[org.plan] ?? PLAN_COLORS.free
                      }`}
                    >
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-kova-silver-dim tabular-nums">
                    {org.memberCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-kova-silver tabular-nums">
                    {formatCost(org.costMtd)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handlePlanOverride(org.id, org.name)}
                      className="text-xs text-kova-blue hover:text-kova-blue-light transition-colors font-medium"
                    >
                      Override plan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-kova-border/50 text-xs text-kova-silver-dim">
        {orgs.length} org{orgs.length !== 1 ? "s" : ""} shown (max 200)
      </div>
    </div>
  );
}
