"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { OrderHistoryHeader } from "@/components/order-history-desktop/order-history-header";
import { OrderFilters, OrderFilterTab } from "@/components/order-history-desktop/order-filters";
import { OrderList, OrderItemData } from "@/components/order-history-desktop/order-list";
import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { Footer } from "@/components/explore-desktop/footer";
import { RotateCcw, Filter } from "lucide-react";

import styles from "./OrderHistoryPage.module.css";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

// Preset fallback orders spanning Today, Yesterday, This Week, Last 7 Days, This Month, and Older
function generateSampleOrderHistory(): any[] {
  const nowMs = Date.now();
  return [
    {
      id: "ord-hist-101",
      createdAt: new Date(nowMs - 2 * 3600 * 1000).toISOString(), // Today (2 hours ago)
      status: "DELIVERED",
      totalAmount: 480,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-sai-101",
      seller: { id: "seller-sai-101", businessName: "Sai's Kitchen & Gourmet Treats" },
      items: JSON.stringify([
        { id: "item-101-1", foodItemId: "item-101-1", name: "Gourmet Paneer Butter Masala", quantity: 1, price: 290, imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80" },
        { id: "item-101-2", foodItemId: "item-101-2", name: "Butter Garlic Naan", quantity: 2, price: 95, imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-102",
      createdAt: new Date(nowMs - 5 * 3600 * 1000).toISOString(), // Today (5 hours ago)
      status: "DELIVERED",
      totalAmount: 560,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-italian-102",
      seller: { id: "seller-italian-102", businessName: "Italian Woodfired Oven" },
      items: JSON.stringify([
        { id: "item-102-1", foodItemId: "item-102-1", name: "Farmhouse Supreme Pizza", quantity: 1, price: 420, imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
        { id: "item-102-2", foodItemId: "item-102-2", name: "Cheesy Garlic Bread", quantity: 1, price: 140, imageUrl: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-103",
      createdAt: new Date(nowMs - 26 * 3600 * 1000).toISOString(), // Yesterday (26 hours ago)
      status: "DELIVERED",
      totalAmount: 390,
      deliveryAddress: "Office 3B, Tech Park, Shivajinagar, Pune",
      sellerId: "seller-biryani-103",
      seller: { id: "seller-biryani-103", businessName: "Royal Dum Biryani House" },
      items: JSON.stringify([
        { id: "item-103-1", foodItemId: "item-103-1", name: "Hyderabadi Veg Dum Biryani", quantity: 1, price: 310, imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80" },
        { id: "item-103-2", foodItemId: "item-103-2", name: "Mirchi Ka Salan & Raita", quantity: 1, price: 80, imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-104",
      createdAt: new Date(nowMs - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago (This Week / Last 7 Days)
      status: "DELIVERED",
      totalAmount: 420,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-mexican-104",
      seller: { id: "seller-mexican-104", businessName: "Mexican Cantina & Bowls" },
      items: JSON.stringify([
        { id: "item-104-1", foodItemId: "item-104-1", name: "Grilled Veggie Burrito Bowl", quantity: 1, price: 320, imageUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=400&q=80" },
        { id: "item-104-2", foodItemId: "item-104-2", name: "Crispy Nachos with Salsa", quantity: 1, price: 100, imageUrl: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-105",
      createdAt: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago (Last 7 Days)
      status: "CANCELLED",
      totalAmount: 310,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-romana-105",
      seller: { id: "seller-romana-105", businessName: "Pizzeria Romana" },
      items: JSON.stringify([
        { id: "item-105-1", foodItemId: "item-105-1", name: "Double Cheese Margherita", quantity: 1, price: 310, imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-106",
      createdAt: new Date(nowMs - 12 * 24 * 3600 * 1000).toISOString(), // 12 days ago (This Month / Last 30 Days)
      status: "DELIVERED",
      totalAmount: 350,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-punjab-106",
      seller: { id: "seller-punjab-106", businessName: "Punjab Grill Express" },
      items: JSON.stringify([
        { id: "item-106-1", foodItemId: "item-106-1", name: "Dal Makhani Deluxe Thali", quantity: 1, price: 350, imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-107",
      createdAt: new Date(nowMs - 22 * 24 * 3600 * 1000).toISOString(), // 22 days ago (This Month / Last 30 Days)
      status: "DELIVERED",
      totalAmount: 280,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-bakery-107",
      seller: { id: "seller-bakery-107", businessName: "Sweet Cravings Bakery" },
      items: JSON.stringify([
        { id: "item-107-1", foodItemId: "item-107-1", name: "Belgian Chocolate Waffle", quantity: 1, price: 190, imageUrl: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80" },
        { id: "item-107-2", foodItemId: "item-107-2", name: "Iced Caramel Macchiato", quantity: 1, price: 90, imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-108",
      createdAt: new Date(nowMs - 45 * 24 * 3600 * 1000).toISOString(), // 45 days ago (Last 3 Months / This Year)
      status: "DELIVERED",
      totalAmount: 260,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-kathi-108",
      seller: { id: "seller-kathi-108", businessName: "Kathi & Roll Junction" },
      items: JSON.stringify([
        { id: "item-108-1", foodItemId: "item-108-1", name: "Paneer Tikka Kathi Roll", quantity: 2, price: 260, imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
    {
      id: "ord-hist-109",
      createdAt: new Date(nowMs - 75 * 24 * 3600 * 1000).toISOString(), // 75 days ago (Last 3 Months / This Year)
      status: "DELIVERED",
      totalAmount: 450,
      deliveryAddress: "Flat 402, Sai Residency, Kothrud, Pune",
      sellerId: "seller-pasta-109",
      seller: { id: "seller-pasta-109", businessName: "Pasta Fresca Bistro" },
      items: JSON.stringify([
        { id: "item-109-1", foodItemId: "item-109-1", name: "Creamy Alfredo Penne Pasta", quantity: 1, price: 360, imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=400&q=80" },
        { id: "item-109-2", foodItemId: "item-109-2", name: "Herb Garlic Bread", quantity: 1, price: 90, imageUrl: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=400&q=80" },
      ]),
    },
  ];
}

export default function OrderHistoryDesktopPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("All Time");
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const rawList = liveOrders.length > 0 ? liveOrders : generateSampleOrderHistory();

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
        restaurantName: o.seller?.businessName || o.restaurantName || "Neo Cloud Kitchen",
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

  const handleReorderMeal = (orderId: string) => {
    const targetOrder = formattedOrders.find((o) => o.id === orderId);
    if (targetOrder && targetOrder.rawItems && targetOrder.rawItems.length > 0) {
      targetOrder.rawItems.forEach((item: any) => {
        const itemImg = item.imageUrl || item.image || targetOrder.imageUrl;
        const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
        const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

        addToCart({
          id: item.foodItemId || item.id || `reorder-${item.name || Math.random()}`,
          foodItemId: item.foodItemId || item.id,
          name: item.name || item.title || "Delicious Meal",
          price: Number(item.price) || 199,
          quantity: item.quantity || item.qty || 1,
          sellerId: targetOrder.sellerId || item.sellerId || "k-1",
          sellerName: targetOrder.restaurantName || "Cloud Kitchen",
          image: itemImg,
          imageUrl: itemImg,
          stockQuantity: stockLimit,
          maxStock: stockLimit,
        });
      });
      router.push("/user/cart");
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
              />
            )}
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}

