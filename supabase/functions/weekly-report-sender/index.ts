// Deno Edge Function - runs on cron schedule: 0 8 * * 1 (Monday 8am UTC)
// Triggers the existing weekly-digest API endpoint which handles querying
// usage_daily_rollups and sending emails via Resend.
//
// Deploy with:
//   supabase functions deploy weekly-report-sender --no-verify-jwt
//
// Schedule with pg_cron:
//   SELECT cron.schedule(
//     'weekly-report-sender',
//     '0 8 * * 1',
//     $$SELECT net.http_post(
//       url := current_setting('app.supabase_function_url') || '/weekly-report-sender',
//       headers := '{"Authorization": "Bearer <anon_key>"}'::jsonb,
//       body := '{}'::jsonb
//     )$$
//   );
//
// Required environment variables (set via supabase secrets):
//   SUPABASE_URL              -- Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY -- Service role key for admin queries
//   NOTIFICATION_SECRET       -- Shared secret for the weekly-digest endpoint
//   APP_URL                   -- Production app URL (defaults to https://kova.dev)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const notificationSecret = Deno.env.get("NOTIFICATION_SECRET")!;
  const appUrl = Deno.env.get("APP_URL") ?? "https://kova.dev";

  if (!supabaseUrl || !supabaseKey || !notificationSecret) {
    console.error(
      "weekly-report-sender: missing required environment variables",
    );
    return new Response(
      JSON.stringify({ status: "error", reason: "missing env vars" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check whether any users have opted in to weekly reports before triggering.
  // This avoids unnecessary processing in the digest endpoint on weeks with
  // zero opted-in users.
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("weekly_reports_enabled", true);

  if (usersError) {
    console.error(
      "weekly-report-sender: failed to query opted-in users:",
      usersError,
    );
    return new Response(
      JSON.stringify({ status: "error", reason: "db query failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!users?.length) {
    console.log("weekly-report-sender: no opted-in users, skipping");
    return new Response(
      JSON.stringify({ status: "ok", sent: 0, reason: "no opted-in users" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `weekly-report-sender: ${users.length} opted-in user(s), triggering digest`,
  );

  // Delegate actual email sending to the weekly-digest Next.js API route, which
  // handles per-user aggregation and Resend delivery. The service role check
  // above ensures we only trigger when there are opted-in users.
  let digestResult: unknown;
  try {
    const response = await fetch(
      `${appUrl}/api/v1/notifications/weekly-digest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-notification-secret": notificationSecret,
        },
        body: JSON.stringify({}),
      },
    );

    digestResult = await response.json();

    if (!response.ok) {
      console.error(
        "weekly-report-sender: digest endpoint returned non-2xx:",
        response.status,
        digestResult,
      );
      return new Response(
        JSON.stringify({
          status: "error",
          reason: "digest endpoint failed",
          digest_result: digestResult,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (fetchErr) {
    console.error(
      "weekly-report-sender: failed to reach digest endpoint:",
      fetchErr,
    );
    return new Response(
      JSON.stringify({ status: "error", reason: "fetch failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      triggered: true,
      opted_in_users: users.length,
      digest_result: digestResult,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
