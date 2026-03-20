import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_operator")
      .eq("id", user.id)
      .single();

    if (!profile?.is_operator) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as { orgId?: string; plan?: string };
    const { orgId, plan } = body;

    if (!orgId || !plan) {
      return NextResponse.json(
        { ok: false, error: "orgId and plan are required" },
        { status: 400 },
      );
    }

    const validPlans = ["free", "pro", "team", "enterprise"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan" },
        { status: 400 },
      );
    }

    const { error } = await admin
      .from("teams")
      .update({ plan, updated_at: new Date().toISOString() })
      .eq("id", orgId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
