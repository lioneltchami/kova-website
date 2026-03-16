import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Polar product slug to display name mapping
// Actual product IDs are configured in Polar.sh dashboard -- these are placeholder slugs
const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  pro_monthly: "Kova Pro (Monthly)",
  pro_annual: "Kova Pro (Annual)",
  team_monthly: "Kova Team (Monthly)",
  team_annual: "Kova Team (Annual)",
};

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
  const productDisplayName =
    PRODUCT_DISPLAY_NAMES[product] ?? "Kova Pro (Monthly)";

  // Once Polar products are created, this route will create a real checkout session
  // using the @polar-sh/nextjs Checkout helper or direct API call to Polar.
  //
  // For now, return a clear JSON response describing what would happen.
  // The Polar accessToken and product IDs will be set via env vars (POLAR_ACCESS_TOKEN,
  // POLAR_ORG_ID) once products are configured on polar.sh.

  const polarOrgId = process.env.POLAR_ORG_ID;
  const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kova.dev";

  if (!polarAccessToken || !polarOrgId) {
    // Polar not yet configured -- return informative placeholder response
    return NextResponse.json({
      message: "Polar checkout not yet configured",
      product,
      product_display_name: productDisplayName,
      customer_email: user.email,
      supabase_user_id: user.id,
      next_step:
        "Configure POLAR_ACCESS_TOKEN and POLAR_ORG_ID env vars and create products on polar.sh",
    });
  }

  // Polar checkout URL construction via API
  // Once products are live, replace with actual Polar product IDs mapped from product slug
  const successUrl = `${appUrl}/dashboard?checkout=success&plan=${product}`;

  try {
    const polarRes = await fetch("https://api.polar.sh/v1/checkouts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${polarAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // product_id will be populated once Polar products are created
        // For now this is a placeholder that demonstrates the request shape
        success_url: successUrl,
        customer_email: user.email,
        metadata: {
          supabase_user_id: user.id,
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

    if (session.url) {
      return NextResponse.redirect(session.url);
    }

    return NextResponse.json({
      product,
      product_display_name: productDisplayName,
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
