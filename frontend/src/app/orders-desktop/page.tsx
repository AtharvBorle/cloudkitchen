"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { OrdersHeader } from "@/components/orders-desktop/orders-header";
import { ActiveOrders, DynamicActiveFoodOrder, DynamicActiveBooking } from "@/components/orders-desktop/active-orders";
import { PastOrders, PastOrderItem } from "@/components/orders-desktop/past-orders";
import { fetchApi } from "@/lib/fetch-api";

import styles from "./OrdersPage.module.css";

function OrdersDesktopContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams ? searchParams.get("query") || "" : "";
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Foods");

  useEffect(() => {
    let isMounted = true;

    async function loadUserOrdersData(initial = false) {
      if (initial) setLoading(true);
      try {
        const [ordersRes, bookingsRes] = await Promise.allSettled([
          fetchApi("/api/user/orders"),
          fetchApi("/api/user/bookings"),
        ]);

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const data = await ordersRes.value.json();
          const list = data.data || data || [];
          if (isMounted) setOrders(Array.isArray(list) ? list : []);
        }

        if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
          const data = await bookingsRes.value.json();
          const list = data.data || data || [];
          if (isMounted) setBookings(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to load user orders/bookings:", err);
      } finally {
        if (initial && isMounted) setLoading(false);
      }
    }

    loadUserOrdersData(true);

    const interval = setInterval(() => {
      loadUserOrdersData(false);
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Format active food orders (PENDING, PREPARING, OUT_FOR_DELIVERY)
  const activeFoodOrders: DynamicActiveFoodOrder[] = useMemo(() => {
    let list = orders
      .filter((o) => {
        const s = (o.status || "").toUpperCase();
        return s !== "DELIVERED" && s !== "CANCELLED";
      })
      .map((o) => {
        let itemsDesc = "";
        try {
          const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
          if (Array.isArray(parsed)) {
            itemsDesc = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
          }
        } catch (e) {
          itemsDesc = "Delicious Meal Preparation";
        }

        const dateStr = o.createdAt
          ? new Date(o.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recent Order";

        return {
          id: o.id,
          vendorName: o.seller?.businessName || "Neo Cloud Kitchen",
          itemSummary: itemsDesc || "Order Items",
          orderDate: dateStr,
          status: o.status || "PENDING",
          totalAmount: o.totalAmount,
          invoiceUrl: `/invoice/order/${o.id}`,
          trackingId: o.seller?.trackingId,
        };
      });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.vendorName.toLowerCase().includes(q) ||
          o.itemSummary.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, searchQuery]);

  // Format active room bookings (PENDING, CONFIRMED)
  const activeRoomBookings: DynamicActiveBooking[] = useMemo(() => {
    let list = bookings
      .filter((b) => {
        const s = (b.status || "").toUpperCase();
        return s === "PENDING" || s === "CONFIRMED";
      })
      .map((b) => {
        const start = b.startDate ? new Date(b.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "";
        const end = b.endDate ? new Date(b.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "";
        return {
          id: b.id,
          vendorName: b.room?.seller?.businessName || b.room?.seller?.user?.name || "Neo Stay PG",
          roomName: b.room?.title || "Deluxe Suite",
          rentalPeriod: `${start} – ${end}`,
          status: b.status || "Confirmed",
          totalAmount: b.totalAmount,
        };
      });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.vendorName.toLowerCase().includes(q) ||
          b.roomName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, searchQuery]);

  // Format past orders (DELIVERED, CANCELLED)
  const pastOrdersList: PastOrderItem[] = useMemo(() => {
    if (orders.length === 0) return [];
    let list = orders
      .filter((o) => {
        const s = (o.status || "").toUpperCase();
        return s === "DELIVERED" || s === "CANCELLED";
      })
      .map((o) => {
        let itemsDesc = "";
        try {
          const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
          if (Array.isArray(parsed)) {
            itemsDesc = parsed.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
          }
        } catch (e) {
          itemsDesc = "Order Items";
        }

        const dateStr = o.createdAt
          ? new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
          : "";

        return {
          id: o.id,
          vendor: o.seller?.businessName || "Neo Cloud Kitchen",
          details: `${itemsDesc} • ${dateStr}`,
          price: `₹${o.totalAmount || 0}`,
          sellerTrackingId: o.seller?.trackingId,
          invoiceUrl: `/invoice/order/${o.id}`,
        };
      });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.vendor.toLowerCase().includes(q) ||
          o.details.toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, searchQuery]);

  const isFoodTab = selectedCategory === "Foods";

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar Component (hidden on mobile <=768px) */}
      <div className={styles.desktopNavbar}>
        <Navbar
          navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
          initialActiveItem="Orders"
        />
      </div>

      <main className={styles.mainContent}>
        {/* Active Search Result Banner */}
        {searchQuery.trim() && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "16px 22px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              border: "1px solid #FFE4D3",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: "700",
                  color: "#0F172A",
                  margin: "0 0 2px 0",
                }}
              >
                Orders matching &quot;{searchQuery}&quot;
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0 }}>
                Found {activeFoodOrders.length + activeRoomBookings.length + pastOrdersList.length} matching order records
              </p>
            </div>
            <Link
              href="/orders-desktop"
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#FF6B00",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                backgroundColor: "#FFF3EB",
              }}
            >
              Clear Search
            </Link>
          </div>
        )}

        {/* 2. Orders Header & Category Filters */}
        <OrdersHeader
          defaultCategory={selectedCategory}
          onCategoryChange={(cat) => setSelectedCategory(cat)}
        />

        {/* 3. Active Orders Section (Food Live Tracking & Room Subscriptions) */}
        <ActiveOrders
          foodOrders={activeFoodOrders}
          roomBookings={activeRoomBookings}
          selectedCategory={selectedCategory}
          loading={loading}
        />

        {/* 4. Past Orders Section (Visible for Foods) */}
        {isFoodTab && (
          <PastOrders
            orders={pastOrdersList}
          />
        )}
      </main>
    </div>
  );
}

export default function OrdersDesktopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#FFF8F2", padding: "40px", textAlign: "center" }}>Loading orders...</div>}>
      <OrdersDesktopContent />
    </Suspense>
  );
}

