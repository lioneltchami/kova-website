import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// PATCH /api/v1/team/slack-webhook
// Updates the Slack incoming webhook URL for the authenticated user's team.
// Only team owners can update this setting.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { teamId?: string; webhookUrl?: string | null };
  try {
    body = (await request.json()) as { teamId?: string; webhookUrl?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { teamId, webhookUrl } = body;

  if (!teamId) {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }

  // Validate webhook URL format if provided
  if (webhookUrl != null && webhookUrl !== "") {
    if (!webhookUrl.startsWith("https://hooks.slack.com/")) {
      return NextResponse.json(
        { error: "Invalid Slack webhook URL. Must start with https://hooks.slack.com/" },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();

  // Verify user is owner of the team
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: updateError } = await admin
    .from("teams")
    .update({ slack_webhook_url: webhookUrl || null })
    .eq("id", teamId);

  if (updateError) {
    console.error("Slack webhook update error:", updateError);
    return NextResponse.json({ error: "Failed to update webhook URL" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
