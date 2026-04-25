import { NextRequest, NextResponse } from "next/server";

import { parseCreateAssistancePayload } from "@/lib/server/activity-validation";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";
import {
  checkRateLimit,
  getClientRateLimitKey,
  rateLimitResponse
} from "@/lib/server/rate-limit";
import { assistanceStore } from "@/lib/store/assistance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "public-assistance",
    action: "status"
  });

  try {
    const tableLabel = request.nextUrl.searchParams.get("table")?.trim() ?? "";

    if (!tableLabel) {
      return observation.finish(NextResponse.json({ active: false }), {
        result: "missing_table"
      });
    }

    const activeRequest = await assistanceStore.findActiveWaiterRequest(tableLabel);

    return observation.finish(
      NextResponse.json({
        active: Boolean(activeRequest)
      }),
      { result: activeRequest ? "active" : "inactive" }
    );
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(
      createErrorResponse("Unable to read waiter status."),
      { result: "exception" }
    );
  }
}

export async function POST(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "public-assistance",
    action: "create"
  });
  const rateLimit = checkRateLimit({
    key: getClientRateLimitKey(request, "assistance"),
    limit: 10,
    windowMs: 60_000
  });

  if (!rateLimit.allowed) {
    return observation.finish(rateLimitResponse(rateLimit.retryAfterSeconds), {
      result: "rate_limited"
    });
  }

  try {
    const payload = parseCreateAssistancePayload(await request.json());

    if (!payload.success) {
      return observation.finish(
        NextResponse.json(
          { error: "Invalid assistance request." },
          { status: 400 }
        ),
        { result: "validation_error" }
      );
    }

    const result = await assistanceStore.createAssistance(payload.data);

    return observation.finish(
      NextResponse.json(
        result.duplicate
          ? {
              duplicate: true,
              message: result.message
            }
          : {
              duplicate: false
            },
        {
          status: result.duplicate ? 200 : 201
        }
      ),
      { result: result.duplicate ? "duplicate" : "created" }
    );
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(
      createErrorResponse("Unable to create assistance request."),
      { result: "exception" }
    );
  }
}
