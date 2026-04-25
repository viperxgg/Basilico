import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getRuntimeEnv } from "@/lib/config/runtime-env";

type LogLevel = "info" | "warn" | "error";

type MetricEntry = {
  name: string;
  count: number;
  lastAt: string;
};

type MetricsStore = {
  startedAt: string;
  counters: Map<string, MetricEntry>;
};

type GlobalMetrics = typeof globalThis & {
  __nordRuntimeMetrics__: MetricsStore | undefined;
};

type RequestObservationOptions = {
  category:
    | "auth"
    | "public-menu"
    | "public-order"
    | "public-assistance"
    | "admin-menu"
    | "upload"
    | "internal";
  action: string;
};

type LogDetails = Record<string, string | number | boolean | null | undefined>;

const runtimeEnv = getRuntimeEnv();

function getMetricsStore() {
  const globalMetrics = globalThis as GlobalMetrics;

  if (!globalMetrics.__nordRuntimeMetrics__) {
    globalMetrics.__nordRuntimeMetrics__ = {
      startedAt: new Date().toISOString(),
      counters: new Map()
    };
  }

  return globalMetrics.__nordRuntimeMetrics__;
}

function incrementMetric(name: string) {
  const metricsStore = getMetricsStore();
  const existing = metricsStore.counters.get(name);
  const lastAt = new Date().toISOString();

  metricsStore.counters.set(name, {
    name,
    count: existing ? existing.count + 1 : 1,
    lastAt
  });
}

export function incrementRuntimeMetric(name: string) {
  incrementMetric(name);
}

function toStatusClass(status: number) {
  if (status >= 500) {
    return "5xx";
  }

  if (status >= 400) {
    return "4xx";
  }

  if (status >= 300) {
    return "3xx";
  }

  if (status >= 200) {
    return "2xx";
  }

  return "other";
}

function getRequestId(request: NextRequest) {
  return request.headers.get("x-request-id")?.trim() || randomUUID();
}

function writeLog(
  level: LogLevel,
  request: Pick<NextRequest, "method" | "nextUrl">,
  requestId: string,
  options: {
    category: RequestObservationOptions["category"] | "system";
    action: string;
  },
  durationMs: number | null,
  details?: LogDetails
) {
  const payload = {
    level,
    timestamp: new Date().toISOString(),
    requestId,
    environment: runtimeEnv.internal.environmentLabel,
    restaurantSlug: runtimeEnv.restaurant.slug ?? "unknown",
    category: options.category,
    action: options.action,
    method: request.method,
    route: request.nextUrl.pathname,
    durationMs,
    ...details
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export function writeRuntimeLog(
  level: LogLevel,
  options: {
    category: RequestObservationOptions["category"] | "system";
    action: string;
    route?: string;
    method?: string;
    requestId?: string;
    durationMs?: number | null;
  },
  details?: LogDetails
) {
  writeLog(
    level,
    {
      method: options.method ?? "SYSTEM",
      nextUrl: {
        pathname: options.route ?? "system"
      } as NextRequest["nextUrl"]
    },
    options.requestId ?? randomUUID(),
    {
      category: options.category,
      action: options.action
    },
    options.durationMs ?? null,
    details
  );
}

export function createRequestObservation(
  request: NextRequest,
  options: RequestObservationOptions
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();

  incrementMetric("requests.total");
  incrementMetric(`requests.route.${request.nextUrl.pathname}`);
  incrementMetric(`requests.method.${request.method}`);
  incrementMetric(`flow.${options.category}.${options.action}.started`);

  return {
    requestId,
    finish(response: NextResponse, details?: LogDetails) {
      const durationMs = Date.now() - startedAt;
      const statusClass = toStatusClass(response.status);

      incrementMetric(`requests.status.${response.status}`);
      incrementMetric(`requests.status-class.${statusClass}`);
      incrementMetric(`flow.${options.category}.${options.action}.status.${response.status}`);

      if (response.status >= 500) {
        incrementMetric(`flow.${options.category}.${options.action}.failure`);
      } else if (response.status >= 400) {
        incrementMetric(`flow.${options.category}.${options.action}.rejected`);
      } else {
        incrementMetric(`flow.${options.category}.${options.action}.success`);
      }

      response.headers.set("x-request-id", requestId);
      writeLog("info", request, requestId, options, durationMs, {
        status: response.status,
        ...details
      });

      return response;
    },
    fail(error: unknown, details?: LogDetails) {
      const durationMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : "Unknown error";

      incrementMetric(`flow.${options.category}.${options.action}.exception`);
      incrementMetric("requests.exceptions");

      writeLog("error", request, requestId, options, durationMs, {
        errorMessage: message,
        ...details
      });
    }
  };
}

export function createErrorResponse(
  message: string,
  status = 500
) {
  return NextResponse.json({ error: message }, { status });
}

export function getRuntimeMetricsSnapshot() {
  const metricsStore = getMetricsStore();

  return {
    generatedAt: new Date().toISOString(),
    startedAt: metricsStore.startedAt,
    environment: runtimeEnv.internal.environmentLabel,
    restaurantSlug: runtimeEnv.restaurant.slug ?? null,
    counters: Array.from(metricsStore.counters.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    )
  };
}
