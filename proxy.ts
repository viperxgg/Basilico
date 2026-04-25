import { NextResponse, type NextRequest } from "next/server";
import { getRuntimeEnv } from "@/lib/config/runtime-env";

const SESSION_COOKIE_NAME = getRuntimeEnv().auth.sessionCookieName;

export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const isProtectedApi =
    request.nextUrl.pathname.startsWith("/api/internal/") ||
    request.nextUrl.pathname.startsWith("/api/admin/") ||
    request.nextUrl.pathname.startsWith("/api/kitchen/") ||
    request.nextUrl.pathname === "/api/activities" ||
    request.nextUrl.pathname.startsWith("/api/activities/");

  if (isProtectedApi) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/portal",
    "/admin/:path*",
    "/kitchen/:path*",
    "/api/internal/:path*",
    "/api/admin/:path*",
    "/api/kitchen/:path*",
    "/api/activities",
    "/api/activities/:path*"
  ]
};
