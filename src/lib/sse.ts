// SSE (Server-Sent Events) utilities for streaming generation/build events
// Allows real-time log streaming to the frontend

import type { AiEvent, AiEventType } from "@/lib/gpu/types";

export interface SSEStream {
  controller: ReadableStreamDefaultController;
  send: (event: AiEvent) => void;
  close: () => void;
}

export function createSSEStream(): { stream: ReadableStream; send: (event: AiEvent) => void; close: () => void } {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  const send = (event: AiEvent) => {
    if (!controller) return;
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(encoder.encode(data));
  };

  const close = () => {
    if (controller) {
      controller.close();
      controller = null;
    }
  };

  return { stream, send, close };
}

export function createEvent(
  type: AiEventType,
  projectId: string,
  data: Partial<AiEvent> = {}
): AiEvent {
  return {
    type,
    projectId,
    timestamp: new Date().toISOString(),
    ...data,
  };
}

// Format SSE response headers
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no", // Disable proxy buffering
};
