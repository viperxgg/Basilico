"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { SoundToggle } from "@/components/admin/sound-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { KitchenColumn } from "@/components/kitchen/kitchen-column";
import styles from "@/components/kitchen/kitchen-board.module.css";
import { requestJson } from "@/lib/client/request-json";
import {
  groupOrdersByKitchenColumn,
  KITCHEN_COLUMNS
} from "@/lib/kitchen/kitchen-utils";
import { createDashboardNotificationPlayer } from "@/lib/notifications/sound";
import { subscribeToPolledResource } from "@/lib/realtime/polling-resource";
import type { AssignedStaff, RestaurantOrder } from "@/lib/types/activity";

type KitchenBoardProps = {
  initialOrders: RestaurantOrder[];
  currentStaff: AssignedStaff;
  restaurantName: string;
  restaurantTagline: string;
};

type KitchenMetric = {
  id: string;
  label: string;
  value: string;
  trend: string;
};

function subscribeToClientReady() {
  return () => {};
}

function deriveKitchenMetrics(orders: RestaurantOrder[]): KitchenMetric[] {
  const newOrders = orders.filter((order) => order.status === "new").length;
  const preparingOrders = orders.filter(
    (order) => order.status === "in_progress"
  ).length;
  const readyOrders = orders.filter((order) => order.status === "ready").length;

  return [
    {
      id: "new",
      label: "Nya beställningar",
      value: String(newOrders),
      trend: "Nyinkommet först"
    },
    {
      id: "preparing",
      label: "Pågår",
      value: String(preparingOrders),
      trend: "Aktivt arbete i köket"
    },
    {
      id: "ready",
      label: "Klara",
      value: String(readyOrders),
      trend: readyOrders > 0 ? "Redo för servering" : "Inget att lämna ut just nu"
    }
  ];
}

const NEW_ORDER_HIGHLIGHT_MS = 18_000;

