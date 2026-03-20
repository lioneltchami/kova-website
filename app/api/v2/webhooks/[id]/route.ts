import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// GET    /api/v2/webhooks/:id  -- fetch one webhook endpoint
// PATCH  /api/v2/webhooks/:id  -- update (requires write scope)
// DELETE /api/v2/webhooks/:id  -- delete (requires write scope)

const SUPPORTED_EVENTS = [
  "usage.synced",
  "budget.alert",
  "cost_center.created",
  "cost_center.updated",
  "cost_center.deleted",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("webhook_endpoints")
    .select("id, team_id, url, events, is_active, created_at, updated_at")
    .eq("id", id)
    .eq("team_id", ctx.teamId)
    .maybeSingle();

  if (error) {
    console.error("v2 webhooks GET/:id error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook endpoint", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Webhook endpoint not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const { url, events, is_active } = body as {
    url?: string;
    events?: string[];
    is_active?: boolean;
  };

  if (url !== undefined) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      return NextResponse.json(
        {
          error: "url must be a valid HTTP or HTTPS URL",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }
  }

  if (events !== undefined) {
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "events must be a non-empty array", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const invalid = events.filter((e) => !SUPPORTED_EVENTS.includes(e));
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: `Unsupported event types: ${invalid.join(", ")}`,
          code: "INVALID_EVENTS",
        },
        { status: 400 },
      );
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (url !== undefined) updates.url = url;
  if (events !== undefined) updates.events = events;
  if (is_active !== undefined) updates.is_active = is_active;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhook_endpoints")
    .update(updates)
    .eq("id", id)
    .eq("team_id", ctx.teamId)
    .select("id, team_id, url, events, is_active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    console.error("v2 webhooks PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update webhook endpoint", code: "UPDATE_FAILED" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Webhook endpoint not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const admin = createAdminClient();

  const { error, count } = await admin
    .from("webhook_endpoints")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("team_id", ctx.teamId);

  if (error) {
    console.error("v2 webhooks DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook endpoint", code: "DELETE_FAILED" },
      { status: 500 },
    );
  }

  if (count === 0) {
    return NextResponse.json(
      { error: "Webhook endpoint not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return new Response(null, { status: 204 });
}
