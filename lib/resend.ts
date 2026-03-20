import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendBudgetAlertEmail(params: {
  to: string;
  teamName: string;
  period: string;
  budgetAmount: number;
  currentSpend: number;
  thresholdPercent: number;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not set, skipping budget alert email");
    return false;
  }

  const percentUsed = Math.round(
    (params.currentSpend / params.budgetAmount) * 100,
  );

  try {
    await client.emails.send({
      from: "Kova Alerts <alerts@kova.dev>",
      to: params.to,
      subject: `Budget Alert: ${percentUsed}% of your ${params.period} budget used`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #c0c0c8; padding: 32px; border-radius: 12px;">
          <h1 style="color: #4361ee; margin: 0 0 24px;">Kova Budget Alert</h1>
          <p style="font-size: 18px; margin: 0 0 16px;">
            Your <strong>${params.teamName}</strong> team has used <strong style="color: ${percentUsed >= 100 ? "#ef4444" : percentUsed >= 80 ? "#f59e0b" : "#4361ee"};">${percentUsed}%</strong> of your ${params.period} budget.
          </p>
          <div style="background: #16162a; border: 1px solid #2a2a45; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #8a8a94;">Current Spend</p>
            <p style="margin: 0; font-size: 28px; font-weight: bold;">$${params.currentSpend.toFixed(2)}</p>
            <div style="background: #2a2a45; border-radius: 4px; height: 8px; margin: 16px 0;">
              <div style="background: ${percentUsed >= 100 ? "#ef4444" : percentUsed >= 80 ? "#f59e0b" : "#4361ee"}; border-radius: 4px; height: 8px; width: ${Math.min(percentUsed, 100)}%;"></div>
            </div>
            <p style="margin: 0; font-size: 14px; color: #8a8a94;">Budget: $${params.budgetAmount.toFixed(2)} / ${params.period}</p>
          </div>
          <a href="https://kova.dev/dashboard/budget" style="display: inline-block; background: #4361ee; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Dashboard</a>
          <p style="margin: 24px 0 0; font-size: 12px; color: #8a8a94;">Manage your budget alerts in <a href="https://kova.dev/dashboard/settings" style="color: #4361ee;">Settings</a>.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send budget alert email:", err);
    return false;
  }
}

export async function sendWeeklyDigestEmail(params: {
  to: string;
  weekStart: string;
  weekEnd: string;
  totalCostUsd: number;
  prevWeekCostUsd: number;
  byTool: Array<{ tool: string; cost: number }>;
  topProject: string | null;
}): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  const change =
    params.prevWeekCostUsd > 0
      ? (
          ((params.totalCostUsd - params.prevWeekCostUsd) /
            params.prevWeekCostUsd) *
          100
        ).toFixed(0)
      : "N/A";
  const changeDirection =
    params.totalCostUsd > params.prevWeekCostUsd ? "up" : "down";

  const toolRows = params.byTool
    .sort((a, b) => b.cost - a.cost)
    .map(
      (t) =>
        `<tr><td style="padding: 8px; border-bottom: 1px solid #2a2a45;">${t.tool}</td><td style="padding: 8px; border-bottom: 1px solid #2a2a45; text-align: right;">$${t.cost.toFixed(2)}</td></tr>`,
    )
    .join("");

  try {
    await client.emails.send({
      from: "Kova <digest@kova.dev>",
      to: params.to,
      subject: `Your AI costs this week: $${params.totalCostUsd.toFixed(2)}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #c0c0c8; padding: 32px; border-radius: 12px;">
          <h1 style="color: #4361ee; margin: 0 0 8px;">Weekly Cost Digest</h1>
          <p style="color: #8a8a94; margin: 0 0 24px;">${params.weekStart} - ${params.weekEnd}</p>
          <div style="background: #16162a; border: 1px solid #2a2a45; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <p style="margin: 0 0 4px; font-size: 14px; color: #8a8a94;">Total AI Spend</p>
            <p style="margin: 0; font-size: 32px; font-weight: bold;">$${params.totalCostUsd.toFixed(2)}</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: ${changeDirection === "up" ? "#f59e0b" : "#22c55e"};">${changeDirection === "up" ? "&#8593;" : "&#8595;"} ${change}% vs last week</p>
          </div>
          <h2 style="font-size: 16px; color: #c0c0c8; margin: 0 0 12px;">By Tool</h2>
          <table style="width: 100%; border-collapse: collapse;">${toolRows}</table>
          ${params.topProject ? `<p style="margin: 16px 0; font-size: 14px; color: #8a8a94;">Top project: <strong>${params.topProject}</strong></p>` : ""}
          <a href="https://kova.dev/dashboard/analytics" style="display: inline-block; background: #4361ee; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">View Full Analytics</a>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send weekly digest:", err);
    return false;
  }
}
