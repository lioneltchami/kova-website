import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code)
    return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?slack=error", request.url),
    );
  }

  // Exchange code for token
  const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const tokenData = await tokenResponse.json();

  if (!tokenData.ok) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?slack=error", request.url),
    );
  }

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  // Upsert slack integration
  const admin = createAdminClient();
  await admin.from("slack_integrations").upsert(
    {
      user_id: user.id,
      team_id: tokenData.team?.id ?? "",
      team_name: tokenData.team?.name ?? "",
      access_token: tokenData.access_token,
      bot_user_id: tokenData.bot_user_id ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return NextResponse.redirect(
    new URL("/dashboard/settings?slack=connected", request.url),
  );
}
