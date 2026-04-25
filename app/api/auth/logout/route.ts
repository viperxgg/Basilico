import { NextRequest, NextResponse } from "next/server";

import { getSessionCookieName } from "@/lib/auth/auth-store";
import { clearServerSessionCookie } from "@/lib/auth/server";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "auth",
    action: "logout"
  });

  try {
    await clearServerSessionCookie();
    const isSecureRequest =
      new URL(request.url).protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: getSessionCookieName(),
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest,
      path: "/",
      expires: new Date(0)
    });

    return observation.finish(response, { result: "success" });
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(createErrorResponse("Unable to complete logout."), {
      result: "exception"
    });
  }
}
