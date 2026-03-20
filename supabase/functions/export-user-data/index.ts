/**
 * Supabase Edge Function: export-user-data
 *
 * Handles GDPR right-to-portability export requests.
 *
 * Flow:
 *   1. Receives a job_id from the request body (authenticated via Authorization header).
 *   2. Validates the job belongs to the requesting user and is in 'pending' status.
 *   3. Marks the job as 'processing'.
 *   4. Queries all user data: profile, usage_records, budgets, and audit_events.
 *   5. Serializes the data to JSON and uploads to Supabase Storage
 *      in the 'user-exports' bucket under `exports/{user_id}/{job_id}.json`.
 *   6. Generates a signed URL (valid 7 days) and writes it back to data_export_jobs.
 *   7. Marks the job as 'ready'.  On any error, marks as 'failed'.
 *
 * The 'user-exports' storage bucket must exist and have service-role write access.
 * Signed URLs allow the user to download without requiring storage auth.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPORT_BUCKET = "user-exports";
/** Signed URL validity period in seconds (7 days). */
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24 * 7;

interface ExportPayload {
  job_id: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Authenticate the caller using their JWT from the Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  const userJwt = authHeader.slice(7);

  // Use user-scoped client to validate identity
  const userClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse request body
  let payload: ExportPayload;
  try {
    payload = (await req.json()) as ExportPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!payload.job_id) {
    return new Response(JSON.stringify({ error: "job_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use service-role client for all DB writes/reads that bypass RLS
  const serviceClient = createClient(supabaseUrl, supabaseKey);

  // Validate the job belongs to this user and is pending
  const { data: job, error: jobError } = await serviceClient
    .from("data_export_jobs")
    .select("id, user_id, status")
    .eq("id", payload.job_id)
    .single();

  if (jobError || !job) {
    return new Response(JSON.stringify({ error: "Export job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (job.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (job.status !== "pending") {
    return new Response(
      JSON.stringify({ error: `Job is already in status: ${job.status}` }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  // Mark as processing
  await serviceClient
    .from("data_export_jobs")
    .update({ status: "processing" })
    .eq("id", job.id);

  try {
    // Collect all user data in parallel
    const [profileResult, usageResult, budgetsResult, auditResult] =
      await Promise.all([
        serviceClient.from("profiles").select("*").eq("id", user.id).single(),

        serviceClient
          .from("usage_records")
          .select(
            "id, tool, model, session_id, project, input_tokens, output_tokens, cost_usd, recorded_at, duration_ms, cli_version, tags",
          )
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false })
          .limit(100_000),

        serviceClient
          .from("budgets")
          .select(
            "id, scope, period, amount_usd, warn_at_percent, is_active, created_at",
          )
          .eq("user_id", user.id),

        serviceClient
          .from("audit_events")
          .select(
            "id, created_at, event_type, resource_type, resource_id, team_id, metadata",
          )
          .eq("actor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10_000),
      ]);

    const exportData = {
      export_metadata: {
        user_id: user.id,
        email: user.email,
        exported_at: new Date().toISOString(),
        job_id: job.id,
      },
      profile: profileResult.data ?? null,
      usage_records: usageResult.data ?? [],
      budgets: budgetsResult.data ?? [],
      audit_events: auditResult.data ?? [],
    };

    const jsonBytes = new TextEncoder().encode(
      JSON.stringify(exportData, null, 2),
    );
    const storagePath = `exports/${user.id}/${job.id}.json`;

    // Upload to Supabase Storage (service role bypasses bucket RLS)
    const { error: uploadError } = await serviceClient.storage
      .from(EXPORT_BUCKET)
      .upload(storagePath, jsonBytes, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Generate a signed URL valid for 7 days
    const { data: signedUrlData, error: signedUrlError } =
      await serviceClient.storage
        .from(EXPORT_BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(
        `Signed URL generation failed: ${signedUrlError?.message}`,
      );
    }

    const expiresAt = new Date(
      Date.now() + SIGNED_URL_EXPIRES_IN * 1000,
    ).toISOString();

    // Mark job as ready with download URL
    await serviceClient
      .from("data_export_jobs")
      .update({
        status: "ready",
        download_url: signedUrlData.signedUrl,
        expires_at: expiresAt,
      })
      .eq("id", job.id);

    console.log(`Export job ${job.id} completed for user ${user.id}`);

    return new Response(
      JSON.stringify({
        status: "ready",
        job_id: job.id,
        download_url: signedUrlData.signedUrl,
        expires_at: expiresAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Export job ${job.id} failed:`, message);

    // Mark the job as failed so the user can retry
    await serviceClient
      .from("data_export_jobs")
      .update({ status: "failed" })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({ error: "Export failed", detail: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
