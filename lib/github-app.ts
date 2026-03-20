import { App } from '@octokit/app';

let githubApp: App | null = null;

export function getGitHubApp(): App | null {
  if (githubApp) return githubApp;
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!appId || !privateKey || !webhookSecret) return null;
  githubApp = new App({ appId: Number(appId), privateKey, webhooks: { secret: webhookSecret } });
  return githubApp;
}

export function buildCostComment(params: {
  teamName: string;
  dailyCost: number;
  weekOverWeekChange: number;
  byTool: { tool: string; cost: number }[];
  budgetStatus?: string;
  dashboardUrl: string;
}): string {
  const changeEmoji = params.weekOverWeekChange > 0 ? ':arrow_up:' : ':arrow_down:';
  const changePct = Math.abs(params.weekOverWeekChange).toFixed(0);
  const toolRows = params.byTool
    .sort((a, b) => b.cost - a.cost)
    .map(t => `| ${t.tool} | $${t.cost.toFixed(2)}/day |`)
    .join('\n');

  return `## Kova AI Cost Report

**Daily AI spend**: $${params.dailyCost.toFixed(2)}/day (${changeEmoji} ${changePct}% vs last week)

| Tool | Daily Cost |
|------|-----------|
${toolRows}

${params.budgetStatus ? `**Budget**: ${params.budgetStatus}` : ''}

[View full analytics](${params.dashboardUrl}) | [Set budget alert](${params.dashboardUrl}/budget)

---
*Reported by [Kova](https://kova.dev) - AI Dev FinOps*`;
}
