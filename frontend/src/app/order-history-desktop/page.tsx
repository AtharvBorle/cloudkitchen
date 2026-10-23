"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, OrderItemData } from "@/components/order-history-desktop/order-list";
import { ReorderModal, ReorderModalType, ReorderItemInfo, UnavailableAddonInfo } from "@/components/order-history-desktop/reorder-modal";
import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { useCart, CartItem } from "@/context/CartContext";
import { Footer } from "@/components/explore-desktop/footer";
import { RotateCcw, Filter } from "lucide-react";

import styles from "./OrderHistoryPage.module.css";

import { useRouter } from "next/navigation";


export default function OrderHistoryDesktopPage() {
  const router = useRouter();
  const { cartItems, addMultipleToCart, addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("All Time");
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [pendingOrderIdForReorder, setPendingOrderIdForReorder] = useState<string | null>(null);

  // Modal State for Alerts and Confirmation Popups
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ReorderModalType;
    sellerName?: string;
    sellerId?: string;
    currentCartSellerName?: string;
    availableItems?: ReorderItemInfo[];
    unavailableItems?: ReorderItemInfo[];
    unavailableAddons?: UnavailableAddonInfo[];
    rawAvailableItems?: CartItem[];
    errorMessage?: string;
  }>({
    isOpen: false,
    type: "ERROR",
  });

  const loadOrders = async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const res = await fetchApi("/api/user/orders");
      if (res.ok) {
        const data = await res.json();
        const list = data.data || data || [];
        if (Array.isArray(list)) {
          setLiveOrders(list);
        }
      }
    } catch (err) {
      console.error("Failed to load live orders for history:", err);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);
  }, []);

  // Real-time SSE stream replaces auto-polling
  useRealtimeStream({
    url: "/api/user/orders/stream",
    onOrder: () => {
      loadOrders(false);
    },
  });

  const formattedOrders: (OrderItemData & { rawDate?: Date })[] = useMemo(() => {
    const rawList = liveOrders;

    return rawList.map((o: any) => {
      let parsedItems: any[] = [];
      let itemsDesc = "";
      try {
        const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        if (Array.isArray(parsed)) {
          parsedItems = parsed;
          itemsDesc = parsed.map((i: any) => `${i.quantity || 1}x ${i.name || i.title || "Item"}`).join(", ");
        }
      } catch (e) {
        itemsDesc = "Order Items";
      }

      const dateField = o.createdAt || o.orderDate || o.date || o.created_at || o.updatedAt;
      const rawDate = dateField ? new Date(dateField) : new Date();
      const validDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;

      const dateStr = validDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      let statusVal: "DELIVERED" | "CANCELLED" | "IN_PROGRESS" = "IN_PROGRESS";
      const s = (o.status || "").toUpperCase();
      if (s === "DELIVERED") statusVal = "DELIVERED";
      else if (s === "CANCELLED" || s === "REJECTED") statusVal = "CANCELLED";

      return {
        id: o.id || `ORD-${Math.random()}`,
        restaurantName: o.seller?.businessName || o.seller?.user?.name || o.restaurantName || "Neo Cloud Kitchen",
        orderNumber: `Order #${(o.id || "").slice(0, 8).toUpperCase()}`,
        orderDate: dateStr,
        rawDate: validDate,
        status: statusVal,
        itemsOrdered: itemsDesc || "Delicious Meals",
        totalAmount: o.totalAmount || 0,
        deliveryAddress: o.deliveryAddress ? `Delivered to ${o.deliveryAddress.split(" | Loc:")[0]}` : "Pickup",
        hasViewDetails: true,
        rawItems: parsedItems,
        sellerId: o.sellerId || o.seller?.id || "k-1",
        imageUrl: o.imageUrl || o.image,
      };
    });
  }, [liveOrders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();

    // Start of calendar week (Sunday)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0).getTime();

    // Start of calendar month (1st of this month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();

    // Start of calendar year (Jan 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();

    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now.getTime() - 90 * 24 * 60 * 60 * 1000;

    const rangeKey = (selectedDateRange || "All Time").trim().toLowerCase();

    return formattedOrders.filter((order) => {
      // 1. Status Filter
      if (activeTab === "delivered" && order.status !== "DELIVERED") return false;
      if (activeTab === "cancelled" && order.status !== "CANCELLED") return false;

      // 2. Date Range Filter
      if (rangeKey === "all time" || rangeKey === "all") {
        return true;
      }

      if (!order.rawDate || isNaN(order.rawDate.getTime())) {
        return true;
      }

      const orderTime = order.rawDate.getTime();

      // Today / Day wise
      if (rangeKey === "today" || rangeKey.includes("day wise") || rangeKey === "daily") {
        return orderTime >= startOfToday && orderTime <= endOfToday;
      }

      // Yesterday
      if (rangeKey === "yesterday") {
        return orderTime >= startOfYesterday && orderTime <= endOfYesterday;
      }

      // This Week / Week wise (Current calendar week)
      if (rangeKey === "this week" || rangeKey.includes("week wise") || rangeKey === "weekly") {
        return orderTime >= startOfWeek && orderTime <= endOfToday;
      }

      // Last 7 Days
      if (rangeKey === "last 7 days") {
        return orderTime >= sevenDaysAgo && orderTime <= now.getTime() + 60000;
      }

      // This Month / Month wise (Current calendar month)
      if (rangeKey === "this month" || rangeKey.includes("month wise") || rangeKey === "monthly") {
        return orderTime >= startOfMonth && orderTime <= endOfToday;
      }

      // Last 30 Days
      if (rangeKey === "last 30 days") {
        return orderTime >= thirtyDaysAgo && orderTime <= now.getTime() + 60000;
      }

      // Last 3 Months
      if (rangeKey === "last 3 months") {
        return orderTime >= ninetyDaysAgo && orderTime <= now.getTime() + 60000;
      }

      // This Year / Year wise
      if (rangeKey === "this year" || rangeKey.includes("year wise") || rangeKey === "yearly") {
        return orderTime >= startOfYear && orderTime <= endOfToday;
      }

      return true;
    });
  }, [formattedOrders, activeTab, selectedDateRange]);

  const isFilterActive = selectedDateRange !== "All Time" || activeTab !== "all";

  const handleViewDetails = (orderId: string) => {
    router.push(`/order-confirmation?orderId=${orderId}`);
  };

  const handleReorderMeal = async (orderId: string) => {
    const order = formattedOrders.find((o) => o.id === orderId);
    setPendingOrderIdForReorder(orderId);
    setReorderingOrderId(orderId);

    try {
      const res = await fetchApi("/api/user/orders/validate-reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const json = await res.json();
      const data = json.data !== undefined ? json.data : json;

      if (!res.ok || json.success === false) {
        setModalState({
          isOpen: true,
          type: "ERROR",
          errorMessage: data?.message || json?.error || "Unable to validate order for reorder. Please try again.",
        });
        return;
      }

      // Check 1: Kitchen offline
      if (data.sellerOnline === false) {
        setModalState({
          isOpen: true,
          type: "OFFLINE",
          sellerName: data.sellerName || order?.restaurantName || "Cloud Kitchen",
          sellerId: data.sellerId || order?.sellerId,
        });
        return;
      }

      // Check 2: No items available
      if (!data.availableItems || data.availableItems.length === 0) {
        setModalState({
          isOpen: true,
          type: "ALL_UNAVAILABLE",
          sellerName: data.sellerName || order?.restaurantName || "Cloud Kitchen",
          sellerId: data.sellerId || order?.sellerId,
          unavailableItems: data.unavailableItems || [],
        });
        return;
      }

      // Check 3: Partial items available (out of stock / unavailable items)
      if (data.unavailableItems && data.unavailableItems.length > 0) {
        setModalState({
          isOpen: true,
          type: "PARTIAL",
          sellerName: data.sellerName || order?.restaurantName || "Cloud Kitchen",
          sellerId: data.sellerId || order?.sellerId,
          availableItems: data.availableItems,
          unavailableItems: data.unavailableItems,
          unavailableAddons: data.unavailableAddons || [],
          rawAvailableItems: data.availableItems,
        });
        return;
      }

      // Check 3b: Unavailable add-ons detected (deleted by seller)
      if (data.hasUnavailableAddons || (data.unavailableAddons && data.unavailableAddons.length > 0)) {
        setModalState({
          isOpen: true,
          type: "UNAVAILABLE_ADDONS",
          sellerName: data.sellerName || order?.restaurantName || "Cloud Kitchen",
          sellerId: data.sellerId || order?.sellerId,
          availableItems: data.availableItems,
          unavailableItems: data.unavailableItems || [],
          unavailableAddons: data.unavailableAddons || [],
          rawAvailableItems: data.availableItems,
        });
        return;
      }

      // Check 4: Full reorder available - check for cart kitchen conflict
      const targetSellerId = data.sellerId;
      if (cartItems.length > 0 && cartItems[0].sellerId && targetSellerId && cartItems[0].sellerId !== targetSellerId) {
        setModalState({
          isOpen: true,
          type: "CART_CONFLICT",
          sellerName: data.sellerName || order?.restaurantName || "Cloud Kitchen",
          sellerId: data.sellerId || order?.sellerId,
          currentCartSellerName: cartItems[0].sellerName || "another kitchen",
          availableItems: data.availableItems,
          rawAvailableItems: data.availableItems,
        });
        return;
      }

      // Everything is available with live prices: Show Confirmation Dialog with live pricing
      setModalState({
        isOpen: true,
        type: "CONFIRM",
        sellerName: data.sellerName || order?.restaurantName || "Cloud Kitchen",
        sellerId: data.sellerId || order?.sellerId,
        availableItems: data.availableItems,
        rawAvailableItems: data.availableItems,
      });
    } catch (err: any) {
      console.error("Reorder error:", err);
      // Fallback
      if (order?.rawItems && order.rawItems.length > 0) {
        const items: ReorderItemInfo[] = order.rawItems.map((item: any) => ({
          id: item.foodItemId || item.id,
          name: item.name || item.title || "Food Item",
          quantity: item.quantity || item.qty || 1,
          price: item.price,
        }));
        setModalState({
          isOpen: true,
          type: "CONFIRM",
          sellerName: order?.restaurantName || "Cloud Kitchen",
          sellerId: order?.sellerId,
          availableItems: items,
          rawAvailableItems: order.rawItems.map((item: any) => ({
            id: item.id || `reorder-${item.name}`,
            foodItemId: item.foodItemId || item.id,
            name: item.name || "Delicious Meal",
            price: item.price || 199,
            quantity: item.quantity || item.qty || 1,
            sellerId: item.sellerId || "k-1",
            sellerName: order?.restaurantName || "Cloud Kitchen",
            image: item.imageUrl || item.image || order?.imageUrl,
            imageUrl: item.imageUrl || item.image || order?.imageUrl,
          })),
        });
      } else {
        setModalState({
          isOpen: true,
          type: "ERROR",
          errorMessage: err.message || "An unexpected error occurred while validating your reorder.",
        });
      }
    } finally {
      setReorderingOrderId(null);
    }
  };

  const handleExecuteReorderMeal = () => {
    const itemsToAdd = modalState.rawAvailableItems || modalState.availableItems;
    if (itemsToAdd && itemsToAdd.length > 0) {
      setModalState((prev) => ({ ...prev, isOpen: false }));
      addMultipleToCart(itemsToAdd as any, false);
      router.push("/cart");
    } else if (pendingOrderIdForReorder) {
      setModalState((prev) => ({ ...prev, isOpen: false }));
      router.push("/explore-desktop");
    }
  };

  const handleConfirmClearAndReorder = () => {
    if (modalState.rawAvailableItems && modalState.rawAvailableItems.length > 0) {
      addMultipleToCart(modalState.rawAvailableItems, true);
      setModalState((prev) => ({ ...prev, isOpen: false }));
      router.push("/cart");
    }
  };

  const handleConfirmPartialReorder = () => {
    if (!modalState.rawAvailableItems || modalState.rawAvailableItems.length === 0) return;

    const targetSellerId = modalState.sellerId;
    if (cartItems.length > 0 && cartItems[0].sellerId && targetSellerId && cartItems[0].sellerId !== targetSellerId) {
      // User has conflict with existing cart
      setModalState((prev) => ({
        ...prev,
        type: "CART_CONFLICT",
        currentCartSellerName: cartItems[0].sellerName || "another kitchen",
      }));
      return;
    }

    addMultipleToCart(modalState.rawAvailableItems, false);
    setModalState((prev) => ({ ...prev, isOpen: false }));
    router.push("/cart");
  };

  const handleExploreOtherKitchens = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    router.push("/food-explore");
  };

  const handleExploreSellerMenu = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.sellerId) {
      router.push(`/restaurant/${modalState.sellerId}`);
    } else {
      router.push("/explore-desktop");
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Shared Profile Sidebar with Order History Active */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="order-history" />
          </div>

          {/* Right Column: Order History Content Sections */}
          <div className={styles.contentWrapper}>
            {/* 2. Order History Header */}
            <OrderHistoryHeader />

            {/* 3. Order Status & Date Filters */}
            <OrderFilters
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              dateRangeText={selectedDateRange}
              onDateRangeChange={(range) => setSelectedDateRange(range)}
            />

            {/* Active Filter Feedback Banner */}
            {isFilterActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FFF7ED",
                  border: "1px solid #FED7AA",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#9A3412",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Filter size={15} color="#EA580C" />
                  <span>
                    Showing <strong>{filteredOrders.length}</strong> {activeTab !== "all" ? `${activeTab} ` : ""}orders
                    {selectedDateRange !== "All Time" ? ` for "${selectedDateRange}"` : ""}.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateRange("All Time");
                    setActiveTab("all");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EA580C",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                >
                  <RotateCcw size={13} /> Reset Filter
                </button>
              </div>
            )}

            {/* 4. Order List */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                Loading your order history...
              </div>
            ) : (
              <OrderList
                orders={filteredOrders}
                onViewDetails={handleViewDetails}
                onReorderMeal={handleReorderMeal}
                reorderingOrderId={reorderingOrderId}
              />
            )}
          </div>
        </div>
      </main>

      {/* Reorder Modal for Alerts, Out-of-Stock, Offline & Cart Conflict Handling */}
      <ReorderModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        sellerName={modalState.sellerName}
        sellerId={modalState.sellerId}
        currentCartSellerName={modalState.currentCartSellerName}
        availableItems={modalState.availableItems}
        unavailableItems={modalState.unavailableItems}
        unavailableAddons={modalState.unavailableAddons}
        errorMessage={modalState.errorMessage}
        isLoading={Boolean(reorderingOrderId)}
        onConfirmReorder={handleExecuteReorderMeal}
        onConfirmClearAndReorder={handleConfirmClearAndReorder}
        onConfirmPartialReorder={handleConfirmPartialReorder}
        onExploreOtherKitchens={handleExploreOtherKitchens}
        onExploreSellerMenu={handleExploreSellerMenu}
      />

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}


