import { normalizeTableId } from "@/lib/activity/normalize-table-id";
import {
  ACTIVE_ACTIVITY_STATUSES,
  applyActivityUpdate,
  getDefaultAssistanceMessage,
  sortActivities
} from "@/lib/activity/activity-helpers";
import { prisma } from "@/lib/db";
import { getDefaultRestaurant } from "@/lib/menu/restaurants";
import type {
  ActivityEvent,
  ActivityEventName,
  AssistanceRequest,
  AssignedStaff,
  CreateAssistanceInput,
  CreateAssistanceResult,
  UpdateActivityInput
} from "@/lib/types/activity";

type AssistanceListener = (event: ActivityEvent) => void;

const ACTIVE_WAITER_STATUSES = Array.from(ACTIVE_ACTIVITY_STATUSES);
const ACTIVE_WAITER_MESSAGE = "Your assistance request is already active.";

function getRestaurantId() {
  return getDefaultRestaurant().slug;
}

function getAssistanceEventName(action: "new" | "updated"): ActivityEventName {
  return action === "new" ? "assistance:new" : "assistance:updated";
}

function dbAssistanceStatus(status: AssistanceRequest["status"]) {
  switch (status) {
    case "claimed":
      return "CLAIMED" as const;
    case "in_progress":
      return "IN_PROGRESS" as const;
    case "ready":
      return "COMPLETED" as const;
    case "completed":
      return "COMPLETED" as const;
    default:
      return "NEW" as const;
  }
}

function appAssistanceStatus(
  status: "NEW" | "CLAIMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED"
): AssistanceRequest["status"] {
  switch (status) {
    case "CLAIMED":
      return "claimed";
    case "IN_PROGRESS":
      return "in_progress";
    case "COMPLETED":
      return "completed";
    default:
      return "new";
  }
}

function dbRequestType(type: AssistanceRequest["requestType"]) {
  return type === "allergen_help" ? "ALLERGEN_HELP" : "CALL_WAITER";
}

function appRequestType(type: "CALL_WAITER" | "ALLERGEN_HELP") {
  return type === "ALLERGEN_HELP" ? "allergen_help" : "call_waiter";
}

function mapAssistanceRow(row: {
  id: string;
  tableRefNormalized: string;
  tableLabelSnapshot: string;
  requestType: "CALL_WAITER" | "ALLERGEN_HELP";
  message: string;
  status: "NEW" | "CLAIMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  source: "CUSTOMER_MENU" | "ADMIN";
  handledByUserId: string | null;
  handledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  handledByUser?: { displayName: string } | null;
}): AssistanceRequest {
  return {
    id: row.id,
    tableId: row.tableRefNormalized,
    tableLabel: row.tableLabelSnapshot,
    requestType: appRequestType(row.requestType),
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    type: "assistance",
    status: appAssistanceStatus(row.status),
    source: "customer_menu",
    assignedTo:
      row.handledByUserId && row.handledByUser
        ? {
            id: row.handledByUserId,
            name: row.handledByUser.displayName,
            role: "Staff"
          }
        : undefined,
    assignedAt: row.handledAt?.toISOString()
  };
}

function dbActiveStatuses() {
  return ACTIVE_WAITER_STATUSES.map(dbAssistanceStatus);
}

class AssistanceStore {
  private listeners = new Set<AssistanceListener>();

  async list() {
    const assistanceRows = await prisma.assistanceRequest.findMany({
      where: { restaurantId: getRestaurantId() },
      orderBy: { createdAt: "desc" },
      include: { handledByUser: true }
    });

    return sortActivities(assistanceRows.map(mapAssistanceRow));
  }

  subscribe(listener: AssistanceListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async findActiveWaiterRequest(tableLabel: string) {
    const requestRow = await prisma.assistanceRequest.findFirst({
      where: {
        restaurantId: getRestaurantId(),
        tableRefNormalized: normalizeTableId(tableLabel),
        requestType: "CALL_WAITER",
        status: { in: dbActiveStatuses() }
      },
      orderBy: { createdAt: "desc" },
      include: { handledByUser: true }
    });

    return requestRow ? mapAssistanceRow(requestRow) : null;
  }

  async createAssistance(
    input: CreateAssistanceInput
  ): Promise<CreateAssistanceResult> {
    const tableLabel = input.tableLabel.trim();
    const tableId = normalizeTableId(tableLabel);

    if (input.requestType === "call_waiter") {
      const existingRequest = await this.findActiveWaiterRequest(tableLabel);

      if (existingRequest) {
        return {
          assistance: existingRequest,
          duplicate: true,
          message: ACTIVE_WAITER_MESSAGE
        };
      }
    }

    const assistance = await prisma.assistanceRequest.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId: getRestaurantId(),
        tableRefNormalized: tableId,
        tableLabelSnapshot: tableLabel,
        requestType: dbRequestType(input.requestType),
        message: input.message?.trim() || getDefaultAssistanceMessage(input.requestType),
        status: "NEW",
        source: "CUSTOMER_MENU"
      },
      include: { handledByUser: true }
    });
    const mapped = mapAssistanceRow(assistance);

    this.publish({
      event: getAssistanceEventName("new"),
      activity: mapped
    });

    return {
      assistance: mapped,
      duplicate: false
    };
  }

  async updateAssistance(
    id: string,
    input: UpdateActivityInput,
    inputActor?: AssignedStaff
  ) {
    const assistanceRow = await prisma.assistanceRequest.findFirst({
      where: { restaurantId: getRestaurantId(), id },
      include: { handledByUser: true }
    });

    if (!assistanceRow) {
      return null;
    }

    const currentActivity = mapAssistanceRow(assistanceRow);
    const prepared = this.prepareUpdatedAssistance(
      currentActivity,
      input,
      inputActor
    );

    if ("error" in prepared) {
      return prepared;
    }

    const updated = await prisma.assistanceRequest.update({
      where: {
        id_restaurantId: {
          id,
          restaurantId: getRestaurantId()
        }
      },
      data: {
        status: dbAssistanceStatus(prepared.status),
        handledByUserId: prepared.assignedTo?.id ?? null,
        handledAt: prepared.assignedAt ? new Date(prepared.assignedAt) : null
      },
      include: { handledByUser: true }
    });
    const activity = mapAssistanceRow(updated);

    this.publish({
      event: getAssistanceEventName("updated"),
      activity
    });

    return { activity };
  }

  async clearCompleted() {
    const result = await prisma.assistanceRequest.deleteMany({
      where: { restaurantId: getRestaurantId(), status: "COMPLETED" }
    });

    return { deletedCount: result.count };
  }

  private prepareUpdatedAssistance(
    activity: AssistanceRequest,
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
    ) as AssistanceRequest;
  }

  private publish(event: ActivityEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

declare global {
  var __restaurantAssistanceStore__: AssistanceStore | undefined;
}

const existingAssistanceStore = globalThis.__restaurantAssistanceStore__;

export const assistanceStore =
  existingAssistanceStore &&
  typeof existingAssistanceStore.clearCompleted === "function"
    ? existingAssistanceStore
    : (globalThis.__restaurantAssistanceStore__ = new AssistanceStore());

