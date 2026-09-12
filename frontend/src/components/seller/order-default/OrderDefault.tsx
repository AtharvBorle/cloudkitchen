"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Clock, Bike, PackageCheck, AlertCircle } from "lucide-react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./OrderDefault.module.css";

export interface OrderItemRow {
  id?: string;
  name: string;
  qty: number;
  price: string;
  total?: string;
}

export interface OrderDetailsData {
  id?: string;
  orderId: string;
  placedTime: string;
  status: "Preparing" | "Pending" | "Out for Delivery" | "Completed" | "Cancelled";
  rawStatus: string;
  customerName: string;
  customerPhone?: string;
  contactNumber?: string;
  deliveryAddress?: string;
  roomAssigned?: string;
  items: OrderItemRow[];
  subtotal: string;
  deliveryFee?: string;
  serviceFee?: string;
  taxes?: string;
  total?: string;
  grandTotal?: string;
  paymentMethod: string;
  deliveryPersonName?: string;
}

export type OrderDetailData = OrderDetailsData;
export type OrderItemDetail = OrderItemRow;

export interface OrderDefaultProps {
  orderData?: OrderDetailsData;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAcceptOrder?: () => void;
  onRejectOrder?: () => void;
}

export const OrderDefault: React.FC<OrderDefaultProps> = ({
  orderData: propOrderData,
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  onSearch,
  onNotificationClick,
  onAcceptOrder,
  onRejectOrder,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawOrderId = searchParams.get("orderId");

  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetailsData | null>(propOrderData || null);
  const [loading, setLoading] = useState(!propOrderData);
  const [actionLoading, setActionLoading] = useState(false);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  const loadOrder = useCallback(async (isPolling = false) => {
    if (propOrderData && !isPolling) {
      setOrder(propOrderData);
      setLoading(false);
      return;
    }

    try {
      if (!isPolling) setLoading(true);
      const res = await fetchApi("/api/seller/orders");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.orders || data.orders || data.data || [];
        if (Array.isArray(list) && list.length > 0) {
          let found = null;
          if (rawOrderId) {
            const clean = rawOrderId.replace("#", "").trim().toLowerCase();
            found = list.find(
              (o: any) =>
                o.id.toLowerCase() === clean ||
                `#ncr-${o.id.slice(0, 4).toLowerCase()}` === rawOrderId.toLowerCase() ||
                o.id.toLowerCase().startsWith(clean)
            );
          }
          // Default to found order, or the latest order if no match
          const target = found || list[0];

          if (target) {
            let parsedItems: any[] = [];
            try {
              parsedItems = typeof target.items === "string" ? JSON.parse(target.items) : target.items;
            } catch {
              parsedItems = [];
            }

            const formattedItems: OrderItemRow[] = Array.isArray(parsedItems)
              ? parsedItems.map((item: any, idx: number) => ({
                  id: item.id || `item-${idx}`,
                  name: item.name || "Food Item",
                  qty: item.quantity || item.qty || 1,
                  price: `₹${item.price || 0}`,
                  total: `₹${(item.price || 0) * (item.quantity || item.qty || 1)}`,
                }))
              : [];

            let statusVal: OrderDetailsData["status"] = "Pending";
            const s = (target.status || "").toUpperCase();
            if (s === "PREPARING") statusVal = "Preparing";
            else if (s === "OUT_FOR_DELIVERY" || s === "ON_THE_WAY") statusVal = "Out for Delivery";
            else if (s === "DELIVERED" || s === "COMPLETED") statusVal = "Completed";
            else if (s === "CANCELLED") statusVal = "Cancelled";
            else statusVal = "Pending";

            const timeStr = target.createdAt
              ? new Date(target.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "Just now";

            const totalNum = target.totalAmount || 0;
            const subtotalNum = Math.max(totalNum - 34, 0);

            setOrder({
              id: target.id,
              orderId: `#NCR-${target.id.slice(0, 4).toUpperCase()}`,
              placedTime: target.createdAt
                ? `Today at ${timeStr}`
                : "Today at 02:45 PM",
              status: statusVal,
              rawStatus: s,
              customerName: target.user?.name || "Customer",
              customerPhone: target.customerPhone || target.user?.phone || "+91 98765 43210",
              contactNumber: target.customerPhone || target.user?.phone || "+91 98765 43210",
              deliveryAddress: target.deliveryAddress || "Powai, Mumbai",
              roomAssigned: target.deliveryAddress ? target.deliveryAddress.split(",")[0] : "Room 101",
              items: formattedItems,
              subtotal: `₹${subtotalNum}`,
              deliveryFee: "₹0",
              serviceFee: "Free",
              taxes: "₹34",
              total: `₹${totalNum}`,
              grandTotal: `₹${totalNum}`,
              paymentMethod: `${target.paymentMethod || "COD"} (${target.isPaid ? "Paid" : "Unpaid"})`,
              deliveryPersonName: target.deliveryPerson?.name,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load seller order details:", err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [propOrderData, rawOrderId]);

  // Initial load
  useEffect(() => {
    loadOrder(false);
  }, [loadOrder]);

  // Real-time polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrder(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [loadOrder]);

  const currentOrderId = order?.id || (rawOrderId ? rawOrderId.replace("#", "") : "");

  const handleAccept = async () => {
    if (onAcceptOrder) {
      onAcceptOrder();
      return;
    }
    if (!currentOrderId) return;
    try {
      setActionLoading(true);
      const res = await fetchApi(`/api/seller/orders/${currentOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING" }),
      });
      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status: "Preparing", rawStatus: "PREPARING" } : null));
        loadOrder(true);
      }
    } catch (err) {
      console.error("Failed to accept order:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (onRejectOrder) {
      onRejectOrder();
      return;
    }
    if (!currentOrderId) return;
    if (!confirm("Are you sure you want to reject / cancel this order?")) return;
    try {
      setActionLoading(true);
      const res = await fetchApi(`/api/seller/orders/${currentOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status: "Cancelled", rawStatus: "CANCELLED" } : null));
        loadOrder(true);
      }
    } catch (err) {
      console.error("Failed to reject order:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!currentOrderId) return;
    try {
      setActionLoading(true);
      const res = await fetchApi(`/api/seller/orders/${currentOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED", isPaid: true }),
      });
      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, status: "Completed", rawStatus: "DELIVERED" } : null));
        loadOrder(true);
      }
    } catch (err) {
      console.error("Failed to mark delivered:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Timeline step active calculation:
  // Step 1: Placed
  // Step 2: Preparing
  // Step 3: Out for Delivery
  // Step 4: Delivered
  const rawStatus = (order?.rawStatus || "").toUpperCase();
  const isDelivered = rawStatus === "DELIVERED" || rawStatus === "COMPLETED";
  const isOut = rawStatus === "OUT_FOR_DELIVERY" || rawStatus === "ON_THE_WAY";
  const isPreparing = rawStatus === "PREPARING";
  const isPending = rawStatus === "PENDING" || !rawStatus;
  const isCancelled = rawStatus === "CANCELLED";

  if (loading && !order) {
    return (
      <div className={styles.container}>
        <ConsoleSidebar
          activeItemId="orders"
          isMobileOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
        />
        <div className={styles.rightSection}>
          <Topbar title="Owner Operations Console" ownerName={ownerName} partnerRole={partnerRole} avatarInitials={avatarInitials} onSearch={onSearch} onNotificationClick={onNotificationClick} onMenuToggle={() => setIsMobileOpen((prev) => !prev)} />
          <main className={styles.mainContent} style={{ textAlign: "center", padding: "80px 20px", color: "#64748b" }}>
            Loading order details...
          </main>
        </div>
      </div>
    );
  }

  const activeOrderData = order || {
    orderId: rawOrderId || "#NCR-8291",
    placedTime: "Just now",
    status: "Pending" as const,
    rawStatus: "PENDING",
    customerName: "Customer",
    customerPhone: "+91 98765 43210",
    contactNumber: "+91 98765 43210",
    deliveryAddress: "Powai, Mumbai",
    roomAssigned: "Room 101",
    items: [],
    subtotal: "₹0",
    deliveryFee: "₹0",
    serviceFee: "Free",
    taxes: "₹0",
    total: "₹0",
    grandTotal: "₹0",
    paymentMethod: "COD (Unpaid)",
  };

  return (
    <div className={styles.container}>
      {/* 1. Left Sidebar with active Orders tab */}
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
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Top Nav Row: Back button + Order ID Header */}
          <div className={styles.topNavRow}>
            <Link href="/seller/orders" className={styles.backBtn} title="Back to Orders">
              <ArrowLeft size={18} />
            </Link>
            <div className={styles.headerGroup}>
              <h1 className={styles.orderTitle}>Order {activeOrderData.orderId}</h1>
              <p className={styles.orderSubtitle}>{activeOrderData.placedTime}</p>
            </div>
          </div>

          {/* Cancelled Banner */}
          {isCancelled && (
            <div style={{ padding: "14px 20px", backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "12px", color: "#B91C1C", fontWeight: "600", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={20} />
              <span>This order has been cancelled.</span>
            </div>
          )}

          {/* 2-Column Details Grid */}
          <div className={styles.detailGrid}>
            {/* Left Column: Resident Info + Ordered Items */}
            <div className={styles.leftColumn}>
              {/* Resident Information Card */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Customer & Delivery Information</h3>
                <div className={styles.residentMetaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>NAME</span>
                    <span className={styles.metaValue}>{activeOrderData.customerName}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>ROOM / ADDRESS</span>
                    <span className={styles.metaValue}>{activeOrderData.deliveryAddress}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>CONTACT</span>
                    <span className={styles.metaValue}>
                      <a href={`tel:${activeOrderData.contactNumber}`} style={{ color: "#F97316", textDecoration: "none" }}>
                        {activeOrderData.contactNumber}
                      </a>
                    </span>
                  </div>
                </div>
              </div>

              {/* Ordered Items Card */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Ordered Items ({activeOrderData.items.length})</h3>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>ITEM</th>
                      <th>PRICE</th>
                      <th>QTY</th>
                      <th>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrderData.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                          No item details recorded.
                        </td>
                      </tr>
                    ) : (
                      activeOrderData.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{item.name}</td>
                          <td>{item.price}</td>
                          <td>{item.qty}</td>
                          <td>{item.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Price Calculation Summary */}
                <div className={styles.priceSummary}>
                  <div className={styles.priceRow}>
                    <span className={styles.priceRowLabel}>Subtotal:</span>
                    <span className={styles.priceRowValue}>{activeOrderData.subtotal}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span className={styles.priceRowLabel}>Service Fee & Delivery:</span>
                    <span className={styles.freeBadge}>{activeOrderData.serviceFee}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span className={styles.priceRowLabel}>Payment Mode:</span>
                    <span className={styles.priceRowValue}>{activeOrderData.paymentMethod}</span>
                  </div>
                  <div className={styles.grandTotalRow}>
                    <span className={styles.grandTotalLabel}>Grand Total:</span>
                    <span className={styles.grandTotalValue}>{activeOrderData.grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Delivery Lifecycle & Action Buttons */}
            <div className={styles.rightCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Order Delivery Lifecycle</h3>
                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700" }}>• Live</span>
              </div>

              {/* Timeline list */}
              <div className={styles.timeline}>
                {/* Step 1: Order Placed */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div className={`${styles.nodeCircle} ${styles.nodeCompleted}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div className={`${styles.connectingLine} ${!isPending ? styles.lineCompleted : ""}`} />
                  </div>
                  <div className={styles.timelineText}>
                    <h4 className={styles.stepTitle}>Order Placed</h4>
                    <span className={styles.stepSubtitle}>{activeOrderData.placedTime}</span>
                  </div>
                </div>

                {/* Step 2: Preparing Food */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div
                      className={`${styles.nodeCircle} ${
                        isDelivered || isOut
                          ? styles.nodeCompleted
                          : isPreparing
                          ? styles.nodeActive
                          : styles.nodeUpcoming
                      }`}
                    >
                      {isDelivered || isOut ? (
                        <Check size={14} strokeWidth={3} />
                      ) : isPreparing ? (
                        <Clock size={13} strokeWidth={2.5} />
                      ) : (
                        "2"
                      )}
                    </div>
                    <div className={`${styles.connectingLine} ${isDelivered || isOut ? styles.lineCompleted : ""}`} />
                  </div>
                  <div className={styles.timelineText}>
                    <h4
                      className={`${styles.stepTitle} ${
                        isPreparing ? styles.stepTitleActive : !isPending ? "" : styles.stepTitleUpcoming
                      }`}
                    >
                      Preparing Food
                    </h4>
                    <span
                      className={`${styles.stepSubtitle} ${
                        isPreparing ? styles.stepSubtitleActive : styles.stepSubtitleUpcoming
                      }`}
                    >
                      {isPreparing ? "In Kitchen (Active)" : isDelivered || isOut ? "Completed ✓" : "Pending Acceptance"}
                    </span>
                  </div>
                </div>

                {/* Step 3: Out for Delivery */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div
                      className={`${styles.nodeCircle} ${
                        isDelivered
                          ? styles.nodeCompleted
                          : isOut
                          ? styles.nodeActive
                          : styles.nodeUpcoming
                      }`}
                    >
                      {isDelivered ? (
                        <Check size={14} strokeWidth={3} />
                      ) : isOut ? (
                        <Bike size={13} strokeWidth={2.5} />
                      ) : (
                        "3"
                      )}
                    </div>
                    <div className={`${styles.connectingLine} ${isDelivered ? styles.lineCompleted : ""}`} />
                  </div>
                  <div className={styles.timelineText}>
                    <h4
                      className={`${styles.stepTitle} ${
                        isOut ? styles.stepTitleActive : isDelivered ? "" : styles.stepTitleUpcoming
                      }`}
                    >
                      Out for Delivery
                    </h4>
                    <span
                      className={`${styles.stepSubtitle} ${
                        isOut ? styles.stepSubtitleActive : styles.stepSubtitleUpcoming
                      }`}
                    >
                      {isOut
                        ? activeOrderData.deliveryPersonName
                          ? `Assigned: ${activeOrderData.deliveryPersonName}`
                          : "Dispatched with Valet"
                        : isDelivered
                        ? "Delivered ✓"
                        : "Awaiting preparation"}
                    </span>
                  </div>
                </div>

                {/* Step 4: Delivered */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div className={`${styles.nodeCircle} ${isDelivered ? styles.nodeCompleted : styles.nodeUpcoming}`}>
                      {isDelivered ? <Check size={14} strokeWidth={3} /> : "4"}
                    </div>
                  </div>
                  <div className={styles.timelineText}>
                    <h4 className={`${styles.stepTitle} ${isDelivered ? styles.stepTitleActive : styles.stepTitleUpcoming}`}>
                      Delivered &amp; Closed
                    </h4>
                    <span className={`${styles.stepSubtitle} ${isDelivered ? styles.stepSubtitleActive : styles.stepSubtitleUpcoming}`}>
                      {isDelivered ? "Successfully handed over to customer" : "Final Step"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.actionDivider} />

              {/* Action Buttons based on current lifecycle status */}
              <div className={styles.actionButtonGroup}>
                {isPending && !isCancelled && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      className={styles.acceptBtn}
                      onClick={handleAccept}
                    >
                      {actionLoading ? "Processing..." : "Accept Order & Start Cooking"}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      className={styles.rejectBtn}
                      onClick={handleReject}
                    >
                      Reject / Cancel Order
                    </button>
                  </>
                )}

                {isPreparing && !isCancelled && (
                  <>
                    <button
                      type="button"
                      className={styles.acceptBtn}
                      onClick={() =>
                        router.push(
                          `/seller/orders/assign-rider?orderId=${encodeURIComponent(activeOrderData.id || currentOrderId)}`
                        )
                      }
                    >
                      Assign Delivery Rider →
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      className={styles.rejectBtn}
                      onClick={handleReject}
                    >
                      Cancel Order
                    </button>
                  </>
                )}

                {isOut && !isCancelled && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      className={styles.acceptBtn}
                      onClick={handleMarkDelivered}
                    >
                      {actionLoading ? "Updating..." : "Mark as Delivered & Closed"}
                    </button>
                    <button
                      type="button"
                      className={styles.rejectBtn}
                      onClick={() =>
                        router.push(
                          `/seller/orders/assign-rider?orderId=${encodeURIComponent(activeOrderData.id || currentOrderId)}`
                        )
                      }
                    >
                      Reassign Rider
                    </button>
                  </>
                )}

                {isDelivered && (
                  <div style={{ textAlign: "center", color: "#10B981", fontWeight: "700", padding: "8px 0" }}>
                    ✓ Order Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDefault;

