type RequestJsonOptions = RequestInit & {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  fallbackMessage?: string;
};

export class ClientRequestError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ClientRequestError";
    this.status = status;
  }
}

function sleep(delayMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

function resolveFallbackMessage(fallbackMessage: string | undefined) {
  return fallbackMessage ?? "The service is temporarily unavailable. Please try again.";
}

export async function requestJson<TResponse>(
  input: RequestInfo | URL,
  {
    timeoutMs = 8_000,
    retryCount = 0,
    retryDelayMs = 750,
    fallbackMessage,
    ...init
  }: RequestJsonOptions = {}
): Promise<TResponse> {
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      });

      const isJsonResponse = response.headers
        .get("content-type")
        ?.includes("application/json");
      const payload = isJsonResponse
        ? ((await response.json()) as { error?: string } & TResponse)
        : null;

      if (!response.ok) {
        if (attempt < retryCount && isRetryableStatus(response.status)) {
          attempt += 1;
          await sleep(retryDelayMs * attempt);
          continue;
        }

        const message =
          response.status >= 500
            ? resolveFallbackMessage(fallbackMessage)
            : payload?.error ?? resolveFallbackMessage(fallbackMessage);

        throw new ClientRequestError(message, response.status);
      }

      return (payload ?? (null as TResponse)) as TResponse;
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";

      if (
        attempt < retryCount &&
        (isAbortError ||
          (error instanceof ClientRequestError &&
            error.status !== null &&
            isRetryableStatus(error.status)))
      ) {
        attempt += 1;
        await sleep(retryDelayMs * attempt);
        continue;
      }

      if (isAbortError) {
        throw new ClientRequestError(resolveFallbackMessage(fallbackMessage), null);
      }

      if (error instanceof ClientRequestError) {
        throw error;
      }

      throw new ClientRequestError(resolveFallbackMessage(fallbackMessage), null);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
