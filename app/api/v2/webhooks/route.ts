import { randomBytes } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// GET  /api/v2/webhooks  -- list webhook endpoints for the team
// POST /api/v2/webhooks  -- create a new webhook endpoint (requires write scope)
//
// POST body: { url: string, events: string[] }
// The signing_secret is generated server-side and returned once on creation.

const SUPPORTED_EVENTS = [
  "usage.synced",
  "budget.alert",
  "cost_center.created",
  "cost_center.updated",
  "cost_center.deleted",
];

function isValidHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request);
  if (!ctx) {
    return NextResponse.json(
      { error: "Invalid or missing API key", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  if (!requireScope(ctx, "read")) {
    return NextResponse.json(
      { error: "Insufficient scope: requires 'read'", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  if (!ctx.teamId) {
    return NextResponse.json(
      { error: "API key is not associated with a team", code: "NO_TEAM" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhook_endpoints")
    .select("id, team_id, url, events, is_active, created_at, updated_at")
    .eq("team_id", ctx.teamId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("v2 webhooks GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook endpoints", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await verifyApiKey(request);
  if (!ctx) {
    return NextResponse.json(
      { error: "Invalid or missing API key", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  if (!requireScope(ctx, "write")) {
    return NextResponse.json(
      { error: "Insufficient scope: requires 'write'", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  if (!ctx.teamId) {
    return NextResponse.json(
      { error: "API key is not associated with a team", code: "NO_TEAM" },
      { status: 422 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const { url, events } = body as { url?: string; events?: unknown[] };

  if (!url || typeof url !== "string" || !isValidHttpsUrl(url)) {
    return NextResponse.json(
      {
        error: "url must be a valid HTTP or HTTPS URL",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: "events must be a non-empty array", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const invalidEvents = (events as string[]).filter(
    (e) => !SUPPORTED_EVENTS.includes(e),
  );
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      {
        error: `Unsupported event types: ${invalidEvents.join(", ")}. Supported: ${SUPPORTED_EVENTS.join(", ")}`,
        code: "INVALID_EVENTS",
      },
      { status: 400 },
    );
  }

  // Generate a signing secret -- returned to the caller once and stored in DB
  // for later HMAC signature verification at delivery time.
  const signingSecret = `whsec_${randomBytes(24).toString("hex")}`;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhook_endpoints")
    .insert({
      team_id: ctx.teamId,
      url,
      signing_secret: signingSecret,
      events: events as string[],
      is_active: true,
    })
    .select("id, team_id, url, events, is_active, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("v2 webhooks POST error:", error);
    return NextResponse.json(
      { error: "Failed to create webhook endpoint", code: "CREATE_FAILED" },
      { status: 500 },
    );
  }

  // Include signing_secret only on creation response -- it is never returned again.
  return NextResponse.json(
    { data: { ...data, signing_secret: signingSecret } },
    { status: 201 },
  );
}
