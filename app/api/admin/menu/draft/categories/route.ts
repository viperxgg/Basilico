import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { writeAuditLog } from "@/lib/server/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const payload = (await request.json()) as {
    label?: unknown;
    shortLabel?: unknown;
    description?: unknown;
  };

  const result = await menuReleaseStore.createDraftCategory({
    label: typeof payload.label === "string" ? payload.label : "",
    shortLabel:
      typeof payload.shortLabel === "string" ? payload.shortLabel : undefined,
    description:
      typeof payload.description === "string" ? payload.description : undefined
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAuditLog({
    session: auth.session,
    action: "menu.category.created",
    entityType: "menu_category",
    details: {
      label: typeof payload.label === "string" ? payload.label.trim() : ""
    }
  });

  return NextResponse.json(result, { status: 201 });
}
