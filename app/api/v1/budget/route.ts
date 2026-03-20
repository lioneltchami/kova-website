import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Budget API -- session-authenticated (dashboard use only)
//
// GET  /api/v1/budget          -- list active budgets for the current user's team(s)
// POST /api/v1/budget          -- create or update a budget
// DELETE /api/v1/budget?id=... -- deactivate (soft-delete) a budget

type BudgetScope = "personal" | "team";
type BudgetPeriod = "daily" | "monthly";

interface BudgetInsert {
  team_id?: string | null;
  user_id: string;
  scope: BudgetScope;
  period: BudgetPeriod;
  amount_usd: number;
  warn_at_percent?: number;
}

// GET /api/v1/budget
// Returns all active budgets visible to the authenticated user.
// Includes personal budgets and budgets for all teams the user belongs to.
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS policy on budgets ensures only visible rows are returned
  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select(
      "id, team_id, user_id, scope, period, amount_usd, warn_at_percent, is_active, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (budgetsError) {
    console.error("Budgets query error:", budgetsError);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 },
    );
  }

  return NextResponse.json({ budgets: budgets ?? [] });
}

// POST /api/v1/budget
// Creates a new budget or updates an existing one (by id).
// Body: { id?: string, team_id?: string, scope, period, amount_usd, warn_at_percent? }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, team_id, scope, period, amount_usd, warn_at_percent } = body as {
    id?: string;
    team_id?: string;
    scope: BudgetScope;
    period: BudgetPeriod;
    amount_usd: number;
    warn_at_percent?: number;
  };

  // Validate required fields
  if (!scope || !["personal", "team"].includes(scope)) {
    return NextResponse.json(
      { error: "Invalid scope: must be 'personal' or 'team'" },
      { status: 400 },
    );
  }

  if (!period || !["daily", "monthly"].includes(period)) {
    return NextResponse.json(
      { error: "Invalid period: must be 'daily' or 'monthly'" },
      { status: 400 },
    );
  }

  if (typeof amount_usd !== "number" || amount_usd <= 0) {
    return NextResponse.json(
      { error: "amount_usd must be a positive number" },
      { status: 400 },
    );
  }

  // M-2: Validate warn_at_percent is within the allowed range (1-100).
  if (
    warn_at_percent !== undefined &&
    warn_at_percent !== null &&
    (typeof warn_at_percent !== "number" ||
      !Number.isInteger(warn_at_percent) ||
      warn_at_percent < 1 ||
      warn_at_percent > 100)
  ) {
    return NextResponse.json(
      { error: "warn_at_percent must be an integer between 1 and 100" },
      { status: 400 },
    );
  }

  // Team budgets require a team_id
  if (scope === "team" && !team_id) {
    return NextResponse.json(
      { error: "team_id is required for team-scoped budgets" },
      { status: 400 },
    );
  }

  if (id) {
    // Update existing budget -- RLS ensures user can only update budgets they own
    const { data: updated, error: updateError } = await supabase
      .from("budgets")
      .update({
        scope,
        period,
        amount_usd,
        warn_at_percent: warn_at_percent ?? 80,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .single();

    if (updateError || !updated) {
      console.error("Budget update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update budget or budget not found" },
        { status: updateError ? 500 : 404 },
      );
    }

    return NextResponse.json({ budget_id: updated.id, action: "updated" });
  }

  // Create new budget
  const insert: BudgetInsert = {
    user_id: user.id,
    scope,
    period,
    amount_usd,
    warn_at_percent: warn_at_percent ?? 80,
  };

  if (team_id) {
    insert.team_id = team_id;
  }

  const { data: created, error: createError } = await supabase
    .from("budgets")
    .insert(insert)
    .select("id")
    .single();

  if (createError || !created) {
    console.error("Budget create error:", createError);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { budget_id: created.id, action: "created" },
    { status: 201 },
  );
}

// DELETE /api/v1/budget?id=<uuid>
// Soft-deletes (deactivates) a budget. Hard deletion is not supported to preserve
// audit history for budget_alerts that reference this budget.
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required query parameter: id" },
      { status: 400 },
    );
  }

  // RLS ensures only the owner or team admin can deactivate a budget
  const { data: deactivated, error: deleteError } = await supabase
    .from("budgets")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .single();

  if (deleteError || !deactivated) {
    console.error("Budget deactivation error:", deleteError);
    return NextResponse.json(
      { error: "Failed to deactivate budget or budget not found" },
      { status: deleteError ? 500 : 404 },
    );
  }

  return NextResponse.json({
    budget_id: deactivated.id,
    action: "deactivated",
  });
}
