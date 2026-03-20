import { type NextRequest, NextResponse } from "next/server";

// Routes that require Supabase auth checking
const AUTH_ROUTES = ["/dashboard", "/login", "/auth", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run Supabase auth on routes that need it
  const needsAuth = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Check if Supabase is configured before trying to use it
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Supabase not configured yet -- let dashboard routes show a setup message
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Supabase is configured -- run auth
  const { updateSession } = await import("@/utils/supabase/middleware");
  const { supabaseResponse, user } = await updateSession(request);

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes -- require authenticated user first, then check operator flag
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check is_operator via admin client (bypasses RLS)
    try {
      const { createAdminClient } = await import("@/lib/supabase-admin");
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("is_operator")
        .eq("id", user.id)
        .single();

      if (!profile?.is_operator) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Admin client misconfigured -- deny access
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect authenticated users away from login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|docs|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
