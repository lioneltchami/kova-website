import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// GET   /api/v2/admin/orgs  -- list all teams (operator only)
// PATCH /api/v2/admin/orgs  -- override a team's plan (operator only)
//
// Operator status is checked via is_operator on the user's profile row.
// This column is set only by service-role operations (not user-editable).

async function requireOperator(): Promise<{ userId: string } | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_operator")
    .eq("id", user.id)
    .maybeSingle();

  if (!(profile as { is_operator?: boolean } | null)?.is_operator) {
    return NextResponse.json(
      { error: "Operator access required", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  return { userId: user.id };
}

export async function GET(request: NextRequest) {
  const result = await requireOperator();
  if (result instanceof NextResponse) return result;

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const PAGE_SIZE = 100;

  const admin = createAdminClient();
  let query = admin
    .from("teams")
    .select(
      "id, name, slug, plan, seats_purchased, created_by, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf8");
      query = query.lt("created_at", decoded);
    } catch {
      return NextResponse.json(
        { error: "Invalid cursor", code: "INVALID_CURSOR" },
        { status: 400 },
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("v2 admin/orgs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  let nextCursor: string | null = null;
  if (hasMore && page.length > 0) {
    const last = page[page.length - 1] as { created_at: string };
    nextCursor = Buffer.from(last.created_at).toString("base64");
  }

  return NextResponse.json({
    data: page,
    next_cursor: nextCursor,
    has_more: hasMore,
  });
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator();
  if (result instanceof NextResponse) return result;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const { team_id, plan } = body as { team_id?: string; plan?: string };

  if (!team_id || typeof team_id !== "string") {
    return NextResponse.json(
      { error: "team_id is required", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const VALID_PLANS = ["free", "pro", "enterprise"];
  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json(
      {
        error: `plan must be one of: ${VALID_PLANS.join(", ")}`,
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("teams")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", team_id)
    .select("id, name, plan, updated_at")
    .maybeSingle();

  if (error) {
    console.error("v2 admin/orgs PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update team plan", code: "UPDATE_FAILED" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Team not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}
