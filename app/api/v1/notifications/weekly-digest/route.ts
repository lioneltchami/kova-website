// Supabase cron schedule: 0 9 * * 1  (Monday 9am UTC)
// Configured via:
//   SELECT cron.schedule(
//     'weekly-digest-email',
//     '0 9 * * 1',
//     $$SELECT net.http_post(
//       url := 'https://kova.dev/api/v1/notifications/weekly-digest',
//       headers := '{"x-notification-secret": "<NOTIFICATION_SECRET>"}'::jsonb,
//       body := '{}'::jsonb
//     )$$
//   );
//
// Required env vars:
//   NOTIFICATION_SECRET -- shared secret for this endpoint
//   RESEND_API_KEY      -- Resend API key for sending emails

import { type NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigestEmail } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-notification-secret");
  if (secret !== process.env.NOTIFICATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get all Pro/Enterprise users (digests only sent to paying subscribers)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, plan")
    .in("plan", ["pro", "enterprise"]);

  if (!profiles?.length) {
    return NextResponse.json({ processed: 0 });
  }

  const now = new Date();
  const weekEnd = now.toISOString().slice(0, 10);
  const weekStart = new Date(now.getTime() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const prevWeekStart = new Date(now.getTime() - 14 * 86400000)
    .toISOString()
    .slice(0, 10);

  let sent = 0;
  for (const profile of profiles) {
    // Get this week's rollups aggregated by tool for this user
    const { data: thisWeek } = await admin
      .from("usage_daily_rollups")
      .select("tool, total_cost_usd")
      .eq("user_id", profile.id)
      .gte("date", weekStart)
      .lte("date", weekEnd);

    // Get prev week's rollups for week-over-week comparison
    const { data: prevWeek } = await admin
      .from("usage_daily_rollups")
      .select("total_cost_usd")
      .eq("user_id", profile.id)
      .gte("date", prevWeekStart)
      .lt("date", weekStart);

    if (!thisWeek?.length) continue;

    const totalCost = thisWeek.reduce(
      (sum, r) => sum + Number(r.total_cost_usd),
      0,
    );
    const prevCost = (prevWeek ?? []).reduce(
      (sum, r) => sum + Number(r.total_cost_usd),
      0,
    );

    // Aggregate cost by tool across all days this week
    const toolMap = new Map<string, number>();
    for (const r of thisWeek) {
      toolMap.set(
        r.tool,
        (toolMap.get(r.tool) ?? 0) + Number(r.total_cost_usd),
      );
    }
    const byTool = [...toolMap.entries()].map(([tool, cost]) => ({
      tool,
      cost,
    }));

    const success = await sendWeeklyDigestEmail({
      to: profile.email,
      weekStart,
      weekEnd,
      totalCostUsd: totalCost,
      prevWeekCostUsd: prevCost,
      byTool,
      topProject: null, // Project-level data not available in usage_daily_rollups
    });

    if (success) sent++;
  }

  return NextResponse.json({ processed: sent });
}
