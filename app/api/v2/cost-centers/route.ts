import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// GET  /api/v2/cost-centers  -- list cost centers for the team
// POST /api/v2/cost-centers  -- create a new cost center (requires write scope)

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
    .from("cost_centers")
    .select(
      "id, team_id, name, description, budget_usd, tags, created_at, updated_at",
    )
    .eq("team_id", ctx.teamId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("v2 cost-centers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost centers", code: "QUERY_FAILED" },
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

  const { name, description, budget_usd, tags } = body as {
    name?: string;
    description?: string;
    budget_usd?: number;
    tags?: Record<string, unknown>;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      {
        error: "name is required and must be a non-empty string",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  if (
    budget_usd !== undefined &&
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

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cost_centers")
    .insert({
      team_id: ctx.teamId,
      name: name.trim(),
      description: description ?? null,
      budget_usd: budget_usd ?? null,
      tags: tags ?? {},
    })
    .select(
      "id, team_id, name, description, budget_usd, tags, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    console.error("v2 cost-centers POST error:", error);
    return NextResponse.json(
      { error: "Failed to create cost center", code: "CREATE_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
