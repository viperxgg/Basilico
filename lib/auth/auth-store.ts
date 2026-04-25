import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getRuntimeEnv } from "@/lib/config/runtime-env";
import { getDefaultRestaurant } from "@/lib/menu/restaurants";
import type {
  AuthRole,
  AuthSession,
  AuthUser,
  LoginEventResult
} from "@/lib/auth/types";

type LoginMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuthTransactionClient = Pick<typeof prisma, "session" | "user" | "loginEvent">;

type AuthenticationSuccess = {
  success: true;
  session: AuthSession;
  sessionToken: string;
};

type AuthenticationFailure = {
  success: false;
  code: "INVALID_CREDENTIALS" | "USER_DISABLED" | "RATE_LIMITED";
  message: string;
};

type AuthenticationResult = AuthenticationSuccess | AuthenticationFailure;

const runtimeEnv = getRuntimeEnv();
const SESSION_COOKIE_NAME = runtimeEnv.auth.sessionCookieName;
const SESSION_TTL_HOURS = runtimeEnv.auth.sessionTtlHours;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_FAILURES = 5;

function getRestaurantId() {
  return getDefaultRestaurant().slug;
}

function now() {
  return new Date();
}

function hashSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}

function getBootstrapUsers() {
  return [
    {
      username: runtimeEnv.auth.bootstrapAdmin.username,
      password: runtimeEnv.auth.bootstrapAdmin.password,
      displayName: runtimeEnv.auth.bootstrapAdmin.displayName,
      roles: ["ADMIN"] as AuthRole[]
    },
    {
      username: runtimeEnv.auth.bootstrapKitchen.username,
      password: runtimeEnv.auth.bootstrapKitchen.password,
      displayName: runtimeEnv.auth.bootstrapKitchen.displayName,
      roles: ["KITCHEN"] as AuthRole[]
    }
  ].filter((user) => Boolean(user.username) && Boolean(user.password));
}

async function ensureRestaurantRecord() {
  const restaurant = getDefaultRestaurant();

  await prisma.restaurant.upsert({
    where: { id: restaurant.slug },
    update: {
      slug: restaurant.slug,
      name: restaurant.branding.name,
      shortName: restaurant.branding.shortName,
      locale: restaurant.branding.locale,
      currencyCode: restaurant.branding.currency,
      timezone: "Europe/Stockholm",
      addressLine: restaurant.branding.addressLine,
      phone: restaurant.branding.phone,
      concept: restaurant.branding.concept,
      openingHoursJson: restaurant.branding.openingHours ?? [],
      galleryImagesJson: restaurant.branding.galleryImages ?? [],
      orderingMode: restaurant.branding.orderingMode ?? "browsing-only",
      locationLabel: restaurant.branding.location,
      description: restaurant.branding.description,
      footerNote: restaurant.branding.footerNote,
      primaryActionLabel: restaurant.branding.primaryActionLabel,
      isActive: true
    },
    create: {
      id: restaurant.slug,
      slug: restaurant.slug,
      name: restaurant.branding.name,
      shortName: restaurant.branding.shortName,
      locale: restaurant.branding.locale,
      currencyCode: restaurant.branding.currency,
      timezone: "Europe/Stockholm",
      addressLine: restaurant.branding.addressLine,
      phone: restaurant.branding.phone,
      concept: restaurant.branding.concept,
      openingHoursJson: restaurant.branding.openingHours ?? [],
      galleryImagesJson: restaurant.branding.galleryImages ?? [],
      orderingMode: restaurant.branding.orderingMode ?? "browsing-only",
      locationLabel: restaurant.branding.location,
      description: restaurant.branding.description,
      footerNote: restaurant.branding.footerNote,
      primaryActionLabel: restaurant.branding.primaryActionLabel,
      isActive: true
    }
  });
}

async function ensureAuthBootstrapData() {
  const restaurantId = getRestaurantId();
  await ensureRestaurantRecord();

  for (const bootstrapUser of getBootstrapUsers()) {
    const existingUser = await prisma.user.findUnique({
      where: {
        restaurantId_username: {
          restaurantId,
          username: bootstrapUser.username
        }
      }
    });

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId,
          username: bootstrapUser.username,
          passwordHash: hashPassword(bootstrapUser.password),
          displayName: bootstrapUser.displayName,
          status: "ACTIVE"
        }
      }));

    for (const roleCode of bootstrapUser.roles) {
      await prisma.userRole.upsert({
        where: {
          restaurantId_userId_roleCode: {
            restaurantId,
            userId: user.id,
            roleCode
          }
        },
        update: {},
        create: {
          id: crypto.randomUUID(),
          restaurantId,
          userId: user.id,
          roleCode
        }
      });
    }
  }
}

async function getUserRoles(userId: string, restaurantId: string): Promise<AuthRole[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId, restaurantId },
    orderBy: { roleCode: "asc" }
  });

  return rows.map((row: { roleCode: AuthRole }) => row.roleCode);
}

function toAuthUser(
  user: {
    id: string;
    restaurantId: string;
    username: string;
    displayName: string;
    status: "ACTIVE" | "DISABLED";
  },
  roles: AuthRole[]
): AuthUser {
  return {
    id: user.id,
    restaurantId: user.restaurantId,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
    roles
  };
}

