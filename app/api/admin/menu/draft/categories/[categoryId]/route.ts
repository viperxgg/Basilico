import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { writeAuditLog } from "@/lib/server/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const payload = (await request.json()) as {
    label?: unknown;
    shortLabel?: unknown;
    description?: unknown;
  };
  const { categoryId } = await context.params;

  const result = await menuReleaseStore.updateDraftCategory(categoryId, {
    label: typeof payload.label === "string" ? payload.label : undefined,
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
    action: "menu.category.updated",
    entityType: "menu_category",
    entityId: categoryId
  });

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const { categoryId } = await context.params;
  const result = await menuReleaseStore.deleteDraftCategory(categoryId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAuditLog({
    session: auth.session,
    action: "menu.category.deleted",
    entityType: "menu_category",
    entityId: categoryId
  });

  return NextResponse.json(result);
}
