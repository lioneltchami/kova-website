import { KpiCard } from "@/components/dashboard/kpi-card";
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
	title: "Dashboard Overview",
};

export default async function DashboardOverview() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { count: totalBuilds } = await supabase
		.from("builds")
		.select("*", { count: "exact", head: true })
		.eq("user_id", user!.id);

	const { data: recentBuilds } = await supabase
		.from("builds")
		.select("*")
		.eq("user_id", user!.id)
		.order("created_at", { ascending: false })
		.limit(10);

	const successCount =
		recentBuilds?.filter((b) => b.status === "success").length ?? 0;
	const totalTokens =
		recentBuilds?.reduce(
			(sum, b) => sum + (b.tokens_input ?? 0) + (b.tokens_output ?? 0),
			0,
		) ?? 0;
	const totalCost =
		recentBuilds?.reduce((sum, b) => sum + Number(b.cost_usd ?? 0), 0) ?? 0;
	const successRate =
		totalBuilds && totalBuilds > 0
			? Math.round((successCount / Math.min(totalBuilds, 10)) * 100)
			: 0;

	return (
		<div>
			<h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<KpiCard label="Total Builds" value={totalBuilds ?? 0} />
				<KpiCard label="Success Rate" value={`${successRate}%`} />
				<KpiCard label="Tokens Used" value={formatTokens(totalTokens)} />
				<KpiCard label="Total Cost" value={formatCost(totalCost)} />
			</div>

			{/* Recent Builds */}
			<div className="bg-kova-surface border border-kova-border rounded-xl p-6">
				<h2 className="text-lg font-semibold text-white mb-4">Recent Builds</h2>
				{!recentBuilds || recentBuilds.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-kova-silver-dim">No builds yet.</p>
						<p className="text-sm text-kova-silver-dim mt-2">
							Run <code className="text-kova-blue font-mono">kova build</code>{" "}
							with a dashboard API key to see your builds here.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="text-left text-xs text-kova-silver-dim uppercase border-b border-kova-border">
									<th className="pb-3 pr-4">Status</th>
									<th className="pb-3 pr-4">Plan</th>
									<th className="pb-3 pr-4">Duration</th>
									<th className="pb-3 pr-4">Tokens</th>
									<th className="pb-3 pr-4">Cost</th>
									<th className="pb-3">Date</th>
								</tr>
							</thead>
							<tbody>
								{recentBuilds.map((build) => (
									<tr
										key={build.id}
										className="border-b border-kova-border/50 hover:bg-kova-charcoal-light/40 transition-colors"
									>
										<td
											className={`py-3 pr-4 font-mono text-sm ${getStatusColor(build.status)}`}
										>
											{getStatusIcon(build.status)} {build.status}
										</td>
										<td className="py-3 pr-4 text-kova-silver text-sm">
											{build.plan_name ?? "—"}
										</td>
										<td className="py-3 pr-4 text-kova-silver-dim text-sm">
											{build.duration_ms
												? formatDuration(build.duration_ms)
												: "—"}
										</td>
										<td className="py-3 pr-4 text-kova-silver-dim text-sm">
											{formatTokens(
												(build.tokens_input ?? 0) + (build.tokens_output ?? 0),
											)}
										</td>
										<td className="py-3 pr-4 text-kova-silver-dim text-sm">
											{formatCost(Number(build.cost_usd ?? 0))}
										</td>
										<td className="py-3 text-kova-silver-dim text-sm">
											{formatRelativeDate(build.created_at)}
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
