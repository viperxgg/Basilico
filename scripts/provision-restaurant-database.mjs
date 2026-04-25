import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

function readFlag(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function printUsage() {
  console.error(
    "Usage: node scripts/provision-restaurant-database.mjs --bundle-dir \"artifacts/provisioning/restaurant-slug\""
  );
}

function parseEnvFile(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function sanitizeDatabaseName(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("POSTGRES_DATABASE_NAME must contain only letters, numbers, and underscores.");
  }

  return name;
}

async function ensureDatabaseExists(adminUrl, databaseName) {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  try {
    const existing = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1",
      [databaseName]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return { created: false };
    }

    // The name is validated above; quote wrapping preserves underscores and casing.
    await client.query(`CREATE DATABASE "${databaseName}"`);
    return { created: true };
  } finally {
    await client.end();
  }
}

const bundleDir = readFlag("--bundle-dir");
if (!bundleDir) {
  printUsage();
  process.exit(1);
}

const resolvedBundleDir = path.resolve(process.cwd(), bundleDir);
const envFilePath = path.join(resolvedBundleDir, ".env.generated");

if (!fs.existsSync(envFilePath)) {
  console.error(`Missing generated env file: ${envFilePath}`);
  process.exit(1);
}

const envValues = parseEnvFile(fs.readFileSync(envFilePath, "utf8"));
const adminUrl = envValues.POSTGRES_ADMIN_URL;
const prismaDatabaseUrl = envValues.PRISMA_DATABASE_URL;
const databaseName = envValues.POSTGRES_DATABASE_NAME;

if (!adminUrl || !prismaDatabaseUrl || !databaseName) {
  console.error(
    "The provisioning bundle must define POSTGRES_ADMIN_URL, PRISMA_DATABASE_URL, and POSTGRES_DATABASE_NAME."
  );
  process.exit(1);
}

sanitizeDatabaseName(databaseName);

const migrateEnv = {
  ...process.env,
  PRISMA_DATABASE_URL: prismaDatabaseUrl
};

const prismaCliPath = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
if (!fs.existsSync(prismaCliPath)) {
  console.error("Prisma CLI is not installed. Run npm install first.");
  process.exit(1);
}

const run = async () => {
  const { created } = await ensureDatabaseExists(adminUrl, databaseName);

  const validateResult = spawnSync(
    process.execPath,
    [prismaCliPath, "validate", "--schema", "./prisma/schema.prisma"],
    {
      cwd: process.cwd(),
      env: migrateEnv,
      stdio: "inherit"
    }
  );

  if (validateResult.status !== 0) {
    process.exit(validateResult.status ?? 1);
  }

  const migrateResult = spawnSync(
    process.execPath,
    [prismaCliPath, "migrate", "deploy", "--schema", "./prisma/schema.prisma"],
    {
      cwd: process.cwd(),
      env: migrateEnv,
      stdio: "inherit"
    }
  );

  if (migrateResult.status !== 0) {
    process.exit(migrateResult.status ?? 1);
  }

  console.log(created ? `Database created: ${databaseName}` : `Database already exists: ${databaseName}`);
  console.log(`Migrations applied using PRISMA_DATABASE_URL from ${envFilePath}`);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
