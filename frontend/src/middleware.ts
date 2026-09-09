import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Auth-protected routes: redirect to /auth if neither access nor refresh cookie exists
  const protectedPaths = ["/checkout", "/account"];
  const isProtected = protectedPaths.some((p) =>
    req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/")
  );
  if (isProtected) {
    const hasAccess = req.cookies.get("tinceram_access")?.value;
    const hasRefresh = req.cookies.get("tinceram_refresh")?.value;
    if (!hasAccess && !hasRefresh) {
      const loginUrl = new URL("/auth", req.url);
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set(
    "X-Frame-Options",
    process.env.NODE_ENV === "production" ? "DENY" : "SAMEORIGIN"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
