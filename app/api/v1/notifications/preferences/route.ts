import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// GET /api/v1/notifications/preferences
// Returns the authenticated user's notification_preferences from profiles.
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("preferences GET: failed to fetch profile:", profileError);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }

  // Return preferences with defaults if the column is null (pre-migration rows)
  const preferences = profile?.notification_preferences ?? {
    weekly_digest: true,
    budget_alerts: true,
    slack_enabled: false,
  };

  return NextResponse.json({ preferences });
}

// PATCH /api/v1/notifications/preferences
// Merges the incoming partial preferences object into the user's existing
// notification_preferences JSONB field. Unknown keys are preserved.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate that the incoming keys are known preference fields
  const allowedKeys = new Set([
    "weekly_digest",
    "budget_alerts",
    "slack_enabled",
    "weekly_reports_enabled",
  ]);
  const unknownKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
  if (unknownKeys.length > 0) {
    return NextResponse.json(
      { error: `Unknown preference keys: ${unknownKeys.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate that values are booleans
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "boolean") {
      return NextResponse.json(
        { error: `Preference "${key}" must be a boolean` },
        { status: 400 },
      );
    }
  }

  const admin = createAdminClient();

  // Fetch current preferences to merge into
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    console.error("preferences PATCH: failed to fetch profile:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch current preferences" },
      { status: 500 },
    );
  }

  const current = profile?.notification_preferences ?? {
    weekly_digest: true,
    budget_alerts: true,
    slack_enabled: false,
  };

  const merged = { ...current, ...body };

  const { error: updateError } = await admin
    .from("profiles")
    .update({ notification_preferences: merged })
    .eq("id", user.id);

  if (updateError) {
    console.error(
      "preferences PATCH: failed to update preferences:",
      updateError,
    );
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json({ preferences: merged });
}
