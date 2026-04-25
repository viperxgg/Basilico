import { prisma } from "@/lib/db";
import type { AuthSession } from "@/lib/auth/types";

type AuditLogInput = {
  session: AuthSession;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, string | number | boolean | null | undefined>;
};

function toAuditTargetType(entityType: string) {
  switch (entityType) {
    case "menu_release":
      return "MENU_RELEASE" as const;
    case "menu_category":
      return "MENU_CATEGORY" as const;
    case "menu_dish":
      return "MENU_DISH" as const;
    case "restaurant_table":
      return "RESTAURANT_TABLE" as const;
    case "user":
      return "USER" as const;
    case "order":
      return "ORDER" as const;
    case "assistance_request":
      return "ASSISTANCE_REQUEST" as const;
    default:
      return "SETTINGS" as const;
  }
}

export async function writeAuditLog(input: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId: input.session.restaurantId,
      actorUserId: input.session.user.id,
      actorType: "USER",
      actorLabel: input.session.user.displayName,
      action: input.action,
      targetType: toAuditTargetType(input.entityType),
      targetId: input.entityId ?? null,
      detailsJson: input.details ?? {}
    }
  });
}

