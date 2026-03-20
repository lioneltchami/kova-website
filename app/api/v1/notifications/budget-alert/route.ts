import { type NextRequest, NextResponse } from "next/server";
import { sendBudgetAlertEmail } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase-admin";

// Internal endpoint: POST /api/v1/notifications/budget-alert
//
// Protected by NOTIFICATION_SECRET header (shared secret, not user auth).
// Called by a Supabase cron job every 15 minutes:
//   SELECT cron.schedule(
//     'notify-budget-alerts',
//     '*/15 * * * *',
//     $$SELECT net.http_post(
//       url := 'https://kova.dev/api/v1/notifications/budget-alert',
//       headers := '{"x-notification-secret": "<NOTIFICATION_SECRET>"}'::jsonb,
//       body := '{}'::jsonb
//     )$$
//   );
//
// Required env vars:
//   NOTIFICATION_SECRET -- shared secret for this endpoint
//   RESEND_API_KEY      -- Resend API key for sending emails

export async function POST(request: NextRequest) {
  // Auth: internal endpoint, protected by shared secret
  const secret = request.headers.get("x-notification-secret");
  if (secret !== process.env.NOTIFICATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find budget alerts from the last hour that have not yet been emailed.
  // NOTE: The notified_email column is added by migration 004.
  // The budget_alerts table does not have a direct team_id for owner lookup;
  // we join to the budgets table to get team_id, then look up the team owner.
  const { data: alerts, error } = await admin
    .from("budget_alerts")
    .select(
      "id, team_id, budget_id, triggered_at, alert_type, threshold_pct, current_spend, budget_amount, notified_email",
    )
    .eq("notified_email", false)
    .gte("triggered_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (error) {
    console.error("budget-alert: failed to query alerts:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 },
    );
  }

  if (!alerts?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let sent = 0;
  for (const alert of alerts) {
    // Look up team owner email via team_members + profiles.
    // team_members.role = 'owner' identifies the team owner.
    const { data: ownerMember } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", alert.team_id)
      .eq("role", "owner")
      .limit(1)
      .single();

    if (!ownerMember) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", ownerMember.user_id)
      .single();

    const email = profile?.email;
    if (!email) continue;

    // Look up team name for the email body.
    const { data: team } = await admin
      .from("teams")
      .select("name")
      .eq("id", alert.team_id)
      .single();

    // Look up budget period from the budgets table.
    const { data: budget } = await admin
      .from("budgets")
      .select("period")
      .eq("id", alert.budget_id)
      .single();

    const success = await sendBudgetAlertEmail({
      to: email,
      teamName: team?.name ?? "Your team",
      period: budget?.period ?? "monthly",
      budgetAmount: Number(alert.budget_amount),
      currentSpend: Number(alert.current_spend),
      thresholdPercent: alert.threshold_pct,
    });

    if (success) {
      await admin
        .from("budget_alerts")
        .update({ notified_email: true })
        .eq("id", alert.id);
      sent++;
    }
  }

  return NextResponse.json({ processed: sent });
}
