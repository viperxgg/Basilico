import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { invalidatePublicMenuCache } from "@/lib/menu/public-menu-cache";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";
import { writeAuditLog } from "@/lib/server/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ releaseId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const observation = createRequestObservation(request, {
    category: "admin-menu",
    action: "publish"
  });

  try {
    const auth = await requireApiSession(request, ["ADMIN"]);
    if (!auth.ok) {
      return observation.finish(
        NextResponse.json(auth.body, { status: auth.status }),
        { result: auth.status === 401 ? "unauthenticated" : "forbidden" }
      );
    }

    const { releaseId } = await context.params;
    const result = await menuReleaseStore.publishDraftRelease(releaseId);

    if ("error" in result) {
      return observation.finish(
        NextResponse.json({ error: result.error }, { status: 400 }),
        { result: "publish_rejected" }
      );
    }

    await writeAuditLog({
      session: auth.session,
      action: "menu.release.published",
      entityType: "menu_release",
      entityId: result.release.id,
      details: { version: result.release.version }
    });

    invalidatePublicMenuCache();

    return observation.finish(NextResponse.json(result), {
      result: "published"
    });
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(
      createErrorResponse("Unable to publish menu release."),
      { result: "exception" }
    );
  }
}
