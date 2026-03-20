export async function sendSlackNotification(
  webhookUrl: string,
  message: { text: string; blocks?: object[] }
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    console.error('Failed to send Slack notification');
    return false;
  }
}

export function buildBudgetAlertBlocks(params: {
  teamName: string; period: string; budgetAmount: number;
  currentSpend: number; dashboardUrl: string;
}): object[] {
  const pct = Math.round((params.currentSpend / params.budgetAmount) * 100);
  const emoji = pct >= 100 ? ':rotating_light:' : pct >= 80 ? ':warning:' : ':moneybag:';
  return [
    { type: 'header', text: { type: 'plain_text', text: `${emoji} Kova Budget Alert` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${params.teamName}* has used *${pct}%* of the ${params.period} budget.\n\n*$${params.currentSpend.toFixed(2)}* of *$${params.budgetAmount.toFixed(2)}*` } },
    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'View Dashboard' }, url: params.dashboardUrl }] },
  ];
}

export function buildAnomalyAlertBlocks(params: {
  toolName: string; date: string; cost: number;
  expectedCost: number; deviation: string; dashboardUrl: string;
}): object[] {
  return [
    { type: 'header', text: { type: 'plain_text', text: ':chart_with_upwards_trend: Cost Anomaly Detected' } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${params.toolName}* cost spiked *${params.deviation}* above normal on ${params.date}.\n\nActual: *$${params.cost.toFixed(2)}* | Expected: ~$${params.expectedCost.toFixed(2)}` } },
    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'View Analytics' }, url: params.dashboardUrl }] },
  ];
}
