import { NextRequest, NextResponse } from "next/server";

import { parseCreateOrderPayload } from "@/lib/server/activity-validation";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";
import { siteConfig } from "@/lib/config/site";
import {
  checkRateLimit,
  getClientRateLimitKey,
  rateLimitResponse
} from "@/lib/server/rate-limit";
import { orderStore } from "@/lib/store/order-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "public-order",
    action: "create"
  });
  const rateLimit = checkRateLimit({
    key: getClientRateLimitKey(request, "orders"),
    limit: 6,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return observation.finish(rateLimitResponse(rateLimit.retryAfterSeconds), {
      result: "rate_limited"
    });
  }

  try {
    if (siteConfig.orderingMode === "browsing-only") {
      return observation.finish(
        NextResponse.json(
          { error: siteConfig.orderMessages.orderingDisabled },
          { status: 403 }
        ),
        { result: "ordering_disabled" }
      );
    }

    const payload = parseCreateOrderPayload(await request.json());

    if (!payload.success) {
      return observation.finish(
        NextResponse.json(
          { error: siteConfig.orderMessages.genericError },
          { status: 400 }
        ),
        { result: "validation_error" }
      );
    }

    const result = await orderStore.createOrder(payload.data);

    return observation.finish(
      NextResponse.json(
        { order: result.order, duplicate: result.duplicate },
        { status: result.duplicate ? 200 : 201 }
      ),
      {
        result: result.duplicate ? "duplicate_prevented" : "created",
        itemCount: result.order.items.length
      }
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
    ) {
      const status = Number((error as { status: number }).status);

      return observation.finish(
        createErrorResponse(siteConfig.orderMessages.genericError, status),
        { result: "rejected" }
      );
    }

    observation.fail(error, { result: "exception" });

    return observation.finish(
      createErrorResponse(siteConfig.orderMessages.genericError),
      { result: "exception" }
    );
  }
}
