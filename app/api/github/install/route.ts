import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const installationId = request.nextUrl.searchParams.get('installation_id');
  // TODO: Link GitHub installation to Kova team
  // For now, redirect to dashboard settings
  void installationId; // will be used when GitHub App installation linking is implemented
  return NextResponse.redirect(new URL('/dashboard/settings?github=connected', request.url));
}
