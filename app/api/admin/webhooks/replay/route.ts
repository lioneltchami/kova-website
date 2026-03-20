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

    const body = (await req.json()) as { deliveryId?: string };
    const { deliveryId } = body;

    if (!deliveryId) {
      return NextResponse.json(
        { ok: false, error: "deliveryId is required" },
        { status: 400 },
      );
    }

    // Reset the delivery to pending so the worker picks it up again
    const { error } = await admin
      .from("webhook_deliveries")
      .update({
        status: "pending",
        next_attempt_at: new Date().toISOString(),
      })
      .eq("id", deliveryId)
      .eq("status", "failed");

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
