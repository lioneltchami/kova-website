/**
 * Polar Checkout Route
 *
 * Required environment variables:
 *   POLAR_ACCESS_TOKEN              - Polar.sh API access token
 *   POLAR_PRODUCT_PRO_MONTHLY       - Polar product ID for Kova Pro - Monthly
 *   POLAR_PRODUCT_PRO_ANNUAL        - Polar product ID for Kova Pro - Annual
 *   POLAR_PRODUCT_ENTERPRISE_MONTHLY - Polar product ID for Kova Enterprise - Monthly
 *   POLAR_PRODUCT_ENTERPRISE_ANNUAL  - Polar product ID for Kova Enterprise - Annual
 *   NEXT_PUBLIC_APP_URL             - App base URL (e.g. https://kova.dev)
 *
 * Usage: GET /api/polar/checkout?product=pro_monthly&seats=3
 *   product: pro_monthly | pro_annual | enterprise_monthly | enterprise_annual
 *   seats:   number (1-500, default 1)
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Map product slugs to env var names holding the Polar product IDs.
// Set these in your environment once products are created on polar.sh.
const PRODUCT_ENV_MAP: Record<string, string> = {
  pro_monthly: "POLAR_PRODUCT_PRO_MONTHLY",
  pro_annual: "POLAR_PRODUCT_PRO_ANNUAL",
  enterprise_monthly: "POLAR_PRODUCT_ENTERPRISE_MONTHLY",
  enterprise_annual: "POLAR_PRODUCT_ENTERPRISE_ANNUAL",
};

const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  pro_monthly: "Kova Pro (Monthly)",
  pro_annual: "Kova Pro (Annual)",
  enterprise_monthly: "Kova Enterprise (Monthly)",
  enterprise_annual: "Kova Enterprise (Annual)",
};

function getPlanFromSlug(slug: string): string {
  if (slug.startsWith("enterprise")) return "enterprise";
  if (slug.startsWith("pro")) return "pro";
  return "free";
}

// GET /api/polar/checkout -- Initiate a Polar checkout session
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "redirectTo",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(loginUrl);
  }

  const { searchParams } = new URL(request.url);
  const product = searchParams.get("product") ?? "pro_monthly";
  const seats = Math.max(
    1,
    Math.min(500, parseInt(searchParams.get("seats") ?? "1", 10) || 1),
  );

  const productDisplayName =
    PRODUCT_DISPLAY_NAMES[product] ?? "Kova Pro (Monthly)";

  const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kova.dev";

  if (!polarAccessToken) {
    return NextResponse.json({
      message: "Polar checkout not yet configured",
      product,
      product_display_name: productDisplayName,
      seats,
      customer_email: user.email,
      supabase_user_id: user.id,
      next_step:
        "Configure POLAR_ACCESS_TOKEN and Polar product ID env vars, then create products on polar.sh",
    });
  }

  // Resolve the Polar product ID from env
  const productEnvKey = PRODUCT_ENV_MAP[product];
  const polarProductId = productEnvKey ? process.env[productEnvKey] : undefined;

  if (!polarProductId) {
    // L-5: Log the missing env details server-side only; do not expose them in the response.
    console.error(
      `Polar product ID not configured for "${product}". ` +
        `Missing env var: ${productEnvKey ?? "unknown"}`,
    );
    return NextResponse.json(
      { error: `Checkout not available for product "${product}"` },
      { status: 503 },
    );
  }

  const successUrl = `${appUrl}/dashboard?checkout=success&plan=${getPlanFromSlug(product)}&seats=${seats}`;
  const plan = getPlanFromSlug(product);

  try {
    const polarRes = await fetch("https://api.polar.sh/v1/checkouts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${polarAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: polarProductId,
        success_url: successUrl,
        customer_email: user.email,
        metadata: {
          supabase_user_id: user.id,
          plan,
          seats: String(seats),
        },
      }),
    });

    if (!polarRes.ok) {
      const errBody = await polarRes.text();
      console.error("Polar checkout creation failed:", errBody);
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          product,
          product_display_name: productDisplayName,
        },
        { status: 502 },
      );
    }

    const session = (await polarRes.json()) as { url?: string; id?: string };

    // M-4: Only redirect to verified Polar checkout URLs to prevent open-redirect attacks.
    if (session.url) {
      if (!session.url.startsWith("https://checkout.polar.sh/")) {
        console.error("Polar returned unexpected checkout URL:", session.url);
        return NextResponse.json(
          { error: "Invalid checkout URL returned by payment provider" },
          { status: 502 },
        );
      }
      return NextResponse.redirect(session.url);
    }

    return NextResponse.json({
      product,
      product_display_name: productDisplayName,
      seats,
      session_id: session.id,
    });
  } catch (err) {
    console.error("Polar checkout error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
