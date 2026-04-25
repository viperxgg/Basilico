import { NextResponse, type NextRequest } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type GlobalRateLimits = typeof globalThis & {
  __nordRateLimitBuckets__: Map<string, RateLimitBucket> | undefined;
};

function getBuckets() {
  const globalRateLimits = globalThis as GlobalRateLimits;

  if (!globalRateLimits.__nordRateLimitBuckets__) {
    globalRateLimits.__nordRateLimitBuckets__ = new Map();
  }

  return globalRateLimits.__nordRateLimitBuckets__;
}

export function getClientRateLimitKey(request: NextRequest, scope: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  return `${scope}:${ipAddress}`;
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const buckets = getBuckets();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs
    });

    return { allowed: true as const };
  }

  if (existing.count >= limit) {
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return { allowed: true as const };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds)
      }
    }
  );
}
