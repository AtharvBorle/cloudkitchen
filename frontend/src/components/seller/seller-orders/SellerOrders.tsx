"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  RotateCw,
  Bike,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Clock,
  Utensils,
  MapPin,
  Phone,
  Mail,
  Calendar,
  PlayCircle,
  Truck,
  Sparkles,
  PauseCircle,
  ChevronRight,
  Check,
  ShieldCheck,
} from "lucide-react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { playNewOrderChime } from "@/lib/audio-chime";
import RejectOrderModal from "./RejectOrderModal";
import ToastNotification from "./ToastNotification";
import PaginationControls from "../common/PaginationControls";
import {
  markSubscriberMealDeliveryStatus,
  MealSubscriber,
  getTierColors,
} from "@/lib/meal-subscriptions";
import styles from "./SellerOrders.module.css";

export const ORDER_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const getRemainingSeconds = (createdAt: string | undefined, currentNow: number): number => {
  if (!createdAt) return ORDER_EXPIRY_MS / 1000;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return 0;
  return Math.max(0, Math.floor((createdTime + ORDER_EXPIRY_MS - currentNow) / 1000));
};

export type OrderStatusFilter =
  | "All"
  | "Pending"
  | "Preparing"
  | "Out for Delivery"
  | "Completed"
  | "Cancelled";

export type DateFilterOption =
  | "ALL"
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH";

export type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "TOTAL_HIGH"
  | "TOTAL_LOW"
  | "CUSTOMER_AZ";

export interface OrderRow {
  id: string;
  orderId: string;
  customer: string;
  room: string;
  items: string;
  rawTotal: number;
  total: string;
  status: "Preparing" | "Pending" | "Out for Delivery" | "Completed" | "Cancelled";
  rawStatus: string;
  createdAt: string;
  date: string;
  time: string;
  deliveryPersonName?: string;
}

const formatOrderDate = (isoString?: string): string => {
  if (!isoString) return "Today";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Today";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Today";
  }
};

const formatOrderTime = (isoString?: string): string => {
  if (!isoString) return "Just now";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Just now";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Just now";
  }
};

export const formatOrderDeliveryAddress = (
  rawAddress?: string | null,
  roomTitle?: string | null
): string => {
  if (!rawAddress) return "N/A";
  let cleaned = String(rawAddress).trim();

  // Strip coordinate metadata suffix e.g. "| Loc: 18.5002,73.8210"
  cleaned = cleaned.replace(/\s*\|\s*Loc:\s*[-0-9.,\s]+/gi, "").trim();

  // Strip bracketed address type prefix e.g. "[Home] "
  cleaned = cleaned.replace(/^\[[^\]]+\]\s*/i, "").trim();

  // Strip explicit room title if present at the start of the address
  if (roomTitle && roomTitle.trim()) {
    const escapedRoom = roomTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(`^${escapedRoom}\\s*,\\s*`, "i"), "").trim();
  }

  // Split by comma to remove leading room/building name prefix and deduplicate consecutive segments
  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const firstLower = parts[0].toLowerCase();
    const isRoomPrefix =
      /^room\s*\d+/i.test(firstLower) ||
      /^testing(\s+room)?(\s*\d+)?$/i.test(firstLower) ||
      firstLower === "myroom" ||
      firstLower.includes("deluxe room") ||
      firstLower.includes("neopace infotech") ||
      firstLower.includes("neoopace infotech") ||
      firstLower === "dfsf" ||
      firstLower === "dfsfdfsf";

    if (isRoomPrefix) {
      parts.shift();
    }
  }

  // Deduplicate consecutive identical segments (e.g. "khotrud, khotrud")
  const deduped: string[] = [];
  for (const part of parts) {
    if (
      deduped.length === 0 ||
      deduped[deduped.length - 1].toLowerCase() !== part.toLowerCase()
    ) {
      deduped.push(part);
    }
  }

  return deduped.join(", ") || "N/A";
};

export interface SellerOrdersProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  orders?: OrderRow[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

function OrderRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const targetOrderId = searchParams?.get("orderId") || searchParams?.get("id");
    if (targetOrderId) {
      router.replace(`/seller/orders/details?orderId=${encodeURIComponent(targetOrderId)}`);
    }
  }, [searchParams, router]);

  return null;
}

