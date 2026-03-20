import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const admin = createAdminClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: rollups } = await admin
    .from("usage_daily_rollups")
    .select("total_cost_usd")
    .eq("user_id", userId)
    .gte("date", startOfMonth.toISOString().slice(0, 10));

  const totalCost = (rollups ?? []).reduce(
    (sum, r) => sum + Number(r.total_cost_usd),
    0,
  );
  const costText = totalCost > 0 ? `$${totalCost.toFixed(2)}/mo` : "$0.00/mo";
  const valueColor = "#4361ee"; // kova-blue

  const labelWidth = 52;
  const valueWidth = costText.length * 7 + 12;
  const totalWidth = labelWidth + valueWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="AI costs: ${costText}">
  <title>AI costs: ${costText}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">AI costs</text>
    <text x="${labelWidth / 2}" y="14">AI costs</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${costText}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${costText}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate",
    },
  });
}
