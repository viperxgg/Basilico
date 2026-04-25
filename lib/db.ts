import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { getRuntimeEnv } from "@/lib/config/runtime-env";

type GlobalPrisma = typeof globalThis & {
  __nordPrismaClient__?: PrismaClient;
};

function assertPostgresDatabaseUrl() {
  const databaseUrl = getRuntimeEnv().databaseUrl;

  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL must point to PostgreSQL. SQLite/file databases are not supported for this production runtime."
    );
  }
}

assertPostgresDatabaseUrl();

const globalForPrisma = globalThis as GlobalPrisma;

export const prisma =
  globalForPrisma.__nordPrismaClient__ ??
  new PrismaClient({
    adapter: new PrismaPg(getRuntimeEnv().databaseUrl),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__nordPrismaClient__ = prisma;
}
