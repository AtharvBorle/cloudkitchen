"use client";

import { useEffect, useRef } from "react";

export interface LiveShopPayload {
  event: "COUPON_UPDATED" | "SELLER_STATUS_CHANGED" | "MENU_UPDATED";
  sellerId?: string | null;
  coupon?: any;
  action?: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE";
  isOnline?: boolean;
  timestamp: string;
}

export interface UseLiveShopStreamOptions {
  sellerId?: string | null;
  enabled?: boolean;
  onCouponUpdated?: (payload: LiveShopPayload) => void;
  onSellerStatusChanged?: (payload: LiveShopPayload) => void;
  onMenuUpdated?: (payload: LiveShopPayload) => void;
  onAnyEvent?: (payload: LiveShopPayload) => void;
}

interface SharedStreamConnection {
  es: EventSource | null;
  subscribers: Set<(payload: LiveShopPayload) => void>;
  reconnectTimeout: NodeJS.Timeout | null;
  isConnected: boolean;
}

const connections = new Map<string, SharedStreamConnection>();

function getConnectionKey(sellerId?: string | null): string {
  return sellerId ? String(sellerId).trim() : "global";
}

function getOrCreateConnection(key: string): SharedStreamConnection {
  let conn = connections.get(key);
  if (!conn) {
    conn = {
      es: null,
      subscribers: new Set(),
      reconnectTimeout: null,
      isConnected: false,
    };
    connections.set(key, conn);
  }
  return conn;
}

function startConnection(key: string, sellerId?: string | null) {
  if (typeof window === "undefined") return;
  const conn = getOrCreateConnection(key);
  if (conn.es) return; // Connection already active

  try {
    const query = sellerId ? `?sellerId=${encodeURIComponent(sellerId)}` : "";
    const url = `/api/public/live/stream${query}`;
    const es = new EventSource(url, { withCredentials: true });
    conn.es = es;

    let lastHandledPayload = "";
    let lastHandledTime = 0;

    const handlePayload = (dataStr: string) => {
      try {
        const now = Date.now();
        // Deduplicate identical payloads received within 300ms
        if (dataStr === lastHandledPayload && now - lastHandledTime < 300) {
          return;
        }
        lastHandledPayload = dataStr;
        lastHandledTime = now;

        const payload: LiveShopPayload = JSON.parse(dataStr);
        if (!payload || !payload.event) return;

        // 1. Notify all hook subscribers for this stream
        conn.subscribers.forEach((cb) => {
          try {
            cb(payload);
          } catch (e) {
            console.error("Live shop subscriber error:", e);
          }
        });

        // 2. Dispatch global window events for cross-component reactivity
        window.dispatchEvent(new CustomEvent("public-live-shop", { detail: payload }));
        if (payload.event === "COUPON_UPDATED") {
          window.dispatchEvent(new CustomEvent("public-coupon-updated", { detail: payload }));
        } else if (payload.event === "SELLER_STATUS_CHANGED") {
          window.dispatchEvent(new CustomEvent("seller-status-updated", { detail: payload }));
        } else if (payload.event === "MENU_UPDATED") {
          window.dispatchEvent(new CustomEvent("seller-menu-updated", { detail: payload }));
        }
      } catch (err) {
        console.error("Failed to parse LiveShop SSE payload:", err);
      }
    };

    es.addEventListener("live", (e) => {
      if (e.data) handlePayload(e.data);
    });

    es.onmessage = (e) => {
      if (e.data && e.data.trim().startsWith("{")) {
        handlePayload(e.data);
      }
    };

    es.onopen = () => {
      conn.isConnected = true;
    };

    es.onerror = (err) => {
      conn.isConnected = false;
      if (conn.es && conn.es.readyState === EventSource.CLOSED) {
        conn.es.close();
        conn.es = null;

        if (conn.subscribers.size > 0) {
          if (conn.reconnectTimeout) clearTimeout(conn.reconnectTimeout);
          conn.reconnectTimeout = setTimeout(() => {
            startConnection(key, sellerId);
          }, 3000);
        }
      }
    };
  } catch (err) {
    console.error("Error creating LiveShop EventSource:", err);
    conn.isConnected = false;
  }
}

function stopConnectionIfOrphaned(key: string) {
  const conn = connections.get(key);
  if (!conn) return;

  if (conn.subscribers.size === 0) {
    if (conn.reconnectTimeout) {
      clearTimeout(conn.reconnectTimeout);
      conn.reconnectTimeout = null;
    }
    if (conn.es) {
      conn.es.close();
      conn.es = null;
    }
    conn.isConnected = false;
    connections.delete(key);
  }
}

/**
 * Hook to listen to real-time shop updates (coupons, seller online status, menu items) via SSE.
 * Requires ZERO polling. Multiple components subscribing to the same seller share 1 single SSE stream.
 */
export function useLiveShopStream(options: UseLiveShopStreamOptions = {}) {
  const {
    sellerId,
    enabled = true,
    onCouponUpdated,
    onSellerStatusChanged,
    onMenuUpdated,
    onAnyEvent,
  } = options;

  const callbacksRef = useRef({
    onCouponUpdated,
    onSellerStatusChanged,
    onMenuUpdated,
    onAnyEvent,
  });

  useEffect(() => {
    callbacksRef.current = {
      onCouponUpdated,
      onSellerStatusChanged,
      onMenuUpdated,
      onAnyEvent,
    };
  }, [onCouponUpdated, onSellerStatusChanged, onMenuUpdated, onAnyEvent]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const key = getConnectionKey(sellerId);
    const conn = getOrCreateConnection(key);

    const subscriber = (payload: LiveShopPayload) => {
      callbacksRef.current.onAnyEvent?.(payload);
      if (payload.event === "COUPON_UPDATED") {
        callbacksRef.current.onCouponUpdated?.(payload);
      } else if (payload.event === "SELLER_STATUS_CHANGED") {
        callbacksRef.current.onSellerStatusChanged?.(payload);
      } else if (payload.event === "MENU_UPDATED") {
        callbacksRef.current.onMenuUpdated?.(payload);
      }
    };

    conn.subscribers.add(subscriber);
    startConnection(key, sellerId);

    return () => {
      conn.subscribers.delete(subscriber);
      // Clean up connection after a short grace period if no components are using it
      setTimeout(() => {
        stopConnectionIfOrphaned(key);
      }, 5000);
    };
  }, [sellerId, enabled]);
}
