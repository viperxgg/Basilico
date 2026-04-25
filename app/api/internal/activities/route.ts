import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import {
  clearCompletedInternalActivities,
  listInternalActivities
} from "@/lib/store/internal-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  return NextResponse.json({
    activities: await listInternalActivities()
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const result = await clearCompletedInternalActivities();

  return NextResponse.json(result);
}
