import { Webhooks } from "@polar-sh/nextjs";
import { createAdminClient } from "@/lib/supabase-admin";

type SubscriptionStatus = "active" | "canceled" | "past_due" | "revoked";

interface SubscriptionCustomer {
	id: string;
	email: string;
}

interface SubscriptionProduct {
	name: string;
}

interface SubscriptionMetadata {
	supabase_user_id?: string;
	team_id?: string;
	plan?: string;
	seats?: string;
}

interface SubscriptionData {
	id: string;
	status: string;
	currentPeriodEnd: Date;
	amount: number;
	currency: string;
	recurringInterval: string;
	customer: SubscriptionCustomer;
	product: SubscriptionProduct;
	metadata?: SubscriptionMetadata;
}

interface SubscriptionPayload {
	data: SubscriptionData;
}

function resolvePlanFromProduct(productName: string): string {
	const lower = productName.toLowerCase();
	if (lower.includes("enterprise")) return "enterprise";
	if (lower.includes("pro")) return "pro";
	return "free";
}

async function upsertSubscription(
	sub: SubscriptionData,
	overrideStatus?: SubscriptionStatus,
) {
	const admin = createAdminClient();

	// Resolve the Supabase user -- prefer metadata user_id, fall back to email lookup
	let userId: string | null = sub.metadata?.supabase_user_id ?? null;

	if (!userId) {
		const { data: resolvedId, error: userError } = await admin.rpc(
			"get_user_id_by_email",
			{ input_email: sub.customer.email },
		);

		if (userError || !resolvedId) {
			console.error(
				"Could not resolve user for email:",
				sub.customer.email,
				userError,
			);
			return;
		}
		userId = resolvedId as string;
	}

	const status: SubscriptionStatus =
		overrideStatus ?? (sub.status as SubscriptionStatus);
	const productName = sub.product.name;
	const planName =
		status === "active" ? resolvePlanFromProduct(productName) : "free";
	const seats = Math.max(1, parseInt(sub.metadata?.seats ?? "1", 10) || 1);

	// Upsert to subscriptions table
	const { error: upsertError } = await admin.from("subscriptions").upsert(
		{
			user_id: userId,
			subscription_id: sub.id,
			subscription_status: status,
			product_name: productName,
			billing_interval: sub.recurringInterval,
			price_amount: sub.amount / 100,
			currency: sub.currency,
			starts_at: new Date().toISOString(),
			ends_at: sub.currentPeriodEnd?.toISOString() ?? null,
			polar_customer_id: sub.customer.id,
			updated_at: new Date().toISOString(),
		},
		{
			onConflict: "user_id,subscription_id",
		},
	);

	if (upsertError) {
		console.error("Subscription upsert error:", upsertError);
		return;
	}

	// Update profiles.plan
	const { error: profileError } = await admin
		.from("profiles")
		.update({ plan: planName, updated_at: new Date().toISOString() })
		.eq("id", userId);

	if (profileError) {
		console.error("Profile plan update error:", profileError);
	}

	// Update team plan and seats if a team_id is provided in metadata
	const teamId = sub.metadata?.team_id;
	if (teamId) {
		const { error: teamError } = await admin
			.from("teams")
			.update({
				plan: status === "active" ? planName : "free",
				seats_purchased: status === "active" ? seats : 1,
				updated_at: new Date().toISOString(),
			})
			.eq("id", teamId);

		if (teamError) {
			console.error("Team plan update error:", teamError);
		}
		return;
	}

	// No team_id in metadata -- find the team the user owns and update it
	if (status === "active") {
		const { data: ownedMembership } = await admin
			.from("team_members")
			.select("team_id")
			.eq("user_id", userId)
			.eq("role", "owner")
			.limit(1)
			.maybeSingle();

		if (ownedMembership) {
			const { error: teamError } = await admin
				.from("teams")
				.update({
					plan: planName,
					seats_purchased: seats,
					updated_at: new Date().toISOString(),
				})
				.eq("id", ownedMembership.team_id);

			if (teamError) {
				console.error("Team plan update (owner lookup) error:", teamError);
			}
		}
	}
}

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

if (!webhookSecret) {
	console.error(
		"POLAR_WEBHOOK_SECRET is not set -- webhook handler is disabled.",
	);
}

// When the secret is missing, export a stub that returns 503 so the route still
// compiles and Polar receives a clear error rather than a 500/404.
export const POST = webhookSecret
	? Webhooks({
			webhookSecret,

			onSubscriptionCreated: async (payload) => {
				const sub = (payload as unknown as SubscriptionPayload).data;
				await upsertSubscription(sub, "active");
			},

			onSubscriptionUpdated: async (payload) => {
				const sub = (payload as unknown as SubscriptionPayload).data;
				await upsertSubscription(sub);
			},

			onSubscriptionCanceled: async (payload) => {
				const sub = (payload as unknown as SubscriptionPayload).data;
				await upsertSubscription(sub, "canceled");
			},

			onSubscriptionRevoked: async (payload) => {
				const sub = (payload as unknown as SubscriptionPayload).data;
				await upsertSubscription(sub, "revoked");
			},
		})
	: () =>
			import("next/server").then(({ NextResponse }) =>
				NextResponse.json(
					{ error: "Webhook handler not configured" },
					{ status: 503 },
				),
			);
