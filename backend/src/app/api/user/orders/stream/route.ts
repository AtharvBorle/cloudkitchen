import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { realtimeEmitter, RealtimeOrderPayload } from "@/lib/realtime-events";
import { getCorsHeaders } from "@/lib/cors";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    let session = await getAuthSession();
    let user = session?.user;

    const { searchParams } = new URL(req.url);
    const queryOrderId = (searchParams.get("orderId") || "").trim();

    // Mobile fallback: allow query param token if EventSource cannot pass Authorization header
    if (!user) {
      const queryToken = searchParams.get("token") || searchParams.get("accessToken");
      if (queryToken) {
        try {
          const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only";
          const decoded = jwt.verify(queryToken, secret) as any;
          if (decoded?.id) {
            const dbUser = await db.user.findUnique({
              where: { id: decoded.id },
              select: { id: true, role: true, email: true, name: true, isActive: true, deletedAt: true, isPermanentlyDeleted: true }
            });
            if (dbUser && dbUser.isActive && !dbUser.deletedAt && !dbUser.isPermanentlyDeleted) {
              user = { id: dbUser.id, role: dbUser.role, email: dbUser.email, name: dbUser.name };
            }
          }
        } catch {}
      }
    }

    // Guest fallback: allow public order stream if valid orderId is provided
    let guestOrderId: string | null = null;
    if (!user && queryOrderId) {
      const orderExists = await db.order.findFirst({
        where: {
          OR: [
            { id: queryOrderId },
            { id: { equals: queryOrderId, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      if (orderExists) {
        guestOrderId = orderExists.id;
      }
    }

    if (!user && !guestOrderId) {
      return new Response(JSON.stringify({ success: false, message: "Please log in first or provide a valid order ID to connect to the order stream.", error: "Please log in first to connect to the order stream." }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
    if (user && user.role !== "USER") {
      return new Response(JSON.stringify({ success: false, message: "Access denied. User account required.", error: "Access denied. User account required." }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const userId = user?.id || null;
    const userChannel = userId ? `user:${userId}` : null;
    const orderChannel = (guestOrderId || queryOrderId) ? `order:${guestOrderId || queryOrderId}` : null;

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
            userId,
            orderId: guestOrderId || queryOrderId || null,
            message: "Real-time user order stream established",
            timestamp: new Date().toISOString(),
          })}\n\n`
        );

        // 2. Real-time Event Listener
        const handleOrderEvent = (payload: RealtimeOrderPayload) => {
          safeEnqueue(`event: order\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        if (userChannel) {
          realtimeEmitter.on(userChannel, handleOrderEvent);
        }
        if (orderChannel) {
          realtimeEmitter.on(orderChannel, handleOrderEvent);
        }

        // 3. Keepalive every 4s to prevent proxy/idle timeouts
        const heartbeat = setInterval(() => {
          safeEnqueue(`: keepalive ${new Date().toISOString()}\n\n`);
        }, 4000);

        cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          clearInterval(heartbeat);
          if (userChannel) {
            realtimeEmitter.off(userChannel, handleOrderEvent);
          }
          if (orderChannel) {
            realtimeEmitter.off(orderChannel, handleOrderEvent);
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
        "Content-Encoding": "none",
        "X-Accel-Buffering": "no",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("User SSE stream error:", error);
    return new Response(JSON.stringify({ error: "Failed to initialize real-time stream" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
}
