import type {
  AssignedStaff,
  ActivityEventName,
  ActivityFilter,
  ActivityStatus,
  AssistanceRequest,
  RestaurantActivity
} from "@/lib/types/activity";

export const ACTIVITY_FILTERS: Array<{ id: ActivityFilter; label: string }> = [
  { id: "all", label: "Alla" },
  { id: "orders", label: "Beställningar" },
  { id: "assistance", label: "Service" },
  { id: "pending", label: "Aktiva" },
  { id: "completed", label: "Avslutade" }
];

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  new: "Ny order",
  claimed: "Mottagen",
  in_progress: "Pågår",
  ready: "Klar",
  completed: "Avslutad"
};

export const ACTIVITY_STREAM_EVENTS: ActivityEventName[] = [
  "order:new",
  "order:updated",
  "assistance:new",
  "assistance:updated"
];

export const ACTIVE_ACTIVITY_STATUSES = new Set<ActivityStatus>([
  "new",
  "claimed",
  "in_progress"
]);

export function isActivityPending(activity: RestaurantActivity) {
  return activity.status !== "completed";
}

export function isAssistanceActivity(
  activity: RestaurantActivity
): activity is AssistanceRequest {
  return activity.type === "assistance";
}

export function isWaiterRequestActivity(activity: RestaurantActivity) {
  return (
    isAssistanceActivity(activity) && activity.requestType === "call_waiter"
  );
}

export function isActiveWaiterRequest(activity: RestaurantActivity) {
  return (
    isWaiterRequestActivity(activity) &&
    ACTIVE_ACTIVITY_STATUSES.has(activity.status)
  );
}

export function getDefaultAssistanceMessage(
  requestType: AssistanceRequest["requestType"]
) {
  return requestType === "call_waiter"
    ? "Gästen har tillkallat personal."
    : "Gästen behöver hjälp med allergener.";
}

export function getActivityStatusOptions(
  activity: RestaurantActivity
): ActivityStatus[] {
  if (activity.type === "order") {
    return ["new", "claimed", "in_progress", "ready", "completed"];
  }

  return ["new", "claimed", "in_progress", "completed"];
}

export function getActivityTitle(activity: RestaurantActivity) {
  if (activity.type === "order") {
    return "Beställning";
  }

  return activity.requestType === "call_waiter"
    ? "Personal tillkallad"
    : "Allergenfråga";
}

export function buildActivitySearchText(activity: RestaurantActivity) {
  if (activity.type === "order") {
    return [
      activity.tableLabel,
      activity.status,
      activity.notes,
      activity.assignedTo?.name,
      activity.assignedTo?.role,
      ...activity.items.map(
        (item) => `${item.quantity} ${item.dishNameSnapshot}`
      ),
      String(activity.total)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  return [
    activity.tableLabel,
    activity.status,
    activity.requestType,
    activity.message,
    activity.assignedTo?.name,
    activity.assignedTo?.role
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesActivityFilter(
  activity: RestaurantActivity,
  filter: ActivityFilter
) {
  return (
    filter === "all" ||
    (filter === "orders" && activity.type === "order") ||
    (filter === "assistance" && activity.type === "assistance") ||
    (filter === "pending" && isActivityPending(activity)) ||
    (filter === "completed" && activity.status === "completed")
  );
}

export function sortActivities(activities: RestaurantActivity[]) {
  return [...activities].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function upsertActivity(
  currentActivities: RestaurantActivity[],
  nextActivity: RestaurantActivity
) {
  const remaining = currentActivities.filter(
    (activity) => activity.id !== nextActivity.id
  );

  return sortActivities([nextActivity, ...remaining]);
}

export function applyActivityUpdate(
  activity: RestaurantActivity,
  status: ActivityStatus,
  assignedTo?: AssignedStaff
) {
  const nextAssignedTo =
    status === "new"
      ? undefined
      : assignedTo || activity.assignedTo;

  const assignmentChanged =
    nextAssignedTo?.id && nextAssignedTo.id !== activity.assignedTo?.id;

  return {
    ...activity,
    status,
    updatedAt: new Date().toISOString(),
    assignedTo: nextAssignedTo,
    assignedAt: assignmentChanged
      ? new Date().toISOString()
      : activity.assignedAt
  };
}

export function getActiveWaiterTableIds(activities: RestaurantActivity[]) {
  return Array.from(
    new Set(
      activities
        .filter(isActiveWaiterRequest)
        .map((activity) => activity.tableId)
    )
  );
}

export function isAssignedToStaff(
  activity: RestaurantActivity,
  staff: AssignedStaff
) {
  return activity.assignedTo?.id === staff.id;
}

export function isAssignedToOtherStaff(
  activity: RestaurantActivity,
  staff: AssignedStaff
) {
  return !!activity.assignedTo && activity.assignedTo.id !== staff.id;
}
