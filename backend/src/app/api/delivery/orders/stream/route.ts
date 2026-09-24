import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { realtimeEmitter, RealtimeOrderPayload } from "@/lib/realtime-events";

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
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ success: false, message: "Please log in first to connect to the delivery stream.", error: "Please log in first to connect to the delivery stream." }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    if (session.user.role !== "DELIVERY" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return new Response(JSON.stringify({ success: false, message: "Access denied. Delivery partner account required.", error: "Access denied. Delivery partner account required." }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    const deliveryPersonId = session.user.id;
    const deliveryChannel = `delivery:${deliveryPersonId}`;

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
            deliveryPersonId,
            message: "Real-time delivery order stream established",
            timestamp: new Date().toISOString(),
          })}\n\n`
        );

        // 2. Real-time Event Listener
        const handleOrderEvent = (payload: RealtimeOrderPayload) => {
          safeEnqueue(`event: order\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        realtimeEmitter.on(deliveryChannel, handleOrderEvent);
        realtimeEmitter.on("delivery:available", handleOrderEvent);

        // 3. Keepalive every 4s to prevent proxy/idle timeouts
        const heartbeat = setInterval(() => {
          safeEnqueue(`: keepalive ${new Date().toISOString()}\n\n`);
        }, 4000);

        cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          clearInterval(heartbeat);
          realtimeEmitter.off(deliveryChannel, handleOrderEvent);
          realtimeEmitter.off("delivery:available", handleOrderEvent);
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
        "Content-Encoding": "none",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  } catch (error: any) {
    console.error("Delivery SSE stream error:", error);
    return new Response(JSON.stringify({ error: "Failed to initialize real-time stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
