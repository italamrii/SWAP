import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "swap_session";

/**
 * Cheap edge gate: anonymous visitors to private areas go straight to sign-in with a
 * return path. Real session validation and role checks still happen server-side.
 */
export function proxy(req: NextRequest) {
  if (!req.cookies.has(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/admin/:path*", "/onboarding"] };
