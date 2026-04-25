import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { writeAuditLog } from "@/lib/server/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const [releases, currentDraft] = await Promise.all([
    menuReleaseStore.listReleases(),
    menuReleaseStore.getCurrentDraftEditor()
  ]);

  return NextResponse.json({
    releases,
    currentDraft
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const result = await menuReleaseStore.createDraftFromPublished(auth.session.user.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAuditLog({
    session: auth.session,
    action: "menu.release.draft_created",
    entityType: "menu_release",
    entityId: result.release.id,
    details: { version: result.release.version }
  });

  return NextResponse.json(result, { status: 201 });
}
