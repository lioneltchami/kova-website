import { type NextRequest, NextResponse } from "next/server";
import { requireScope, verifyApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-admin";

// GET /api/v2/usage/rollup
// Returns pre-aggregated usage data grouped by the specified dimension.
//
// Query params:
//   group_by  - required: day | week | month | tool | model | cost_center
//   since     - ISO 8601 lower bound (inclusive)
//   until     - ISO 8601 upper bound (inclusive)
//
// Response: { data: RollupRow[] }

type GroupBy = "day" | "week" | "month" | "tool" | "model" | "cost_center";

const VALID_GROUP_BY: GroupBy[] = [
  "day",
  "week",
  "month",
  "tool",
  "model",
  "cost_center",
];

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
  const groupByParam = searchParams.get("group_by") as GroupBy | null;
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  if (!groupByParam || !VALID_GROUP_BY.includes(groupByParam)) {
    return NextResponse.json(
      {
        error: `group_by is required and must be one of: ${VALID_GROUP_BY.join(", ")}`,
        code: "INVALID_GROUP_BY",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  if (
    groupByParam === "day" ||
    groupByParam === "week" ||
    groupByParam === "month"
  ) {
    // Use the pre-aggregated daily rollup table
    let query = admin
      .from("usage_daily_rollups")
      .select(
        "date, tool, model, total_sessions, total_input_tokens, total_output_tokens, total_cost_usd",
      )
      .eq("team_id", ctx.teamId)
      .order("date", { ascending: false });

    if (since) query = query.gte("date", since);
    if (until) query = query.lte("date", until);

    const { data, error } = await query;
    if (error) {
      console.error("v2 rollup query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch rollup data", code: "QUERY_FAILED" },
        { status: 500 },
      );
    }

    const rows = data ?? [];

    // For week/month grouping, aggregate on the application side from daily rows
    if (groupByParam === "week" || groupByParam === "month") {
      type DailyRow = {
        date: string;
        tool: string;
        model: string;
        total_sessions: number;
        total_input_tokens: number;
        total_output_tokens: number;
        total_cost_usd: number;
      };

      const buckets = new Map<
        string,
        {
          period: string;
          total_sessions: number;
          total_input_tokens: number;
          total_output_tokens: number;
          total_cost_usd: number;
        }
      >();

      for (const row of rows as DailyRow[]) {
        const d = new Date(row.date);
        let period: string;
        if (groupByParam === "month") {
          period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        } else {
          // ISO week: Monday-based
          const day = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1;
          const monday = new Date(d);
          monday.setUTCDate(d.getUTCDate() - day);
          period = monday.toISOString().slice(0, 10);
        }

        const existing = buckets.get(period);
        if (existing) {
          existing.total_sessions += row.total_sessions;
          existing.total_input_tokens += row.total_input_tokens;
          existing.total_output_tokens += row.total_output_tokens;
          existing.total_cost_usd += row.total_cost_usd;
        } else {
          buckets.set(period, {
            period,
            total_sessions: row.total_sessions,
            total_input_tokens: row.total_input_tokens,
            total_output_tokens: row.total_output_tokens,
            total_cost_usd: row.total_cost_usd,
          });
        }
      }

      const aggregated = Array.from(buckets.values()).sort((a, b) =>
        b.period.localeCompare(a.period),
      );
      return NextResponse.json({ data: aggregated });
    }

    return NextResponse.json({ data: rows });
  }

  // For tool, model, cost_center: query usage_records directly and group
  let query = admin
    .from("usage_records")
    .select(
      "tool, model, cost_center_id, input_tokens, output_tokens, cost_usd, recorded_at",
    )
    .eq("team_id", ctx.teamId);

  if (since) query = query.gte("recorded_at", since);
  if (until) query = query.lte("recorded_at", until);

  const { data, error } = await query;
  if (error) {
    console.error("v2 rollup query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rollup data", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  type UsageRow = {
    tool: string;
    model: string;
    cost_center_id: string | null;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };

  const rows = (data ?? []) as UsageRow[];
  const buckets = new Map<
    string,
    {
      group_key: string;
      total_records: number;
      total_input_tokens: number;
      total_output_tokens: number;
      total_cost_usd: number;
    }
  >();

  for (const row of rows) {
    const key =
      groupByParam === "tool"
        ? row.tool
        : groupByParam === "model"
          ? row.model
          : (row.cost_center_id ?? "unassigned");

    const existing = buckets.get(key);
    if (existing) {
      existing.total_records += 1;
      existing.total_input_tokens += row.input_tokens;
      existing.total_output_tokens += row.output_tokens;
      existing.total_cost_usd += row.cost_usd;
    } else {
      buckets.set(key, {
        group_key: key,
        total_records: 1,
        total_input_tokens: row.input_tokens,
        total_output_tokens: row.output_tokens,
        total_cost_usd: row.cost_usd,
      });
    }
  }

  const aggregated = Array.from(buckets.values()).sort(
    (a, b) => b.total_cost_usd - a.total_cost_usd,
  );

  return NextResponse.json({ data: aggregated });
}
