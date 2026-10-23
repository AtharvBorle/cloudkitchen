"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  Bell,
  ChevronRight,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Bike,
  Utensils,
  PauseCircle,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import RejectOrderModal from "../RejectOrderModal";
import ToastNotification from "../ToastNotification";
import PaginationControls from "../../common/PaginationControls";
import DeliveryOtpModal from "../../subscription/DeliveryOtpModal";
import { getRemainingSeconds } from "../SellerOrders";
import { fetchApi } from "@/lib/fetch-api";
import {
  markSubscriberMealDeliveryStatus,
  MealSubscriber,
  MealSlotDeliveryRecord,
  getTierColors,
} from "@/lib/meal-subscriptions";
import {
  PREDEFINED_MEAL_SLOTS,
  normalizeMealSlotId,
  normalizeMealSlotIds,
  getMealSlotDetails,
  MealSlotDefinition,
} from "@/lib/meal-slots";
import styles from "./ResponsiveSellerOrders.module.css";

export type OrderFilterTab = "New" | "Preparing" | "Out" | "Done" | "Cancelled" | "All";

export interface ResponsiveOrderItem {
  id: string;
  orderNumber: string;
  timeAgo: string;
  customerName: string;
  itemsText: string;
  priorOrdersCount: number;
  totalAmount: string;
  rating: number;
  deliveredCount: number;
  cancelledCount: number;
  status: "New" | "Preparing" | "Out" | "Done" | "Cancelled";
  createdAt?: string;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
}

import { useSellerProfile, isGenericFallbackName } from "@/hooks/useSellerProfile";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";

export interface ResponsiveSellerOrdersProps {
  orders?: ResponsiveOrderItem[];
  ownerName?: string;
  hasUnreadNotifications?: boolean;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => Promise<void> | void;
  onOrderClick?: (order: ResponsiveOrderItem) => void;
  onNotificationClick?: () => void;
  onSyncDevices?: () => void;
}

const EMPTY_ORDERS: ResponsiveOrderItem[] = [];

