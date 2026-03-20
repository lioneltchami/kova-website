import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit } from "./rate-limit-redis";

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

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  // 1. Content-length guard -- reject oversized payloads before reading the body
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Payload too large (max 10 MB)", code: "PAYLOAD_TOO_LARGE" },
      { status: 413 },
    );
  }

  // 2. Extract and validate Bearer token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Bearer token", code: "MISSING_AUTH" },
      { status: 401 },
    );
  }
  const apiKey = authHeader.slice(7);

  const admin = createAdminClient();

  // 3. Verify API key via service-role RPC (private schema function)
  const { data: keyData, error: keyError } = await admin.rpc("verify_api_key", {
    p_key: apiKey,
  });

  if (keyError || !keyData || keyData.length === 0 || !keyData[0].valid) {
    return NextResponse.json(
      { error: "Invalid API key", code: "INVALID_API_KEY" },
      { status: 401 },
    );
  }

  const { account_id: userId } = keyData[0] as {
    valid: boolean;
    account_id: string;
    account_email: string;
    account_plan: string;
  };

  // 4. Rate limit check -- keyed by first 8 chars of the API key
  const keyPrefix = apiKey.slice(0, 8);
  const rateLimit = await checkRateLimit(keyPrefix);

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil(
      (rateLimit.resetAt - Date.now()) / 1000,
    );
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMIT" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      },
    );
  }

  // 5. Parse and validate body
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const records = body.records as unknown[];

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json(
      { error: "No records provided", code: "NO_RECORDS" },
      { status: 400 },
    );
  }

  if (records.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 records per request", code: "TOO_MANY_RECORDS" },
      { status: 400 },
    );
  }

  // 5b. H-2: Validate field lengths before sending records to the database.
  //     These limits mirror the CHECK constraints in migration 003.
  const FIELD_LIMITS: Record<string, number> = {
    tool: 50,
    model: 100,
    session_id: 200,
    project: 500,
    cli_version: 50,
  };

  for (let i = 0; i < records.length; i++) {
    const rec = records[i] as Record<string, unknown>;
    for (const [field, maxLen] of Object.entries(FIELD_LIMITS)) {
      const val = rec[field];
      if (typeof val === "string" && val.length > maxLen) {
        return NextResponse.json(
          {
            error: `Record ${i}: field "${field}" exceeds maximum length of ${maxLen}`,
            code: "FIELD_TOO_LONG",
          },
          { status: 400 },
        );
      }
    }
  }

  // 6. Resolve or create the user's team
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
        { error: "Failed to resolve team", code: "TEAM_RESOLVE_FAILED" },
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

  // 7. Upload records via service-role RPC (handles deduplication internally)
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
      {
        error: "Upload failed",
        details: uploadError.message,
        code: "UPLOAD_FAILED",
      },
      { status: 500 },
    );
  }

  // 8. Invalidate the per-user rollup cache so the dashboard reflects new data
  //    on the next page load without waiting for the 5-minute TTL to expire.
  revalidateTag(`user-rollup-${userId}`, {});

  // 9. Touch last_used_at on the API key (best-effort, non-fatal)
  //    The verify_api_key function already does this, so this is a no-op safety net
  //    in case the verify function is updated to skip the update.
  await admin
    .schema("private")
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("user_id", userId);

  const accepted: number = result?.[0]?.accepted ?? 0;
  const duplicates: number = result?.[0]?.duplicates ?? 0;

  // 10. Trigger webhook deliveries for active endpoints subscribed to 'usage.synced'
  //    Best-effort: errors here must not affect the upload response.
  if (teamId && accepted > 0) {
    void (async () => {
      try {
        const { data: endpoints } = await admin
          .from("webhook_endpoints")
          .select("id")
          .eq("team_id", teamId)
          .eq("is_active", true)
          .contains("events", ["usage.synced"]);

        if (endpoints && endpoints.length > 0) {
          const payload = {
            event: "usage.synced",
            team_id: teamId,
            user_id: userId,
            accepted,
            duplicates,
            synced_at: new Date().toISOString(),
          };

          const deliveryRows = (endpoints as { id: string }[]).map((ep) => ({
            endpoint_id: ep.id,
            event_type: "usage.synced",
            payload,
            status: "pending",
            attempt_count: 0,
            next_attempt_at: new Date().toISOString(),
          }));

          const { error: deliveryError } = await admin
            .from("webhook_deliveries")
            .insert(deliveryRows);

          if (deliveryError) {
            console.error("webhook_deliveries insert error:", deliveryError);
          }
        }
      } catch (err) {
        console.error("Webhook delivery trigger error:", err);
      }
    })();
  }

  return NextResponse.json(
    { accepted, duplicates, errors: 0 },
    {
      status: 201,
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    },
  );
}
