import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import {
  getSessionCookieName,
  revokeSessionToken,
  validateSessionToken
} from "@/lib/auth/auth-store";
import type { AuthRole, AuthSession } from "@/lib/auth/types";

export function hasRequiredRole(
  session: AuthSession,
  requiredRoles?: AuthRole[]
) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.some((role) => session.user.roles.includes(role));
}

export function getInternalHomePath(session: AuthSession) {
  const { roles } = session.user;

  if (roles.includes("ADMIN") && roles.includes("KITCHEN")) {
    return "/portal";
  }

  if (session.user.roles.includes("ADMIN")) {
    return "/admin";
  }

  if (session.user.roles.includes("KITCHEN")) {
    return "/kitchen";
  }

  return "/";
}

function getFallbackPath(session: AuthSession) {
  return getInternalHomePath(session);
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  return validateSessionToken(token);
}

export async function requirePageSession(
  requiredRoles: AuthRole[],
  nextPath: string
) {
  const session = await getServerSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!hasRequiredRole(session, requiredRoles)) {
    redirect(getFallbackPath(session));
  }

  return session;
}

export async function getApiSession(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return validateSessionToken(token);
}

export async function requireApiSession(
  request: NextRequest,
  requiredRoles?: AuthRole[]
) {
  const session = await getApiSession(request);

  if (!session) {
    return {
      ok: false as const,
      status: 401,
      body: { error: "Authentication required." }
    };
  }

  if (!hasRequiredRole(session, requiredRoles)) {
    return {
      ok: false as const,
      status: 403,
      body: { error: "Forbidden." }
    };
  }

  return { ok: true as const, session };
}

export async function clearServerSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  await revokeSessionToken(token);
  return token;
}
