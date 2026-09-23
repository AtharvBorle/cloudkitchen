import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
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
      return new Response(JSON.stringify({ success: false, message: "Please log in first to connect to the kitchen order stream.", error: "Please log in first to connect to the kitchen order stream." }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    if (session.user.role !== "SELLER") {
      return new Response(JSON.stringify({ success: false, message: "Access denied. Seller account required.", error: "Access denied. Seller account required." }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    const sellerProfile = await db.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    const sellerId = sellerProfile?.id || session.user.id;
    const sellerChannel = `seller:${sellerId}`;
    const userChannel = `seller:${session.user.id}`;

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
            message: "Real-time seller order stream established",
            timestamp: new Date().toISOString(),
          })}\n\n`
        );

        // 2. Real-time Event Listener
        const handleOrderEvent = (payload: RealtimeOrderPayload) => {
          safeEnqueue(`event: order\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        realtimeEmitter.on(sellerChannel, handleOrderEvent);
        if (sellerChannel !== userChannel) {
          realtimeEmitter.on(userChannel, handleOrderEvent);
        }
        realtimeEmitter.on("seller:all", handleOrderEvent);

        // 3. Keepalive every 4s to prevent proxy/idle timeouts
        const heartbeat = setInterval(() => {
          safeEnqueue(`: keepalive ${new Date().toISOString()}\n\n`);
        }, 4000);

        cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          clearInterval(heartbeat);
          realtimeEmitter.off(sellerChannel, handleOrderEvent);
          if (sellerChannel !== userChannel) {
            realtimeEmitter.off(userChannel, handleOrderEvent);
          }
          realtimeEmitter.off("seller:all", handleOrderEvent);
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
    console.error("Seller SSE stream error:", error);
    return new Response(JSON.stringify({ error: "Failed to initialize real-time stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
