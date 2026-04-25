"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from "react";

import styles from "@/components/admin/staff-dashboard.module.css";
import { SoundToggle } from "@/components/admin/sound-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { requestJson } from "@/lib/client/request-json";
import {
  ACTIVITY_FILTERS,
  ACTIVITY_STATUS_LABELS,
  applyActivityUpdate,
  buildActivitySearchText,
  getActivityTitle,
  isActivityPending,
  isAssignedToOtherStaff,
  matchesActivityFilter
} from "@/lib/activity/activity-helpers";
import { createDashboardNotificationPlayer } from "@/lib/notifications/sound";
import { subscribeToPolledResource } from "@/lib/realtime/polling-resource";
import type {
  ActivityFilter,
  ActivityStatus,
  AssignedStaff,
  AssistanceRequest,
  RestaurantActivity,
  RestaurantOrder
} from "@/lib/types/activity";

type StaffDashboardProps = {
  initialActivities: RestaurantActivity[];
  currentStaff: AssignedStaff;
  restaurantName: string;
  restaurantTagline: string;
};

type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  trend: string;
};

type ActivityAction = {
  key: string;
  label: string;
  status: ActivityStatus;
  allowReassign?: boolean;
};

function subscribeToClientReady() {
  return () => {};
}

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
  if (diffHours < 24) {
    return `${diffHours} tim sedan`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} dag${diffDays === 1 ? "" : "ar"} sedan`;
}

function deriveMetrics(activities: RestaurantActivity[]): DashboardMetric[] {
  const orderActivities = activities.filter(
    (activity): activity is RestaurantOrder => activity.type === "order"
  );
  const assistanceActivities = activities.filter(
    (activity): activity is AssistanceRequest => activity.type === "assistance"
  );
  const pendingOrders = orderActivities.filter(isActivityPending).length;
  const pendingAssistance = assistanceActivities.filter(isActivityPending).length;
  const completedToday = activities.filter(
    (activity) => activity.status === "completed"
  ).length;

  return [
    {
      id: "orders",
      label: "Beställningar idag",
      value: String(orderActivities.length),
      trend: `${pendingOrders} aktiva i kön`
    },
    {
      id: "assistance",
      label: "Väntande service",
      value: String(pendingAssistance),
      trend:
        pendingAssistance > 0 ? "Behöver följas upp" : "Inga aktiva ärenden"
    },
    {
      id: "completed",
      label: "Avslutade idag",
      value: String(completedToday),
      trend: `${assistanceActivities.length} serviceärenden mottagna`
    }
  ];
}

function getActivityActions(
  activity: RestaurantActivity,
  currentStaff: AssignedStaff
): ActivityAction[] {
  if (activity.status === "completed") {
    return [];
  }

  if (isAssignedToOtherStaff(activity, currentStaff)) {
    return [
      {
        key: "take-over",
        label: `Ta över från ${activity.assignedTo?.name}`,
        status: "claimed",
        allowReassign: true
      }
    ];
  }

  const startLabel =
    activity.type === "order" ? "Starta" : "Börja hantera";
  const claimLabel = activity.type === "order" ? "Ta order" : "Ta ärende";
  const progressLabel =
    activity.type === "order" ? "Markera klar" : "Avsluta";

  if (activity.status === "new") {
    return [
      {
        key: "claim",
        label: claimLabel,
        status: "claimed"
      },
      {
        key: "start",
        label: startLabel,
        status: "in_progress"
      }
    ];
  }

  if (activity.status === "claimed") {
    return [
      {
        key: "start",
        label: startLabel,
        status: "in_progress"
      },
      ...(activity.type === "assistance"
        ? ([{
            key: "complete",
            label: "Avsluta",
            status: "completed" as ActivityStatus
          }] satisfies ActivityAction[])
        : [])
    ];
  }

  if (activity.status === "in_progress") {
    return [
      {
        key: activity.type === "order" ? "ready" : "complete",
        label: progressLabel,
        status: activity.type === "order" ? "ready" : "completed"
      }
    ];
  }

  if (activity.status === "ready") {
    return [
      {
        key: "complete",
        label: "Avsluta",
        status: "completed"
      }
    ];
  }

  return [
    {
      key: "complete",
      label: "Avsluta",
      status: "completed"
    }
  ];
}

function getAssignmentLabel(activity: RestaurantActivity, now: number) {
  if (!activity.assignedTo) {
    return "Ej tilldelad";
  }

  const prefix =
    activity.status === "claimed"
      ? "Mottagen av"
      : activity.status === "ready"
        ? "Klar av"
      : activity.status === "completed"
        ? "Avslutad av"
        : "Ansvarig";

  const assignedTime = activity.assignedAt
    ? ` · ${formatRelativeTime(activity.assignedAt, now)}`
    : "";

  return `${prefix} ${activity.assignedTo.name}${assignedTime}`;
}

type StatusBadgeProps = {
  status: ActivityStatus;
};

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={styles.statusChip} data-status={status}>
      {ACTIVITY_STATUS_LABELS[status]}
    </span>
  );
}

type FilterTabsProps = {
  activeFilter: ActivityFilter;
  onChange: (filter: ActivityFilter) => void;
};

function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
  return (
    <div className={styles.filterTabs} role="tablist" aria-label="Filtrera ärenden">
      {ACTIVITY_FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          role="tab"
          aria-selected={activeFilter === filter.id}
          className={`${styles.filterTab} ${
            activeFilter === filter.id ? styles.filterTabActive : ""
          }`}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

type ActivityCardProps = {
  activity: RestaurantActivity;
  currentStaff: AssignedStaff;
  now: number;
  isHighlighted: boolean;
  isUpdating: boolean;
  onAction: (
    activity: RestaurantActivity,
    action: ActivityAction
  ) => void;
};

function ActivityCard({
  activity,
  currentStaff,
  now,
  isHighlighted,
  isUpdating,
  onAction
}: ActivityCardProps) {
  const actions = getActivityActions(activity, currentStaff);

  return (
    <article
      className={styles.feedCard}
      data-completed={activity.status === "completed"}
      data-highlighted={isHighlighted}
      data-type={activity.type}
    >
      <div className={styles.tableBadge}>
        <span className={styles.tableLabel}>Bord</span>
        <span className={styles.tableValue}>{activity.tableLabel}</span>
      </div>

      <div className={styles.cardMain}>
        <div className={styles.cardHeader}>
          <h3 className={styles.eventTitle}>{getActivityTitle(activity)}</h3>
          <StatusBadge status={activity.status} />
        </div>

        {activity.type === "order" ? (
          <>
            <div className={styles.itemsList}>
              {activity.items.map((item) => (
                <span key={item.itemId} className={styles.itemChip}>
                  {item.quantity}x {item.dishNameSnapshot}
                </span>
              ))}
            </div>
            <div className={styles.metaLine}>
              {activity.guestCount
                ? `${activity.guestCount} gäster`
                : "Antal gäster saknas"}
            </div>
            {activity.notes ? (
              <p className={styles.details}>Meddelande: {activity.notes}</p>
            ) : null}
          </>
        ) : (
          <>
            <p className={styles.details}>{activity.message}</p>
            <div className={styles.metaLine}>
              {activity.requestType === "call_waiter"
                ? "Gästen väntar på personal"
                : "Gästen behöver allergeninformation"}
            </div>
          </>
        )}

        <div
          className={styles.assignmentLine}
          data-unassigned={!activity.assignedTo}
        >
          {getAssignmentLabel(activity, now)}
        </div>
      </div>

      <div className={styles.cardAside}>
        <span className={styles.timeText}>
          {formatRelativeTime(activity.createdAt, now)}
        </span>

        {activity.type === "order" ? (
          <>
            <span className={styles.secondaryText}>Totalt</span>
            <span className={styles.totalValue}>{formatCurrency(activity.total)}</span>
          </>
        ) : null}

        <div className={styles.statusActions}>
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={`${styles.statusButton} ${
                action.allowReassign ? styles.statusButtonDanger : ""
              }`}
              disabled={isUpdating}
              onClick={() => onAction(activity, action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

const MemoActivityCard = memo(ActivityCard);

export function StaffDashboard({
  initialActivities,
  currentStaff,
  restaurantName,
  restaurantTagline
}: StaffDashboardProps) {
  const [activities, setActivities] =
    useState<RestaurantActivity[]>(initialActivities);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionState, setConnectionState] = useState<
    "connecting" | "live" | "reconnecting"
  >("connecting");
  const [now, setNow] = useState<number>(() => Date.now());
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundPlayerRef = useRef<ReturnType<
    typeof createDashboardNotificationPlayer
  > | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const hydratedActivityIdsRef = useRef(new Set(initialActivities.map((activity) => activity.id)));
  const isClientReady = useSyncExternalStore(
    subscribeToClientReady,
    () => true,
    () => false
  );

  const displayedSoundEnabled = isClientReady ? soundEnabled : true;
  const metrics = useMemo(() => deriveMetrics(activities), [activities]);
  const completedCount = useMemo(
    () => activities.filter((activity) => activity.status === "completed").length,
    [activities]
  );

  const filteredActivities = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesFilter = matchesActivityFilter(activity, activeFilter);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        buildActivitySearchText(activity).includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activities, activeFilter, searchTerm]);

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
    return subscribeToPolledResource<
      { activities: RestaurantActivity[] },
      RestaurantActivity[]
    >({
      endpoint: "/api/internal/activities",
      intervalMs: 8000,
      maxBackoffMs: 30000,
      selectData: (payload) => payload.activities,
      getSignature: (nextActivities) =>
        nextActivities
          .map((activity) => `${activity.id}:${activity.status}:${activity.updatedAt ?? activity.createdAt}`)
          .join("|"),
      onData: (nextActivities) => {
        const knownIds = hydratedActivityIdsRef.current;
        const newIds = nextActivities
          .filter((activity) => !knownIds.has(activity.id))
          .map((activity) => activity.id);

        hydratedActivityIdsRef.current = new Set(
          nextActivities.map((activity) => activity.id)
        );
        setActivities(nextActivities);

        if (newIds.length > 0) {
          setHighlightedIds((current) => {
            const currentSet = new Set(current);
            newIds.forEach((id) => currentSet.add(id));
            return Array.from(currentSet);
          });

          window.setTimeout(() => {
            setHighlightedIds((current) =>
              current.filter((highlightedId) => !newIds.includes(highlightedId))
            );
          }, 3200);

          if (soundEnabledRef.current) {
            void soundPlayerRef.current?.play();
          }
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
    });
  }, []);

  async function handleAction(
    activity: RestaurantActivity,
    action: ActivityAction
  ) {
    const previousActivity = activities.find(
      (currentActivity) => currentActivity.id === activity.id
    );
    if (!previousActivity) {
      return;
    }

    const optimisticActivity = applyActivityUpdate(
      previousActivity,
      action.status,
      currentStaff
    );

    setErrorMessage(null);
    setUpdatingIds((current) => [...current, activity.id]);
    setActivities((current) =>
      current.map((currentActivity) =>
        currentActivity.id === previousActivity.id
          ? optimisticActivity
          : currentActivity
      )
    );

    try {
      await requestJson(`/api/internal/activities/${activity.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: action.status,
          allowReassign: action.allowReassign === true
        }),
        timeoutMs: 8000,
        fallbackMessage: "Kunde inte uppdatera ärendet. Försök igen."
      });
    } catch (error) {
      setActivities((current) =>
        current.map((currentActivity) =>
          currentActivity.id === previousActivity.id
            ? previousActivity
            : currentActivity
        )
      );
      setErrorMessage(
        error instanceof Error ? error.message : "Kunde inte uppdatera ärendet."
      );
    } finally {
      setUpdatingIds((current) =>
        current.filter((activityId) => activityId !== activity.id)
      );
    }
  }

  async function handleToggleSound() {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);

    if (nextEnabled) {
      await soundPlayerRef.current?.unlock();
    }
  }

  async function handleClearCompleted() {
    const completedIds = activities
      .filter((activity) => activity.status === "completed")
      .map((activity) => activity.id);

    if (completedIds.length === 0) {
      return;
    }

    const previousActivities = activities;
    setErrorMessage(null);
    setActivities((current) =>
      current.filter((activity) => activity.status !== "completed")
    );

    try {
      await requestJson("/api/internal/activities", {
        method: "DELETE",
        timeoutMs: 8000,
        fallbackMessage: "Kunde inte rensa avslutade ärenden just nu."
      });
    } catch (error) {
      setActivities(previousActivities);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Kunde inte rensa avslutade ärenden."
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
              <h1 className={styles.title}>Serviceöversikt</h1>
              <p className={styles.subtitle}>
                {restaurantTagline}. Följ serviceärenden och beställningar i
                ett tydligt flöde anpassat för personalen.
              </p>
            </div>

            <div className={styles.headerMeta}>
              <div className={styles.dateCard}>
                <span>{new Date(now).toLocaleDateString("en-GB")}</span>
              </div>
              <div className={styles.statusBadge}>
                <span
                  className={styles.statusDot}
                  aria-hidden="true"
                  data-state={connectionState}
                />
                <span>
                  {connectionState === "live"
                    ? "Uppdateringar aktiva"
                    : connectionState === "connecting"
                      ? "Startar uppdateringar"
                      : "Försöker igen"}
                </span>
              </div>
              <SoundToggle
                enabled={displayedSoundEnabled}
                onToggle={handleToggleSound}
              />
              <LogoutButton className={styles.clearCompletedButton} />
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

        <section className={styles.mainGrid}>
          <aside className={styles.metricsRail} aria-label="Översikt">
            {metrics.map((metric) => (
              <article key={metric.id} className={styles.metricCard}>
                <span className={styles.metricLabel}>{metric.label}</span>
                <strong className={styles.metricValue}>{metric.value}</strong>
                <span className={styles.metricTrend}>{metric.trend}</span>
              </article>
            ))}
          </aside>

          <section className={styles.feedPanel}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarTop}>
                <div>
                  <h2 className={styles.toolbarTitle}>Beställningar och service</h2>
                  <p className={styles.toolbarText}>
                    Sök på bord, maträtt, meddelande eller personal. Vyn
                    uppdateras automatiskt utan att störa arbetet.
                  </p>
                </div>

                {completedCount > 0 ? (
                  <button
                    type="button"
                    className={styles.clearCompletedButton}
                    onClick={handleClearCompleted}
                  >
                    Rensa avslutade ({completedCount})
                  </button>
                ) : null}
              </div>

              <div className={styles.toolbarActions}>
                <label className={styles.searchWrap}>
                  <span className={styles.searchIcon} aria-hidden="true">
                    Sök
                  </span>
                  <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Sök bord, beställning, service eller personal"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="Sök i serviceöversikten"
                  />
                </label>

                <FilterTabs
                  activeFilter={activeFilter}
                  onChange={setActiveFilter}
                />
              </div>

              {errorMessage ? (
                <p className={styles.errorText} role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <div className={styles.feedList}>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <MemoActivityCard
                    key={activity.id}
                    activity={activity}
                    currentStaff={currentStaff}
                    now={now}
                    isHighlighted={highlightedIds.includes(activity.id)}
                    isUpdating={updatingIds.includes(activity.id)}
                    onAction={handleAction}
                  />
                ))
              ) : (
                <div className={styles.emptyState}>
                  <strong>Inga nya beställningar just nu</strong>
                  <span>
                    Ändra sökning eller filter om du vill se andra ärenden.
                  </span>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
