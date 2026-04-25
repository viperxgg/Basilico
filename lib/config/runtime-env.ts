type DomainMode = "custom-apex" | "custom-subdomain" | "fallback-subdomain";
type UploadStorageMode = "local";

type BootstrapUserEnv = {
  username: string;
  password: string;
  displayName: string;
  email?: string;
};

export type RuntimeEnv = {
  databaseUrl: string;
  prismaDatabaseUrl?: string;
  directUrl?: string;
  postgresDatabaseName?: string;
  postgresAdminUrl?: string;
  restaurant: {
    name?: string;
    slug?: string;
    domain?: string;
    fallbackDomain?: string;
    domainMode?: DomainMode;
    vercelProjectName?: string;
  };
  auth: {
    passwordPepper?: string;
    sessionCookieName: string;
    sessionTtlHours: number;
    bootstrapAdmin: BootstrapUserEnv;
    bootstrapKitchen: BootstrapUserEnv;
  };
  uploads: {
    storageMode: UploadStorageMode;
    baseDir: string;
    publicBasePath: string;
    maxImageBytes: number;
  };
  internal: {
    environmentLabel: string;
  };
};

let cachedEnv: RuntimeEnv | undefined;

const PLACEHOLDER_SECRETS = new Set([
  "change-me",
  "change-me-admin",
  "change-me-kitchen",
  "replace-with-strong-admin-password",
  "replace-with-strong-kitchen-password"
]);

function readString(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readStringWithDefault(name: string, fallback: string) {
  return readString(name) ?? fallback;
}

function readPositiveInteger(name: string, fallback: number) {
  const raw = readString(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readDomainMode(value: string | undefined): DomainMode | undefined {
  if (
    value === "custom-apex" ||
    value === "custom-subdomain" ||
    value === "fallback-subdomain"
  ) {
    return value;
  }

  return undefined;
}

function assertEnvShape(env: RuntimeEnv) {
  if (!env.auth.sessionCookieName) {
    throw new Error("SESSION_COOKIE_NAME must not be empty.");
  }

  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL must be configured.");
  }

  if (env.uploads.storageMode !== "local") {
    throw new Error("Only local upload storage is supported in the current runtime.");
  }

  if (!env.uploads.baseDir || !env.uploads.publicBasePath.startsWith("/")) {
    throw new Error(
      "UPLOADS_BASE_DIR and UPLOADS_PUBLIC_BASE_PATH must resolve to usable local upload paths."
    );
  }

  const isProductionLike =
    env.internal.environmentLabel === "production" ||
    env.internal.environmentLabel === "staging";

  if (!isProductionLike) {
    return;
  }

  if (!env.auth.passwordPepper) {
    throw new Error(
      "AUTH_PASSWORD_PEPPER must be configured for staging and production deployments."
    );
  }

  if (PLACEHOLDER_SECRETS.has(env.auth.bootstrapAdmin.password)) {
    throw new Error(
      "AUTH_BOOTSTRAP_ADMIN_PASSWORD must be replaced before staging or production startup."
    );
  }

  if (PLACEHOLDER_SECRETS.has(env.auth.bootstrapKitchen.password)) {
    throw new Error(
      "AUTH_BOOTSTRAP_KITCHEN_PASSWORD must be replaced before staging or production startup."
    );
  }
}

export function getRuntimeEnv(): RuntimeEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const restaurantSlug = readString("RESTAURANT_SLUG");
  const defaultUploadsBaseDir = restaurantSlug
    ? `public/restaurants/${restaurantSlug}/dishes/uploads`
    : "public/restaurants/basilico/dishes/uploads";
  const defaultUploadsPublicBasePath = restaurantSlug
    ? `/restaurants/${restaurantSlug}/dishes/uploads`
    : "/restaurants/basilico/dishes/uploads";

  const env: RuntimeEnv = {
    databaseUrl: readStringWithDefault("DATABASE_URL", ""),
    prismaDatabaseUrl: readString("PRISMA_DATABASE_URL"),
    directUrl: readString("DIRECT_URL"),
    postgresDatabaseName: readString("POSTGRES_DATABASE_NAME"),
    postgresAdminUrl: readString("POSTGRES_ADMIN_URL"),
    restaurant: {
      name: readString("RESTAURANT_NAME"),
      slug: restaurantSlug,
      domain: readString("RESTAURANT_DOMAIN"),
      fallbackDomain: readString("FALLBACK_DOMAIN"),
      domainMode: readDomainMode(readString("DOMAIN_MODE")),
      vercelProjectName: readString("VERCEL_PROJECT_NAME")
    },
    auth: {
      passwordPepper: readString("AUTH_PASSWORD_PEPPER"),
      sessionCookieName: readStringWithDefault("SESSION_COOKIE_NAME", "nord_session"),
      sessionTtlHours: readPositiveInteger("SESSION_TTL_HOURS", 168),
      bootstrapAdmin: {
        username: readStringWithDefault("AUTH_BOOTSTRAP_ADMIN_USERNAME", "admin"),
        password: readStringWithDefault("AUTH_BOOTSTRAP_ADMIN_PASSWORD", "change-me"),
        displayName: readStringWithDefault("AUTH_BOOTSTRAP_ADMIN_DISPLAY_NAME", "Basilico Admin"),
        email: readString("AUTH_BOOTSTRAP_ADMIN_EMAIL")
      },
      bootstrapKitchen: {
        username: readStringWithDefault("AUTH_BOOTSTRAP_KITCHEN_USERNAME", "kitchen"),
        password: readStringWithDefault(
          "AUTH_BOOTSTRAP_KITCHEN_PASSWORD",
          "change-me-kitchen"
        ),
        displayName: readStringWithDefault(
          "AUTH_BOOTSTRAP_KITCHEN_DISPLAY_NAME",
          "Basilico Kitchen"
        )
      }
    },
    uploads: {
      storageMode: "local",
      baseDir: readStringWithDefault("UPLOADS_BASE_DIR", defaultUploadsBaseDir),
      publicBasePath: readStringWithDefault(
        "UPLOADS_PUBLIC_BASE_PATH",
        defaultUploadsPublicBasePath
      ),
      maxImageBytes: readPositiveInteger("UPLOADS_MAX_IMAGE_BYTES", 5 * 1024 * 1024)
    },
    internal: {
      environmentLabel: readStringWithDefault("INTERNAL_ENVIRONMENT_LABEL", "local")
    }
  };

  assertEnvShape(env);
  cachedEnv = env;
  return env;
}
