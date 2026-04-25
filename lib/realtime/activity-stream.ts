import {
  ACTIVITY_STREAM_EVENTS
} from "@/lib/activity/activity-helpers";
import type {
  ActivityEventName,
  RestaurantActivity
} from "@/lib/types/activity";

type SubscribeToActivityStreamInput = {
  endpoint?: string;
  onActivity: (
    activity: RestaurantActivity,
    eventName: ActivityEventName
  ) => void;
  onOpen?: () => void;
  onError?: () => void;
};

export function subscribeToActivityStream({
  endpoint = "/api/internal/live",
  onActivity,
  onOpen,
  onError
}: SubscribeToActivityStreamInput) {
  const eventSource = new EventSource(endpoint);

  const handleIncomingActivity = (event: MessageEvent<string>) => {
    onActivity(
      JSON.parse(event.data) as RestaurantActivity,
      event.type as ActivityEventName
    );
  };

  eventSource.onopen = () => {
    onOpen?.();
  };

  eventSource.onerror = () => {
    onError?.();
  };

  for (const eventName of ACTIVITY_STREAM_EVENTS) {
    eventSource.addEventListener(eventName, handleIncomingActivity);
  }

  return () => {
    eventSource.close();
  };
}
