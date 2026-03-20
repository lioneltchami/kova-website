import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  // Verify Slack signing secret
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { text: "Slack integration not configured" },
      { status: 503 },
    );
  }

  const body = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
  const slackSig = request.headers.get("x-slack-signature") ?? "";

  const sigBase = `v0:${timestamp}:${body}`;
  const expected =
    "v0=" +
    crypto.createHmac("sha256", signingSecret).update(sigBase).digest("hex");

  if (slackSig !== expected) {
    return NextResponse.json({ text: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const text = params.get("text")?.trim() ?? "today";
  const slackUserId = params.get("user_id") ?? "";

  const admin = createAdminClient();

  // Look up Kova user from slack_integrations
  const { data: integration } = await admin
    .from("slack_integrations")
    .select("user_id")
    .eq("bot_user_id", slackUserId)
    .single();

  if (!integration) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Your Slack account is not linked to Kova. Visit kova.dev/dashboard/settings to connect.",
    });
  }

  // Parse period
  let days = 1;
  if (text === "week") days = 7;
  else if (text === "month") days = 30;

  const since = new Date(Date.now() - days * 86400000)
    .toISOString()
    .slice(0, 10);

  const { data: rollups } = await admin
    .from("usage_daily_rollups")
    .select("tool, total_cost_usd, total_sessions")
    .eq("user_id", integration.user_id)
    .gte("date", since);

  const toolMap = new Map<string, { cost: number; sessions: number }>();
  let total = 0;
  for (const r of rollups ?? []) {
    const existing = toolMap.get(r.tool) ?? { cost: 0, sessions: 0 };
    existing.cost += Number(r.total_cost_usd);
    existing.sessions += Number(r.total_sessions);
    toolMap.set(r.tool, existing);
    total += Number(r.total_cost_usd);
  }

  const periodLabel =
    text === "week" ? "This Week" : text === "month" ? "This Month" : "Today";
  const toolLines = [...toolMap.entries()]
    .sort((a, b) => b[1].cost - a[1].cost)
    .map(
      ([tool, data]) =>
        `${tool}: $${data.cost.toFixed(2)} (${data.sessions} sessions)`,
    )
    .join("\n");

  return NextResponse.json({
    response_type: "ephemeral",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `Kova Costs - ${periodLabel}` },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Total:* $${total.toFixed(2)}\n\n${toolLines || "No data for this period"}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Dashboard" },
            url: "https://kova.dev/dashboard",
          },
        ],
      },
    ],
  });
}
