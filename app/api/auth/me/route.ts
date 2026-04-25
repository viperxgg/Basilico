import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "auth",
    action: "me"
  });

  try {
    const auth = await requireApiSession(request);

    if (!auth.ok) {
      return observation.finish(
        NextResponse.json(auth.body, { status: auth.status }),
        { result: auth.status === 401 ? "unauthenticated" : "forbidden" }
      );
    }

    return observation.finish(
      NextResponse.json({
        user: auth.session.user,
        expiresAt: auth.session.expiresAt
      }),
      { result: "success", roleCount: auth.session.user.roles.length }
    );
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(createErrorResponse("Unable to read session."), {
      result: "exception"
    });
  }
}
