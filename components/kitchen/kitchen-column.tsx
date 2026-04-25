"use client";

import { memo } from "react";

import styles from "@/components/kitchen/kitchen-board.module.css";
import { KitchenOrderCard } from "@/components/kitchen/kitchen-order-card";
import type {
  KitchenColumnDefinition
} from "@/lib/kitchen/kitchen-utils";
import type { AssignedStaff, RestaurantOrder } from "@/lib/types/activity";

type KitchenColumnProps = {
  column: KitchenColumnDefinition;
  currentStaff: AssignedStaff;
  now: number;
  orders: RestaurantOrder[];
  recentOrderIds: string[];
  updatingIds: string[];
  onUpdateOrderStatus: (
    order: RestaurantOrder,
    nextStatus: RestaurantOrder["status"]
  ) => void;
};

function KitchenColumnComponent({
  column,
  now,
  orders,
  recentOrderIds,
  updatingIds,
  onUpdateOrderStatus
}: KitchenColumnProps) {
  return (
    <section className={styles.boardColumn} data-column={column.id}>
      <header className={styles.columnHeader}>
        <h2 className={styles.columnTitle}>{column.title}</h2>
        <span className={styles.columnCount}>{orders.length}</span>
      </header>

      <div className={styles.columnCards}>
        {orders.length > 0 ? (
          orders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              isNewArrival={recentOrderIds.includes(order.id)}
              isUpdating={updatingIds.includes(order.id)}
              now={now}
              order={order}
              onUpdateOrderStatus={onUpdateOrderStatus}
            />
          ))
        ) : (
          <div className={styles.columnEmpty}>{column.emptyText}</div>
        )}
      </div>
    </section>
  );
}

export const KitchenColumn = memo(KitchenColumnComponent);
