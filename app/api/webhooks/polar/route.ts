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

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodEnd: Date;
  amount: number;
  currency: string;
  recurringInterval: string;
  customer: SubscriptionCustomer;
  product: SubscriptionProduct;
}

interface SubscriptionPayload {
  data: SubscriptionData;
}

async function upsertSubscription(
  sub: SubscriptionData,
  overrideStatus?: SubscriptionStatus,
) {
  const admin = createAdminClient();

  // Resolve the Supabase user from the customer's email
  const { data: userId, error: userError } = await admin.rpc(
    "get_user_id_by_email",
    { input_email: sub.customer.email },
  );

  if (userError || !userId) {
    console.error(
      "Could not resolve user for email:",
      sub.customer.email,
      userError,
    );
    return;
  }

  const status: SubscriptionStatus =
    overrideStatus ?? (sub.status as SubscriptionStatus);
  const productName = sub.product.name;

  // Upsert to subscriptions table
  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      user_id: userId as string,
      subscription_id: sub.id,
      subscription_status: status,
      product_name: productName,
      billing_interval: sub.recurringInterval,
      price_amount: sub.amount / 100, // Polar amounts are in cents
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

  // Update profiles.plan -- active subscriptions set the plan, cancels/revokes reset to free
  const planName =
    status === "active" ? resolvePlanFromProduct(productName) : "free";

  const { error: profileError } = await admin
    .from("profiles")
    .update({ plan: planName, updated_at: new Date().toISOString() })
    .eq("id", userId as string);

  if (profileError) {
    console.error("Profile plan update error:", profileError);
  }
}

function resolvePlanFromProduct(productName: string): string {
  const lower = productName.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("team")) return "team";
  if (lower.includes("pro")) return "pro";
  return "free";
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

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
});
