import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/v1/usage/export -- Dashboard-only CSV export of usage records
//
// Authentication: session cookie (dashboard users only, not API key)
//
// Query params:
//   range   -- "7d" | "30d" | "90d"  (default: "30d")
//   tool    -- exact match filter
//   model   -- exact match filter
//   project -- partial (ilike) match filter
//
// Response: text/csv attachment with columns:
//   date,tool,model,project,session_id,input_tokens,output_tokens,cost_usd
//
// Limits: max 10,000 rows. If truncated, X-Truncated: true header is added.

const MAX_ROWS = 10_000;

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function getRangeStart(range: string): Date {
  const days = RANGE_DAYS[range] ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return since;
}

// Minimal CSV escaping: wrap values containing commas, quotes, or newlines in double
// quotes, and double-up any literal quote characters inside.
function csvEscape(value: string | null | undefined): string {
  const str = value ?? "";
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields
    .map((f) => csvEscape(f === null || f === undefined ? "" : String(f)))
    .join(",");
}

export async function GET(request: NextRequest) {
  // 1. Session auth -- dashboard only
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse query params
  const { searchParams } = request.nextUrl;
  const range = searchParams.get("range") ?? "30d";
  const toolFilter = searchParams.get("tool") ?? "";
  const modelFilter = searchParams.get("model") ?? "";
  const projectFilter = searchParams.get("project") ?? "";

  const since = getRangeStart(range);

  // 3. Build query -- fetch one extra row to detect truncation
  let query = supabase
    .from("usage_records")
    .select(
      "recorded_at, tool, model, project, session_id, input_tokens, output_tokens, cost_usd",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: false })
    .limit(MAX_ROWS + 1); // +1 lets us detect when the true count exceeds the cap

  if (toolFilter) query = query.eq("tool", toolFilter);
  if (modelFilter) query = query.eq("model", modelFilter);
  if (projectFilter) query = query.ilike("project", `%${projectFilter}%`);

  const { data: rows, error: queryError } = await query;

  if (queryError) {
    console.error("usage export query error:", queryError);
    return NextResponse.json(
      { error: "Failed to fetch usage records" },
      { status: 500 },
    );
  }

  const allRows = rows ?? [];
  const truncated = allRows.length > MAX_ROWS;
  const outputRows = truncated ? allRows.slice(0, MAX_ROWS) : allRows;

  // 4. Build CSV
  const csvLines: string[] = [
    "date,tool,model,project,session_id,input_tokens,output_tokens,cost_usd",
  ];

  for (const r of outputRows) {
    csvLines.push(
      buildCsvRow([
        r.recorded_at,
        r.tool,
        r.model,
        r.project,
        r.session_id,
        r.input_tokens,
        r.output_tokens,
        r.cost_usd,
      ]),
    );
  }

  const csv = csvLines.join("\n");

  // 5. Build filename with current date
  const dateStamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `kova-usage-${dateStamp}.csv`;

  const headers = new Headers({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });

  if (truncated) {
    headers.set("X-Truncated", "true");
  }

  return new NextResponse(csv, { status: 200, headers });
}
