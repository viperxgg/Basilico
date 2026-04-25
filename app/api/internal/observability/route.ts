import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import {
  createRequestObservation,
  getRuntimeMetricsSnapshot
} from "@/lib/observability/runtime-observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "internal",
    action: "observability"
  });
  const auth = await requireApiSession(request, ["ADMIN"]);

  if (!auth.ok) {
    return observation.finish(
      NextResponse.json(auth.body, { status: auth.status }),
      { result: auth.status === 401 ? "unauthenticated" : "forbidden" }
    );
  }

  return observation.finish(
    NextResponse.json(getRuntimeMetricsSnapshot()),
    { result: "success" }
  );
}