async function buildSession(
  user: {
    id: string;
    restaurantId: string;
    username: string;
    displayName: string;
    status: "ACTIVE" | "DISABLED";
  },
  session: {
    id: string;
    restaurantId: string;
    expiresAt: Date;
  }
): Promise<AuthSession> {
  return {
    id: session.id,
    restaurantId: session.restaurantId,
    user: toAuthUser(user, await getUserRoles(user.id, session.restaurantId)),
    expiresAt: session.expiresAt.toISOString()
  };
}

async function createLoginEvent(
  result: LoginEventResult,
  usernameAttempted: string,
  metadata: LoginMetadata,
  options?: {
    userId?: string | null;
    failureReason?: string | null;
  }
) {
  await prisma.loginEvent.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId: getRestaurantId(),
      userId: options?.userId ?? null,
      usernameAttempted,
      result,
      failureReason: options?.failureReason ?? null,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null
    }
  });
}

async function isLoginRateLimited(username: string, metadata: LoginMetadata) {
  const since = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_MS);
  const keys = [
    username ? `username:${username}` : null,
    metadata.ipAddress ? `ip:${metadata.ipAddress}` : null
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    return false;
  }

  const failureCount = await prisma.loginEvent.count({
    where: {
      restaurantId: getRestaurantId(),
      result: "FAILURE",
      createdAt: { gte: since },
      OR: keys.map((key) =>
        key.startsWith("username:")
          ? { usernameAttempted: key.slice("username:".length) }
          : { ipAddress: key.slice("ip:".length) }
      )
    }
  });

  return failureCount >= LOGIN_RATE_LIMIT_MAX_FAILURES;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeSeconds() {
  const ttlHours = Number.isFinite(SESSION_TTL_HOURS) && SESSION_TTL_HOURS > 0
    ? SESSION_TTL_HOURS
    : 168;

  return ttlHours * 60 * 60;
}

export function createSessionCookieValue() {
  return randomBytes(32).toString("base64url");
}

export function getAssignedStaffFromSession(session: AuthSession) {
  return {
    id: session.user.id,
    name: session.user.displayName,
    role:
      session.user.roles.length > 1
        ? session.user.roles.join("/")
        : session.user.roles[0] === "ADMIN"
          ? "Admin"
          : "Kitchen"
  };
}

export async function authenticateUser(
  username: string,
  password: string,
  metadata: LoginMetadata
): Promise<AuthenticationResult> {
  await ensureAuthBootstrapData();

  const restaurantId = getRestaurantId();
  const normalizedUsername = username.trim().toLowerCase();

  if (await isLoginRateLimited(normalizedUsername, metadata)) {
    await createLoginEvent("LOCKED", normalizedUsername, metadata, {
      failureReason: "rate_limited"
    });

    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many login attempts. Try again later."
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      restaurantId_username: {
        restaurantId,
        username: normalizedUsername
      }
    }
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await createLoginEvent("FAILURE", normalizedUsername, metadata, {
      failureReason: "invalid_credentials"
    });

    return {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid username or password."
    };
  }

  if (user.status === "DISABLED") {
    await createLoginEvent("LOCKED", normalizedUsername, metadata, {
      userId: user.id,
      failureReason: "user_disabled"
    });

    return {
      success: false,
      code: "USER_DISABLED",
      message: "This account is disabled."
    };
  }

  const sessionToken = createSessionCookieValue();
  const createdAt = now();
  const expiresAt = new Date(Date.now() + getSessionMaxAgeSeconds() * 1000);

  const session = await prisma.$transaction(async (tx: AuthTransactionClient) => {
    const createdSession = await tx.session.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId,
        userId: user.id,
        sessionTokenHash: hashSessionToken(sessionToken),
        status: "ACTIVE",
        expiresAt,
        lastSeenAt: createdAt,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null
      }
    });

    await tx.user.update({
      where: {
        id_restaurantId: {
          id: user.id,
          restaurantId
        }
      },
      data: { lastLoginAt: createdAt }
    });

    await tx.loginEvent.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId,
        userId: user.id,
        usernameAttempted: normalizedUsername,
        result: "SUCCESS",
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null
      }
    });

    return createdSession;
  });

  return {
    success: true,
    session: await buildSession(user, session),
    sessionToken
  };
}

export async function validateSessionToken(sessionToken: string | null | undefined) {
  if (!sessionToken) {
    return null;
  }

  await ensureAuthBootstrapData();

  const session = await prisma.session.findUnique({
    where: { sessionTokenHash: hashSessionToken(sessionToken) }
  });

  if (!session || session.status !== "ACTIVE" || session.revokedAt) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id_restaurantId: {
        id: session.userId,
        restaurantId: session.restaurantId
      }
    }
  });

  if (!user || user.status === "DISABLED") {
    await prisma.session.update({
      where: { id: session.id },
      data: { status: "REVOKED", revokedAt: now() }
    });

    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.update({
      where: { id: session.id },
      data: { status: "EXPIRED", revokedAt: now() }
    });

    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: now() }
  });

  return buildSession(user, session);
}

export async function revokeSessionToken(sessionToken: string | null | undefined) {
  if (!sessionToken) {
    return;
  }

  await prisma.session.updateMany({
    where: {
      sessionTokenHash: hashSessionToken(sessionToken),
      status: "ACTIVE"
    },
    data: {
      status: "REVOKED",
      revokedAt: now()
    }
  });
}
