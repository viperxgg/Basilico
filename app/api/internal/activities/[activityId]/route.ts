import { NextRequest, NextResponse } from "next/server";

import { getAssignedStaffFromSession } from "@/lib/auth/auth-store";
import { requireApiSession } from "@/lib/auth/server";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";
import { parseStatusPayload } from "@/lib/server/activity-validation";
import { updateInternalActivity } from "@/lib/store/internal-operations";
import { orderStore } from "@/lib/store/order-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ activityId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const observation = createRequestObservation(request, {
    category: "internal",
    action: "activity-update"
  });

  try {
    const auth = await requireApiSession(request, ["ADMIN", "KITCHEN"]);

    if (!auth.ok) {
      return observation.finish(
        NextResponse.json(auth.body, { status: auth.status }),
        { result: auth.status === 401 ? "unauthenticated" : "forbidden" }
      );
    }

    const payload = parseStatusPayload(await request.json());

    if (!payload.success) {
      return observation.finish(
        NextResponse.json({ error: payload.error }, { status: 400 }),
        { result: "validation_error" }
      );
    }

    const { activityId } = await context.params;
    const assignedTo = getAssignedStaffFromSession(auth.session);

    if (
      !auth.session.user.roles.includes("ADMIN") &&
      auth.session.user.roles.includes("KITCHEN")
    ) {
      const orderResult = await orderStore.updateOrder(activityId, {
        ...payload.data
      }, assignedTo);

      if (!orderResult) {
        return observation.finish(
          NextResponse.json({ error: "Forbidden." }, { status: 403 }),
          { result: "forbidden" }
        );
      }

      if ("error" in orderResult) {
        return observation.finish(
          NextResponse.json({ error: orderResult.error }, { status: 400 }),
          { result: "rejected" }
        );
      }

      return observation.finish(
        NextResponse.json({ activity: orderResult.activity }),
        { result: "updated" }
      );
    }

    const result = await updateInternalActivity(activityId, {
      ...payload.data
    }, assignedTo);

    if (!result) {
      return observation.finish(
        NextResponse.json({ error: "Activity not found." }, { status: 404 }),
        { result: "not_found" }
      );
    }

    if ("error" in result) {
      return observation.finish(
        NextResponse.json({ error: result.error }, { status: 400 }),
        { result: "rejected" }
      );
    }

    return observation.finish(
      NextResponse.json({ activity: result.activity }),
      { result: "updated" }
    );
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(
      createErrorResponse("Unable to update activity right now."),
      { result: "exception" }
    );
  }
}
