"use client";

import { useEffect, useRef, useState } from "react";

export interface RealtimeOrderPayload {
  event: "ORDER_CREATED" | "ORDER_UPDATED" | "ORDER_CANCELLED" | "ORDER_STATUS_CHANGED" | "DASHBOARD_REFRESH";
  order?: any;
  orderId?: string;
  status?: string;
  sellerId?: string;
  userId?: string;
  deliveryPersonId?: string | null;
  timestamp: string;
}

export interface UseRealtimeStreamOptions {
  url: string;
  enabled?: boolean;
  onOrder?: (payload: RealtimeOrderPayload) => void;
  onConnected?: () => void;
  onError?: (err: any) => void;
}

// Global shared connection manager to reuse 1 SSE connection across all components on a page
interface StreamConnection {
  es: EventSource | null;
  subscribers: Set<(payload: RealtimeOrderPayload) => void>;
  connectedSubscribers: Set<() => void>;
  errorSubscribers: Set<(err: any) => void>;
  reconnectTimeout: NodeJS.Timeout | null;
  isConnected: boolean;
}

const connections = new Map<string, StreamConnection>();

function getOrCreateConnection(url: string): StreamConnection {
  let conn = connections.get(url);
  if (!conn) {
    conn = {
      es: null,
      subscribers: new Set(),
      connectedSubscribers: new Set(),
      errorSubscribers: new Set(),
      reconnectTimeout: null,
      isConnected: false,
    };
    connections.set(url, conn);
  }
  return conn;
}

function startConnection(url: string) {
  if (typeof window === "undefined") return;
  const conn = getOrCreateConnection(url);
  if (conn.es) return; // Already running

  try {
    const es = new EventSource(url, { withCredentials: true });
    conn.es = es;

    let lastHandledPayload = "";
    let lastHandledTime = 0;

    const handlePayload = (dataStr: string) => {
      try {
        const now = Date.now();
        // Deduplicate identical payloads received within 300ms (e.g. from event vs message dual emission)
        if (dataStr === lastHandledPayload && now - lastHandledTime < 300) {
          return;
        }
        lastHandledPayload = dataStr;
        lastHandledTime = now;

        const payload: RealtimeOrderPayload = JSON.parse(dataStr);
        // 1. Notify hook subscribers
        conn.subscribers.forEach((cb) => {
          try { cb(payload); } catch (e) { console.error("Subscriber error:", e); }
        });
        // 2. Dispatch global window events
        window.dispatchEvent(new CustomEvent("realtime-order", { detail: payload }));
        if (payload.event) {
          window.dispatchEvent(new CustomEvent(`realtime-order-${payload.event}`, { detail: payload }));
        }
      } catch (err) {
        console.error("Failed to parse SSE payload:", err);
      }
    };

    es.addEventListener("connected", () => {
      conn.isConnected = true;
      conn.connectedSubscribers.forEach((cb) => {
        try { cb(); } catch {}
      });
    });

    es.addEventListener("order", (e) => {
      handlePayload(e.data);
    });

    // Fallback standard message handler
    es.onmessage = (e) => {
      if (e.data && e.data.trim().startsWith("{")) {
        handlePayload(e.data);
      }
    };

    es.onopen = () => {
      conn.isConnected = true;
      conn.connectedSubscribers.forEach((cb) => {
        try { cb(); } catch {}
      });
    };

    es.onerror = (err) => {
      conn.isConnected = false;
      conn.errorSubscribers.forEach((cb) => {
        try { cb(err); } catch {}
      });

      // Only manually close and recreate if the browser marked it CLOSED
      if (conn.es && conn.es.readyState === EventSource.CLOSED) {
        conn.es.close();
        conn.es = null;

        if (conn.subscribers.size > 0 || conn.connectedSubscribers.size > 0) {
          if (conn.reconnectTimeout) clearTimeout(conn.reconnectTimeout);
          conn.reconnectTimeout = setTimeout(() => {
            startConnection(url);
          }, 2000);
        }
      }
    };
  } catch (err) {
    console.error("Error creating shared EventSource:", err);
    conn.isConnected = false;
  }
}

function stopConnectionIfOrphaned(url: string) {
  const conn = connections.get(url);
  if (!conn) return;

  if (conn.subscribers.size === 0 && conn.connectedSubscribers.size === 0) {
    if (conn.reconnectTimeout) clearTimeout(conn.reconnectTimeout);
    if (conn.es) {
      conn.es.close();
      conn.es = null;
    }
    conn.isConnected = false;
    connections.delete(url);
  }
}

export function useRealtimeStream({
  url,
  enabled = true,
  onOrder,
  onConnected,
  onError,
}: UseRealtimeStreamOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const onOrderRef = useRef(onOrder);
  const onConnectedRef = useRef(onConnected);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onOrderRef.current = onOrder;
    onConnectedRef.current = onConnected;
    onErrorRef.current = onError;
  }, [onOrder, onConnected, onError]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setIsConnected(false);
      return;
    }

    const conn = getOrCreateConnection(url);

    const orderHandler = (payload: RealtimeOrderPayload) => {
      if (onOrderRef.current) onOrderRef.current(payload);
    };

    const connectedHandler = () => {
      setIsConnected(true);
      if (onConnectedRef.current) onConnectedRef.current();
    };

    const errorHandler = (err: any) => {
      setIsConnected(false);
      if (onErrorRef.current) onErrorRef.current(err);
    };

    conn.subscribers.add(orderHandler);
    conn.connectedSubscribers.add(connectedHandler);
    conn.errorSubscribers.add(errorHandler);

    if (conn.isConnected) {
      setIsConnected(true);
    }

    startConnection(url);

    return () => {
      conn.subscribers.delete(orderHandler);
      conn.connectedSubscribers.delete(connectedHandler);
      conn.errorSubscribers.delete(errorHandler);
      stopConnectionIfOrphaned(url);
    };
  }, [url, enabled]);

  return { isConnected };
}
