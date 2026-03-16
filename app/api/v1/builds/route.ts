import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// POST /api/v1/builds -- CLI uploads build data, authenticated via Bearer API key
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Bearer token" },
      { status: 401 },
    );
  }
  const apiKey = authHeader.slice(7);

  const admin = createAdminClient();

  // Verify API key via RPC (runs in private schema, requires service role)
  const { data: keyData, error: keyError } = await admin.rpc("verify_api_key", {
    p_key: apiKey,
  });

  if (keyError || !keyData || keyData.length === 0 || !keyData[0].valid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { account_id: userId } = keyData[0] as {
    valid: boolean;
    account_id: string;
    account_email: string;
    account_plan: string;
  };

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    project_name,
    cli_version,
    plan_name,
    started_at,
    finished_at,
    duration_ms,
    status,
    exit_code,
    os,
    node_version,
    tokens_input,
    tokens_output,
    cost_usd,
    model_used,
    tasks,
  } = body as {
    project_name: string;
    cli_version: string;
    plan_name: string;
    started_at: string;
    finished_at: string;
    duration_ms: number;
    status: string;
    exit_code: number;
    os: string;
    node_version: string;
    tokens_input: number;
    tokens_output: number;
    cost_usd: number;
    model_used: string;
    tasks: Array<{
      task_name: string;
      status: string;
      agent_type: string | null;
      model: string | null;
      duration_ms: number | null;
      tokens_input: number;
      tokens_output: number;
      cost_usd: number;
    }>;
  };

  // Insert the build record
  const { data: buildData, error: buildError } = await admin
    .from("builds")
    .insert({
      user_id: userId,
      project_name,
      cli_version,
      plan_name,
      started_at,
      finished_at,
      duration_ms,
      status,
      exit_code,
      os,
      node_version,
      tokens_input: tokens_input ?? 0,
      tokens_output: tokens_output ?? 0,
      cost_usd: cost_usd ?? 0,
      model_used,
    })
    .select("id")
    .single();

  if (buildError || !buildData) {
    console.error("Build insert error:", buildError);
    return NextResponse.json(
      { error: "Failed to record build" },
      { status: 500 },
    );
  }

  const buildId = buildData.id as string;

  // Insert build tasks if provided
  if (Array.isArray(tasks) && tasks.length > 0) {
    const taskRows = tasks.map((t) => ({
      build_id: buildId,
      user_id: userId,
      task_name: t.task_name,
      status: t.status,
      agent_type: t.agent_type,
      model: t.model,
      duration_ms: t.duration_ms,
      tokens_input: t.tokens_input ?? 0,
      tokens_output: t.tokens_output ?? 0,
      cost_usd: t.cost_usd ?? 0,
    }));

    const { error: tasksError } = await admin
      .from("build_tasks")
      .insert(taskRows);

    if (tasksError) {
      // Non-fatal: build is recorded, tasks failed
      console.error("Build tasks insert error:", tasksError);
    }
  }

  return NextResponse.json(
    { build_id: buildId, status: "recorded" },
    { status: 201 },
  );
}

// GET /api/v1/builds -- Dashboard reads builds, authenticated via session
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)),
  );
  const status = searchParams.get("status");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("builds")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: builds, count, error: buildsError } = await query;

  if (buildsError) {
    console.error("Builds query error:", buildsError);
    return NextResponse.json(
      { error: "Failed to fetch builds" },
      { status: 500 },
    );
  }

  return NextResponse.json({ builds: builds ?? [], total: count ?? 0 });
}
