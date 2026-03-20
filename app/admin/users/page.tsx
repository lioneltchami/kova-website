import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import { AdminUsersTable } from "./users-table";

export const metadata: Metadata = {
  title: "Admin - Users",
};

interface UserRow {
  id: string;
  email: string;
  plan: string;
  created_at: string;
  last_sync: string | null;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  let users: UserRow[] = [];

  try {
    const admin = createAdminClient();

    // Get profiles joined with last sync time from usage_records
    let profilesQuery = admin
      .from("profiles")
      .select("id, email, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (query) {
      profilesQuery = profilesQuery.ilike("email", `%${query}%`);
    }

    const { data: profiles } = await profilesQuery;

    if (profiles && profiles.length > 0) {
      // Batch-fetch last sync times
      const userIds = profiles.map((p) => p.id);
      const { data: lastSyncs } = await admin
        .from("usage_records")
        .select("user_id, recorded_at")
        .in("user_id", userIds)
        .order("recorded_at", { ascending: false });

      // Build map: user_id -> latest recorded_at
      const lastSyncMap: Record<string, string> = {};
      for (const row of lastSyncs ?? []) {
        if (!lastSyncMap[row.user_id]) {
          lastSyncMap[row.user_id] = row.recorded_at as string;
        }
      }

      users = profiles.map((p) => ({
        id: p.id,
        email: p.email,
        plan: p.plan,
        created_at: p.created_at,
        last_sync: lastSyncMap[p.id] ?? null,
      }));
    }
  } catch {
    // Admin client not configured
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-kova-silver-dim mt-0.5">
          All registered users and their current plan
        </p>
      </div>
      <AdminUsersTable users={users} initialQuery={query} />
    </div>
  );
}
