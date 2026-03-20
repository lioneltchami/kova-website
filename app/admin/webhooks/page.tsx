import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import { AdminWebhooksTable } from "./webhooks-table";

export const metadata: Metadata = {
	title: "Admin - Webhooks",
};

interface FailedDelivery {
	id: string;
	endpointId: string;
	endpointUrl: string;
	teamName: string;
	eventType: string;
	attemptCount: number;
	lastResponseCode: number | null;
	createdAt: string;
}

export default async function AdminWebhooksPage() {
	let deliveries: FailedDelivery[] = [];

	try {
		const admin = createAdminClient();

		const { data: failed } = await admin
			.from("webhook_deliveries")
			.select(
				"id, endpoint_id, event_type, attempt_count, last_response_code, created_at",
			)
			.eq("status", "failed")
			.order("created_at", { ascending: false })
			.limit(200);

		if (failed && failed.length > 0) {
			const endpointIds = [...new Set(failed.map((d) => d.endpoint_id))];

			const { data: endpoints } = await admin
				.from("webhook_endpoints")
				.select("id, url, team_id")
				.in("id", endpointIds);

			const teamIds = [...new Set((endpoints ?? []).map((e) => e.team_id))];
			const { data: teams } = await admin
				.from("teams")
				.select("id, name")
				.in("id", teamIds);

			const endpointMap: Record<string, { url: string; teamId: string }> = {};
			for (const ep of endpoints ?? []) {
				endpointMap[ep.id] = { url: ep.url, teamId: ep.team_id };
			}

			const teamMap: Record<string, string> = {};
			for (const t of teams ?? []) {
				teamMap[t.id] = t.name;
			}

			deliveries = failed.map((d) => {
				const ep = endpointMap[d.endpoint_id];
				return {
					id: d.id,
					endpointId: d.endpoint_id,
					endpointUrl: ep?.url ?? "Unknown",
					teamName: ep ? (teamMap[ep.teamId] ?? "Unknown") : "Unknown",
					eventType: d.event_type,
					attemptCount: d.attempt_count,
					lastResponseCode: d.last_response_code ?? null,
					createdAt: d.created_at,
				};
			});
		}
	} catch {
		// Admin client not configured
	}

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-white">
					Failed Webhook Deliveries
				</h1>
				<p className="text-sm text-kova-silver-dim mt-0.5">
					All failed deliveries across all teams. Replay to retry delivery.
				</p>
			</div>
			<AdminWebhooksTable deliveries={deliveries} />
		</div>
	);
}
