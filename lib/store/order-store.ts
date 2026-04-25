import { normalizeTableId } from "@/lib/activity/normalize-table-id";
import { applyActivityUpdate } from "@/lib/activity/activity-helpers";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors/app-error";
import {
  getDishById,
  getPublishedRestaurantOrNull,
  getStaticRestaurant
} from "@/lib/menu/restaurants";
import {
  incrementRuntimeMetric,
  writeRuntimeLog
} from "@/lib/observability/runtime-observability";
import type {
  ActivityEvent,
  ActivityEventName,
  AssignedStaff,
  CreateOrderInput,
  OrderItem,
  RestaurantOrder,
  UpdateActivityInput
} from "@/lib/types/activity";

type OrderEventListener = (event: ActivityEvent) => void;

function getRestaurantId() {
  return getStaticRestaurant().slug;
}

function getOrderEventName(action: "new" | "updated"): ActivityEventName {
  return action === "new" ? "order:new" : "order:updated";
}

function dbOrderStatus(status: RestaurantOrder["status"]) {
  switch (status) {
    case "claimed":
      return "CLAIMED" as const;
    case "in_progress":
      return "IN_PROGRESS" as const;
    case "ready":
      return "READY" as const;
    case "completed":
      return "COMPLETED" as const;
    default:
      return "NEW" as const;
  }
}

function appOrderStatus(
  status: "NEW" | "CLAIMED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELED"
): RestaurantOrder["status"] {
  switch (status) {
    case "CLAIMED":
      return "claimed";
    case "IN_PROGRESS":
      return "in_progress";
    case "READY":
      return "ready";
    case "COMPLETED":
      return "completed";
    default:
      return "new";
  }
}

function mapOrderRow(order: {
  id: string;
  tableRefNormalized: string;
  tableLabelSnapshot: string;
  guestCount: number | null;
  notes: string | null;
  subtotalMinor: number;
  totalMinor: number;
  status: "NEW" | "CLAIMED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELED";
  source: "CUSTOMER_MENU" | "ADMIN";
  claimedByUserId: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  claimedByUser?: { displayName: string } | null;
  items: Array<{
    menuDishId: string | null;
    dishNameSnapshot: string;
    dishPriceSnapshotMinor: number;
    quantity: number;
  }>;
}): RestaurantOrder {
  return {
    id: order.id,
    tableId: order.tableRefNormalized,
    tableLabel: order.tableLabelSnapshot,
    items: order.items.map(
      (item): OrderItem => ({
        itemId: item.menuDishId ?? item.dishNameSnapshot,
        dishNameSnapshot: item.dishNameSnapshot,
        dishPriceSnapshotMinor: item.dishPriceSnapshotMinor,
        quantity: item.quantity
      })
    ),
    subtotal: order.subtotalMinor,
    total: order.totalMinor,
    guestCount: order.guestCount ?? undefined,
    notes: order.notes ?? undefined,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    type: "order",
    status: appOrderStatus(order.status),
    source: "customer_menu",
    assignedTo:
      order.claimedByUserId && order.claimedByUser
        ? {
            id: order.claimedByUserId,
            name: order.claimedByUser.displayName,
            role: "Staff"
          }
        : undefined,
    assignedAt: order.claimedAt?.toISOString()
  };
}

function assignmentFields(activity: RestaurantOrder) {
  return {
    assignedStaffId: activity.assignedTo?.id ?? null,
    assignedAt: activity.assignedAt ? new Date(activity.assignedAt) : null
  };
}

const DUPLICATE_ORDER_WINDOW_MS = 15_000;

function normalizeFreeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function buildOrderFingerprint(input: {
  tableRefNormalized: string;
  guestCount?: number | null;
  notes?: string | null;
  total: number;
  items: Array<{
    dishNameSnapshot: string;
    dishPriceSnapshotMinor: number;
    quantity: number;
  }>;
}) {
  return JSON.stringify({
    table: input.tableRefNormalized,
    guestCount: input.guestCount ?? null,
    notes: normalizeFreeText(input.notes),
    total: input.total,
    items: input.items.map((item) => ({
      name: item.dishNameSnapshot,
      price: item.dishPriceSnapshotMinor,
      quantity: item.quantity
    }))
  });
}

