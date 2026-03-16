import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

// POST /api/v1/api-keys -- Create new API key (plaintext returned once)
export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Call the private.create_api_key RPC via service role client
  const { data: key, error: rpcError } = await admin.rpc("create_api_key", {
    p_user_id: user.id,
    p_name: "CLI Key",
  });

  if (rpcError || !key) {
    console.error("create_api_key RPC error:", rpcError);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }

  // Return the plaintext key -- shown ONCE, never stored
  return NextResponse.json({ key: key as string }, { status: 201 });
}

// GET /api/v1/api-keys -- List API keys (safe fields only, never key_hash)
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Query private.api_keys via admin client -- RLS does not apply to service role
  // We scope by user_id explicitly for security
  const { data: keys, error: keysError } = await admin
    .schema("private")
    .from("api_keys")
    .select("id, name, key_prefix, is_active, last_used_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (keysError) {
    console.error("API keys query error:", keysError);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }

  return NextResponse.json({ keys: keys ?? [] });
}

// DELETE /api/v1/api-keys -- Revoke API key (soft delete by setting is_active = false)
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
  const keyId = searchParams.get("id");

  if (!keyId) {
    return NextResponse.json(
      { error: "Missing key id parameter" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .schema("private")
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", keyId)
    .eq("user_id", user.id); // Ensure user can only revoke their own keys

  if (updateError) {
    console.error("API key revoke error:", updateError);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
