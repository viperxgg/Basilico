import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { orderStore } from "@/lib/store/order-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request, ["KITCHEN", "ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  return NextResponse.json({
    orders: await orderStore.listOrders()
  });
}
