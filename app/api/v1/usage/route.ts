import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

// POST /api/v1/usage -- CLI uploads usage records, authenticated via Bearer API key
//
// Request body:
//   { records: UsageRecord[] }   -- max 500 records per request
//
// Each record shape:
//   {
//     id: string             -- client-generated idempotency key (deduped server-side)
//     tool: string           -- e.g. "Task", "Edit", "Bash"
//     model?: string         -- e.g. "claude-sonnet-4-6"
//     session_id?: string
//     project?: string
//     input_tokens: number
//     output_tokens: number
//     cost_usd: number
//     timestamp: string      -- ISO 8601 (mapped to recorded_at)
//     duration_ms?: number
//     cli_version?: string
//   }
//
// Response: { accepted: number, duplicates: number, errors: number }

export async function POST(request: NextRequest) {
  // 1. Extract and validate Bearer token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Bearer token" },
      { status: 401 },
    );
  }
  const apiKey = authHeader.slice(7);

  const admin = createAdminClient();

  // 2. Verify API key via service-role RPC (private schema function)
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

  // 3. Parse and validate body
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const records = body.records as unknown[];

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "No records provided" }, { status: 400 });
  }

  if (records.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 records per request" },
      { status: 400 },
    );
  }

  // 4. Resolve or create the user's team
  //    Users who have not been added to any team get an auto-created personal workspace.
  const { data: membership } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  let teamId: string | null = membership?.team_id ?? null;

  if (!teamId) {
    // Create personal workspace and add user as owner in a transaction-like sequence.
    // If the team insert succeeds but team_members fails, the orphaned team is harmless --
    // the next request will create another personal workspace attempt.
    const { data: team, error: teamError } = await admin
      .from("teams")
      .insert({
        name: "Personal",
        slug: `personal-${userId.slice(0, 8)}`,
        created_by: userId,
        plan: "free",
        seats_purchased: 1,
      })
      .select("id")
      .single();

    if (teamError || !team) {
      console.error("Personal team creation error:", teamError);
      return NextResponse.json(
        { error: "Failed to resolve team" },
        { status: 500 },
      );
    }

    teamId = team.id as string;

    const { error: memberError } = await admin.from("team_members").insert({
      team_id: teamId,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      // Non-fatal: the team exists; the membership row can be repaired later
      console.error("Team member insert error:", memberError);
    }
  }

  // 5. Upload records via service-role RPC (handles deduplication internally)
  const { data: result, error: uploadError } = await admin.rpc(
    "upload_usage_records",
    {
      p_team_id: teamId,
      p_user_id: userId,
      p_records: records,
    },
  );

  if (uploadError) {
    console.error("upload_usage_records RPC error:", uploadError);
    return NextResponse.json(
      { error: "Upload failed", details: uploadError.message },
      { status: 500 },
    );
  }

  // 6. Touch last_used_at on the API key (best-effort, non-fatal)
  //    The verify_api_key function already does this, so this is a no-op safety net
  //    in case the verify function is updated to skip the update.
  await admin
    .schema("private")
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("user_id", userId);

  const accepted: number = result?.[0]?.accepted ?? 0;
  const duplicates: number = result?.[0]?.duplicates ?? 0;

  return NextResponse.json(
    { accepted, duplicates, errors: 0 },
    { status: 201 },
  );
}
