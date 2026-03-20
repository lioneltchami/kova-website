import { type NextRequest, NextResponse } from "next/server";
import { sendSlackNotification } from "@/lib/slack";
import { createClient } from "@/utils/supabase/server";

// POST /api/v1/team/slack-webhook/test
// Sends a test Slack message to verify the webhook URL works.
// Requires the user to be authenticated.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { webhookUrl?: string };
  try {
    body = (await request.json()) as { webhookUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { webhookUrl } = body;

  if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
    return NextResponse.json(
      { error: "Invalid Slack webhook URL" },
      { status: 400 }
    );
  }

  const ok = await sendSlackNotification(webhookUrl, {
    text: "Kova is connected! Budget alerts will be posted here.",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":white_check_mark: *Kova is connected!*\n\nBudget alerts and cost anomalies will be posted to this channel.",
        },
      },
    ],
  });

  if (!ok) {
    return NextResponse.json(
      { error: "Failed to send test message. Check the webhook URL." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
