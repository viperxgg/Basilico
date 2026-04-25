import type {
  AssistanceRequest,
  RestaurantActivity,
  RestaurantOrder
} from "@/lib/types/activity";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const seededOrders: RestaurantOrder[] = [
  {
    id: "activity-101",
    tableId: "table-12",
    tableLabel: "Table 12",
    items: [
      {
        itemId: "dish-002",
        dishNameSnapshot: "Truffle Fries",
        dishPriceSnapshotMinor: 75,
        quantity: 2
      },
      {
        itemId: "dish-003",
        dishNameSnapshot: "Grilled Salmon",
        dishPriceSnapshotMinor: 245,
        quantity: 1
      },
      {
        itemId: "dish-005",
        dishNameSnapshot: "Sparkling Water",
        dishPriceSnapshotMinor: 35,
        quantity: 2
      }
    ],
    subtotal: 465,
    total: 465,
    guestCount: 3,
    createdAt: minutesAgo(2),
    type: "order",
    status: "new",
    source: "customer_menu"
  },
  {
    id: "activity-103",
    tableId: "table-7",
    tableLabel: "Table 7",
    items: [
      {
        itemId: "dish-006",
        dishNameSnapshot: "Craft Beer",
        dishPriceSnapshotMinor: 85,
        quantity: 1
      },
      {
        itemId: "dish-001",
        dishNameSnapshot: "Bruschetta Classica",
        dishPriceSnapshotMinor: 89,
        quantity: 2
      },
      {
        itemId: "dish-008",
        dishNameSnapshot: "Swedish Cheesecake",
        dishPriceSnapshotMinor: 110,
        quantity: 1
      }
    ],
    subtotal: 373,
    total: 373,
    guestCount: 2,
    createdAt: minutesAgo(9),
    type: "order",
    status: "in_progress",
    source: "customer_menu",
    assignedTo: {
      id: "kitchen",
      name: "Kitchen",
      role: "Kitchen"
    },
    assignedAt: minutesAgo(8)
  },
  {
    id: "activity-105",
    tableId: "table-2",
    tableLabel: "Table 2",
    items: [
      {
        itemId: "dish-007",
        dishNameSnapshot: "Chocolate Fondant",
        dishPriceSnapshotMinor: 95,
        quantity: 2
      },
      {
        itemId: "dish-005",
        dishNameSnapshot: "Sparkling Water",
        dishPriceSnapshotMinor: 35,
        quantity: 1
      }
    ],
    subtotal: 225,
    total: 225,
    guestCount: 2,
    createdAt: minutesAgo(18),
    type: "order",
    status: "completed",
    source: "customer_menu"
  }
];

const seededAssistance: AssistanceRequest[] = [
  {
    id: "activity-102",
    tableId: "table-4",
    tableLabel: "Table 4",
    requestType: "allergen_help",
    message: "Guest asked for allergy clarification and an extra side plate.",
    createdAt: minutesAgo(4),
    type: "assistance",
    status: "claimed",
    source: "customer_menu",
    assignedTo: {
      id: "sara",
      name: "Sara",
      role: "Floor"
    },
    assignedAt: minutesAgo(3)
  },
  {
    id: "activity-104",
    tableId: "table-15",
    tableLabel: "Table 15",
    requestType: "call_waiter",
    message: "Payment terminal requested at the table.",
    createdAt: minutesAgo(14),
    type: "assistance",
    status: "completed",
    source: "customer_menu",
    assignedTo: {
      id: "anna",
      name: "Anna",
      role: "Floor"
    },
    assignedAt: minutesAgo(13),
    updatedAt: minutesAgo(10)
  }
];

export function createSeedOrders(): RestaurantOrder[] {
  return [...seededOrders];
}

export function createSeedAssistanceRequests(): AssistanceRequest[] {
  return [...seededAssistance];
}

export function createSeedActivities(): RestaurantActivity[] {
  return [...createSeedOrders(), ...createSeedAssistanceRequests()].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}