export const ResponsiveSellerOrders: React.FC<ResponsiveSellerOrdersProps> = ({
  orders = EMPTY_ORDERS,
  ownerName,
  hasUnreadNotifications,
  onAccept,
  onReject,
  onOrderClick,
  onNotificationClick,
  onSyncDevices,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seller = useSellerProfile();
  const { unreadCount } = useSellerNotifications();
  const isNotificationActive =
    hasUnreadNotifications !== undefined ? hasUnreadNotifications : unreadCount > 0;
  const effectiveOwnerName =
    ownerName && !isGenericFallbackName(ownerName)
      ? ownerName
      : (!isGenericFallbackName(seller.ownerName) ? seller.ownerName : "");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<OrderFilterTab>("New");
  const [ordersList, setOrdersList] = useState<ResponsiveOrderItem[]>(orders);
  const [now, setNow] = useState(Date.now());
  const autoCancelledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // In-app rejection modal & toast state
  const [orderToReject, setOrderToReject] = useState<ResponsiveOrderItem | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (orders) {
      setOrdersList(orders);
    }
  }, [orders]);

  // Section toggle: Regular Orders vs Subscribers Meal (persisted across refresh via URL & sessionStorage)
  // NOTE: Subscribers Meal option commented out per request - not needed currently
  const sectionParam = searchParams?.get("section")?.toLowerCase();
  /*
  const initialSection: "orders" | "subscribers" =
    sectionParam === "subscribers" || sectionParam === "subscriber-meal"
      ? "subscribers"
      : "orders";
  */
  const initialSection: "orders" | "subscribers" = "orders";

  const [activeSection, setActiveSection] = useState<"orders" | "subscribers">(initialSection);
  const [subscribers, setSubscribers] = useState<MealSubscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [otpModalDelivery, setOtpModalDelivery] = useState<MealSlotDeliveryRecord | null>(null);

  const tabParam = searchParams?.get("subTab")?.toLowerCase();
  const initialSubTab: "today" | "paused" | "all" =
    tabParam === "paused" || tabParam === "all" ? (tabParam as "paused" | "all") : "today";

  const [subscribersTab, setSubscribersTab] = useState<"today" | "paused" | "all">(initialSubTab);
  const [subMealSlotFilter, setSubMealSlotFilter] = useState<string>("ALL");

  // Keep navigation section and sub-tab persistent across page reloads on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentSectionParam = searchParams?.get("section")?.toLowerCase();
    const currentSubTabParam = searchParams?.get("subTab")?.toLowerCase();

    // Subscribers Meal option commented out per request - defaulting to regular orders
    /*
    if (currentSectionParam === "subscribers" || currentSectionParam === "subscriber-meal") {
      setActiveSection("subscribers");
      sessionStorage.setItem("neo_seller_orders_active_section", "subscribers");
    } else if (currentSectionParam === "orders") {
      setActiveSection("orders");
      sessionStorage.setItem("neo_seller_orders_active_section", "orders");
    } else {
      const savedSection = sessionStorage.getItem("neo_seller_orders_active_section");
      if (savedSection === "subscribers") {
        setActiveSection("subscribers");
        const url = new URL(window.location.href);
        url.searchParams.set("section", "subscribers");
        window.history.replaceState(null, "", url.toString());
      }
    }
    */
    setActiveSection("orders");

    if (currentSubTabParam === "today" || currentSubTabParam === "paused" || currentSubTabParam === "all") {
      setSubscribersTab(currentSubTabParam as "today" | "paused" | "all");
      sessionStorage.setItem("neo_seller_orders_subscribers_tab", currentSubTabParam);
    } else {
      const savedTab = sessionStorage.getItem("neo_seller_orders_subscribers_tab");
      if (savedTab === "today" || savedTab === "paused" || savedTab === "all") {
        setSubscribersTab(savedTab as "today" | "paused" | "all");
      }
    }
  }, [searchParams]);

  // Update dynamic document title based on current active section
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title =
        activeSection === "subscribers"
          ? "Subscribers Meal Delivery | Neo Cloud Kitchen"
          : "Food & Service Orders | Neo Cloud Kitchen";
    }
  }, [activeSection]);

  const handleSectionChange = React.useCallback((section: "orders" | "subscribers") => {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("neo_seller_orders_active_section", section);
        const url = new URL(window.location.href);
        if (section === "subscribers") {
          url.searchParams.set("section", "subscribers");
        } else {
          url.searchParams.delete("section");
          url.searchParams.delete("subTab");
        }
        window.history.replaceState(null, "", url.toString());
      } catch (e) {
        console.error("Failed to update section in storage/URL:", e);
      }
    }
  }, []);

  const handleSubscribersTabChange = React.useCallback((tab: "today" | "paused" | "all") => {
    setSubscribersTab(tab);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("neo_seller_orders_subscribers_tab", tab);
        const url = new URL(window.location.href);
        url.searchParams.set("subTab", tab);
        window.history.replaceState(null, "", url.toString());
      } catch (e) {
        console.error("Failed to update subTab in storage/URL:", e);
      }
    }
  }, []);

  const todayDateStr = React.useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date());
      const getPart = (t: string) => parts.find((p) => p.type === t)?.value || "";
      return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }, []);

  const loadSubscribers = React.useCallback(async (isSilent = false) => {
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
      console.error("Failed to load seller subscribers on mobile:", err);
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
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "N/A";
    }
  };

  const getSubscriberSlots = React.useCallback((s: MealSubscriber): MealSlotDefinition[] => {
    if (s.mealSlots && s.mealSlots.length > 0) return s.mealSlots;
    if (s.slotIds && s.slotIds.length > 0) return s.slotIds.map((id) => getMealSlotDetails(id));
    const normalized = normalizeMealSlotIds(s.mealTimings || []);
    if (normalized.length > 0) return normalized.map((id) => getMealSlotDetails(id));
    return [getMealSlotDetails("lunch")];
  }, []);

  // Synchronized Slot Delivery Check across todayDeliveries (relational), mealSlots, and dailyDeliveries
  const isSubscriberSlotDelivered = React.useCallback((sub: MealSubscriber, slotId: string): boolean => {
    const normSlot = normalizeMealSlotId(slotId) || slotId;

    // 1. Check todayDeliveries (relational MealSubscriptionDelivery table)
    if (Array.isArray((sub as any).todayDeliveries)) {
      const td = (sub as any).todayDeliveries.find(
        (s: any) => normalizeMealSlotId(s.id) === normSlot
      );
      if (td && (td.isDelivered || td.todayStatus === "DELIVERED")) {
        return true;
      }
    }

    // 2. Check mealSlots
    if (Array.isArray(sub.mealSlots)) {
      const ms = sub.mealSlots.find(
        (s: any) => normalizeMealSlotId(s.id) === normSlot
      );
      if (ms && ((ms as any).isDelivered || (ms as any).todayStatus === "DELIVERED")) {
        return true;
      }
    }

    // 3. Check dailyDeliveries (legacy JSON records)
    if (Array.isArray(sub.dailyDeliveries)) {
      const isDel = sub.dailyDeliveries.some((d: any) => {
        const matchesDate = d.date === todayDateStr;
        const matchesSlot = normalizeMealSlotId(d.slotId) === normSlot || (!d.slotId && normSlot === "breakfast");
        return matchesDate && matchesSlot && d.status === "DELIVERED";
      });
      if (isDel) return true;
    }

    return false;
  }, [todayDateStr]);

  const isSubscriberDeliveredToday = React.useCallback((sub: MealSubscriber): boolean => {
    const slots = getSubscriberSlots(sub);
    if (slots.length === 0) return false;
    return slots.every((slot) => isSubscriberSlotDelivered(sub, slot.id));
  }, [getSubscriberSlots, isSubscriberSlotDelivered]);

  const pausedSubscribers = React.useMemo(() => {
    return subscribers.filter((s) => Boolean(s.isPaused));
  }, [subscribers]);

  const todayDeliverySubscribers = React.useMemo(() => {
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

  const slotCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    PREDEFINED_MEAL_SLOTS.forEach((slot) => { counts[slot.id] = 0; });
    todayDeliverySubscribers.forEach((s) => {
      const slots = getSubscriberSlots(s);
      counts.ALL += slots.length;
      slots.forEach((slot) => {
        counts[slot.id] = (counts[slot.id] || 0) + 1;
      });
    });
    return counts;
  }, [todayDeliverySubscribers, getSubscriberSlots]);

  const mealsToDeliverTodayCount = slotCounts.ALL || todayDeliverySubscribers.length;
  const deliveredTodayCount = React.useMemo(() => {
    return todayDeliverySubscribers.filter((s) => isSubscriberDeliveredToday(s)).length;
  }, [todayDeliverySubscribers, isSubscriberDeliveredToday]);
  const pendingTodayCount = Math.max(0, mealsToDeliverTodayCount - deliveredTodayCount);
  const pausedCount = pausedSubscribers.length;
  const totalSubscribersCount = subscribers.length;

  const displayedSubscribers = React.useMemo(() => {
    let list =
      subscribersTab === "today"
        ? todayDeliverySubscribers
        : subscribersTab === "paused"
        ? pausedSubscribers
        : subscribers;

    if (subscribersTab === "today" && subMealSlotFilter !== "ALL") {
      list = list.filter((s) => {
        const slots = getSubscriberSlots(s);
        return slots.some((slot) => slot.id === subMealSlotFilter);
      });
    }

    return list;
  }, [subscribersTab, todayDeliverySubscribers, pausedSubscribers, subscribers, subMealSlotFilter, getSubscriberSlots]);

  const handleToggleDelivery = async (sub: MealSubscriber, slotId?: string) => {
    const targetSlotId = slotId || (getSubscriberSlots(sub)[0]?.id || "breakfast");
    const isCurrentlyDelivered = isSubscriberSlotDelivered(sub, targetSlotId);

    // Once a meal is verified and delivered via OTP, it cannot be reverted to pending
    if (isCurrentlyDelivered) {
      setToast({
        type: "error",
        text: "This meal has already been delivered and verified via Customer OTP. It cannot be marked as pending again.",
      });
      return;
    }

    // Open OTP verification modal to confirm delivery
    const slotObj = getMealSlotDetails(targetSlotId);
    const record: MealSlotDeliveryRecord = {
      id: `del-${sub.id}-${targetSlotId}`,
      subscriptionId: sub.id,
      slotId: targetSlotId,
      slotName: slotObj.name,
      slotSubtitle: slotObj.subtitle,
      scheduledTime: slotObj.defaultTimeRange,
      sellerId: "",
      userId: (sub as any).userId || "",
      scheduledDate: todayDateStr,
      status: "PENDING",
      deliveredAt: null,
      markedBy: null,
      note: null,
      customerName: sub.customerName || "Subscriber",
      customerPhone: sub.customerPhone || "",
      customerEmail: sub.customerEmail || "",
      deliveryAddress: sub.deliveryAddress || "",
      planName: sub.planName || "Meal Plan",
      tier: sub.tier || "Bronze",
      subscription: {
        id: sub.id,
        tier: sub.tier || "Bronze",
        status: sub.status || "ACTIVE",
        deliveryAddress: sub.deliveryAddress || "",
        contactPhone: sub.customerPhone || "",
        user: {
          id: (sub as any).userId || "",
          name: sub.customerName || "Subscriber",
          phone: sub.customerPhone || "",
          email: sub.customerEmail || "",
        },
        plan: {
          id: sub.planId || "",
          name: sub.planName || "Meal Plan",
          tier: sub.tier || "Bronze",
        },
      },
    };
    setOtpModalDelivery(record);
  };

  const handleConfirmResponsiveOtpDelivery = async (otp: string, note?: string) => {
    if (!otpModalDelivery) return;
    const item = otpModalDelivery;
    try {
      await markSubscriberMealDeliveryStatus(
        item.subscriptionId,
        todayDateStr,
        "DELIVERED",
        note,
        item.slotId,
        otp
      );
      setToast({
        type: "success",
        text: `${item.slotName} marked as Delivered for ${item.customerName || "Customer"} (Verified via OTP)`,
      });
      setOtpModalDelivery(null);
      loadSubscribers(false);
    } catch (err: any) {
      throw err;
    }
  };

  // Auto-cancel expired New orders in background
  useEffect(() => {
    ordersList.forEach((order) => {
      if (order.status === "New") {
        const sec = getRemainingSeconds(order.createdAt, now);
        if (sec <= 0 && !autoCancelledRef.current.has(order.id)) {
          autoCancelledRef.current.add(order.id);
          if (onReject) {
            onReject(order.id);
          } else {
            fetchApi(`/api/seller/orders/${order.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "CANCELLED" }),
            }).catch(() => {});
          }
          setOrdersList((prev) =>
            prev.map((o) => (o.id === order.id ? { ...o, status: "Cancelled" as const } : o))
          );
        }
      }
    });
  }, [ordersList, now, onReject]);

  // Filter tab counts
  const newCount = ordersList.filter((o) => {
    if (o.status !== "New") return false;
    return getRemainingSeconds(o.createdAt, now) > 0;
  }).length;
  const preparingCount = ordersList.filter((o) => o.status === "Preparing").length;
  const outCount = ordersList.filter((o) => o.status === "Out").length;
  const doneCount = ordersList.filter((o) => o.status === "Done").length;
  const cancelledCount = ordersList.filter((o) => {
    let eff = o.status;
    if (eff === "New" && getRemainingSeconds(o.createdAt, now) <= 0) {
      eff = "Cancelled";
    }
    return eff === "Cancelled";
  }).length;

  const filteredOrders = ordersList.filter((order) => {
    let effStatus = order.status;
    if (effStatus === "New" && getRemainingSeconds(order.createdAt, now) <= 0) {
      effStatus = "Cancelled";
    }
    if (selectedTab === "All") return true;
    return effStatus === selectedTab;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | "All">(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab]);

  const paginatedOrders = React.useMemo(() => {
    if (pageSize === "All") return filteredOrders;
    const numSize = Number(pageSize) || 10;
    const startIndex = (currentPage - 1) * numSize;
    return filteredOrders.slice(startIndex, startIndex + numSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleCardClick = (order: ResponsiveOrderItem) => {
    if (onOrderClick) {
      onOrderClick(order);
    } else {
      router.push(`/seller/orders/details?orderId=${encodeURIComponent(order.id)}&from=orders`);
    }
  };

  const handleAcceptOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAccept) {
      onAccept(orderId);
    } else {
      setOrdersList((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: "Preparing" as const } : ord))
      );
    }
  };

  const handleOpenReject = (order: ResponsiveOrderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderToReject(order);
  };

  const handleConfirmRejection = async () => {
    if (!orderToReject) return;
    try {
      setIsRejecting(true);
      if (onReject) {
        await onReject(orderToReject.id);
      } else {
        setOrdersList((prev) =>
          prev.map((ord) => (ord.id === orderToReject.id ? { ...ord, status: "Cancelled" as const } : ord))
        );
      }
      setToast({
        type: "success",
        text: `Order ${orderToReject.orderNumber} rejected successfully.`,
      });
      setOrderToReject(null);
    } catch (err) {
      console.error("Failed to reject order:", err);
      setToast({
        type: "error",
        text: "Failed to reject order. Please try again.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="orders"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      {/* Main Responsive Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header */}
        <header className={styles.topBar}>
          <div className={styles.headerLeftGroup}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavMenuOpen(true);
              }}
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <Menu size={24} />
            </button>
            <Link href="/seller/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          <h1 className={styles.pageTitle}>{activeSection === "subscribers" ? "Subscribers Meal" : "Orders"}</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              if (onNotificationClick) {
                onNotificationClick();
              } else {
                router.push("/seller/notifications");
              }
            }}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
            {isNotificationActive && <span className={styles.notificationDot} />}
          </button>
        </header>

        {/* Section Switcher: Food Orders vs Subscribers Meal */}
        <div className={styles.sectionSwitchContainer}>
          <button
            type="button"
            className={`${styles.sectionSwitchBtn} ${activeSection === "orders" ? styles.sectionSwitchBtnActive : ""}`}
            onClick={() => handleSectionChange("orders")}
          >
            <Bike size={16} />
            <span>Food Orders</span>
          </button>
          {/* NOTE: Subscribers Meal option commented out per request - not needed currently
          <button
            type="button"
            className={`${styles.sectionSwitchBtn} ${activeSection === "subscribers" ? styles.sectionSwitchBtnActive : ""}`}
            onClick={() => handleSectionChange("subscribers")}
          >
            <Utensils size={16} />
            <span>Subscribers Meal</span>
          </button>
          */}
        </div>

        {activeSection === "orders" ? (
          <>
            {/* Status Filter Tabs (Horizontal scrolling capsule pills) */}
            <div className={styles.filterTabsWrapper} role="tablist" aria-label="Order Status Filters">
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "New"}
            className={`${styles.filterPill} ${selectedTab === "New" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("New")}
          >
            <span>New</span>
            <span className={styles.pillBadge}>{newCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "Preparing"}
            className={`${styles.filterPill} ${selectedTab === "Preparing" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("Preparing")}
          >
            <span>Preparing</span>
            <span className={styles.pillBadge}>{preparingCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "Out"}
            className={`${styles.filterPill} ${selectedTab === "Out" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("Out")}
          >
            <span>Out</span>
            <span className={styles.pillBadge}>{outCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "Done"}
            className={`${styles.filterPill} ${selectedTab === "Done" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("Done")}
          >
            <span>Done</span>
            <span className={styles.pillBadge}>{doneCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === "Cancelled"}
            className={`${styles.filterPill} ${selectedTab === "Cancelled" ? styles.filterPillActive : ""}`}
            onClick={() => setSelectedTab("Cancelled")}
          >
            <span>Cancelled</span>
            <span className={styles.pillBadge}>{cancelledCount}</span>
          </button>
        </div>

        {/* Orders Content Area */}
        <main className={styles.contentArea}>
          {filteredOrders.length > 0 ? (
            <>
              <div className={styles.ordersList}>
                {paginatedOrders.map((order) => (
                  <article
                    key={order.id}
                    className={styles.orderCard}
                    onClick={() => handleCardClick(order)}
                  >
                    {/* Top Meta Line: #1234 • ⏱️ 04:32 > */}
                    <div className={styles.cardTopRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={styles.orderMetaText}>{order.orderNumber}</span>
                        {order.status === "New" ? (
                          (() => {
                            const sec = getRemainingSeconds(order.createdAt, now);
                            const mm = String(Math.floor(sec / 60)).padStart(2, "0");
                            const ss = String(sec % 60).padStart(2, "0");
                            const isUrgent = sec <= 60;
                            return sec > 0 ? (
                              <span
                                className={`${styles.timerBadge} ${isUrgent ? styles.timerBadgeUrgent : ""}`}
                                title={`Accept order within ${mm}:${ss}`}
                              >
                                <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                                {mm}:{ss}
                              </span>
                            ) : (
                              (() => {
                                const isUserCancelled =
                                  order.cancelledBy === "USER" ||
                                  (Boolean(order.cancellationReason) && /cancelled by (customer|user|you)/i.test(order.cancellationReason || ""));
                                return (
                                  <span className={styles.cancelledBadge}>
                                    {isUserCancelled ? "Cancelled by User" : "Cancelled"}
                                  </span>
                                );
                              })()
                            );
                          })()
                        ) : (
                          <span className={styles.orderMetaText}>• {order.timeAgo}</span>
                        )}
                      </div>
                      <ChevronRight size={18} className={styles.chevronIcon} />
                    </div>

                    {/* Customer Info & Items */}
                    <div className={styles.customerSection}>
                      <h2 className={styles.customerName}>{order.customerName}</h2>
                      <p className={styles.itemsLine}>{order.itemsText}</p>
                    </div>

                    {/* Total Amount */}
                    <div className={styles.secondaryInfoRow}>
                      <span className={styles.totalAmountText}>{order.totalAmount}</span>
                    </div>

                    {/* Customer Status: Delivered or Cancelled (Click to view Reliability Modal) */}
                    <div
                      className={styles.customerStatsRow}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/seller/res/orders/reliability");
                      }}
                      title="View Customer Reliability Score"
                      style={{ cursor: "pointer" }}
                    >
                      {order.status === "Cancelled" || (order.status === "New" && getRemainingSeconds(order.createdAt, now) <= 0) ? (
                        (() => {
                          const isUserCancelled =
                            order.cancelledBy === "USER" ||
                            (Boolean(order.cancellationReason) && /cancelled by (customer|user|you)/i.test(order.cancellationReason || ""));
                          return (
                            <div className={styles.cancelledStat}>
                              <span className={styles.statDotRed} />
                              <span>{isUserCancelled ? "Cancelled by User" : "Cancelled"}</span>
                              {isUserCancelled && order.cancellationReason && (
                                <span style={{ marginLeft: "6px", fontSize: "0.74rem", color: "#B91C1C", fontWeight: 500 }}>
                                  ({order.cancellationReason})
                                </span>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className={styles.deliveredStat}>
                          <span className={styles.statDotGreen} />
                          <span>Delivered</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {order.status === "New" && getRemainingSeconds(order.createdAt, now) > 0 && (
                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          className={styles.acceptButton}
                          onClick={(e) => handleAcceptOrder(order.id, e)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className={styles.rejectButton}
                          onClick={(e) => handleOpenReject(order, e)}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {order.status === "Preparing" && (
                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          className={styles.acceptButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrdersList((prev) =>
                              prev.map((o) => (o.id === order.id ? { ...o, status: "Out" as const } : o))
                            );
                          }}
                        >
                          Ready for Delivery
                        </button>
                      </div>
                    )}

                    {order.status === "Out" && (
                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          className={styles.acceptButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrdersList((prev) =>
                              prev.map((o) => (o.id === order.id ? { ...o, status: "Done" as const } : o))
                            );
                          }}
                        >
                          Mark Delivered
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemName="orders"
                pageSizeOptions={[10, 20, 25, 50, "All"]}
              />
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <PackageCheck size={26} />
              </div>
              <h3 className={styles.emptyTitle}>No {selectedTab} Orders</h3>
              <p className={styles.emptySubtitle}>
                There are currently no orders in {selectedTab.toLowerCase()} status.
              </p>
            </div>
          )}
        </main>
      </>
    ) : (
      <main className={styles.contentArea} style={{ paddingBottom: "32px" }}>
        {/* Metric Cards Grid */}
        <div className={styles.subMetricsGridMobile}>
          <div className={styles.subMetricCardMobile}>
            <Utensils size={20} color="#EA580C" />
            <div>
              <h4 className={styles.subMetricValMobile}>{mealsToDeliverTodayCount}</h4>
              <p className={styles.subMetricLblMobile}>Meals Today</p>
            </div>
          </div>

          <div className={styles.subMetricCardMobile}>
            <CheckCircle2 size={20} color="#16A34A" />
            <div>
              <h4 className={styles.subMetricValMobile} style={{ color: "#16A34A" }}>{deliveredTodayCount}</h4>
              <p className={styles.subMetricLblMobile}>Delivered</p>
            </div>
          </div>

          <div className={styles.subMetricCardMobile}>
            <Clock size={20} color="#B45309" />
            <div>
              <h4 className={styles.subMetricValMobile} style={{ color: "#B45309" }}>{pendingTodayCount}</h4>
              <p className={styles.subMetricLblMobile}>Pending Today</p>
            </div>
          </div>

          <div className={styles.subMetricCardMobile}>
            <PauseCircle size={20} color="#DC2626" />
            <div>
              <h4 className={styles.subMetricValMobile} style={{ color: "#DC2626" }}>{pausedCount}</h4>
              <p className={styles.subMetricLblMobile}>Paused Window</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs for Subscribers */}
        <div className={styles.subTabsNavMobile}>
          <button
            type="button"
            className={`${styles.subTabPillMobile} ${subscribersTab === "today" ? styles.subTabPillMobileActive : ""}`}
            onClick={() => handleSubscribersTabChange("today")}
          >
            <Utensils size={14} />
            <span>Today&apos;s Deliveries</span>
            <span className={styles.pillBadge}>{mealsToDeliverTodayCount}</span>
          </button>

          <button
            type="button"
            className={`${styles.subTabPillMobile} ${subscribersTab === "paused" ? styles.subTabPillMobileActive : ""}`}
            onClick={() => handleSubscribersTabChange("paused")}
          >
            <PauseCircle size={14} />
            <span>Paused Window</span>
            <span className={styles.pillBadge} style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>{pausedCount}</span>
          </button>

          <button
            type="button"
            className={`${styles.subTabPillMobile} ${subscribersTab === "all" ? styles.subTabPillMobileActive : ""}`}
            onClick={() => handleSubscribersTabChange("all")}
          >
            <ShieldCheck size={14} />
            <span>All Subscribers</span>
            <span className={styles.pillBadge}>{totalSubscribersCount}</span>
          </button>
        </div>

        {/* 7 Predefined Meal Slot Filter Tabs on Mobile */}
        {subscribersTab === "today" && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              padding: "4px 0 10px 0",
              scrollbarWidth: "none",
            }}
          >
            <button
              type="button"
              onClick={() => setSubMealSlotFilter("ALL")}
              style={{
                padding: "5px 12px",
                borderRadius: "9999px",
                fontSize: "0.78rem",
                fontWeight: subMealSlotFilter === "ALL" ? 800 : 600,
                border: subMealSlotFilter === "ALL" ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                backgroundColor: subMealSlotFilter === "ALL" ? "#FFF7ED" : "#FFFFFF",
                color: subMealSlotFilter === "ALL" ? "#C2410C" : "#475569",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span>All Slots</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  backgroundColor: subMealSlotFilter === "ALL" ? "#FFEDD5" : "#F1F5F9",
                  color: subMealSlotFilter === "ALL" ? "#C2410C" : "#64748B",
                  fontWeight: 700,
                }}
              >
                {slotCounts.ALL || 0}
              </span>
            </button>
            {PREDEFINED_MEAL_SLOTS.map((slot) => {
              const isSelected = subMealSlotFilter === slot.id;
              const count = slotCounts[slot.id] || 0;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSubMealSlotFilter(slot.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "9999px",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 800 : 600,
                    border: isSelected ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                    backgroundColor: isSelected ? "#FFF7ED" : "#FFFFFF",
                    color: isSelected ? "#C2410C" : "#475569",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span>{slot.name}</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                      backgroundColor: isSelected ? "#FFEDD5" : "#F1F5F9",
                      color: isSelected ? "#C2410C" : "#64748B",
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* If Paused Tab, Info Banner */}
        {subscribersTab === "paused" && (
          <div className={styles.pausedWindowBannerMobile}>
            <PauseCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h5 style={{ margin: "0 0 2px 0", fontSize: "0.85rem", fontWeight: 800 }}>Dedicated Paused Window</h5>
              <p style={{ margin: 0, fontSize: "0.76rem", lineHeight: 1.4 }}>
                Paused subscribers are <strong>strictly excluded from today&apos;s delivery list</strong>. Their paused days are automatically added to active subscription days.
              </p>
            </div>
          </div>
        )}

        {/* Subscriber Cards List */}
        {loadingSubs ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "#64748B" }}>
            <Loader2 size={28} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 8px" }} />
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>Loading subscribers...</p>
          </div>
        ) : displayedSubscribers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Utensils size={24} />
            </div>
            <h3 className={styles.emptyTitle}>
              {subscribersTab === "today"
                ? "No Meals to Deliver Today"
                : subscribersTab === "paused"
                ? "No Paused Subscribers"
                : "No Subscribers Found"}
            </h3>
            <p className={styles.emptySubtitle}>
              {subscribersTab === "today"
                ? "All deliveries for today are complete or no active subscriptions scheduled."
                : subscribersTab === "paused"
                ? "None of your subscribers are currently on pause."
                : "No meal subscribers registered."}
            </p>
          </div>
        ) : (
          <div>
            {displayedSubscribers.map((sub) => {
              const tierColors = getTierColors(sub.tier || "Bronze");
              const initialLetter = (sub.customerName || "Customer").charAt(0).toUpperCase();
              const subSlots = getSubscriberSlots(sub);

              return (
                <article key={sub.id} className={styles.subCardMobile}>
                  <div className={styles.subCardHeaderMobile}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className={styles.subAvatarMobile}>{initialLetter}</div>
                      <div>
                        <h4 className={styles.subNameMobile}>{sub.customerName || "Subscriber"}</h4>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "2px" }}>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "6px",
                              backgroundColor: tierColors.tierBg,
                              color: tierColors.tierColor,
                            }}
                          >
                            {sub.planName} ({sub.tier || "Bronze"})
                          </span>
                          {sub.isPaused ? (
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#DC2626", backgroundColor: "#FEF2F2", padding: "2px 6px", borderRadius: "6px" }}>
                              ⏸️ Paused
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#16A34A", backgroundColor: "#DCFCE7", padding: "2px 6px", borderRadius: "6px" }}>
                              ✅ Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#0F172A" }}>
                        ₹{sub.pricePaid || 0}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748B" }}>{sub.cycle || "Weekly"}</div>
                    </div>
                  </div>

                  <div className={styles.subDetailsBoxMobile}>
                    {sub.customerPhone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Phone size={13} color="#64748B" />
                        <a href={`tel:${sub.customerPhone}`} style={{ color: "#EA580C", fontWeight: 600, textDecoration: "none" }}>
                          {sub.customerPhone}
                        </a>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <MapPin size={13} color="#EA580C" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ color: "#334155" }}>{sub.deliveryAddress || "Address provided at checkout"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, marginBottom: "4px" }}>
                        Meal Slots:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {subSlots.map((slot) => (
                          <span
                            key={slot.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              backgroundColor: "#EFF6FF",
                              color: "#1D4ED8",
                              border: "1px solid #BFDBFE",
                            }}
                          >
                            <Clock size={10} />
                            {slot.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={13} color="#64748B" />
                      <span style={{ color: "#334155" }}>
                        Valid: {formatSubDate(sub.startDate)} → {formatSubDate(sub.endDate)}
                      </span>
                    </div>
                    {(sub.usedPauseDays || 0) > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#16A34A", fontWeight: 700, fontSize: "0.75rem" }}>
                        <Sparkles size={12} />
                        <span>+{sub.usedPauseDays} pause days added to validity</span>
                      </div>
                    )}
                    {sub.isPaused && (
                      <div style={{ marginTop: "4px", padding: "6px 8px", backgroundColor: "#FEF2F2", borderRadius: "6px", color: "#991B1B", fontSize: "0.75rem" }}>
                        <div><strong>Paused:</strong> {formatSubDate(sub.pausedAt)}</div>
                        <div><strong>Resumes:</strong> {formatSubDate(sub.pauseEndDate)}</div>
                      </div>
                    )}
                  </div>

                  {/* Slot-level Delivery Action Buttons (Only for today's deliveries tab) */}
                  {subscribersTab === "today" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                      {subSlots.map((slot) => {
                        const isSlotDelivered = isSubscriberSlotDelivered(sub, slot.id);
                        return isSlotDelivered ? (
                          <div
                            key={slot.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: "#F0FDF4",
                              color: "#15803D",
                              border: "1px solid #BBF7D0",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={15} color="#15803D" />
                            <span>{slot.name}: Delivered (OTP Verified)</span>
                          </div>
                        ) : (
                          <button
                            key={slot.id}
                            type="button"
                            className={styles.deliveryActionBtnMobile}
                            style={{
                              backgroundColor: "#EA580C",
                              color: "#FFFFFF",
                              border: "none",
                              padding: "8px 12px",
                              fontSize: "0.8rem",
                            }}
                            onClick={() => handleToggleDelivery(sub, slot.id)}
                          >
                            <PackageCheck size={15} />
                            <span>{slot.name}: Mark Delivered</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    )}
  </div>

      {/* In-App Rejection Confirmation Modal */}
      <RejectOrderModal
        isOpen={Boolean(orderToReject)}
        orderId={orderToReject?.orderNumber}
        customerName={orderToReject?.customerName}
        itemsSummary={orderToReject?.itemsText}
        totalAmount={orderToReject?.totalAmount}
        isLoading={isRejecting}
        onClose={() => {
          if (!isRejecting) setOrderToReject(null);
        }}
        onConfirm={handleConfirmRejection}
      />

      {/* Customer Delivery OTP Verification Modal */}
      <DeliveryOtpModal
        isOpen={Boolean(otpModalDelivery)}
        onClose={() => setOtpModalDelivery(null)}
        onConfirm={handleConfirmResponsiveOtpDelivery}
        delivery={otpModalDelivery}
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

export default ResponsiveSellerOrders;
