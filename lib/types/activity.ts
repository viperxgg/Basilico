export type ActivityStatus =
  | "new"
  | "claimed"
  | "in_progress"
  | "ready"
  | "completed";

export type ActivityType = "order" | "assistance";

export type ActivitySource = "customer_menu";

export type AssistanceRequestType = "call_waiter" | "allergen_help";

export type AssignedStaff = {
  id: string;
  name: string;
  role?: string;
};

export type OrderItem = {
  itemId: string;
  dishNameSnapshot: string;
  dishPriceSnapshotMinor: number;
  quantity: number;
};

export type CreateOrderItemInput = {
  dishId: string;
  variantId?: string;
  quantity: number;
};

export type BaseActivity = {
  id: string;
  tableId: string;
  tableLabel: string;
  createdAt: string;
  updatedAt?: string;
  status: ActivityStatus;
  source: ActivitySource;
  assignedTo?: AssignedStaff;
  assignedAt?: string;
};

export type RestaurantOrder = BaseActivity & {
  items: OrderItem[];
  subtotal: number;
  total: number;
  guestCount?: number;
  notes?: string;
  type: "order";
};

export type AssistanceRequest = BaseActivity & {
  requestType: AssistanceRequestType;
  message: string;
  type: "assistance";
};

export type RestaurantActivity = RestaurantOrder | AssistanceRequest;

export type ActivityFilter =
  | "all"
  | "orders"
  | "assistance"
  | "pending"
  | "completed";

export type ActivityEventName =
  | "order:new"
  | "order:updated"
  | "assistance:new"
  | "assistance:updated";

export type ActivityEvent = {
  event: ActivityEventName;
  activity: RestaurantActivity;
};

export type CreateOrderInput = {
  clientRequestId?: string;
  tableLabel: string;
  guestCount?: number;
  notes?: string;
  items: CreateOrderItemInput[];
};

export type CreateAssistanceInput = {
  tableLabel: string;
  requestType: AssistanceRequestType;
  message?: string;
};

export type UpdateActivityInput = {
  status: ActivityStatus;
  allowReassign?: boolean;
};

export type CreateAssistanceResult = {
  assistance: AssistanceRequest;
  duplicate: boolean;
  message?: string;
};
