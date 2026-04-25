import type { ActivityEvent } from "@/lib/types/activity";

const encoder = new TextEncoder();

export function encodeSseComment(comment: string) {
  return encoder.encode(`: ${comment}\n\n`);
}

export function encodeSseEvent(event: ActivityEvent) {
  return encoder.encode(
    `event: ${event.event}\ndata: ${JSON.stringify(event.activity)}\n\n`
  );
}
