import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = (await request.json()) as { type: "github" | "slack" };
  if (!type || !["github", "slack"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (type === "github") {
    await admin
      .from("github_app_installations")
      .delete()
      .eq("user_id", user.id);
  } else {
    await admin.from("slack_integrations").delete().eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}
