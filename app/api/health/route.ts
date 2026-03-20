import { NextResponse } from "next/server";

// GET /api/health -- Lightweight liveness check.
// Returns 200 with a summary of which optional env vars are present.
// Never returns secrets -- only boolean presence flags.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      polar: !!process.env.POLAR_ACCESS_TOKEN,
      redis: !!process.env.UPSTASH_REDIS_REST_URL,
      resend: !!process.env.RESEND_API_KEY,
    },
  });
}
