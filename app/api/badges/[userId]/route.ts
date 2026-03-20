import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const admin = createAdminClient();

  // Get current month total cost from usage_daily_rollups
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: rollups } = await admin
    .from('usage_daily_rollups')
    .select('total_cost_usd')
    .eq('user_id', userId)
    .gte('date', startOfMonth.toISOString().slice(0, 10));

  const totalCost = (rollups ?? []).reduce((sum, r) => sum + Number(r.total_cost_usd), 0);

  // Check budget for color
  const { data: budget } = await admin
    .from('budgets')
    .select('amount_usd')
    .eq('user_id', userId)
    .eq('period', 'monthly')
    .eq('is_active', true)
    .limit(1)
    .single();

  let color = 'blue';
  if (budget) {
    const pct = (totalCost / Number(budget.amount_usd)) * 100;
    color = pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : 'brightgreen';
  }

  const message = totalCost > 0 ? `$${totalCost.toFixed(2)}/mo` : 'no data';
  if (totalCost === 0) color = 'lightgrey';

  return NextResponse.json(
    { schemaVersion: 1, label: 'AI costs', message, color, cacheSeconds: 3600 },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
