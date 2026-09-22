"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCw, Bike, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { playNewOrderChime } from "@/lib/audio-chime";
import RejectOrderModal from "./RejectOrderModal";
import ToastNotification from "./ToastNotification";
import styles from "./SellerOrders.module.css";

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
  time: string;
  deliveryPersonName?: string;
}

export interface SellerOrdersProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  orders?: OrderRow[];
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
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
            else statusVal = "Pending";

            const timeAgoStr = o.createdAt
              ? new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "Just now";

            return {
              id: o.id,
              orderId: `#NCR-${o.id.slice(0, 4).toUpperCase()}`,
              customer: o.user?.name || "Customer",
              room: o.room?.title || o.deliveryAddress || "Room 101",
              items: itemsSummary || "1x Dish Item",
              rawTotal: Number(o.totalAmount) || 0,
              total: `₹${o.totalAmount || 0}`,
              status: statusVal,
              rawStatus: s,
              createdAt: o.createdAt || new Date().toISOString(),
              time: timeAgoStr,
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
          const newRow: OrderRow = {
            id: o.id,
            orderId: `#NCR-${o.id.slice(0, 4).toUpperCase()}`,
            customer: o.user?.name || "Customer",
            room: o.deliveryAddress || "Room 101",
            items: itemsSummary || "1x Dish Item",
            rawTotal: Number(o.totalAmount) || 0,
            total: `₹${o.totalAmount || 0}`,
            status: "Pending",
            rawStatus: "PENDING",
            createdAt: o.createdAt || new Date().toISOString(),
            time: "Just now",
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
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

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
      if (map[o.status] !== undefined) {
        map[o.status]++;
      }
    });
    return map;
  }, [orderList, dateFilter]);

  // Filter & Sort computation
  const filteredOrders = useMemo(() => {
    let list = [...orderList];

    // 1. Status Filter
    if (activeFilter !== "All") {
      list = list.filter((order) => order.status === activeFilter);
    }

    // 2. Date Range Filter
    if (dateFilter !== "ALL") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

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
  }, [orderList, activeFilter, dateFilter, searchQuery, sortBy]);

  const resetFilters = () => {
    setActiveFilter("All");
    setDateFilter("ALL");
    setSearchQuery("");
    setSortBy("NEWEST");
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
          {/* Header Title & Subtitle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div className={styles.headerGroup}>
              <h1 className={styles.title}>Food & Service Orders</h1>
              <p className={styles.subtitle}>
                Manage active incoming, preparation, and delivery cycles in real-time.
              </p>
            </div>

            {/* Live Sync Status Pill */}
            <div className={styles.liveSyncIndicator} title="Orders are synchronized live with the backend">
              <span className={styles.liveSyncDot} />
              <span>Live Real-Time Sync</span>
            </div>
          </div>

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
                    <th>TIME</th>
                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px", color: "#64748b", fontSize: "14px" }}>
                        {loading ? (
                          "Loading orders..."
                        ) : (
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
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isPending = order.status === "Pending";
                      const isPreparing = order.status === "Preparing";
                      const isOut = order.status === "Out for Delivery";
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
                          <td>
                            <span
                              className={`${styles.statusBadge} ${getStatusBadgeClass(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className={styles.timeText}>{order.time}</td>
                          <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.actionBtnGroup}>
                              {isPending && (
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
          </div>
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