class OrderStore {
  private listeners = new Set<OrderEventListener>();

  async listOrders() {
    const orderRows = await prisma.order.findMany({
      where: { restaurantId: getRestaurantId() },
      orderBy: { createdAt: "desc" },
      include: {
        items: { orderBy: { lineNumber: "asc" } },
        claimedByUser: true
      }
    });

    return orderRows.map(mapOrderRow);
  }

  subscribe(listener: OrderEventListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private async findRecentDuplicateOrder(input: {
    tableRefNormalized: string;
    guestCount?: number;
    notes?: string;
    total: number;
    items: Array<{
      dishNameSnapshot: string;
      dishPriceSnapshotMinor: number;
      quantity: number;
    }>;
  }) {
    const duplicateWindowStart = new Date(Date.now() - DUPLICATE_ORDER_WINDOW_MS);
    const fingerprint = buildOrderFingerprint(input);
    const recentOrders = await prisma.order.findMany({
      where: {
        restaurantId: getRestaurantId(),
        source: "CUSTOMER_MENU",
        tableRefNormalized: input.tableRefNormalized,
        createdAt: { gte: duplicateWindowStart },
        status: {
          in: ["NEW", "CLAIMED", "IN_PROGRESS", "READY"]
        }
      },
      include: {
        items: { orderBy: { lineNumber: "asc" } },
        claimedByUser: true
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    return (
      recentOrders.find((order) => {
        const orderFingerprint = buildOrderFingerprint({
          tableRefNormalized: order.tableRefNormalized,
          guestCount: order.guestCount,
          notes: order.notes,
          total: order.totalMinor,
          items: order.items
        });

        return orderFingerprint === fingerprint;
      }) ?? null
    );
  }

  async createOrder(input: CreateOrderInput): Promise<{
    order: RestaurantOrder;
    duplicate: boolean;
  }> {
    const orderId = crypto.randomUUID();
    const tableLabel = input.tableLabel.trim();
    const restaurant =
      (await getPublishedRestaurantOrNull()) ?? getStaticRestaurant();
    const tableRefNormalized = normalizeTableId(tableLabel);
    const items = input.items.map((item, index) => {
      const dish = getDishById(restaurant, item.dishId);

      if (!dish || dish.status !== "available") {
        throw new AppError(`Dish "${item.dishId}" is not available.`, 400);
      }
      const variant = item.variantId
        ? dish.variants?.find((candidate) => candidate.id === item.variantId)
        : undefined;

      if (item.variantId && !variant) {
        throw new AppError(`Variant "${item.variantId}" is not available.`, 400);
      }

      const price = variant?.price ?? dish.price;
      const variantLabel = variant?.label ? ` (${variant.label})` : "";

      return {
        lineNumber: index + 1,
        dishNameSnapshot: `${dish.name}${variantLabel}`,
        dishSlugSnapshot: dish.slug,
        dishPriceSnapshotMinor: price.amount,
        currencyCodeSnapshot: price.currency,
        categoryNameSnapshot: dish.categoryId,
        caloriesSnapshot: dish.calories,
        quantity: item.quantity
      };
    });
    const total = items.reduce(
      (sum, item) => sum + item.dishPriceSnapshotMinor * item.quantity,
      0
    );
    const duplicateOrder = await this.findRecentDuplicateOrder({
      tableRefNormalized,
      guestCount: input.guestCount,
      notes: input.notes,
      total,
      items
    });

    if (duplicateOrder) {
      incrementRuntimeMetric("orders.duplicate_prevented");
      writeRuntimeLog(
        "warn",
        {
          category: "system",
          action: "order-duplicate-blocked",
          route: "/api/orders",
          method: "POST"
        },
        {
          orderId: duplicateOrder.id,
          tableLabel,
          itemCount: duplicateOrder.items.length
        }
      );

      return {
        order: mapOrderRow(duplicateOrder),
        duplicate: true
      };
    }

    const order = await prisma.order.create({
      data: {
        id: orderId,
        restaurantId: restaurant.slug,
        tableRefNormalized,
        tableLabelSnapshot: tableLabel,
        subtotalMinor: total,
        totalMinor: total,
        currencyCode: restaurant.branding.currency,
        guestCount: input.guestCount ?? null,
        notes: input.notes?.trim() || null,
        status: "NEW",
        source: "CUSTOMER_MENU",
        items: {
          create: items.map((item) => ({
            id: crypto.randomUUID(),
            restaurant: {
              connect: { id: restaurant.slug }
            },
            ...item
          }))
        }
      },
      include: {
        items: { orderBy: { lineNumber: "asc" } },
        claimedByUser: true
      }
    });

    const mappedOrder = mapOrderRow(order);
    incrementRuntimeMetric("orders.created");
    writeRuntimeLog(
      "info",
      {
        category: "system",
        action: "order-created",
        route: "/api/orders",
        method: "POST"
      },
      {
        orderId: mappedOrder.id,
        tableLabel: mappedOrder.tableLabel,
        itemCount: mappedOrder.items.length,
        total: mappedOrder.total
      }
    );
    this.publish({ event: getOrderEventName("new"), activity: mappedOrder });

    return {
      order: mappedOrder,
      duplicate: false
    };
  }

  async clearCompletedOrders() {
    const result = await prisma.order.deleteMany({
      where: { restaurantId: getRestaurantId(), status: "COMPLETED" }
    });

    return { deletedCount: result.count };
  }

  async updateOrder(
    id: string,
    input: UpdateActivityInput,
    inputActor?: AssignedStaff
  ) {
    const orderRow = await prisma.order.findFirst({
      where: { restaurantId: getRestaurantId(), id },
      include: {
        items: { orderBy: { lineNumber: "asc" } },
        claimedByUser: true
      }
    });

    if (!orderRow) {
      return null;
    }

    const currentOrder = mapOrderRow(orderRow);
    const prepared = this.prepareUpdatedOrder(currentOrder, input, inputActor);

    if ("error" in prepared) {
      return prepared;
    }

    const nextAssignment = assignmentFields(prepared);
    const updated = await prisma.order.update({
      where: {
        id_restaurantId: {
          id,
          restaurantId: getRestaurantId()
        }
      },
      data: {
        status: dbOrderStatus(prepared.status),
        claimedByUserId: nextAssignment.assignedStaffId,
        claimedAt: nextAssignment.assignedAt
      },
      include: {
        items: { orderBy: { lineNumber: "asc" } },
        claimedByUser: true
      }
    });
    const activity = mapOrderRow(updated);
    incrementRuntimeMetric(`orders.status.${activity.status}`);
    writeRuntimeLog(
      "info",
      {
        category: "system",
        action: "order-status-updated",
        route: "/api/internal/activities/[activityId]",
        method: "PATCH"
      },
      {
        orderId: activity.id,
        status: activity.status,
        assignedTo: activity.assignedTo?.name ?? null
      }
    );

    this.publish({ event: getOrderEventName("updated"), activity });

    return { activity };
  }

  private prepareUpdatedOrder(
    activity: RestaurantOrder,
    input: UpdateActivityInput,
    inputActor?: AssignedStaff
  ) {
    const incomingAssignee = inputActor ?? activity.assignedTo;
    const hasAssignmentConflict =
      activity.assignedTo &&
      incomingAssignee &&
      activity.assignedTo.id !== incomingAssignee.id &&
      !input.allowReassign;

    if (hasAssignmentConflict) {
      const assignedStaffName =
        activity.assignedTo?.name ?? "another staff member";

      return {
        error: `Already assigned to ${assignedStaffName}.`
      };
    }

    if (input.status === "claimed" && !incomingAssignee) {
      return {
        error: "Assigned staff is required to claim this activity."
      };
    }

    return applyActivityUpdate(
      activity,
      input.status,
      incomingAssignee
    ) as RestaurantOrder;
  }

  private publish(event: ActivityEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

declare global {
  var __restaurantOrderStore__: OrderStore | undefined;
}

const existingOrderStore = globalThis.__restaurantOrderStore__;

export const orderStore =
  existingOrderStore &&
  typeof existingOrderStore.clearCompletedOrders === "function"
    ? existingOrderStore
    : (globalThis.__restaurantOrderStore__ = new OrderStore());
