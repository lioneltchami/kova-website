import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatCost,
  formatDuration,
  formatRelativeDate,
  formatTokens,
  getStatusColor,
  getStatusIcon,
} from "@/lib/dashboard-utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Build Detail",
};

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: build } = await supabase
    .from("builds")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!build) notFound();

  const { data: tasks } = await supabase
    .from("build_tasks")
    .select("*")
    .eq("build_id", id)
    .order("created_at", { ascending: true });

  const totalTokens = (build.tokens_input ?? 0) + (build.tokens_output ?? 0);

  // Count models used across tasks
  const modelCounts: Record<string, number> = {};
  tasks?.forEach((t) => {
    if (t.model) {
      modelCounts[t.model] = (modelCounts[t.model] ?? 0) + 1;
    }
  });

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/builds"
        className="inline-flex items-center gap-2 text-sm text-kova-silver-dim hover:text-kova-silver mb-6 transition-colors"
      >
        &larr; Back to Builds
      </Link>

      {/* Header */}
      <div className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              {build.plan_name ?? "Build"}
            </h1>
            <p className="text-sm text-kova-silver-dim font-mono">{build.id}</p>
          </div>
          <span
            className={`text-lg font-mono font-semibold ${getStatusColor(build.status)}`}
          >
            {getStatusIcon(build.status)} {build.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-kova-border">
          <div>
            <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
              Started
            </p>
            <p className="text-sm text-kova-silver">
              {formatRelativeDate(build.started_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
              Duration
            </p>
            <p className="text-sm text-kova-silver">
              {build.duration_ms ? formatDuration(build.duration_ms) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
              Project
            </p>
            <p className="text-sm text-kova-silver">
              {build.project_name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
              CLI Version
            </p>
            <p className="text-sm text-kova-silver font-mono">
              {build.cli_version ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Token + Cost Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-2">
            Input Tokens
          </p>
          <p className="text-2xl font-bold text-white">
            {formatTokens(build.tokens_input ?? 0)}
          </p>
        </div>
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-2">
            Output Tokens
          </p>
          <p className="text-2xl font-bold text-white">
            {formatTokens(build.tokens_output ?? 0)}
          </p>
        </div>
        <div className="bg-kova-surface border border-kova-border rounded-xl p-5">
          <p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-2">
            Total Cost
          </p>
          <p className="text-2xl font-bold text-white">
            {formatCost(Number(build.cost_usd ?? 0))}
          </p>
          <p className="text-xs text-kova-silver-dim mt-1">
            {formatTokens(totalTokens)} total tokens
          </p>
        </div>
      </div>

      {/* Model Distribution */}
      {Object.keys(modelCounts).length > 0 && (
        <div className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-white mb-4">
            Model Distribution
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(modelCounts).map(([model, count]) => (
              <div
                key={model}
                className="flex items-center gap-2 px-3 py-1.5 bg-kova-charcoal-light rounded-lg"
              >
                <span className="text-sm font-mono text-kova-blue">
                  {model}
                </span>
                <span className="text-xs text-kova-silver-dim">
                  {count} task{count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Breakdown */}
      <div className="bg-kova-surface border border-kova-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-kova-border">
          <h2 className="text-base font-semibold text-white">
            Task Breakdown{tasks ? ` (${tasks.length})` : ""}
          </h2>
        </div>

        {!tasks || tasks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-kova-silver-dim text-sm">
              No task data available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border bg-kova-charcoal/30">
                  <th className="px-6 py-3">Task</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Tokens</th>
                  <th className="px-6 py-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
                  >
                    <td className="px-6 py-3 text-sm text-kova-silver font-mono">
                      {task.task_name}
                    </td>
                    <td
                      className={`px-6 py-3 text-sm font-mono ${getStatusColor(task.status)}`}
                    >
                      {getStatusIcon(task.status)} {task.status}
                    </td>
                    <td className="px-6 py-3 text-sm text-kova-silver-dim">
                      {task.agent_type ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-kova-silver-dim font-mono">
                      {task.model ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-kova-silver-dim">
                      {task.duration_ms
                        ? formatDuration(task.duration_ms)
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-kova-silver-dim">
                      {formatTokens(
                        (task.tokens_input ?? 0) + (task.tokens_output ?? 0),
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-kova-silver-dim">
                      {formatCost(Number(task.cost_usd ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
