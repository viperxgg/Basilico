import type {
  AssistanceRequestType,
  CreateAssistanceInput,
  CreateOrderItemInput,
  CreateOrderInput,
  UpdateActivityInput
} from "@/lib/types/activity";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const TABLE_LABEL_PATTERN = /^[\p{L}\p{N}\s#\-]{1,24}$/u;
const MAX_ORDER_ITEM_QUANTITY = 20;
const MAX_GUEST_COUNT = 20;
const MAX_NOTES_LENGTH = 280;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseOrderItems(value: unknown): ValidationResult<CreateOrderItemInput[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return { success: false, error: "Order items are required." };
  }

  const items: CreateOrderItemInput[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      return { success: false, error: "Each order item must be a valid object." };
    }

    const dishId = typeof item.dishId === "string" ? item.dishId.trim() : "";
    const variantId =
      typeof item.variantId === "string" && item.variantId.trim()
        ? item.variantId.trim()
        : undefined;
    const quantity =
      typeof item.quantity === "number" && Number.isInteger(item.quantity)
        ? item.quantity
        : Number.NaN;

    if (
      !dishId ||
      quantity < 1 ||
      quantity > MAX_ORDER_ITEM_QUANTITY ||
      !Number.isFinite(quantity)
    ) {
      return { success: false, error: "Order items contain invalid values." };
    }

    items.push({ dishId, variantId, quantity });
  }

  return { success: true, data: items };
}

function parseTableLabel(value: unknown): ValidationResult<string> {
  const tableLabel = typeof value === "string" ? value.trim() : "";

  if (!tableLabel || !TABLE_LABEL_PATTERN.test(tableLabel)) {
    return { success: false, error: "Table label is required." };
  }

  return { success: true, data: tableLabel };
}

export function parseCreateOrderPayload(
  value: unknown
): ValidationResult<CreateOrderInput> {
  if (!isRecord(value)) {
    return { success: false, error: "Invalid order payload." };
  }

  const tableLabelResult = parseTableLabel(value.tableLabel);
  if (!tableLabelResult.success) {
    return tableLabelResult;
  }

  const itemsResult = parseOrderItems(value.items);
  if (!itemsResult.success) {
    return itemsResult;
  }

  const clientRequestId =
    typeof value.clientRequestId === "string" &&
    value.clientRequestId.trim().length > 0 &&
    value.clientRequestId.trim().length <= 80
      ? value.clientRequestId.trim()
      : undefined;
  const guestCount =
    typeof value.guestCount === "number" &&
    Number.isInteger(value.guestCount) &&
    value.guestCount > 0 &&
    value.guestCount <= MAX_GUEST_COUNT
      ? value.guestCount
      : undefined;
  const notes =
    typeof value.notes === "string"
      ? value.notes.trim().slice(0, MAX_NOTES_LENGTH)
      : undefined;

  return {
    success: true,
    data: {
      clientRequestId,
      tableLabel: tableLabelResult.data,
      guestCount,
      notes,
      items: itemsResult.data
    }
  };
}

export function parseCreateAssistancePayload(
  value: unknown
): ValidationResult<CreateAssistanceInput> {
  if (!isRecord(value)) {
    return { success: false, error: "Invalid assistance payload." };
  }

  const tableLabelResult = parseTableLabel(value.tableLabel);
  if (!tableLabelResult.success) {
    return tableLabelResult;
  }

  const requestType = value.requestType;
  const isValidRequestType =
    requestType === "call_waiter" || requestType === "allergen_help";

  if (!isValidRequestType) {
    return { success: false, error: "Invalid assistance request type." };
  }

  const message = typeof value.message === "string" ? value.message.trim() : "";

  if (requestType === "allergen_help" && message.length < 3) {
    return {
      success: false,
      error: "Allergen assistance details are required."
    };
  }

  return {
    success: true,
    data: {
      tableLabel: tableLabelResult.data,
      requestType: requestType as AssistanceRequestType,
      message: message || undefined
    }
  };
}

export function parseStatusPayload(
  value: unknown
): ValidationResult<UpdateActivityInput> {
  if (!isRecord(value)) {
    return { success: false, error: "Invalid status payload." };
  }

  const status = value.status;

  if (
    status !== "new" &&
    status !== "claimed" &&
    status !== "in_progress" &&
    status !== "ready" &&
    status !== "completed"
  ) {
    return { success: false, error: "Invalid activity status." };
  }

  const allowReassign = value.allowReassign === true;

  return {
    success: true,
    data: { status, allowReassign }
  };
}
