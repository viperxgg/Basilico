import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { writeAuditLog } from "@/lib/server/audit-log";
import type { DishAvailabilityStatus } from "@/lib/types/restaurant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseStatus(value: unknown): DishAvailabilityStatus {
  return value === "sold-out" || value === "hidden" ? value : "available";
}

function parseList(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
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

  const priceMinor =
    typeof payload.priceMinor === "number" &&
    Number.isInteger(payload.priceMinor) &&
    payload.priceMinor >= 0
      ? payload.priceMinor
      : Number.NaN;
  const calories =
    typeof payload.calories === "number" && Number.isInteger(payload.calories)
      ? payload.calories
      : payload.calories === null
        ? null
        : undefined;

  const result = await menuReleaseStore.createDraftDish({
    categoryId:
      typeof payload.categoryId === "string" ? payload.categoryId : "",
    name: typeof payload.name === "string" ? payload.name : "",
    description:
      typeof payload.description === "string" ? payload.description : "",
    priceMinor,
    calories,
    status: parseStatus(payload.status),
    imageRef: typeof payload.imageRef === "string" ? payload.imageRef : undefined,
    imageAlt: typeof payload.imageAlt === "string" ? payload.imageAlt : "",
    ingredients: parseList(payload.ingredients),
    allergens: parseList(payload.allergens)
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAuditLog({
    session: auth.session,
    action: "menu.dish.created",
    entityType: "menu_dish",
    details: {
      name: typeof payload.name === "string" ? payload.name.trim() : ""
    }
  });

  return NextResponse.json(result, { status: 201 });
}
