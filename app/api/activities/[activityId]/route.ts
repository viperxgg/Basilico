import { NextRequest, NextResponse } from "next/server";

import { getAssignedStaffFromSession } from "@/lib/auth/auth-store";
import { requireApiSession } from "@/lib/auth/server";
import { parseStatusPayload } from "@/lib/server/activity-validation";
import { updateInternalActivity } from "@/lib/store/internal-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ activityId: string }>;
};

// Compatibility route for older admin clients that may still patch `/api/activities/:id`.
// The canonical protected endpoint is `/api/internal/activities/:id`.
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const payload = parseStatusPayload(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  const { activityId } = await context.params;
  const result = await updateInternalActivity(
    activityId,
    payload.data,
    getAssignedStaffFromSession(auth.session)
  );

  if (!result) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ activity: result.activity });
}
