/**
 * Supabase Edge Function: health-checker
 *
 * Probes a set of external endpoints and writes the results to the
 * public.health_checks table. Runs on a cron schedule every 5 minutes.
 *
 * Configure in supabase/config.toml:
 *   [functions.health-checker]
 *   schedule = "* /5 * * * *"   (remove space between / and 5 -- TOML comment workaround)
 *
 * Each check result carries:
 *   - component: logical name (e.g. "api", "website")
 *   - status: healthy | degraded | down
 *   - latency_ms: round-trip time in milliseconds
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CheckTarget {
  component: string;
  url: string;
  /** HTTP status codes considered healthy. Defaults to [200]. */
  healthyCodes?: number[];
  /** Request timeout in milliseconds. Defaults to 5000. */
  timeoutMs?: number;
}

interface CheckResult {
  component: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number | null;
  checked_at: string;
}

const TARGETS: CheckTarget[] = [
  {
    component: "api_health",
    url: `${Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://app.kova.dev"}/api/health`,
    healthyCodes: [200],
    timeoutMs: 5000,
  },
  {
    component: "website",
    url: Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://app.kova.dev",
    healthyCodes: [200],
    timeoutMs: 5000,
  },
];

async function checkEndpoint(target: CheckTarget): Promise<CheckResult> {
  const healthyCodes = target.healthyCodes ?? [200];
  const timeoutMs = target.timeoutMs ?? 5000;
  const start = Date.now();

  try {
    const response = await fetch(target.url, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const latencyMs = Date.now() - start;

    if (healthyCodes.includes(response.status)) {
      return {
        component: target.component,
        status: "healthy",
        latency_ms: latencyMs,
        checked_at: new Date().toISOString(),
      };
    }

    // Got a response but with an unexpected status code
    return {
      component: target.component,
      status: "degraded",
      latency_ms: latencyMs,
      checked_at: new Date().toISOString(),
    };
  } catch (_err) {
    // Timeout or network error -- component is down
    return {
      component: target.component,
      status: "down",
      latency_ms: null,
      checked_at: new Date().toISOString(),
    };
  }
}

Deno.serve(async (_req: Request): Promise<Response> => {
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

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Run all checks in parallel for speed
  const results = await Promise.all(TARGETS.map(checkEndpoint));

  // Write all results to health_checks table via service role (bypasses RLS)
  const { error: insertError } = await supabase
    .from("health_checks")
    .insert(results);

  if (insertError) {
    console.error("Failed to write health check results:", insertError.message);
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const summary = results.map((r) => ({
    component: r.component,
    status: r.status,
    latency_ms: r.latency_ms,
  }));

  console.log("Health checks completed:", JSON.stringify(summary));

  return new Response(
    JSON.stringify({ checked_at: new Date().toISOString(), results: summary }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
