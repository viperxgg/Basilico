import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { writeAuditLog } from "@/lib/server/audit-log";
import type { DishAvailabilityStatus } from "@/lib/types/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ dishId: string }>;
};

function parseStatus(value: unknown): DishAvailabilityStatus | undefined {
  return value === "available" || value === "sold-out" || value === "hidden"
    ? value
    : undefined;
}

function parseList(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const payload = (await request.json()) as {
    categoryId?: unknown;
    name?: unknown;
    description?: unknown;
    priceMinor?: unknown;
    calories?: unknown;
    status?: unknown;
    imageRef?: unknown;
    imageAlt?: unknown;
    ingredients?: unknown;
    allergens?: unknown;
  };
  const { dishId } = await context.params;

  const priceMinor =
    typeof payload.priceMinor === "number" &&
    Number.isInteger(payload.priceMinor) &&
    payload.priceMinor >= 0
      ? payload.priceMinor
      : undefined;
  const calories =
    typeof payload.calories === "number" && Number.isInteger(payload.calories)
      ? payload.calories
      : payload.calories === null
        ? null
        : undefined;

  const result = await menuReleaseStore.updateDraftDish(dishId, {
    categoryId:
      typeof payload.categoryId === "string" ? payload.categoryId : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    description:
      typeof payload.description === "string" ? payload.description : undefined,
    priceMinor,
    calories,
    status: parseStatus(payload.status),
    imageRef:
      typeof payload.imageRef === "string" ? payload.imageRef : undefined,
    imageAlt: typeof payload.imageAlt === "string" ? payload.imageAlt : undefined,
    ingredients: parseList(payload.ingredients),
    allergens: parseList(payload.allergens)
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAuditLog({
    session: auth.session,
    action: "menu.dish.updated",
    entityType: "menu_dish",
    entityId: dishId
  });

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const { dishId } = await context.params;
  const result = await menuReleaseStore.deleteDraftDish(dishId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAuditLog({
    session: auth.session,
    action: "menu.dish.deleted",
    entityType: "menu_dish",
    entityId: dishId
  });

  return NextResponse.json(result);
}
