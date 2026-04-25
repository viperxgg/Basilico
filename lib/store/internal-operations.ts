import { sortActivities } from "@/lib/activity/activity-helpers";
import { orderStore } from "@/lib/store/order-store";
import { assistanceStore } from "@/lib/store/assistance-store";
import type { AssignedStaff, UpdateActivityInput } from "@/lib/types/activity";

export async function listInternalActivities() {
  const [orders, assistance] = await Promise.all([
    orderStore.listOrders(),
    assistanceStore.list()
  ]);

  return sortActivities([...orders, ...assistance]);
}

export async function updateInternalActivity(
  id: string,
  input: UpdateActivityInput,
  assignedTo?: AssignedStaff
) {
  const orderResult = await orderStore.updateOrder(id, input, assignedTo);
  if (orderResult) {
    return orderResult;
  }

  return assistanceStore.updateAssistance(id, input, assignedTo);
}

export async function clearCompletedInternalActivities() {
  const [orders, assistance] = await Promise.all([
    orderStore.clearCompletedOrders(),
    assistanceStore.clearCompleted()
  ]);

  return {
    deletedCount: orders.deletedCount + assistance.deletedCount
  };
}
