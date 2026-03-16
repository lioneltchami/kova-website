import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// GET /api/v1/subscription -- Check subscription status
// Accepts either Bearer API key (CLI) or session cookie (dashboard)
export async function GET(request: NextRequest) {
  let userId: string | null = null;

  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    // CLI path: verify via API key
    const apiKey = authHeader.slice(7);
    const admin = createAdminClient();

    const { data: keyData, error: keyError } = await admin.rpc(
      "verify_api_key",
      { p_key: apiKey },
    );

    if (!keyError && keyData && keyData.length > 0 && keyData[0].valid) {
      userId = (keyData[0] as { valid: boolean; account_id: string })
        .account_id;
    }
  }

  // Dashboard path: fall back to session if no Bearer key resolved a user
  if (!userId) {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;
  }

  const admin = createAdminClient();

  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .select("subscription_status, product_name, ends_at, billing_interval")
    .eq("user_id", userId)
    .eq("subscription_status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) {
    console.error("Subscription query error:", subError);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 },
    );
  }

  if (!subscription) {
    // No active subscription -- free plan
    return NextResponse.json({
      plan: "free",
      active: false,
      ends_at: null,
    });
  }

  return NextResponse.json({
    plan: subscription.product_name.toLowerCase(),
    active: subscription.subscription_status === "active",
    ends_at: subscription.ends_at ?? null,
  });
}
