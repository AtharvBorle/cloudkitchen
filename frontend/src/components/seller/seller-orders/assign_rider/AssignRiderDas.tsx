"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  User,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Check,
  UserPlus,
  Loader2,
  Package,
  CreditCard,
  Truck,
} from "lucide-react";
import ConsoleSidebar from "../../sidebar/Sidebar";
import Topbar from "../../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { broadcastDeliveryAlert } from "@/hooks/useSellerNotifications";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./AssignRiderDas.module.css";

function AssignRiderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawOrderId = searchParams.get("orderId");
  const cleanOrderId = (rawOrderId || "").replace("#", "").trim();

  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [order, setOrder] = useState<any>(null);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignedRiderId, setAssignedRiderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, deliveryRes] = await Promise.all([
        fetchApi("/api/seller/orders"),
        fetchApi("/api/seller/delivery"),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const ordersList = ordersData.data?.orders || ordersData.orders || ordersData.data || [];
        if (Array.isArray(ordersList) && cleanOrderId) {
          const found = ordersList.find(
            (o: any) =>
              o.id.toLowerCase() === cleanOrderId.toLowerCase() ||
              `#${o.id.slice(0, 6)}`.toLowerCase() === cleanOrderId.toLowerCase() ||
              o.id.toLowerCase().includes(cleanOrderId.toLowerCase())
          );
          if (found) {
            setOrder(found);
            if (found.deliveryPersonId) {
              setAssignedRiderId(found.deliveryPersonId);
            }
          }
        }
      }

      if (deliveryRes.ok) {
        const deliveryData = await deliveryRes.json();
        const deliveryList = deliveryData.data?.deliveryPersons || deliveryData.deliveryPersons || deliveryData.data || [];
        if (Array.isArray(deliveryList)) {
          setRiders(deliveryList);
        }
      }
    } catch (err) {
      console.error("Failed to load assign rider data:", err);
    } finally {
      setLoading(false);
    }
  }, [cleanOrderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignRider = async (rider: any) => {
    if (!order?.id) {
      alert("Order details not found to assign rider.");
      return;
    }

    setAssigningId(rider.id);
    try {
      const res = await fetchApi(`/api/seller/orders/${order.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPersonId: rider.id }),
      });

      if (res.ok) {
        setAssignedRiderId(rider.id);
        try {
          broadcastDeliveryAlert({
            orderId: order.id.slice(0, 6).toUpperCase(),
            riderName: rider.name || "Delivery Partner",
            riderPhone: rider.phone,
            status: "RIDER_ASSIGNED",
          });
        } catch {}
        showToast(`Rider ${rider.name} assigned to Order #${order.id.slice(0, 6).toUpperCase()}!`);
        setTimeout(() => {
          router.push(`/seller/orders/details?orderId=${encodeURIComponent(order.id)}`);
        }, 1000);
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.message || errData?.error || "Failed to assign rider.");
      }
    } catch (err) {
      console.error("Error assigning rider:", err);
      alert("An error occurred while assigning the delivery partner.");
    } finally {
      setAssigningId(null);
    }
  };

  // Parse order items
  let parsedItems: any[] = [];
  if (order?.items) {
    try {
      const p = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
      if (Array.isArray(p)) parsedItems = p;
    } catch {
      parsedItems = [];
    }
  }

  const filteredRiders = React.useMemo(() => {
    if (!searchQuery.trim()) return riders;
    const q = searchQuery.toLowerCase().trim();
    return riders.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.vehicleType?.toLowerCase().includes(q) ||
        r.vehicleNumber?.toLowerCase().includes(q)
    );
  }, [riders, searchQuery]);

  return (
    <div className={styles.layout}>
      {/* 1. Left Sidebar Navigation */}
      <ConsoleSidebar
        activeItemId="orders"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* 2. Main Console Content */}
      <div className={styles.mainWrapper}>
        <Topbar
          title="Owner Operations Console"
          searchPlaceholder="Search rider by name, phone or vehicle..."
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
          onSearch={(q) => setSearchQuery(q)}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        <main className={styles.canvasContainer}>
          {/* Header Navigation & Page Info */}
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => router.push("/seller/orders")}
              >
                <ArrowLeft size={16} />
                <span>Back to Orders</span>
              </button>
              <div className={styles.titleRow}>
                <h1 className={styles.pageTitle}>Assign Delivery Partner</h1>
                {order && (
                  <span className={styles.orderBadge}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                )}
              </div>
              <p className={styles.pageSubtitle}>
                Dispatch this freshly prepared meal to an available delivery rider from your fleet.
              </p>
            </div>

            <div className={styles.headerActions}>
              <Link href="/seller/delivery/add-agent" className={styles.addRiderBtn}>
                <UserPlus size={16} />
                <span>Add Delivery Boy</span>
              </Link>
            </div>
          </div>

          {/* Toast Banner */}
          {toastMessage && (
            <div
              style={{
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                color: "#15803D",
                padding: "12px 18px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={18} />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Two-Column Layout */}
          <div className={styles.contentGrid}>
            {/* Left Column: Order Summary Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <Package size={20} color="#F97316" />
                  <h2 className={styles.cardTitle}>Order Dispatch Overview</h2>
                </div>
                <span className={styles.statusPill}>
                  {order?.status || "PREPARING"}
                </span>
              </div>

              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#64748B" }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <span>Loading order dispatch details...</span>
                </div>
              ) : order ? (
                <div className={styles.infoStack}>
                  {/* Customer Information */}
                  <div className={styles.infoBlock}>
                    <div className={styles.infoIconBox}>
                      <User size={18} />
                    </div>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Customer</span>
                      <span className={styles.infoValue}>{order.user?.name || "Customer"}</span>
                      {(order.customerPhone || order.user?.phone) && (
                        <a
                          href={`tel:${order.customerPhone || order.user?.phone}`}
                          className={styles.phoneLink}
                        >
                          <Phone size={12} />
                          <span>{order.customerPhone || order.user?.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Delivery Location */}
                  <div className={styles.infoBlock}>
                    <div className={styles.infoIconBox}>
                      <MapPin size={18} />
                    </div>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Delivery Destination</span>
                      <span className={styles.infoSub}>
                        {order.deliveryAddress || "Customer Address"}
                      </span>
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  <div className={styles.itemsList}>
                    <span className={styles.infoLabel}>Items in this order ({parsedItems.length})</span>
                    {parsedItems.map((item: any, idx: number) => (
                      <div key={idx} className={styles.itemRow}>
                        <span className={styles.itemName}>
                          {item.name || "Dish Item"}
                          <span className={styles.itemQty}>x{item.quantity || item.qty || 1}</span>
                        </span>
                        <span className={styles.itemPrice}>
                          ₹{((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}

                    <div className={styles.totalRow}>
                      <span>Total Amount</span>
                      <span style={{ color: "#F97316" }}>
                        ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "30px 0", textAlign: "center", color: "#64748B" }}>
                  <p>Order #{cleanOrderId} not found.</p>
                  <Link href="/seller/orders" style={{ color: "#F97316", fontWeight: 600 }}>
                    Return to orders list
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column: Available Delivery Squad */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <Bike size={20} color="#F97316" />
                  <h2 className={styles.cardTitle}>
                    Delivery Squad ({filteredRiders.length} Available)
                  </h2>
                </div>
                <Link
                  href="/seller/delivery/add-agent"
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#F97316",
                    textDecoration: "none",
                  }}
                >
                  + Add New Boy
                </Link>
              </div>

              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#64748B" }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <span>Loading delivery fleet...</span>
                </div>
              ) : filteredRiders.length === 0 ? (
                <div className={styles.emptyState}>
                  <Truck size={40} color="#CBD5E1" />
                  <h3 className={styles.emptyTitle}>No Delivery Riders Registered</h3>
                  <p className={styles.emptySub}>
                    You haven't onboarded any delivery boys yet. Add your in-house delivery partner to assign and dispatch kitchen orders.
                  </p>
                  <Link href="/seller/delivery/add-agent" className={styles.addRiderBtn} style={{ marginTop: "8px" }}>
                    <UserPlus size={16} />
                    <span>Add Delivery Boy</span>
                  </Link>
                </div>
              ) : (
                <div className={styles.ridersList}>
                  {filteredRiders.map((rider) => {
                    const isAssigned = assignedRiderId === rider.id;
                    const isAssigning = assigningId === rider.id;

                    const initials = rider.name
                      ? rider.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "RD";

                    return (
                      <div
                        key={rider.id}
                        className={`${styles.riderCard} ${isAssigned ? styles.riderCardAssigned : ""}`}
                      >
                        <div className={styles.riderLeft}>
                          <div className={styles.riderAvatar}>{initials}</div>
                          <div className={styles.riderInfo}>
                            <div className={styles.riderNameRow}>
                              <h4 className={styles.riderName}>{rider.name}</h4>
                              <span
                                className={`${styles.dutyBadge} ${
                                  rider.isActive !== false ? styles.onDuty : styles.offDuty
                                }`}
                              >
                                {rider.isActive !== false ? "On Duty" : "Off Duty"}
                              </span>
                            </div>

                            <div className={styles.riderMeta}>
                              {rider.phone && <span>{rider.phone}</span>}
                              {(rider.vehicleType || rider.vehicleNumber) && (
                                <span className={styles.vehicleTag}>
                                  {rider.vehicleType || "Vehicle"}
                                  {rider.vehicleNumber ? ` • ${rider.vehicleNumber}` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isAssigned ? (
                            <div className={styles.assignedBtn}>
                              <Check size={14} strokeWidth={3} />
                              <span>Assigned</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isAssigning || !order}
                              className={styles.assignBtn}
                              onClick={() => handleAssignRider(rider)}
                            >
                              {isAssigning ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>Assigning...</span>
                                </>
                              ) : (
                                <>
                                  <Bike size={14} />
                                  <span>Assign Partner</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AssignRiderDas() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontFamily: "sans-serif" }}>
          Loading Assign Rider Console...
        </div>
      }
    >
      <AssignRiderContent />
    </Suspense>
  );
}
