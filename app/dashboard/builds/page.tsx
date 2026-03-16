import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  formatCost,
  formatDuration,
  formatRelativeDate,
  formatTokens,
  getStatusColor,
  getStatusIcon,
} from "@/lib/dashboard-utils";

export const metadata = {
  title: "Builds",
};

const PAGE_SIZE = 25;

interface SearchParams {
  page?: string;
  status?: string;
  sort?: string;
}

export default async function BuildsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const statusFilter = params.status ?? "all";
  const sort = params.sort ?? "date";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("builds")
    .select("*", { count: "exact" })
    .eq("user_id", user!.id);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (sort === "duration") {
    query = query.order("duration_ms", { ascending: false });
  } else if (sort === "cost") {
    query = query.order("cost_usd", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: builds, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  function buildUrl(overrides: Partial<SearchParams>) {
    const p = new URLSearchParams();
    const merged = {
      page: String(page),
      status: statusFilter,
      sort,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "1") p.set(k, v);
    });
    const qs = p.toString();
    return `/dashboard/builds${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Builds</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status filter */}
        <div className="flex items-center gap-1 bg-kova-surface border border-kova-border rounded-lg overflow-hidden text-sm">
          {["all", "success", "failed", "running", "pending"].map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s, page: "1" })}
              className={`px-3 py-2 capitalize transition-colors ${
                statusFilter === s
                  ? "bg-kova-blue text-white"
                  : "text-kova-silver-dim hover:text-kova-silver"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 bg-kova-surface border border-kova-border rounded-lg overflow-hidden text-sm">
          {[
            { value: "date", label: "Date" },
            { value: "duration", label: "Duration" },
            { value: "cost", label: "Cost" },
          ].map((s) => (
            <Link
              key={s.value}
              href={buildUrl({ sort: s.value, page: "1" })}
              className={`px-3 py-2 transition-colors ${
                sort === s.value
                  ? "bg-kova-charcoal-light text-kova-silver"
                  : "text-kova-silver-dim hover:text-kova-silver"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-kova-surface border border-kova-border rounded-xl overflow-hidden">
        {!builds || builds.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-kova-silver-dim">No builds found.</p>
            {statusFilter !== "all" && (
              <Link
                href="/dashboard/builds"
                className="text-sm text-kova-blue hover:underline mt-2 inline-block"
              >
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border bg-kova-charcoal/30">
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Tokens</th>
                  <th className="px-6 py-3">Cost</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {builds.map((build) => (
                  <tr
                    key={build.id}
                    className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/builds/${build.id}`}
                        className={`font-mono text-sm hover:underline ${getStatusColor(build.status)}`}
                      >
                        {getStatusIcon(build.status)} {build.status}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-kova-silver text-sm">
                      {build.plan_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-kova-silver-dim text-sm">
                      {build.duration_ms
                        ? formatDuration(build.duration_ms)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-kova-silver-dim text-sm">
                      {formatTokens(
                        (build.tokens_input ?? 0) + (build.tokens_output ?? 0),
                      )}
                    </td>
                    <td className="px-6 py-4 text-kova-silver-dim text-sm">
                      {formatCost(Number(build.cost_usd ?? 0))}
                    </td>
                    <td className="px-6 py-4 text-kova-silver-dim text-sm">
                      {formatRelativeDate(build.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-kova-border">
            <p className="text-sm text-kova-silver-dim">
              Page {page} of {totalPages} ({count} total)
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-sm bg-kova-charcoal-light border border-kova-border rounded-lg text-kova-silver hover:text-white transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-sm bg-kova-blue text-white rounded-lg hover:bg-kova-blue-light transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
