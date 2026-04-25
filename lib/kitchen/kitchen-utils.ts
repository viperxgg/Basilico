import type {
  ActivityStatus,
  RestaurantOrder
} from "@/lib/types/activity";

export type KitchenColumnId = "new" | "in_progress" | "ready" | "completed";

export type KitchenColumnDefinition = {
  id: KitchenColumnId;
  title: string;
  emptyText: string;
};

export const KITCHEN_COLUMNS: KitchenColumnDefinition[] = [
  {
    id: "new",
    title: "Ny order",
    emptyText: "Inga nya beställningar just nu"
  },
  {
    id: "in_progress",
    title: "Pågår",
    emptyText: "Inga pågående beställningar just nu"
  },
  {
    id: "ready",
    title: "Klar",
    emptyText: "Inga klara beställningar just nu"
  },
  {
    id: "completed",
    title: "Avslutad",
    emptyText: "Inga avslutade beställningar just nu"
  }
];

export function getKitchenColumnId(status: ActivityStatus): KitchenColumnId {
  if (status === "in_progress") {
    return "in_progress";
  }

  if (status === "ready") {
    return "ready";
  }

  if (status === "completed") {
    return "completed";
  }

  return "new";
}

export function groupOrdersByKitchenColumn(orders: RestaurantOrder[]) {
  return {
    new: orders
      .filter((order) => getKitchenColumnId(order.status) === "new")
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      ),
    in_progress: orders
      .filter((order) => getKitchenColumnId(order.status) === "in_progress")
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      ),
    ready: orders
      .filter((order) => getKitchenColumnId(order.status) === "ready")
      .sort(
        (left, right) =>
          new Date(right.updatedAt ?? right.createdAt).getTime() -
          new Date(left.updatedAt ?? left.createdAt).getTime()
      ),
    completed: orders
      .filter((order) => getKitchenColumnId(order.status) === "completed")
      .sort(
        (left, right) =>
          new Date(right.updatedAt ?? right.createdAt).getTime() -
          new Date(left.updatedAt ?? left.createdAt).getTime()
      )
  };
}

export function isKitchenOrderOverdue(order: RestaurantOrder, now: number) {
  return (
    order.status !== "completed" &&
    now - new Date(order.createdAt).getTime() >= 10 * 60 * 1000
  );
}
