import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// GET /api/v2/usage
// Cursor-based pagination over usage_records for the authenticated API key's team.
//
// Query params:
//   cursor      - opaque cursor (base64-encoded "recorded_at,id" from previous page)
//   since       - ISO 8601 lower bound on recorded_at (inclusive)
//   until       - ISO 8601 upper bound on recorded_at (inclusive)
//   tool        - filter by tool name
//   model       - filter by model name
//   project     - filter by project name
//   cost_center_id - filter by cost center UUID
//
// Response: { data: UsageRecord[], next_cursor: string | null, has_more: boolean }

const PAGE_SIZE = 100;

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

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const since = searchParams.get("since");
  const until = searchParams.get("until");
  const tool = searchParams.get("tool");
  const model = searchParams.get("model");
  const project = searchParams.get("project");
  const costCenterId = searchParams.get("cost_center_id");

  const admin = createAdminClient();

  // Decode cursor: base64("recorded_at|id")
  let cursorRecordedAt: string | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf8");
      const parts = decoded.split("|");
      if (parts.length === 2) {
        cursorRecordedAt = parts[0];
        cursorId = parts[1];
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid cursor", code: "INVALID_CURSOR" },
        { status: 400 },
      );
    }
  }

  let query = admin
    .from("usage_records")
    .select(
      "id, user_id, team_id, tool, model, session_id, project, cost_center_id, input_tokens, output_tokens, cost_usd, recorded_at, duration_ms, cli_version, tags",
    )
    .eq("team_id", ctx.teamId)
    .order("recorded_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (since) query = query.gte("recorded_at", since);
  if (until) query = query.lte("recorded_at", until);
  if (tool) query = query.eq("tool", tool);
  if (model) query = query.eq("model", model);
  if (project) query = query.eq("project", project);
  if (costCenterId) query = query.eq("cost_center_id", costCenterId);

  // Apply cursor: seek to rows strictly before the cursor position
  if (cursorRecordedAt && cursorId) {
    // Records ordered DESC by (recorded_at, id): cursor points to last item on previous page.
    // We want rows where recorded_at < cursorRecordedAt,
    // OR recorded_at = cursorRecordedAt AND id < cursorId.
    query = query.or(
      `recorded_at.lt.${cursorRecordedAt},and(recorded_at.eq.${cursorRecordedAt},id.lt.${cursorId})`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("v2 usage query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage records", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  let nextCursor: string | null = null;
  if (hasMore && page.length > 0) {
    const last = page[page.length - 1] as { recorded_at: string; id: string };
    nextCursor = Buffer.from(`${last.recorded_at}|${last.id}`).toString(
      "base64",
    );
  }

  return NextResponse.json({
    data: page,
    next_cursor: nextCursor,
    has_more: hasMore,
  });
}
