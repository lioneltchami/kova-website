import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getGitHubApp, buildCostComment } from '@/lib/github-app';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const app = getGitHubApp();
  if (!app) return NextResponse.json({ error: 'GitHub App not configured' }, { status: 503 });

  // Verify webhook signature
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  const payload = JSON.parse(body);

  if (event === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
    // Get installation Octokit
    const installationId = payload.installation?.id;
    if (!installationId) return NextResponse.json({ ok: true });

    const octokit = await app.getInstallationOctokit(installationId);
    const admin = createAdminClient();

    // Look up team costs (simplified: use sender's GitHub username to find Kova user)
    // For MVP: post a generic team cost summary
    const { data: rollups } = await admin
      .from('usage_daily_rollups')
      .select('tool, total_cost_usd')
      .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));

    if (rollups?.length) {
      const toolMap = new Map<string, number>();
      let totalDailyCost = 0;
      for (const r of rollups) {
        toolMap.set(r.tool, (toolMap.get(r.tool) ?? 0) + Number(r.total_cost_usd));
        totalDailyCost += Number(r.total_cost_usd);
      }
      totalDailyCost /= 7; // daily average

      const comment = buildCostComment({
        teamName: 'Your team',
        dailyCost: totalDailyCost,
        weekOverWeekChange: 0,
        byTool: [...toolMap.entries()].map(([tool, cost]) => ({ tool, cost: cost / 7 })),
        dashboardUrl: 'https://kova.dev/dashboard',
      });

      // Post or update comment
      const owner = payload.repository.owner.login as string;
      const repo = payload.repository.name as string;
      const issueNumber = payload.pull_request.number as number;

      const { data: comments } = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        owner,
        repo,
        issue_number: issueNumber,
      });

      const existingComment = (comments as Array<{ id: number; body?: string }>).find(
        c => c.body?.includes('Kova AI Cost Report')
      );

      if (existingComment) {
        await octokit.request('PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}', {
          owner,
          repo,
          comment_id: existingComment.id,
          body: comment,
        });
      } else {
        await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
          owner,
          repo,
          issue_number: issueNumber,
          body: comment,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
