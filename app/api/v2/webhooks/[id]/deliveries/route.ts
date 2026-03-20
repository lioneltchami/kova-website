import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// GET /api/v2/webhooks/:id/deliveries
// Returns paginated delivery history for a webhook endpoint.
//
// Query params:
//   cursor  - opaque page cursor
//   limit   - page size (max 100, default 50)

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

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

  const { id: endpointId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limitParam = parseInt(
    searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE),
    10,
  );
  const pageSize = Math.min(
    isNaN(limitParam) ? DEFAULT_PAGE_SIZE : limitParam,
    MAX_PAGE_SIZE,
  );

  const admin = createAdminClient();

  // Verify the endpoint belongs to the caller's team
  const { data: endpoint, error: endpointError } = await admin
    .from("webhook_endpoints")
    .select("id")
    .eq("id", endpointId)
    .eq("team_id", ctx.teamId)
    .maybeSingle();

  if (endpointError) {
    console.error("v2 deliveries endpoint check error:", endpointError);
    return NextResponse.json(
      { error: "Failed to verify endpoint ownership", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  if (!endpoint) {
    return NextResponse.json(
      { error: "Webhook endpoint not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  let query = admin
    .from("webhook_deliveries")
    .select(
      "id, endpoint_id, event_type, payload, status, attempt_count, next_attempt_at, last_response_code, last_response_body, created_at",
    )
    .eq("endpoint_id", endpointId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);

  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf8");
      const parts = decoded.split("|");
      if (parts.length === 2) {
        const [cursorCreatedAt, cursorId] = parts;
        query = query.or(
          `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`,
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid cursor", code: "INVALID_CURSOR" },
        { status: 400 },
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("v2 deliveries GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery history", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;

  let nextCursor: string | null = null;
  if (hasMore && page.length > 0) {
    const last = page[page.length - 1] as { created_at: string; id: string };
    nextCursor = Buffer.from(`${last.created_at}|${last.id}`).toString(
      "base64",
    );
  }

  return NextResponse.json({
    data: page,
    next_cursor: nextCursor,
    has_more: hasMore,
  });
}
