import { orderStore } from "@/lib/store/order-store";
import { assistanceStore } from "@/lib/store/assistance-store";
import type { ActivityEvent } from "@/lib/types/activity";

type InternalLiveListener = (event: ActivityEvent) => void;

export function subscribeToInternalLive(listener: InternalLiveListener) {
  const unsubscribeOrders = orderStore.subscribe(listener);
  const unsubscribeAssistance = assistanceStore.subscribe(listener);

  return () => {
    unsubscribeOrders();
    unsubscribeAssistance();
  };
}
