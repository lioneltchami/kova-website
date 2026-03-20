import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// GET    /api/v2/cost-centers/:id  -- fetch one cost center
// PATCH  /api/v2/cost-centers/:id  -- update (requires write scope)
// DELETE /api/v2/cost-centers/:id  -- delete (requires write scope)

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
    .from("cost_centers")
    .select(
      "id, team_id, name, description, budget_usd, tags, created_at, updated_at",
    )
    .eq("id", id)
    .eq("team_id", ctx.teamId)
    .maybeSingle();

  if (error) {
    console.error("v2 cost-centers GET/:id error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost center", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Cost center not found", code: "NOT_FOUND" },
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

  const { name, description, budget_usd, tags } = body as {
    name?: string;
    description?: string;
    budget_usd?: number | null;
    tags?: Record<string, unknown>;
  };

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length === 0)
  ) {
    return NextResponse.json(
      { error: "name must be a non-empty string", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  if (
    budget_usd !== undefined &&
    budget_usd !== null &&
    (typeof budget_usd !== "number" || budget_usd < 0)
  ) {
    return NextResponse.json(
      {
        error: "budget_usd must be a non-negative number",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (budget_usd !== undefined) updates.budget_usd = budget_usd;
  if (tags !== undefined) updates.tags = tags;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cost_centers")
    .update(updates)
    .eq("id", id)
    .eq("team_id", ctx.teamId)
    .select(
      "id, team_id, name, description, budget_usd, tags, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    console.error("v2 cost-centers PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update cost center", code: "UPDATE_FAILED" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Cost center not found", code: "NOT_FOUND" },
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
    .from("cost_centers")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("team_id", ctx.teamId);

  if (error) {
    console.error("v2 cost-centers DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete cost center", code: "DELETE_FAILED" },
      { status: 500 },
    );
  }

  if (count === 0) {
    return NextResponse.json(
      { error: "Cost center not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return new Response(null, { status: 204 });
}