export const SellerOrders: React.FC<SellerOrdersProps> = ({
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  orders: propOrders,
  onSearch: externalOnSearch,
  onNotificationClick,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderStatusFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderList, setOrderList] = useState<OrderRow[]>(propOrders || []);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Live 1-second ticker for accurate 5-minute countdown without refresh drift
  const [now, setNow] = useState(Date.now());
  const autoCancelledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Background auto-cancel detector: cancels expired pending orders when timer hits 0
  useEffect(() => {
    orderList.forEach((order) => {
      const isPending = order.status === "Pending" || order.rawStatus === "PENDING";
      if (isPending) {
        const remainingSec = getRemainingSeconds(order.createdAt, now);
        if (remainingSec <= 0 && !autoCancelledRef.current.has(order.id)) {
          autoCancelledRef.current.add(order.id);
          fetchApi(`/api/seller/orders/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED" }),
          })
            .then((res) => {
              if (res.ok) {
                setOrderList((prev) =>
                  prev.map((o) => (o.id === order.id ? { ...o, status: "Cancelled", rawStatus: "CANCELLED" } : o))
                );
              }
            })
            .catch((err) => console.error("Auto cancel error:", err));
        }
      }
    });
  }, [orderList, now]);

  // In-app rejection modal & toast state
  const [orderToReject, setOrderToReject] = useState<OrderRow | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  // Section toggle: Regular Food Orders vs Subscribers Meal
  const [activeSection, setActiveSection] = useState<"orders" | "subscribers">("orders");

  // Subscribers State
  const [subscribers, setSubscribers] = useState<MealSubscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subscribersTab, setSubscribersTab] = useState<"today" | "paused" | "all">("today");
  const [subSearchQuery, setSubSearchQuery] = useState("");
  const [subTierFilter, setSubTierFilter] = useState("ALL");
  const [subDeliveryFilter, setSubDeliveryFilter] = useState<"ALL" | "DELIVERED" | "PENDING">("ALL");

  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const loadSubscribers = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingSubs(true);
      const res = await fetchApi("/api/seller/meal-plans");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.subscribers || data.subscribers || [];
        if (Array.isArray(list)) {
          setSubscribers(list);
        }
      }
    } catch (err) {
      console.error("Failed to load seller meal subscribers:", err);
    } finally {
      if (!isSilent) setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers(false);
  }, [loadSubscribers]);

  useEffect(() => {
    const handler = () => loadSubscribers(true);
    window.addEventListener("meal-subscriptions-updated", handler);
    return () => window.removeEventListener("meal-subscriptions-updated", handler);
  }, [loadSubscribers]);

  const formatSubDate = (iso?: string | null): string => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // 1. Paused subscribers list
  const pausedSubscribers = useMemo(() => {
    return subscribers.filter((s) => Boolean(s.isPaused));
  }, [subscribers]);

  // 2. Today's Delivery subscribers (strictly excludes paused subscribers!)
  const todayDeliverySubscribers = useMemo(() => {
    const nowDate = new Date();
    return subscribers.filter((s) => {
      if (s.isPaused) return false;
      const statusUpper = (s.status || "").toUpperCase();
      if (statusUpper === "CANCELLED" || statusUpper === "EXPIRED") return false;
      if (s.startDate && new Date(s.startDate) > nowDate) return false;
      if (s.endDate && new Date(s.endDate) < nowDate) return false;
      return true;
    });
  }, [subscribers]);

  // Metric counters
  const mealsToDeliverTodayCount = todayDeliverySubscribers.length;
  const deliveredTodayCount = useMemo(() => {
    return todayDeliverySubscribers.filter((s) => {
      const todayRec = s.dailyDeliveries?.find((d: any) => d.date === todayDateStr);
      return todayRec?.status === "DELIVERED";
    }).length;
  }, [todayDeliverySubscribers, todayDateStr]);
  const pendingTodayCount = Math.max(0, mealsToDeliverTodayCount - deliveredTodayCount);
  const pausedCount = pausedSubscribers.length;
  const totalSubscribersCount = subscribers.length;

  // Filtered subscribers for display based on active tab & filters
  const displayedSubscribers = useMemo(() => {
    let list =
      subscribersTab === "today"
        ? todayDeliverySubscribers
        : subscribersTab === "paused"
        ? pausedSubscribers
        : subscribers;

    const q = subSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          (s.customerName || "").toLowerCase().includes(q) ||
          (s.customerPhone || "").toLowerCase().includes(q) ||
          (s.customerEmail || "").toLowerCase().includes(q) ||
          (s.deliveryAddress || "").toLowerCase().includes(q) ||
          (s.planName || "").toLowerCase().includes(q)
      );
    }

    if (subTierFilter !== "ALL") {
      list = list.filter((s) => (s.tier || "Bronze").toUpperCase() === subTierFilter.toUpperCase());
    }

    if (subscribersTab === "today" && subDeliveryFilter !== "ALL") {
      list = list.filter((s) => {
        const isDel = s.dailyDeliveries?.find((d: any) => d.date === todayDateStr)?.status === "DELIVERED";
        return subDeliveryFilter === "DELIVERED" ? isDel : !isDel;
      });
    }

    return list;
  }, [
    subscribersTab,
    todayDeliverySubscribers,
    pausedSubscribers,
    subscribers,
    subSearchQuery,
    subTierFilter,
    subDeliveryFilter,
    todayDateStr,
  ]);

  const handleToggleDelivery = async (sub: MealSubscriber) => {
    const isCurrentlyDelivered = sub.dailyDeliveries?.find((d: any) => d.date === todayDateStr)?.status === "DELIVERED";
    const nextStatus: "DELIVERED" | "NOT_DELIVERED" = isCurrentlyDelivered ? "NOT_DELIVERED" : "DELIVERED";

    // Optimistic UI update
    setSubscribers((prev) =>
      prev.map((s) => {
        if (s.id !== sub.id) return s;
        const currentDeliveries = Array.isArray(s.dailyDeliveries) ? [...s.dailyDeliveries] : [];
        const idx = currentDeliveries.findIndex((d: any) => d.date === todayDateStr);
        const rec = {
          date: todayDateStr,
          status: nextStatus,
          markedAt: new Date().toISOString(),
        };
        if (idx >= 0) {
          currentDeliveries[idx] = rec;
        } else {
          currentDeliveries.unshift(rec);
        }
        return { ...s, dailyDeliveries: currentDeliveries };
      })
    );

    try {
      await markSubscriberMealDeliveryStatus(sub.id, todayDateStr, nextStatus);
      setToast({
        type: "success",
        text: `Meal marked as ${nextStatus === "DELIVERED" ? "Delivered" : "Pending"} for ${sub.customerName || "Customer"}`,
      });
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to update delivery status" });
      loadSubscribers(true);
    }
  };

  const loadOrders = useCallback(async (isPolling = false) => {
    if (propOrders && propOrders.length > 0 && !isPolling) {
      setOrderList(propOrders);
      return;
    }

    try {
      if (!isPolling) setLoading(true);
      const res = await fetchApi("/api/seller/orders");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.orders || data.orders || data.data || [];
        if (Array.isArray(list)) {
          const mapped: OrderRow[] = list.map((o: any) => {
            let itemsSummary = "";
            try {
              const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
              if (Array.isArray(parsed)) {
                itemsSummary = parsed.map((i: any) => {
                  const addonsText = i.selectedAddons && i.selectedAddons.length > 0 ? ` (+${i.selectedAddons.map((a: any) => a.name).join(", ")})` : "";
                  return `${i.quantity || 1}x ${i.name}${addonsText}`;
                }).join(", ");
              }
            } catch (e) {
              itemsSummary = "Kitchen Items";
            }

            let statusVal: OrderRow["status"] = "Pending";
            const s = (o.status || "").toUpperCase();
            if (s === "PREPARING") statusVal = "Preparing";
            else if (s === "OUT_FOR_DELIVERY" || s === "ON_THE_WAY") statusVal = "Out for Delivery";
            else if (s === "DELIVERED" || s === "COMPLETED") statusVal = "Completed";
            else if (s === "CANCELLED") statusVal = "Cancelled";
            else {
              const remainingSec = getRemainingSeconds(o.createdAt, Date.now());
              if (remainingSec <= 0) {
                statusVal = "Cancelled";
              } else {
                statusVal = "Pending";
              }
            }

            const orderDateStr = formatOrderDate(o.createdAt);
            const orderTimeStr = formatOrderTime(o.createdAt);

            return {
              id: o.id,
              orderId: `#NCR-${o.id.slice(0, 4).toUpperCase()}`,
              customer: o.user?.name || "Customer",
              room: formatOrderDeliveryAddress(o.deliveryAddress, o.room?.title),
              items: itemsSummary || "1x Dish Item",
              rawTotal: Number(o.totalAmount) || 0,
              total: `₹${o.totalAmount || 0}`,
              status: statusVal,
              rawStatus: s,
              createdAt: o.createdAt || new Date().toISOString(),
              date: orderDateStr,
              time: orderTimeStr,
              deliveryPersonName: o.deliveryPerson?.name,
            };
          });
          setOrderList(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to load seller orders:", err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [propOrders]);

  // Initial load
  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  // Real-time SSE stream replaces 4s auto-polling
  useRealtimeStream({
    url: "/api/seller/orders/stream",
    onConnected: () => {
      loadOrders(true);
    },
    onOrder: (payload) => {
      if (payload.event === "ORDER_CREATED") {
        playNewOrderChime();
        if (payload.order && payload.order.id) {
          const o = payload.order;
          let itemsSummary = "";
          try {
            const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
            if (Array.isArray(parsed)) {
              itemsSummary = parsed.map((i: any) => {
                const addonsText = i.selectedAddons && i.selectedAddons.length > 0 ? ` (+${i.selectedAddons.map((a: any) => a.name).join(", ")})` : "";
                return `${i.quantity || 1}x ${i.name}${addonsText}`;
              }).join(", ");
            }
          } catch (e) {
            itemsSummary = "Kitchen Items";
          }
          const orderDateStr = formatOrderDate(o.createdAt);
          const orderTimeStr = formatOrderTime(o.createdAt);
          const newRow: OrderRow = {
            id: o.id,
            orderId: `#NCR-${o.id.slice(0, 4).toUpperCase()}`,
            customer: o.user?.name || "Customer",
            room: formatOrderDeliveryAddress(o.deliveryAddress, o.room?.title),
            items: itemsSummary || "1x Dish Item",
            rawTotal: Number(o.totalAmount) || 0,
            total: `₹${o.totalAmount || 0}`,
            status: "Pending",
            rawStatus: "PENDING",
            createdAt: o.createdAt || new Date().toISOString(),
            date: orderDateStr,
            time: orderTimeStr,
            deliveryPersonName: o.deliveryPerson?.name,
          };
          setOrderList((prev) => {
            if (prev.some((item) => item.id === o.id)) return prev;
            return [newRow, ...prev];
          });
        }
      } else if (payload.event === "ORDER_UPDATED" && payload.orderId) {
        if (payload.status) {
          const s = payload.status.toUpperCase();
          let statusVal: OrderRow["status"] = "Pending";
          if (s === "PREPARING") statusVal = "Preparing";
          else if (s === "OUT_FOR_DELIVERY" || s === "ON_THE_WAY") statusVal = "Out for Delivery";
          else if (s === "DELIVERED" || s === "COMPLETED") statusVal = "Completed";
          else if (s === "CANCELLED") statusVal = "Cancelled";
          setOrderList((prev) =>
            prev.map((item) => (item.id === payload.orderId ? { ...item, status: statusVal, rawStatus: s } : item))
          );
        }
      } else if (payload.event === "ORDER_CANCELLED" && payload.orderId) {
        setOrderList((prev) =>
          prev.map((item) => (item.id === payload.orderId ? { ...item, status: "Cancelled", rawStatus: "CANCELLED" } : item))
        );
      }
      loadOrders(true);
    },
  });

  // Action: Accept order (PENDING -> PREPARING)
  const handleAccept = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoadingId(orderId);
      const res = await fetchApi(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING" }),
      });
      if (res.ok) {
        setOrderList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "Preparing", rawStatus: "PREPARING" } : o))
        );
        loadOrders(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setToast({
          type: "error",
          text: errData.error || errData.message || "Failed to accept order. Acceptance window may have expired.",
        });
        loadOrders(true);
      }
    } catch (err) {
      console.error("Failed to accept order:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open rejection confirmation modal
  const handleOpenReject = (order: OrderRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToReject(order);
  };

  // Confirm rejection handler
  const handleConfirmRejection = async () => {
    if (!orderToReject) return;
    try {
      setIsRejecting(true);
      const res = await fetchApi(`/api/seller/orders/${orderToReject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setOrderList((prev) =>
          prev.map((o) => (o.id === orderToReject.id ? { ...o, status: "Cancelled", rawStatus: "CANCELLED" } : o))
        );
        setToast({
          type: "success",
          text: `Order ${orderToReject.orderId} rejected successfully.`,
        });
        setOrderToReject(null);
        loadOrders(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({
          type: "error",
          text: data?.error || data?.message || "Failed to reject order. Please try again.",
        });
      }
    } catch (err) {
      console.error("Failed to reject order:", err);
      setToast({
        type: "error",
        text: "Failed to reject order due to a network error.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Action: Mark Delivered (OUT_FOR_DELIVERY -> DELIVERED)
  const handleMarkDelivered = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoadingId(orderId);
      const res = await fetchApi(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED", isPaid: true }),
      });
      if (res.ok) {
        setOrderList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "Completed", rawStatus: "DELIVERED" } : o))
        );
        loadOrders(true);
      }
    } catch (err) {
      console.error("Failed to mark delivered:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusFilters: OrderStatusFilter[] = [
    "All",
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Completed",
    "Cancelled",
  ];

  // Calculate status counts respecting active date filter
  const counts = useMemo(() => {
    const todayDate = new Date();
    const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 1, 23, 59, 59, 999);
    const startOfWeek = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - todayDate.getDay(), 0, 0, 0, 0);
    const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1, 0, 0, 0, 0);

    const baseList = orderList.filter((order) => {
      if (dateFilter !== "ALL") {
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return true;

        if (dateFilter === "TODAY") {
          return orderDate >= startOfToday && orderDate <= endOfToday;
        }
        if (dateFilter === "YESTERDAY") {
          return orderDate >= startOfYesterday && orderDate <= endOfYesterday;
        }
        if (dateFilter === "THIS_WEEK") {
          return orderDate >= startOfWeek;
        }
        if (dateFilter === "THIS_MONTH") {
          return orderDate >= startOfMonth;
        }
      }
      return true;
    });

    const map: Record<OrderStatusFilter, number> = {
      All: baseList.length,
      Pending: 0,
      Preparing: 0,
      "Out for Delivery": 0,
      Completed: 0,
      Cancelled: 0,
    };
    baseList.forEach((o) => {
      let effStatus: OrderStatusFilter = o.status;
      if (effStatus === "Pending") {
        const sec = getRemainingSeconds(o.createdAt, now);
        if (sec <= 0) effStatus = "Cancelled";
      }
      if (map[effStatus] !== undefined) {
        map[effStatus]++;
      }
    });
    return map;
  }, [orderList, dateFilter, now]);

  // Filter & Sort computation
  const filteredOrders = useMemo(() => {
    let list = [...orderList];

    // 1. Status Filter
    if (activeFilter !== "All") {
      list = list.filter((order) => {
        let effStatus: OrderStatusFilter = order.status;
        if (effStatus === "Pending") {
          const sec = getRemainingSeconds(order.createdAt, now);
          if (sec <= 0) effStatus = "Cancelled";
        }
        return effStatus === activeFilter;
      });
    }

    // 2. Date Range Filter
    if (dateFilter !== "ALL") {
      const nowDate = new Date();
      const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 23, 59, 59, 999);
      const startOfYesterday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 1, 0, 0, 0, 0);
      const endOfYesterday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 1, 23, 59, 59, 999);
      const startOfWeek = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - nowDate.getDay(), 0, 0, 0, 0);
      const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0, 0, 0, 0);

      list = list.filter((order) => {
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return true;

        if (dateFilter === "TODAY") {
          return orderDate >= startOfToday && orderDate <= endOfToday;
        }
        if (dateFilter === "YESTERDAY") {
          return orderDate >= startOfYesterday && orderDate <= endOfYesterday;
        }
        if (dateFilter === "THIS_WEEK") {
          return orderDate >= startOfWeek;
        }
        if (dateFilter === "THIS_MONTH") {
          return orderDate >= startOfMonth;
        }
        return true;
      });
    }

    // 3. Search Filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      list = list.filter((order) => {
        return (
          order.orderId.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query) ||
          order.room.toLowerCase().includes(query) ||
          order.items.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query) ||
          (order.date && order.date.toLowerCase().includes(query)) ||
          (order.time && order.time.toLowerCase().includes(query)) ||
          (order.deliveryPersonName && order.deliveryPersonName.toLowerCase().includes(query)) ||
          order.status.toLowerCase().includes(query)
        );
      });
    }

    // 4. Sorting
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;

      if (sortBy === "NEWEST") {
        return timeB - timeA;
      }
      if (sortBy === "OLDEST") {
        return timeA - timeB;
      }
      if (sortBy === "TOTAL_HIGH") {
        return (b.rawTotal || 0) - (a.rawTotal || 0);
      }
      if (sortBy === "TOTAL_LOW") {
        return (a.rawTotal || 0) - (b.rawTotal || 0);
      }
      if (sortBy === "CUSTOMER_AZ") {
        return (a.customer || "").localeCompare(b.customer || "", undefined, { sensitivity: "base" });
      }
      return 0;
    });

    return list;
  }, [orderList, activeFilter, dateFilter, searchQuery, sortBy, now]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | "All">(10);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, dateFilter, searchQuery, sortBy]);

  // Slice paginated orders
  const paginatedOrders = useMemo(() => {
    if (pageSize === "All") return filteredOrders;
    const numSize = Number(pageSize) || 10;
    const startIndex = (currentPage - 1) * numSize;
    return filteredOrders.slice(startIndex, startIndex + numSize);
  }, [filteredOrders, currentPage, pageSize]);

  const resetFilters = () => {
    setActiveFilter("All");
    setDateFilter("ALL");
    setSearchQuery("");
    setSortBy("NEWEST");
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status: OrderRow["status"]) => {
    switch (status) {
      case "Preparing":
        return styles.statusPreparing;
      case "Pending":
        return styles.statusPending;
      case "Out for Delivery":
        return styles.statusOutForDelivery;
      case "Completed":
        return styles.statusCompleted;
      case "Cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  return (
    <div className={styles.ordersContainer}>
      <Suspense fallback={null}>
        <OrderRedirectHandler />
      </Suspense>
      {/* 1. Left Sidebar Component with active Orders tab */}
      <ConsoleSidebar
        activeItemId="orders"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={ownerName}
        partnerRole={partnerRole}
        avatarInitials={avatarInitials}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={(q) => {
            setSearchQuery(q);
            if (externalOnSearch) externalOnSearch(q);
          }}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Orders Content */}
        <main className={styles.mainContent}>
          {/* Header Title & Subtitle + Top Section Switcher */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div className={styles.headerGroup}>
              <h1 className={styles.title}>
                {activeSection === "orders" ? "Food & Service Orders" : "Subscribers Meal Delivery"}
              </h1>
              <p className={styles.subtitle}>
                {activeSection === "orders"
                  ? "Manage active incoming, preparation, and delivery cycles in real-time."
                  : "Dispatch daily meal deliveries for active subscribers and monitor paused customer accounts."}
              </p>
            </div>

            {/* Top Switcher: Regular Food Orders vs Subscribers Meal */}
            <div className={styles.sectionSwitchContainer}>
              <button
                type="button"
                className={`${styles.sectionSwitchBtn} ${activeSection === "orders" ? styles.sectionSwitchBtnActive : ""}`}
                onClick={() => setActiveSection("orders")}
              >
                <Bike size={16} />
                <span>Food Orders ({orderList.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.sectionSwitchBtn} ${activeSection === "subscribers" ? styles.sectionSwitchBtnActive : ""}`}
                onClick={() => setActiveSection("subscribers")}
              >
                <Utensils size={16} />
                <span>Subscribers Meal ({mealsToDeliverTodayCount} Today)</span>
              </button>
            </div>
          </div>

          {activeSection === "orders" ? (
            <>
              {/* Control Bar: Status Filter Tabs + Right Filter/Sort Buttons */}
              <div className={styles.controlBar}>
            {/* Status Segmented Pill Group */}
            <div className={styles.statusPillGroup}>
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`${styles.statusPillBtn} ${
                    activeFilter === filter ? styles.activePill : ""
                  }`}
                >
                  <span>{filter}</span>
                  <span className={styles.pillBadge}>{counts[filter]}</span>
                </button>
              ))}
            </div>

            {/* Right Side Options: Search + Date Filter + Sort */}
            <div className={styles.rightFilters}>
              {/* Search input */}
              <div className={styles.searchWrapper}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search orders, customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Date Filter Dropdown */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                className={styles.filterSelect}
                aria-label="Filter by Date"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Filter: Today</option>
                <option value="YESTERDAY">Filter: Yesterday</option>
                <option value="THIS_WEEK">Filter: This Week</option>
                <option value="THIS_MONTH">Filter: This Month</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={styles.filterSelect}
                aria-label="Sort Orders"
              >
                <option value="NEWEST">Sort: Newest</option>
                <option value="OLDEST">Sort: Oldest</option>
                <option value="TOTAL_HIGH">Total: High to Low</option>
                <option value="TOTAL_LOW">Total: Low to High</option>
                <option value="CUSTOMER_AZ">Customer: A to Z</option>
              </select>
            </div>
          </div>

          {/* Orders Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.tableContainer}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>ROOM / ADDRESS</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th>DATE & TIME</th>
                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`order-skeleton-${idx}`}>
                        <td style={{ padding: "16px" }}>
                          <div style={{ width: "90px", height: "18px", borderRadius: "6px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ width: "120px", height: "18px", borderRadius: "6px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ width: "140px", height: "18px", borderRadius: "6px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ width: "70px", height: "18px", borderRadius: "6px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ width: "60px", height: "18px", borderRadius: "6px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ width: "80px", height: "24px", borderRadius: "12px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ width: "80px", height: "24px", borderRadius: "12px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out" }} />
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <div style={{ width: "80px", height: "30px", borderRadius: "6px", background: "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite ease-in-out", marginLeft: "auto" }} />
                        </td>
                      </tr>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#64748b", fontSize: "14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                          <span>
                            No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""} orders found
                              {dateFilter !== "ALL" ? ` for ${dateFilter.toLowerCase().replace("_", " ")}` : ""}
                              {searchQuery ? ` matching "${searchQuery}"` : ""}.
                            </span>
                            {(activeFilter !== "All" || dateFilter !== "ALL" || searchQuery || sortBy !== "NEWEST") && (
                              <button
                                type="button"
                                onClick={resetFilters}
                                style={{
                                  padding: "6px 14px",
                                  fontSize: "0.82rem",
                                  fontWeight: 600,
                                  color: "#F97316",
                                  backgroundColor: "#FFF7ED",
                                  border: "1px solid #FFEDD5",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                }}
                              >
                                Reset All Filters
                              </button>
                            )}
                          </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const isPending = order.status === "Pending" || order.rawStatus === "PENDING";
                      const remainingSec = isPending ? getRemainingSeconds(order.createdAt, now) : 0;
                      const isExpired = isPending && remainingSec <= 0;
                      const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
                      const ss = String(remainingSec % 60).padStart(2, "0");
                      const isUrgent = remainingSec <= 60;

                      const isPreparing = order.status === "Preparing" || order.rawStatus === "PREPARING";
                      const isOut = order.status === "Out for Delivery" || order.rawStatus === "OUT_FOR_DELIVERY";
                      const isActionDisabled = actionLoadingId === order.id;

                      return (
                        <tr
                          key={order.id}
                          onClick={() => {
                            router.push(`/seller/orders/details?orderId=${encodeURIComponent(order.id)}`);
                          }}
                          style={{ cursor: "pointer" }}
                          title="Click to view full order lifecycle & details"
                        >
                          <td className={styles.orderIdText}>{order.orderId}</td>
                          <td className={styles.customerText}>{order.customer}</td>
                          <td className={styles.roomText}>{order.room}</td>
                          <td className={styles.itemsText}>{order.items}</td>
                          <td className={styles.totalText}>{order.total}</td>
                          <td className={styles.statusCell}>
                            {isPending ? (
                              !isExpired ? (
                                <div
                                  className={`${styles.statusBadge} ${
                                    isUrgent ? styles.statusTimerUrgent : styles.statusTimer
                                  }`}
                                  title={`Accept order within ${mm}:${ss} before auto-cancellation`}
                                >
                                  <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                                  <span className={styles.statusLabel}>{mm}:{ss}</span>
                                </div>
                              ) : (
                                <div className={`${styles.statusBadge} ${styles.statusCancelled}`} title="Auto-cancelled (acceptance time expired)">
                                  <span className={styles.statusDot} />
                                  <span className={styles.statusLabel}>Cancelled</span>
                                </div>
                              )
                            ) : (
                              <div
                                className={`${styles.statusBadge} ${getStatusBadgeClass(
                                  order.status
                                )}`}
                              >
                                <span className={styles.statusDot} />
                                <span className={styles.statusLabel}>{order.status}</span>
                              </div>
                            )}
                          </td>
                          <td className={styles.dateTimeCell}>
                            <div className={styles.datePrimary}>{order.date}</div>
                            <div className={styles.timeSecondary}>{order.time}</div>
                          </td>
                          <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.actionBtnGroup}>
                              {isPending && !isExpired && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isActionDisabled}
                                    className={styles.acceptBtn}
                                    onClick={(e) => handleAccept(order.id, e)}
                                    title="Accept order and start preparing"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isActionDisabled}
                                    className={styles.rejectBtn}
                                    onClick={(e) => handleOpenReject(order, e)}
                                    title="Reject order"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {isPreparing && (
                                <button
                                  type="button"
                                  className={styles.assignBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/seller/orders/assign-rider?orderId=${encodeURIComponent(order.id)}`);
                                  }}
                                  title="Assign delivery rider"
                                >
                                  <Bike size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                                  Assign Rider
                                </button>
                              )}

                              {isOut && (
                                <button
                                  type="button"
                                  disabled={isActionDisabled}
                                  className={styles.acceptBtn}
                                  onClick={(e) => handleMarkDelivered(order.id, e)}
                                  title="Mark order as completed"
                                >
                                  Mark Delivered
                                </button>
                              )}

                              <button
                                type="button"
                                className={styles.detailsBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/seller/orders/details?orderId=${encodeURIComponent(order.id)}`);
                                }}
                                title="View details"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredOrders.length > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemName="orders"
                pageSizeOptions={[10, 20, 25, 50, "All"]}
              />
            )}
          </div>
        </>
      ) : (
        /* =========================================================================
           SUBSCRIBERS MEAL SECTION
           ========================================================================= */
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Metric Cards Grid */}
          <div className={styles.subMetricsGrid}>
            {/* 1. Meals to Deliver Today (Strictly Non-Paused) */}
            <div className={styles.subMetricCard}>
              <div className={styles.subMetricIconBox} style={{ backgroundColor: "#FFF7ED", color: "#EA580C" }}>
                <Utensils size={24} />
              </div>
              <div>
                <h3 className={styles.subMetricValue}>{mealsToDeliverTodayCount}</h3>
                <p className={styles.subMetricLabel}>Meals To Deliver Today</p>
              </div>
            </div>

            {/* 2. Delivered Today */}
            <div className={styles.subMetricCard}>
              <div className={styles.subMetricIconBox} style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className={styles.subMetricValue} style={{ color: "#16A34A" }}>{deliveredTodayCount}</h3>
                <p className={styles.subMetricLabel}>Delivered Today</p>
              </div>
            </div>

            {/* 3. Pending Delivery Today */}
            <div className={styles.subMetricCard}>
              <div className={styles.subMetricIconBox} style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className={styles.subMetricValue} style={{ color: "#B45309" }}>{pendingTodayCount}</h3>
                <p className={styles.subMetricLabel}>Pending Delivery Today</p>
              </div>
            </div>

            {/* 4. Paused Subscribers */}
            <div className={styles.subMetricCard}>
              <div className={styles.subMetricIconBox} style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                <PauseCircle size={24} />
              </div>
              <div>
                <h3 className={styles.subMetricValue} style={{ color: "#DC2626" }}>{pausedCount}</h3>
                <p className={styles.subMetricLabel}>Paused Subscribers</p>
              </div>
            </div>

            {/* 5. Total Plan Subscribers */}
            <div className={styles.subMetricCard}>
              <div className={styles.subMetricIconBox} style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>
                <Truck size={24} />
              </div>
              <div>
                <h3 className={styles.subMetricValue}>{totalSubscribersCount}</h3>
                <p className={styles.subMetricLabel}>Total Subscribers</p>
              </div>
            </div>
          </div>

          {/* Sub-Tabs Nav & Filter Controls */}
          <div className={styles.subTabsNav}>
            <div className={styles.subTabsGroup}>
              <button
                type="button"
                className={`${styles.subTabBtn} ${subscribersTab === "today" ? styles.subTabBtnActive : ""}`}
                onClick={() => setSubscribersTab("today")}
              >
                <Utensils size={15} />
                <span>Today&apos;s Meal Deliveries</span>
                <span
                  className={styles.subBadge}
                  style={{
                    backgroundColor: subscribersTab === "today" ? "#FFEDD5" : "#E2E8F0",
                    color: subscribersTab === "today" ? "#C2410C" : "#475569",
                  }}
                >
                  {mealsToDeliverTodayCount}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.subTabBtn} ${subscribersTab === "paused" ? styles.subTabBtnActive : ""}`}
                onClick={() => setSubscribersTab("paused")}
              >
                <PauseCircle size={15} />
                <span>Paused Subscribers Window</span>
                <span
                  className={styles.subBadge}
                  style={{
                    backgroundColor: subscribersTab === "paused" ? "#FEE2E2" : "#E2E8F0",
                    color: subscribersTab === "paused" ? "#DC2626" : "#475569",
                  }}
                >
                  {pausedCount}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.subTabBtn} ${subscribersTab === "all" ? styles.subTabBtnActive : ""}`}
                onClick={() => setSubscribersTab("all")}
              >
                <ShieldCheck size={15} />
                <span>All Subscribers</span>
                <span
                  className={styles.subBadge}
                  style={{
                    backgroundColor: subscribersTab === "all" ? "#FFEDD5" : "#E2E8F0",
                    color: subscribersTab === "all" ? "#C2410C" : "#475569",
                  }}
                >
                  {totalSubscribersCount}
                </span>
              </button>
            </div>

            {/* Filters Group */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div className={styles.searchWrapper}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search subscriber, phone, address..."
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select
                value={subTierFilter}
                onChange={(e) => setSubTierFilter(e.target.value)}
                className={styles.filterSelect}
                aria-label="Filter by Tier"
              >
                <option value="ALL">All Tiers</option>
                <option value="BRONZE">Tier: Bronze</option>
                <option value="SILVER">Tier: Silver</option>
                <option value="GOLD">Tier: Gold</option>
              </select>

              {subscribersTab === "today" && (
                <select
                  value={subDeliveryFilter}
                  onChange={(e) => setSubDeliveryFilter(e.target.value as any)}
                  className={styles.filterSelect}
                  aria-label="Filter by Delivery Status"
                >
                  <option value="ALL">Status: All</option>
                  <option value="PENDING">Pending Delivery ({pendingTodayCount})</option>
                  <option value="DELIVERED">Delivered Today ({deliveredTodayCount})</option>
                </select>
              )}
            </div>
          </div>

          {/* Informative Header Notices */}
          {subscribersTab === "today" && (
            <div style={{ fontSize: "0.86rem", color: "#64748B", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} color="#EA580C" />
              <span>
                Showing active meal subscriptions scheduled for today ({new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}). Paused subscribers are strictly excluded from this preparation roster.
              </span>
            </div>
          )}

          {subscribersTab === "paused" && (
            <div className={styles.pausedWindowBanner}>
              <PauseCircle size={24} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.98rem", fontWeight: 800 }}>
                  Dedicated Paused Subscribers Window
                </h4>
                <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.5 }}>
                  These subscribers have frozen their meal subscriptions. Deliveries are stopped, and they are <strong>excluded from today&apos;s meal preparation and delivery count</strong>. The days they pause are automatically added to extend their active subscription validity.
                </p>
              </div>
            </div>
          )}

          {/* Subscribers List Cards */}
          <div className={styles.subListContainer}>
            {loadingSubs ? (
              <div style={{ textAlign: "center", padding: "64px 20px", color: "#64748B" }}>
                <Loader2 size={32} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Loading meal subscribers roster...</p>
              </div>
            ) : displayedSubscribers.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "18px",
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "1.5px dashed #CBD5E1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#FFF7ED",
                    color: "#EA580C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Utensils size={26} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0F172A" }}>
                  {subscribersTab === "today"
                    ? "No Meals to Deliver Today"
                    : subscribersTab === "paused"
                    ? "No Paused Subscribers"
                    : "No Subscribers Found"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748B", maxWidth: "420px" }}>
                  {subscribersTab === "today"
                    ? "All scheduled meal deliveries for today have either been marked delivered or no active plans are running today."
                    : subscribersTab === "paused"
                    ? "None of your subscribers are currently on pause. All subscribers are on active meal schedules."
                    : "No subscribers match your search or filter criteria."}
                </p>
              </div>
            ) : (
              displayedSubscribers.map((sub) => {
                const tierColors = getTierColors(sub.tier || "Bronze");
                const todayRecord = sub.dailyDeliveries?.find((d: any) => d.date === todayDateStr);
                const isDeliveredToday = todayRecord?.status === "DELIVERED";
                const initialLetter = (sub.customerName || "Customer").charAt(0).toUpperCase();

                return (
                  <div key={sub.id} className={styles.subCard}>
                    {/* Card Header */}
                    <div className={styles.subCardHeader}>
                      <div className={styles.subCustomerInfo}>
                        <div className={styles.subAvatar}>{initialLetter}</div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <h3 className={styles.subCustomerName}>{sub.customerName || "Subscriber"}</h3>
                            <span
                              className={styles.subPlanPill}
                              style={{ backgroundColor: tierColors.tierBg, color: tierColors.tierColor }}
                            >
                              🍱 {sub.planName} ({sub.tier || "Bronze"})
                            </span>
                            {sub.isPaused ? (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#FEF2F2",
                                  color: "#DC2626",
                                  border: "1px solid #FECACA",
                                }}
                              >
                                ⏸️ Currently Paused
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#DCFCE7",
                                  color: "#15803D",
                                  border: "1px solid #BBF7D0",
                                }}
                              >
                                ✅ Active Delivery
                              </span>
                            )}
                          </div>

                          <div className={styles.subCustomerMeta}>
                            {sub.customerPhone && (
                              <a href={`tel:${sub.customerPhone}`} className={styles.subContactLink}>
                                <Phone size={13} />
                                <span>{sub.customerPhone}</span>
                              </a>
                            )}
                            {sub.customerEmail && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Mail size={13} color="#94A3B8" />
                                <span>{sub.customerEmail}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 600 }}>Billing Cycle:</span>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                          {sub.cycle || "Weekly"} (₹{(sub.pricePaid || 0).toLocaleString("en-IN")})
                        </div>
                      </div>
                    </div>

                    {/* Subscriber Details Row */}
                    <div className={styles.subDetailsRow}>
                      {/* Delivery Address */}
                      <div className={styles.subDetailBlock} style={{ gridColumn: "span 2" }}>
                        <span className={styles.subDetailLabel}>Delivery Address</span>
                        <span className={styles.subDetailValue}>
                          <MapPin size={15} color="#EA580C" style={{ flexShrink: 0 }} />
                          <span>{sub.deliveryAddress || "Address provided at checkout"}</span>
                        </span>
                      </div>

                      {/* Meal Timings */}
                      <div className={styles.subDetailBlock}>
                        <span className={styles.subDetailLabel}>Meal Timings & Slot</span>
                        <span className={styles.subDetailValue}>
                          <Clock size={15} color="#EA580C" style={{ flexShrink: 0 }} />
                          <span>
                            {sub.mealTimings && sub.mealTimings.length > 0
                              ? sub.mealTimings.join(", ")
                              : "Standard Delivery Window"}
                          </span>
                        </span>
                      </div>

                      {/* Subscription Validity (Showing Added Pause Days) */}
                      <div className={styles.subDetailBlock}>
                        <span className={styles.subDetailLabel}>Active Subscription Validity</span>
                        <span className={styles.subDetailValue}>
                          <Calendar size={15} color="#EA580C" style={{ flexShrink: 0 }} />
                          <span>
                            {formatSubDate(sub.startDate)} → {formatSubDate(sub.endDate)}
                          </span>
                        </span>
                        {(sub.usedPauseDays || 0) > 0 && (
                          <span style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700, marginTop: "2px" }}>
                            ✨ +{sub.usedPauseDays} pause days added to plan expiry
                          </span>
                        )}
                      </div>

                      {/* Paused Details If Active Pause */}
                      {sub.isPaused && (
                        <div className={styles.subDetailBlock} style={{ gridColumn: "span 2", background: "#FEF2F2", padding: "8px 12px", borderRadius: "8px", border: "1px solid #FECACA" }}>
                          <span className={styles.subDetailLabel} style={{ color: "#DC2626" }}>Pause Window Details</span>
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "2px", fontSize: "0.85rem", color: "#991B1B" }}>
                            <span><strong>Paused On:</strong> {formatSubDate(sub.pausedAt)}</span>
                            <span><strong>Resumes On:</strong> {formatSubDate(sub.pauseEndDate)}</span>
                            <span><strong>Total Paused:</strong> {sub.usedPauseDays || 0} days</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Action: Today's Delivery Marking (For Today Tab) */}
                    {subscribersTab === "today" && (
                      <div className={styles.subFooterActions}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isDeliveredToday ? (
                            <span
                              style={{
                                backgroundColor: "#DCFCE7",
                                color: "#15803D",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <CheckCircle2 size={16} />
                              <span>
                                Delivered Today{" "}
                                {todayRecord?.markedAt
                                  ? `(${new Date(todayRecord.markedAt).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })})`
                                  : ""}
                              </span>
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: "#FEF3C7",
                                color: "#B45309",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Clock size={16} />
                              <span>Pending Delivery Today</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleDelivery(sub)}
                          className={`${styles.deliveryToggleBtn} ${
                            isDeliveredToday ? styles.deliveryBtnPending : styles.deliveryBtnDelivered
                          }`}
                          title={isDeliveredToday ? "Mark as Pending Delivery" : "Mark as Delivered Today"}
                        >
                          {isDeliveredToday ? (
                            <>
                              <Clock size={15} />
                              <span>Mark as Not Delivered</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={15} />
                              <span>Mark as Delivered Today</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </main>
      </div>

      {/* In-App Rejection Confirmation Modal */}
      <RejectOrderModal
        isOpen={Boolean(orderToReject)}
        orderId={orderToReject?.orderId}
        customerName={orderToReject?.customer}
        itemsSummary={orderToReject?.items}
        totalAmount={orderToReject?.total}
        isLoading={isRejecting}
        onClose={() => {
          if (!isRejecting) setOrderToReject(null);
        }}
        onConfirm={handleConfirmRejection}
      />

      {/* In-App Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.text}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SellerOrders;

