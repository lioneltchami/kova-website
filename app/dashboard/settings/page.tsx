import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiKeyManager } from "@/components/dashboard/api-key-manager";
import { formatRelativeDate } from "@/lib/dashboard-utils";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
	title: "Settings",
};

export default async function SettingsPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("email, username, avatar_url, plan, created_at")
		.eq("id", user.id)
		.single();

	const { data: subscription } = await supabase
		.from("subscriptions")
		.select("*")
		.eq("user_id", user.id)
		.eq("subscription_status", "active")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	// Fetch API keys via admin would normally be needed since they're in private schema.
	// We expose them through the API endpoint client-side via ApiKeyManager.

	const plan = profile?.plan ?? "free";
	const isPaid = plan !== "free";

	return (
		<div className="max-w-3xl">
			<h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

			{/* Account section */}
			<section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
				<h2 className="text-base font-semibold text-white mb-4">Account</h2>

				<div className="flex items-center gap-4 mb-6">
					{profile?.avatar_url ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={profile.avatar_url}
							alt="Avatar"
							className="w-14 h-14 rounded-full border border-kova-border"
						/>
					) : (
						<div className="w-14 h-14 rounded-full bg-kova-charcoal-light border border-kova-border flex items-center justify-center text-kova-silver font-bold text-xl">
							{(profile?.email ?? user?.email ?? "?")[0].toUpperCase()}
						</div>
					)}
					<div>
						<p className="text-white font-semibold">
							{profile?.username ?? "—"}
						</p>
						<p className="text-sm text-kova-silver-dim">
							{profile?.email ?? user?.email}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-kova-border">
					<div>
						<p className="text-xs text-kova-silver-dim uppercase tracking-wider mb-1">
							Current Plan
						</p>
						<span
							className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${
								plan === "free"
									? "bg-kova-charcoal-light text-kova-silver"
									: plan === "pro"
										? "bg-kova-blue/20 text-kova-blue"
										: plan === "team"
											? "bg-purple-900/30 text-purple-400"
											: "bg-amber-900/30 text-amber-400"
							}`}
						>
							{plan}
						</span>
					</div>

					{!isPaid ? (
						<Link
							href="/pricing"
							className="px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
						>
							Upgrade to Pro
						</Link>
					) : (
						<div className="text-right">
							{subscription?.ends_at && (
								<p className="text-xs text-kova-silver-dim">
									Renews {formatRelativeDate(subscription.ends_at)}
								</p>
							)}
							<p className="text-xs text-green-400 mt-0.5">
								Active subscription
							</p>
						</div>
					)}
				</div>
			</section>

			{/* API Keys section */}
			<section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
				<h2 className="text-base font-semibold text-white mb-1">API Keys</h2>
				<p className="text-sm text-kova-silver-dim mb-4">
					API keys authenticate the Kova CLI with your dashboard.
				</p>
				<ApiKeyManager />
			</section>

			{/* Billing History */}
			<section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
				<h2 className="text-base font-semibold text-white mb-4">
					Billing History
				</h2>
				{!isPaid ? (
					<div className="text-center py-6">
						<p className="text-sm text-kova-silver-dim mb-3">
							No billing history. You are on the Free plan.
						</p>
						<Link
							href="/pricing"
							className="inline-block px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
						>
							Upgrade to Pro
						</Link>
					</div>
				) : (
					<div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-kova-border">
										<th className="text-left text-xs text-kova-silver-dim uppercase tracking-wider pb-3 pr-4">
											Date
										</th>
										<th className="text-left text-xs text-kova-silver-dim uppercase tracking-wider pb-3 pr-4">
											Plan
										</th>
										<th className="text-left text-xs text-kova-silver-dim uppercase tracking-wider pb-3 pr-4">
											Amount
										</th>
										<th className="text-left text-xs text-kova-silver-dim uppercase tracking-wider pb-3">
											Status
										</th>
									</tr>
								</thead>
								<tbody>
									{subscription ? (
										<tr className="border-b border-kova-border/50">
											<td className="py-3 pr-4 text-kova-silver">
												{new Date(subscription.created_at).toLocaleDateString(
													"en-US",
													{
														year: "numeric",
														month: "short",
														day: "numeric",
													},
												)}
											</td>
											<td className="py-3 pr-4 text-kova-silver capitalize">
												{subscription.product_name ?? "Pro"}
											</td>
											<td className="py-3 pr-4 text-kova-silver">
												{subscription.price_amount != null
													? `$${Number(subscription.price_amount).toFixed(2)}`
													: "—"}
											</td>
											<td className="py-3">
												<span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400">
													Active
												</span>
											</td>
										</tr>
									) : (
										<tr>
											<td
												colSpan={4}
												className="py-6 text-center text-kova-silver-dim text-sm"
											>
												No billing records found.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
						<div className="mt-4 pt-4 border-t border-kova-border">
							<a
								href="/api/polar/portal"
								className="text-sm text-kova-blue hover:text-kova-blue-light transition-colors"
							>
								Manage subscription &rarr;
							</a>
						</div>
					</div>
				)}
			</section>

			{/* CLI Setup */}
			<section className="bg-kova-surface border border-kova-border rounded-xl p-6">
				<h2 className="text-base font-semibold text-white mb-4">
					CLI Setup Instructions
				</h2>
				<ol className="space-y-3 text-sm">
					{[
						"Create an API key using the panel above",
						<>
							Run:{" "}
							<code className="text-kova-blue font-mono bg-kova-charcoal-light px-2 py-0.5 rounded">
								kova login
							</code>
						</>,
						"Paste your API key when prompted",
						"Done! Builds will now sync to your dashboard automatically.",
					].map((step, i) => (
						<li key={i} className="flex items-start gap-3">
							<span className="flex-shrink-0 w-5 h-5 rounded-full bg-kova-blue/20 text-kova-blue text-xs font-bold flex items-center justify-center mt-0.5">
								{i + 1}
							</span>
							<span className="text-kova-silver">{step}</span>
						</li>
					))}
				</ol>
				<p className="text-xs text-kova-silver-dim mt-4">
					After running{" "}
					<code className="text-kova-blue font-mono bg-kova-charcoal-light px-1.5 rounded">
						kova sync
					</code>
					, the &quot;Last sync&quot; date on your API key will update to
					reflect the most recent upload.
				</p>
			</section>
		</div>
	);
}
