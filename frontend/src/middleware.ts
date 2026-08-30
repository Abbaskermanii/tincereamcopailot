import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = process.env.SECRET_KEY || process.env.NEXT_PUBLIC_SECRET_KEY || "";

const protectedPaths = ["/admin", "/account"];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Read access token from cookie
  const token = request.cookies.get("tinceram_access")?.value;

  if (!token) {
    return redirectToLogin(request, pathname);
  }

  // Validate JWT token locally (no backend call needed)
  if (!SECRET_KEY) {
    // Secret not configured — deny access in production
    return redirectToLogin(request, pathname);
  }

  try {
    const secret = new TextEncoder().encode(SECRET_KEY);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    // Check token type and expiration
    if (payload.type !== "access" || !payload.sub) {
      return redirectToLogin(request, pathname);
    }

    // Check expiration explicitly (jose also checks, but belt-and-suspenders)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return redirectToLogin(request, pathname);
    }

    // For /admin/* routes, we need to verify admin status.
    // The JWT doesn't carry is_admin, so we add a custom claim on login
    // or do a lightweight check. For now, we rely on the page components
    // and backend RBAC for admin authorization.
    // The middleware ensures only authenticated users reach protected pages.
    return NextResponse.next();
  } catch {
    // Invalid token — clear it and redirect to login
    const response = redirectToLogin(request, pathname);
    response.cookies.delete("tinceram_access");
    response.cookies.delete("tinceram_refresh");
    return response;
  }
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL("/auth", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
  ],
};
