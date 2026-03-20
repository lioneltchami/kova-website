"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface UserRow {
  id: string;
  email: string;
  plan: string;
  created_at: string;
  last_sync: string | null;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-kova-charcoal-light text-kova-silver-dim",
  pro: "bg-kova-blue/20 text-kova-blue",
  team: "bg-purple-900/30 text-purple-400",
  enterprise: "bg-amber-900/30 text-amber-400",
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface AdminUsersTableProps {
  users: UserRow[];
  initialQuery: string;
}

export function AdminUsersTable({ users, initialQuery }: AdminUsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`/admin/users?${params.toString()}`);
    });
  }

  function handlePlanOverride(userId: string, email: string) {
    const newPlan = window.prompt(
      `Override plan for ${email}?\nEnter: free, pro, team, enterprise`,
    );
    if (!newPlan) return;
    const valid = ["free", "pro", "team", "enterprise"];
    if (!valid.includes(newPlan)) {
      alert("Invalid plan. Must be: free, pro, team, or enterprise");
      return;
    }
    // Fire server action via fetch to admin API
    fetch("/api/admin/users/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan: newPlan }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          router.refresh();
        } else {
          alert("Failed to update plan: " + (data.error ?? "Unknown error"));
        }
      })
      .catch(() => alert("Request failed"));
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-kova-silver-dim"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full pl-8 pr-4 py-2 text-sm bg-kova-surface border border-kova-border rounded-lg text-kova-silver placeholder-kova-silver-dim focus:outline-none focus:ring-1 focus:ring-kova-blue"
        />
      </div>

      {/* Table */}
      <div className="bg-kova-surface border border-kova-border rounded-xl overflow-hidden">
        {isPending && (
          <div className="h-0.5 bg-kova-blue/40 animate-pulse w-full" />
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-kova-silver-dim uppercase tracking-wider border-b border-kova-border bg-kova-charcoal-light/30">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last Sync</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-kova-silver-dim"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-kova-silver font-medium">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          PLAN_COLORS[user.plan] ?? PLAN_COLORS.free
                        }`}
                      >
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-kova-silver-dim">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-kova-silver-dim">
                      {formatDate(user.last_sync)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handlePlanOverride(user.id, user.email)}
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
          {users.length} user{users.length !== 1 ? "s" : ""} shown (max 200)
        </div>
      </div>
    </div>
  );
}
