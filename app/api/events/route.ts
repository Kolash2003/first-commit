import { eventBus } from '@/lib/event-bus';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * Server-Sent Events stream. Clients connect once and receive real-time
 * capture/check events whenever MCP tools fire.
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection acknowledgement
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Subscribe to the event bus
      const unsubscribe = eventBus.subscribe((event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream may have closed
        }
      });

      // Keep-alive ping every 20s so proxies don't close the connection
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(ping);
        }
      }, 20000);

      // Cleanup when client disconnects
      return () => {
        unsubscribe();
        clearInterval(ping);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
