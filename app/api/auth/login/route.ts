import { NextRequest, NextResponse } from "next/server";

import {
  authenticateUser,
  getSessionCookieName,
  getSessionMaxAgeSeconds
} from "@/lib/auth/auth-store";
import { getInternalHomePath } from "@/lib/auth/server";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";
import {
  checkRateLimit,
  getClientRateLimitKey,
  rateLimitResponse
} from "@/lib/server/rate-limit";
import type { AuthSession } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveNextPath(
  requestedNext: unknown,
  session: AuthSession
) {
  const roles = session.user.roles;
  const nextPath =
    typeof requestedNext === "string" && requestedNext.startsWith("/")
      ? requestedNext
      : null;

  const defaultPath = getInternalHomePath(session);

  if (nextPath) {
    if (nextPath.startsWith("/portal") && roles.includes("ADMIN") && roles.includes("KITCHEN")) {
      return nextPath;
    }

    if (nextPath.startsWith("/admin") && roles.includes("ADMIN")) {
      return nextPath;
    }

    if (nextPath.startsWith("/kitchen") && roles.includes("KITCHEN")) {
      return nextPath;
    }
  }

  return defaultPath;
}

export async function POST(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "auth",
    action: "login"
  });
  const rateLimit = checkRateLimit({
    key: getClientRateLimitKey(request, "login"),
    limit: 8,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return observation.finish(rateLimitResponse(rateLimit.retryAfterSeconds), {
      result: "rate_limited"
    });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return observation.finish(
      NextResponse.json({ error: "Invalid login payload." }, { status: 400 }),
      { result: "invalid_payload" }
    );
  }

  const username =
    typeof (payload as { username?: unknown })?.username === "string"
      ? (payload as { username: string }).username.trim()
      : "";
  const password =
    typeof (payload as { password?: unknown })?.password === "string"
      ? (payload as { password: string }).password
      : "";
  const next = (payload as { next?: unknown })?.next;

  if (!username || !password) {
    return observation.finish(
      NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      ),
      { result: "missing_credentials" }
    );
  }

  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = request.headers.get("user-agent");
    const result = await authenticateUser(username, password, {
      ipAddress,
      userAgent
    });
    const isSecureRequest =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    if (!result.success) {
      return observation.finish(
        NextResponse.json(
          { error: "Invalid username or password." },
          { status: 401 }
        ),
        { result: result.code }
      );
    }

    const response = NextResponse.json({
      user: result.session.user,
      expiresAt: result.session.expiresAt,
      redirectTo: resolveNextPath(next, result.session)
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: result.sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest,
      path: "/",
      maxAge: getSessionMaxAgeSeconds()
    });

    return observation.finish(response, {
      result: "success",
      roleCount: result.session.user.roles.length
    });
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(
      createErrorResponse("Unable to complete login."),
      { result: "exception" }
    );
  }
}
