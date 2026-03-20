import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// GET   /api/v2/admin/users?email=...  -- search users by email (operator only)
// PATCH /api/v2/admin/users            -- set is_operator flag (operator only)

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
  const email = searchParams.get("email");

  if (!email || email.trim().length === 0) {
    return NextResponse.json(
      { error: "email query parameter is required", code: "MISSING_PARAM" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Search via profiles table (email is stored there post-signup)
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, username, plan, is_operator, created_at, updated_at")
    .ilike("email", `%${email.trim()}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("v2 admin/users GET error:", error);
    return NextResponse.json(
      { error: "Failed to search users", code: "QUERY_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const operatorResult = await requireOperator();
  if (operatorResult instanceof NextResponse) return operatorResult;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const { user_id, is_operator } = body as {
    user_id?: string;
    is_operator?: boolean;
  };

  if (!user_id || typeof user_id !== "string") {
    return NextResponse.json(
      { error: "user_id is required", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  if (typeof is_operator !== "boolean") {
    return NextResponse.json(
      { error: "is_operator must be a boolean", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  // Prevent operators from demoting themselves (safety guard)
  if (user_id === operatorResult.userId && !is_operator) {
    return NextResponse.json(
      {
        error: "Operators cannot revoke their own operator status",
        code: "SELF_DEMOTION_DENIED",
      },
      { status: 409 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ is_operator, updated_at: new Date().toISOString() })
    .eq("id", user_id)
    .select("id, email, is_operator, updated_at")
    .maybeSingle();

  if (error) {
    console.error("v2 admin/users PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update operator flag", code: "UPDATE_FAILED" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}
