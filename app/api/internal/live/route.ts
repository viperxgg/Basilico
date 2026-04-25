import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { encodeSseComment, encodeSseEvent } from "@/lib/realtime/sse";
import { subscribeToInternalLive } from "@/lib/store/internal-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request, ["ADMIN", "KITCHEN"]);

  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const isKitchenOnly =
    auth.session.user.roles.includes("KITCHEN") &&
    !auth.session.user.roles.includes("ADMIN");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encodeSseComment("connected"));

      const unsubscribe = subscribeToInternalLive((event) => {
        if (isKitchenOnly && event.activity.type !== "order") {
          return;
        }

        controller.enqueue(encodeSseEvent(event));
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(encodeSseComment("ping"));
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
