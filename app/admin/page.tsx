import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import { Users, Building2, BarChart3, CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Overview",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="bg-kova-surface border border-kova-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-kova-silver-dim uppercase tracking-wider font-medium">
          {label}
        </p>
        <span className="text-kova-blue opacity-60">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  let totalUsers = 0;
  let totalTeams = 0;
  let totalUsageRecords = 0;
  let activeSubscriptions = 0;

  try {
    const admin = createAdminClient();

    const [usersRes, teamsRes, usageRes, subsRes] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("teams").select("id", { count: "exact", head: true }),
      admin.from("usage_records").select("id", { count: "exact", head: true }),
      admin
        .from("subscriptions")
        .select("user_id", { count: "exact", head: true })
        .eq("subscription_status", "active"),
    ]);

    totalUsers = usersRes.count ?? 0;
    totalTeams = teamsRes.count ?? 0;
    totalUsageRecords = usageRes.count ?? 0;
    activeSubscriptions = subsRes.count ?? 0;
  } catch {
    // Admin client not configured in this environment
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wider bg-red-400/10 px-2 py-0.5 rounded">
            Operator
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-kova-silver-dim mt-0.5">
          Key metrics across all users and organizations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          icon={<Users size={18} />}
        />
        <KpiCard
          label="Total Teams"
          value={totalTeams.toLocaleString()}
          icon={<Building2 size={18} />}
        />
        <KpiCard
          label="Usage Records"
          value={totalUsageRecords.toLocaleString()}
          icon={<BarChart3 size={18} />}
        />
        <KpiCard
          label="Active Subscriptions"
          value={activeSubscriptions.toLocaleString()}
          icon={<CreditCard size={18} />}
        />
      </div>
    </div>
  );
}
