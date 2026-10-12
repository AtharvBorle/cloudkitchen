import { NextRequest } from "next/server";
import { realtimeEmitter, RealtimeLivePayload } from "@/lib/realtime-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId")?.trim() || null;

    let cleanup = () => {};

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;

        const safeEnqueue = (dataStr: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(dataStr));
          } catch (e) {
            isClosed = true;
          }
        };

        // 1. Initial Connection Handshake
        safeEnqueue(
          `event: connected\ndata: ${JSON.stringify({
            connected: true,
            sellerId,
            message: "Real-time public shop live stream established",
            timestamp: new Date().toISOString(),
          })}\n\n`
        );

        // 2. Event Handlers
        const handleLiveEvent = (payload: RealtimeLivePayload) => {
          safeEnqueue(`event: live\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        realtimeEmitter.on("public:live", handleLiveEvent);
        if (sellerId) {
          realtimeEmitter.on(`public:seller:${sellerId}`, handleLiveEvent);
        }

        // 3. Keepalive every 15s to keep SSE connection alive through proxies
        const heartbeat = setInterval(() => {
          safeEnqueue(`: keepalive ${new Date().toISOString()}\n\n`);
        }, 15000);

        cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          clearInterval(heartbeat);
          realtimeEmitter.off("public:live", handleLiveEvent);
          if (sellerId) {
            realtimeEmitter.off(`public:seller:${sellerId}`, handleLiveEvent);
          }
          try {
            controller.close();
          } catch {}
        };

        if (req.signal) {
          req.signal.addEventListener("abort", () => {
            cleanup();
          });
        }
      },
      cancel() {
        cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, must-revalidate, no-store",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  } catch (error) {
    console.error("Public live SSE stream error:", error);
    return new Response(JSON.stringify({ error: "Failed to initialize public live stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
