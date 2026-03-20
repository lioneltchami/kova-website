import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// DELETE /api/v2/me
// Hard-deletes the authenticated user's account.
// Requires the explicit confirmation header: X-Confirm-Delete: true
// Session auth only (not API key) -- this is a destructive, irreversible action.
//
// Returns 204 on success.

export async function DELETE(request: NextRequest) {
  // Require session auth for destructive account operations
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

  // Explicit safety gate: caller must send X-Confirm-Delete: true
  const confirmHeader = request.headers.get("x-confirm-delete");
  if (confirmHeader !== "true") {
    return NextResponse.json(
      {
        error:
          "Account deletion requires the X-Confirm-Delete: true header. This action is irreversible.",
        code: "CONFIRMATION_REQUIRED",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Call the hard_delete_user RPC (implemented in a future migration).
  // Runs as service role so it can cascade-delete all user data.
  const { error } = await admin.rpc("hard_delete_user", {
    p_user_id: user.id,
  });

  if (error) {
    const isNotFound =
      error.code === "PGRST202" || error.message?.includes("does not exist");
    if (isNotFound) {
      // RPC not yet available -- fall back to Supabase admin API deletion
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error("admin.deleteUser error:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete account", code: "DELETE_FAILED" },
          { status: 500 },
        );
      }
      return new Response(null, { status: 204 });
    }

    console.error("hard_delete_user RPC error:", error);
    return NextResponse.json(
      { error: "Failed to delete account", code: "DELETE_FAILED" },
      { status: 500 },
    );
  }

  return new Response(null, { status: 204 });
}
