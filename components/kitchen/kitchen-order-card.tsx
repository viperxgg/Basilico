"use client";

import { memo } from "react";

import styles from "@/components/kitchen/kitchen-board.module.css";
import { ACTIVITY_STATUS_LABELS } from "@/lib/activity/activity-helpers";
import {
  getKitchenColumnId,
  isKitchenOrderOverdue,
  type KitchenColumnId
} from "@/lib/kitchen/kitchen-utils";
import type { RestaurantOrder } from "@/lib/types/activity";

type KitchenOrderCardProps = {
  isNewArrival: boolean;
  isUpdating: boolean;
  now: number;
  order: RestaurantOrder;
  onUpdateOrderStatus: (
    order: RestaurantOrder,
    nextStatus: RestaurantOrder["status"]
  ) => void;
};

function formatCurrency(value: number) {
  return `${value} SEK`;
}

function formatRelativeTime(createdAt: string, now: number) {
  const timestamp = new Date(createdAt).getTime();
  const diffMs = now - timestamp;

  if (diffMs < 45_000) {
    return "Nyss";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes} min sedan`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} tim sedan`;
}

function getPrimaryAction(columnId: KitchenColumnId) {
  if (columnId === "new") {
    return { label: "Påbörja", status: "in_progress" as const };
  }

  if (columnId === "in_progress") {
    return { label: "Markera klar", status: "ready" as const };
  }

  return { label: "Avsluta", status: "completed" as const };
}

function getSecondaryAction(columnId: KitchenColumnId) {
  if (columnId === "in_progress") {
    return { label: "Till ny order", status: "new" as const };
  }

  if (columnId === "ready") {
    return { label: "Tillbaka till pågår", status: "in_progress" as const };
  }

  return null;
}

function KitchenOrderCardComponent({
  isNewArrival,
  isUpdating,
  now,
  order,
  onUpdateOrderStatus
}: KitchenOrderCardProps) {
  const columnId = getKitchenColumnId(order.status);
  const primaryAction = getPrimaryAction(columnId);
  const secondaryAction = getSecondaryAction(columnId);
  const isOverdue = isKitchenOrderOverdue(order, now);
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article
      className={styles.orderCard}
      data-column={columnId}
      data-overdue={isOverdue}
      data-new-arrival={isNewArrival}
    >
      <div className={styles.cardHeader}>
        <div className={styles.tableBlock}>
          <span className={styles.tableLabel}>Bord</span>
          <strong className={styles.tableValue}>{order.tableLabel}</strong>
        </div>

        <div className={styles.metaBlock}>
          {isNewArrival ? (
            <span className={styles.newBadge}>Ny order</span>
          ) : null}
          <span className={styles.statusChip} data-status={order.status}>
            {ACTIVITY_STATUS_LABELS[order.status]}
          </span>
          <span className={styles.timeValue} data-overdue={isOverdue}>
            {formatRelativeTime(order.createdAt, now)}
          </span>
        </div>
      </div>

      <div className={styles.orderFacts}>
        <div className={styles.factPill}>
          <span>Artiklar</span>
          <strong>{totalQuantity}</strong>
        </div>
        <div className={styles.factPill}>
          <span>Total</span>
          <strong>{formatCurrency(order.total)}</strong>
        </div>
      </div>

      <div className={styles.itemsList}>
        {order.items.map((item) => (
          <div key={item.itemId} className={styles.itemRow}>
            <div className={styles.itemCopy}>
              <span className={styles.itemName}>{item.dishNameSnapshot}</span>
            </div>
            <span className={styles.itemQty}>{item.quantity}x</span>
          </div>
        ))}
      </div>

      <div className={styles.cardFooter}>
        {order.notes ? (
          <div className={styles.noteBlock}>
            <span className={styles.noteLabel}>Meddelande</span>
            <span className={styles.noteText}>{order.notes}</span>
          </div>
        ) : null}

        <div className={styles.assignmentText}>
          Ansvarig: <strong>{order.assignedTo?.name ?? "Ej tilldelad"}</strong>
        </div>

        {columnId !== "completed" ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryAction}
              data-column={columnId}
              disabled={isUpdating}
              onClick={() => onUpdateOrderStatus(order, primaryAction.status)}
            >
              {isUpdating ? "Sparar..." : primaryAction.label}
            </button>

            {secondaryAction ? (
              <button
                type="button"
                className={styles.secondaryAction}
                disabled={isUpdating}
                onClick={() => onUpdateOrderStatus(order, secondaryAction.status)}
              >
                {secondaryAction.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export const KitchenOrderCard = memo(KitchenOrderCardComponent);
