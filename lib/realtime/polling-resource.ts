type SubscribeToPolledResourceInput<TPayload, TData> = {
  endpoint: string;
  intervalMs?: number;
  timeoutMs?: number;
  maxBackoffMs?: number;
  selectData: (payload: TPayload) => TData;
  getSignature: (data: TData) => string;
  onData: (data: TData) => void;
  onOpen?: () => void;
  onError?: (state: { failureCount: number; message: string }) => void;
};

export function subscribeToPolledResource<TPayload, TData>({
  endpoint,
  intervalMs = 4000,
  timeoutMs = 5000,
  maxBackoffMs = 15000,
  selectData,
  getSignature,
  onData,
  onOpen,
  onError
}: SubscribeToPolledResourceInput<TPayload, TData>) {
  let timeoutId: number | undefined;
  let aborted = false;
  let lastSignature: string | null = null;
  let hasConnected = false;
  let consecutiveFailureCount = 0;

  const scheduleNextPoll = (delayMs = intervalMs) => {
    if (aborted) {
      return;
    }

    timeoutId = window.setTimeout(() => {
      void poll();
    }, delayMs);
  };

  const poll = async () => {
    if (aborted) {
      return;
    }

    if (document.visibilityState !== "visible") {
      scheduleNextPoll();
      return;
    }

    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Polling failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as TPayload;
      const data = selectData(payload);
      const nextSignature = getSignature(data);
      consecutiveFailureCount = 0;

      if (!hasConnected) {
        hasConnected = true;
        onOpen?.();
      }

      if (nextSignature !== lastSignature) {
        lastSignature = nextSignature;
        onData(data);
      }
    } catch (error) {
      consecutiveFailureCount += 1;
      hasConnected = false;
      onError?.({
        failureCount: consecutiveFailureCount,
        message:
          error instanceof Error
            ? error.message
            : "Polling failed unexpectedly."
      });
    } finally {
      window.clearTimeout(timeoutId);
      const nextDelay =
        consecutiveFailureCount > 0
          ? Math.min(intervalMs * 2 ** Math.min(consecutiveFailureCount - 1, 3), maxBackoffMs)
          : intervalMs;
      scheduleNextPoll(nextDelay);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    window.clearTimeout(timeoutId);
    void poll();
  };

  void poll();
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    aborted = true;
    window.clearTimeout(timeoutId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
