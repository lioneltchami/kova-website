import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import { AdminOrgsTable } from "./orgs-table";

export const metadata: Metadata = {
  title: "Admin - Orgs",
};

interface OrgRow {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  costMtd: number;
}

export default async function AdminOrgsPage() {
  let orgs: OrgRow[] = [];

  try {
    const admin = createAdminClient();

    const { data: teams } = await admin
      .from("teams")
      .select("id, name, plan")
      .order("name")
      .limit(200);

    if (teams && teams.length > 0) {
      const teamIds = teams.map((t) => t.id);

      // Member counts
      const { data: memberCounts } = await admin
        .from("team_members")
        .select("team_id")
        .in("team_id", teamIds);

      const memberCountMap: Record<string, number> = {};
      for (const row of memberCounts ?? []) {
        memberCountMap[row.team_id] = (memberCountMap[row.team_id] ?? 0) + 1;
      }

      // Cost MTD via usage_daily_rollups
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

      // We need to join through team_members to usage_daily_rollups
      // Fetch all member user_ids grouped by team, then fetch rollups
      const { data: memberships } = await admin
        .from("team_members")
        .select("team_id, user_id")
        .in("team_id", teamIds);

      const teamUserMap: Record<string, string[]> = {};
      for (const m of memberships ?? []) {
        if (!teamUserMap[m.team_id]) teamUserMap[m.team_id] = [];
        teamUserMap[m.team_id].push(m.user_id);
      }

      const allUserIds = [
        ...new Set((memberships ?? []).map((m) => m.user_id)),
      ];

      const { data: rollups } = await admin
        .from("usage_daily_rollups")
        .select("user_id, total_cost_usd")
        .in("user_id", allUserIds)
        .gte("date", monthStart);

      const userCostMap: Record<string, number> = {};
      for (const r of rollups ?? []) {
        userCostMap[r.user_id] =
          (userCostMap[r.user_id] ?? 0) + Number(r.total_cost_usd ?? 0);
      }

      orgs = teams.map((t) => {
        const userIds = teamUserMap[t.id] ?? [];
        const costMtd = userIds.reduce(
          (sum, uid) => sum + (userCostMap[uid] ?? 0),
          0,
        );
        return {
          id: t.id,
          name: t.name,
          plan: t.plan ?? "free",
          memberCount: memberCountMap[t.id] ?? 0,
          costMtd,
        };
      });
    }
  } catch {
    // Admin client not configured
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="text-sm text-kova-silver-dim mt-0.5">
          All teams, member counts, and month-to-date spend
        </p>
      </div>
      <AdminOrgsTable orgs={orgs} />
    </div>
  );
}
