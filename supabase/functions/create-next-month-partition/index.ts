/**
 * Supabase Edge Function: create-next-month-partition
 *
 * Creates the next calendar month's partition on the usage_records partitioned
 * table so that no inserts land in the catch-all "default" partition.
 *
 * Cron schedule: `5 0 1 * *`
 *   Runs on the 1st of every month at 00:05 UTC -- just after midnight so the
 *   new partition is ready before any usage records arrive for the new month.
 *
 * Configure in supabase/config.toml (Supabase cron integration):
 *   [functions.create-next-month-partition]
 *   schedule = "5 0 1 * *"
 *
 * Prerequisites:
 *   The exec_sql RPC referenced below must be created via a migration before
 *   this function can run. See the note in migration 004 (or equivalent).
 *   Alternatively, call the Postgres REST API directly with service-role auth.
 *
 * exec_sql RPC (create in a migration if it does not exist):
 *
 *   CREATE OR REPLACE FUNCTION private.exec_sql(sql TEXT)
 *   RETURNS VOID
 *   LANGUAGE plpgsql SECURITY DEFINER
 *   SET search_path = ''
 *   AS $$
 *   BEGIN
 *     EXECUTE sql;
 *   END;
 *   $$;
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({
        status: "error",
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Compute next month boundaries.
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const afterNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, "0");

  const partitionName = `usage_records_y${year}m${month}`;
  const startDate = nextMonth.toISOString().slice(0, 10); // YYYY-MM-DD
  const endDate = afterNextMonth.toISOString().slice(0, 10); // YYYY-MM-DD

  const sql = `
    CREATE TABLE IF NOT EXISTS public.${partitionName}
    PARTITION OF public.usage_records
    FOR VALUES FROM ('${startDate}') TO ('${endDate}');
  `;

  // Call exec_sql RPC (SECURITY DEFINER function in private schema).
  // This function must be created via migration before this edge function runs.
  const { error } = await supabase.rpc("exec_sql", { sql });

  if (error) {
    console.error("Partition creation error:", error.message);
    return new Response(
      JSON.stringify({ status: "error", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `Partition created: ${partitionName} (${startDate} to ${endDate})`,
  );

  return new Response(
    JSON.stringify({
      status: "created",
      partition: partitionName,
      range: { from: startDate, to: endDate },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
