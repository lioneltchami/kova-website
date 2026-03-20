import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// GET /api/v2/audit-log
// Returns paginated audit events for the team.
// Requires admin scope (API key) or owner/admin role (session auth).
//
// Query params:
//   cursor        - opaque page cursor
//   since         - ISO 8601 lower bound on created_at
//   until         - ISO 8601 upper bound on created_at
//   actor_id      - filter by actor UUID
//   event_type    - filter by event type (e.g. INSERT, UPDATE, DELETE)
//   resource_type - filter by resource type (e.g. cost_centers, budgets)

const PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  // Support both API key auth (requires admin scope) and session auth (requires owner/admin role)
  const apiKeyCtx = await verifyApiKey(request);

  let teamId: string | null = null;

  if (apiKeyCtx) {
    // API key path: requires admin scope
    if (!requireScope(apiKeyCtx, "admin")) {
      return NextResponse.json(
        {
          error:
            "Insufficient scope: requires 'admin' scope for audit log access",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }
    teamId = apiKeyCtx.teamId || null;
  } else {
    // Session auth path: requires owner or admin role in at least one team
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

    // Check that the user holds owner or admin role in at least one team
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          error: "Access denied: owner or admin role required",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }
    teamId = membership.team_id;
  }

  if (!teamId) {
    return NextResponse.json(
      { error: "Could not resolve team for audit log access", code: "NO_TEAM" },
      { status: 422 },
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const since = searchParams.get("since");
  const until = searchParams.get("until");
  const actorId = searchParams.get("actor_id");
  const eventType = searchParams.get("event_type");
  const resourceType = searchParams.get("resource_type");

  const admin = createAdminClient();

  let query = admin
    .from("audit_events")
    .select(
      "id, created_at, actor_id, actor_email, event_type, resource_type, resource_id, team_id, old_data, new_data, metadata",
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (since) query = query.gte("created_at", since);
  if (until) query = query.lte("created_at", until);
  if (actorId) query = query.eq("actor_id", actorId);
  if (eventType) query = query.eq("event_type", eventType);
  if (resourceType) query = query.eq("resource_type", resourceType);

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
    console.error("v2 audit-log GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

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
