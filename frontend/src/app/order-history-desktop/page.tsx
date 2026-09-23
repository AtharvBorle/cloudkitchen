"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, OrderItemData } from "@/components/order-history-desktop/order-list";
import { ReorderModal, ReorderModalType, ReorderItemInfo } from "@/components/order-history-desktop/reorder-modal";
import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { useCart, CartItem } from "@/context/CartContext";
import { Footer } from "@/components/explore-desktop/footer";

import styles from "./OrderHistoryPage.module.css";

import { useRouter } from "next/navigation";

export default function OrderHistoryDesktopPage() {
  const router = useRouter();
  const { cartItems, addMultipleToCart } = useCart();

  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("All Time");
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);

  // Modal State for Alerts and Confirmation Popups
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ReorderModalType;
    sellerName?: string;
    sellerId?: string;
    currentCartSellerName?: string;
    availableItems?: ReorderItemInfo[];
    unavailableItems?: ReorderItemInfo[];
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

  // Real-time SSE stream replaces 4s auto-polling
  useRealtimeStream({
    url: "/api/user/orders/stream",
    onOrder: () => {
      loadOrders(false);
    },
  });

  const formattedOrders: (OrderItemData & { rawDate?: Date })[] = useMemo(() => {
    return liveOrders.map((o: any) => {
      let itemsDesc = "";
      try {
        const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
        if (Array.isArray(parsed)) {
          itemsDesc = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
        }
      } catch (e) {
        itemsDesc = "Order Items";
      }

      const rawDate = o.createdAt ? new Date(o.createdAt) : new Date();
      const dateStr = rawDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      let statusVal: "DELIVERED" | "CANCELLED" | "IN_PROGRESS" = "IN_PROGRESS";
      const s = (o.status || "").toUpperCase();
      if (s === "DELIVERED") statusVal = "DELIVERED";
      else if (s === "CANCELLED") statusVal = "CANCELLED";

      return {
        id: o.id,
        restaurantName: o.seller?.businessName || o.seller?.user?.name || "Neo Cloud Kitchen",
        orderNumber: `Order #${o.id.slice(0, 8).toUpperCase()}`,
        orderDate: dateStr,
        rawDate,
        status: statusVal,
        itemsOrdered: itemsDesc || "Delicious Meals",
        totalAmount: o.totalAmount || 0,
        deliveryAddress: o.deliveryAddress ? `Delivered to ${o.deliveryAddress.split(" | Loc:")[0]}` : "Pickup",
        hasViewDetails: true,
      };
    });
  }, [liveOrders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return formattedOrders.filter((order) => {
      // 1. Status Filter
      if (activeTab === "delivered" && order.status !== "DELIVERED") return false;
      if (activeTab === "cancelled" && order.status !== "CANCELLED") return false;

      // 2. Date Range Filter
      if (order.rawDate && selectedDateRange !== "All Time") {
        const orderTime = order.rawDate.getTime();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();

        if (selectedDateRange === "Today") {
          if (orderTime < startOfToday || orderTime > endOfToday) return false;
        } else if (selectedDateRange === "Yesterday") {
          if (orderTime < startOfYesterday || orderTime > endOfYesterday) return false;
        } else if (selectedDateRange === "This Week") {
          if (orderTime < startOfWeek) return false;
        } else if (selectedDateRange === "This Month") {
          if (orderTime < startOfMonth) return false;
        } else if (selectedDateRange === "Last 7 Days") {
          const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
          if (orderTime < sevenDaysAgo) return false;
        } else if (selectedDateRange === "Last 30 Days") {
          const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;
          if (orderTime < thirtyDaysAgo) return false;
        } else if (selectedDateRange === "Last 3 Months") {
          const threeMonthsAgo = startOfToday - 90 * 24 * 60 * 60 * 1000;
          if (orderTime < threeMonthsAgo) return false;
        } else if (selectedDateRange === "This Year") {
          const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
          if (orderTime < startOfYear) return false;
        }
      }

      return true;
    });
  }, [formattedOrders, activeTab, selectedDateRange]);

  const handleViewDetails = (orderId: string) => {
    router.push(`/order-confirmation?orderId=${orderId}`);
  };

  const handleReorderMeal = async (orderId: string) => {
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
          sellerName: data.sellerName || "Cloud Kitchen",
          sellerId: data.sellerId,
        });
        return;
      }

      // Check 2: No items available
      if (!data.availableItems || data.availableItems.length === 0) {
        setModalState({
          isOpen: true,
          type: "ALL_UNAVAILABLE",
          sellerName: data.sellerName || "Cloud Kitchen",
          sellerId: data.sellerId,
          unavailableItems: data.unavailableItems || [],
        });
        return;
      }

      // Check 3: Partial items available
      if (data.unavailableItems && data.unavailableItems.length > 0) {
        setModalState({
          isOpen: true,
          type: "PARTIAL",
          sellerName: data.sellerName || "Cloud Kitchen",
          sellerId: data.sellerId,
          availableItems: data.availableItems,
          unavailableItems: data.unavailableItems,
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
          sellerName: data.sellerName || "Cloud Kitchen",
          sellerId: data.sellerId,
          currentCartSellerName: cartItems[0].sellerName || "another kitchen",
          availableItems: data.availableItems,
          rawAvailableItems: data.availableItems,
        });
        return;
      }

      // Everything is clear: Add items to cart and redirect to /cart
      addMultipleToCart(data.availableItems, false);
      router.push("/cart");
    } catch (err: any) {
      console.error("Reorder error:", err);
      setModalState({
        isOpen: true,
        type: "ERROR",
        errorMessage: err.message || "An unexpected error occurred while processing your reorder.",
      });
    } finally {
      setReorderingOrderId(null);
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
    router.push("/explore-desktop");
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
        errorMessage={modalState.errorMessage}
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