export function KitchenBoard({
  initialOrders,
  currentStaff,
  restaurantName,
  restaurantTagline
}: KitchenBoardProps) {
  const [orders, setOrders] = useState<RestaurantOrder[]>(initialOrders);
  const [showCompleted, setShowCompleted] = useState(true);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "live" | "reconnecting"
  >("connecting");
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const [now, setNow] = useState<number>(() => Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundPlayerRef = useRef<ReturnType<
    typeof createDashboardNotificationPlayer
  > | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const hydratedOrderIdsRef = useRef(new Set(initialOrders.map((order) => order.id)));
  const highlightTimersRef = useRef<Map<string, number>>(new Map());
  const isClientReady = useSyncExternalStore(
    subscribeToClientReady,
    () => true,
    () => false
  );

  const displayedSoundEnabled = isClientReady ? soundEnabled : true;
  const metrics = useMemo(() => deriveKitchenMetrics(orders), [orders]);
  const groupedOrders = useMemo(() => groupOrdersByKitchenColumn(orders), [orders]);
  const visibleColumns = useMemo(
    () =>
      KITCHEN_COLUMNS.filter(
        (column) => showCompleted || column.id !== "completed"
      ),
    [showCompleted]
  );

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const player = createDashboardNotificationPlayer();
    soundPlayerRef.current = player;
    player.attachUnlockListeners();

    return () => {
      player.dispose();
      soundPlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const highlightTimers = highlightTimersRef.current;

    return () => {
      for (const timerId of highlightTimers.values()) {
        window.clearTimeout(timerId);
      }
      highlightTimers.clear();
    };
  }, []);

  useEffect(() => {
    return subscribeToPolledResource<{ orders: RestaurantOrder[] }, RestaurantOrder[]>(
      {
        endpoint: "/api/kitchen/orders",
        intervalMs: 8000,
        maxBackoffMs: 30000,
        selectData: (payload) => payload.orders,
        getSignature: (nextOrders) =>
          nextOrders
            .map((order) => `${order.id}:${order.status}:${order.updatedAt ?? order.createdAt}`)
            .join("|"),
        onData: (nextOrders) => {
          const knownIds = hydratedOrderIdsRef.current;
          const newOrderIds = nextOrders
            .filter((order) => !knownIds.has(order.id))
            .map((order) => order.id);

          hydratedOrderIdsRef.current = new Set(
            nextOrders.map((order) => order.id)
          );
          setOrders(nextOrders);

          if (newOrderIds.length > 0) {
            setRecentOrderIds((current) => [
              ...new Set([...newOrderIds, ...current])
            ]);

            newOrderIds.forEach((orderId) => {
              const existingTimerId = highlightTimersRef.current.get(orderId);
              if (existingTimerId) {
                window.clearTimeout(existingTimerId);
              }

              const timerId = window.setTimeout(() => {
                setRecentOrderIds((current) =>
                  current.filter((currentOrderId) => currentOrderId !== orderId)
                );
                highlightTimersRef.current.delete(orderId);
              }, NEW_ORDER_HIGHLIGHT_MS);

              highlightTimersRef.current.set(orderId, timerId);
            });
          }

          if (newOrderIds.length > 0 && soundEnabledRef.current) {
            void soundPlayerRef.current?.play();
          }
        },
        onOpen: () => {
          setConnectionState("live");
          setErrorMessage(null);
        },
        onError: ({ failureCount }) => {
          setConnectionState("reconnecting");
          if (failureCount >= 2) {
            setErrorMessage("Kunde inte hämta beställningar");
          }
        }
      }
    );
  }, []);

  async function handleToggleSound() {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);

    if (nextEnabled) {
      await soundPlayerRef.current?.unlock();
    }
  }

  async function handleUpdateOrderStatus(
    order: RestaurantOrder,
    nextStatus: RestaurantOrder["status"]
  ) {
    const previousOrder = orders.find((currentOrder) => currentOrder.id === order.id);
    if (!previousOrder) {
      return;
    }

    const optimisticOrder = {
      ...previousOrder,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      assignedTo: previousOrder.assignedTo ?? currentStaff,
      assignedAt: previousOrder.assignedAt ?? new Date().toISOString()
    };

    setErrorMessage(null);
    setUpdatingIds((current) => [...current, order.id]);
    setOrders((current) =>
      current.map((currentOrder) =>
        currentOrder.id === previousOrder.id ? optimisticOrder : currentOrder
      )
    );

    try {
      await requestJson(`/api/internal/activities/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: nextStatus
        }),
        timeoutMs: 8000,
        fallbackMessage: "Kunde inte uppdatera beställningen. Försök igen."
      });
    } catch (error) {
      setOrders((current) =>
        current.map((currentOrder) =>
          currentOrder.id === previousOrder.id ? previousOrder : currentOrder
        )
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Kunde inte uppdatera beställningen."
      );
    } finally {
      setUpdatingIds((current) =>
        current.filter((orderId) => orderId !== order.id)
      );
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={`${styles.panel} ${styles.header}`}>
          <div className={styles.headerRow}>
            <div>
              <p className={styles.eyebrow}>{restaurantName}</p>
              <h1 className={styles.title}>Köksvy</h1>
              <p className={styles.subtitle}>
                {restaurantTagline}. Följ bongar, uppdatera status snabbt och håll
                överlämningen till serveringen tydlig.
              </p>
            </div>

            <div className={styles.headerMeta}>
              <div className={styles.dateCard}>
                <span>{new Date(now).toLocaleDateString("sv-SE")}</span>
              </div>
              <div className={styles.statusBadge}>
                <span
                  className={styles.statusDot}
                  aria-hidden="true"
                  data-state={connectionState}
                />
                <span>
                  {connectionState === "live"
                    ? "Köksflöde aktivt"
                    : connectionState === "connecting"
                      ? "Startar köksflöde"
                      : "Försöker igen"}
                </span>
              </div>
              <SoundToggle
                enabled={displayedSoundEnabled}
                onToggle={handleToggleSound}
              />
              <button
                type="button"
                className={styles.completedToggle}
                onClick={() => setShowCompleted((current) => !current)}
                aria-pressed={showCompleted}
              >
                {showCompleted ? "Dölj avslutade" : "Visa avslutade"}
              </button>
              <LogoutButton className={styles.completedToggle} />
            </div>
          </div>

          <div className={styles.headerControls}>
            <div className={styles.currentStaffBadge}>
              <span className={styles.controlLabel}>Inloggad som</span>
              <strong>{currentStaff.name}</strong>
              {currentStaff.role ? (
                <small>{currentStaff.role}</small>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.metrics}>
          {metrics.map((metric) => (
            <article key={metric.id} className={styles.metricCard}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <strong className={styles.metricValue}>{metric.value}</strong>
              <span className={styles.metricTrend}>{metric.trend}</span>
            </article>
          ))}
        </section>

        <section className={styles.boardWrap}>
          {errorMessage ? (
            <p className={styles.errorText} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className={styles.board} data-show-completed={showCompleted}>
            {visibleColumns.map((column) => (
              <KitchenColumn
                key={column.id}
                column={column}
                currentStaff={currentStaff}
                now={now}
                orders={groupedOrders[column.id]}
                recentOrderIds={recentOrderIds}
                updatingIds={updatingIds}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
