"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Phone,
  FileText,
  CookingPot,
  Bike,
  Package,
  CheckCircle2,
  Bell,
  XCircle,
  Clock,
  Check,
  Loader2,
} from "lucide-react";
import { getRemainingSeconds } from "../SellerOrders";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./ResponsiveSellerOrdersDetails.module.css";

export interface ResponsiveOrderItemLine {
  id: string;
  name: string;
  qty: number;
  price: string;
}

export type OrderTimelineStep = "Order Placed" | "Preparing" | "On the way" | "Delivered" | "Cancelled";

export interface ResponsiveSellerOrdersDetailsProps {
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  riderName?: string;
  riderInitials?: string;
  riderPhone?: string;
  riderEta?: string;
  items?: ResponsiveOrderItemLine[];
  subtotal?: string;
  deliveryFee?: string;
  discount?: string;
  total?: string;
  paymentMethod?: string;
  initialStatus?: OrderTimelineStep;
  createdAt?: string;
  onBack?: () => void;
  onCallRider?: () => void;
  onStatusChange?: (newStatus: OrderTimelineStep) => Promise<void> | void;
}

const DEFAULT_ITEMS: ResponsiveOrderItemLine[] = [];

export const ResponsiveSellerOrdersDetails: React.FC<
  ResponsiveSellerOrdersDetailsProps
> = ({
  orderId = "",
  customerName = "Customer",
  customerPhone = "",
  deliveryAddress = "",
  riderName = "",
  riderInitials = "",
  riderPhone = "",
  riderEta = "",
  items = DEFAULT_ITEMS,
  subtotal = "₹0",
  deliveryFee = "Free",
  discount,
  total = "₹0",
  paymentMethod = "COD",
  initialStatus = "Order Placed",
  createdAt,
  onBack,
  onCallRider,
  onStatusChange,
}) => {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderTimelineStep>(initialStatus);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Synchronize status whenever initialStatus prop updates
  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  const remainingSec = createdAt ? getRemainingSeconds(createdAt, now) : 300;
  // Expiry is STRICTLY for unaccepted pending orders ("Order Placed")
  const isPendingOrder = initialStatus === "Order Placed" && currentStatus === "Order Placed";
  const isExpired = isPendingOrder && remainingSec <= 0;
  const isCancelled = currentStatus === "Cancelled" || (isPendingOrder && isExpired);

  useEffect(() => {
    if (isExpired && isPendingOrder) {
      setCurrentStatus("Cancelled");
    }
  }, [isExpired, isPendingOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleUpdateStatus = async (targetStep: OrderTimelineStep) => {
    if (updatingStatus || currentStatus === targetStep || currentStatus === "Cancelled") return;

    try {
      setUpdatingStatus(true);
      if (onStatusChange) {
        await onStatusChange(targetStep);
      } else {
        const cleanId = (orderId || "").replace("#NCR-", "").replace("#ncr-", "").replace("#", "").trim();
        if (cleanId) {
          let backendStatus = "PENDING";
          if (targetStep === "Preparing") backendStatus = "PREPARING";
          else if (targetStep === "On the way") backendStatus = "OUT_FOR_DELIVERY";
          else if (targetStep === "Delivered") backendStatus = "DELIVERED";
          else if (targetStep === "Cancelled") backendStatus = "CANCELLED";

          const res = await fetchApi(`/api/seller/orders/${cleanId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: backendStatus,
              ...(targetStep === "Delivered" ? { isPaid: true } : {}),
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.message || data?.error || "Failed to update order status");
          }
        }
      }

      setCurrentStatus(targetStep);
      if (targetStep === "Delivered") {
        showToast("🎉 Order marked as Delivered successfully!");
      } else if (targetStep === "On the way") {
        showToast("🛵 Order marked Out for Delivery!");
      } else if (targetStep === "Preparing") {
        showToast("🍳 Order accepted & cooking started!");
      } else {
        showToast(`Order status updated to ${targetStep}`);
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showToast(err?.message || "Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStepStatus = (stepKey: OrderTimelineStep): "completed" | "active" | "inactive" => {
    if (currentStatus === "Cancelled") {
      return stepKey === "Order Placed" ? "completed" : "inactive";
    }
    const orderProgression: OrderTimelineStep[] = ["Order Placed", "Preparing", "On the way", "Delivered"];
    const currentIndex = orderProgression.indexOf(currentStatus);
    const stepIndex = orderProgression.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "inactive";
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const fromParam = urlParams.get("from");
      if (fromParam === "dashboard") {
        router.push("/seller/res/dashboard");
        return;
      }
      if (fromParam === "orders") {
        router.push("/seller/res/orders");
        return;
      }
      if (document.referrer) {
        if (
          document.referrer.includes("/seller/res/dashboard") ||
          document.referrer.includes("/seller/dashboard")
        ) {
          router.push("/seller/res/dashboard");
          return;
        }
        if (
          document.referrer.includes("/seller/orders") ||
          document.referrer.includes("/seller/res/orders")
        ) {
          router.push("/seller/res/orders");
          return;
        }
      }
      if (window.history.length > 1) {
        const prevPath = window.location.pathname;
        router.back();
        setTimeout(() => {
          if (window.location.pathname === prevPath) {
            router.push("/seller/res/dashboard");
          }
        }, 200);
        return;
      }
      router.push("/seller/res/dashboard");
    } else {
      router.push("/seller/res/dashboard");
    }
  };

  const handleCallRider = () => {
    if (onCallRider) {
      onCallRider();
    } else {
      if (typeof window !== "undefined") {
        window.location.href = `tel:${riderPhone}`;
      }
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackClick}
            aria-label="Back to Orders"
            title="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <h1 className={styles.orderHeaderTitle}>Order {orderId}</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
          </button>
        </header>

        {/* Scrollable Content */}
        <main className={styles.contentArea}>
          {/* 1. Map Illustration View Card */}
          <section className={styles.mapCard}>
            <div className={styles.mapGraphicWrapper}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 380 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.mapSvg}
              >
                {/* Background Map Land */}
                <rect width="380" height="180" rx="16" fill="#EEF2F6" />

                {/* Building Blocks */}
                <rect x="20" y="20" width="80" height="50" rx="6" fill="#E2E8F0" />
                <rect x="110" y="20" width="100" height="40" rx="6" fill="#E2E8F0" />
                <rect x="220" y="20" width="80" height="45" rx="6" fill="#E2E8F0" />
                <rect x="25" y="80" width="90" height="70" rx="6" fill="#E2E8F0" />
                <rect x="250" y="75" width="105" height="75" rx="6" fill="#E2E8F0" />

                {/* Park Greenery Area */}
                <path
                  d="M130 65 C140 45, 230 40, 245 65 C260 90, 240 140, 210 145 C180 150, 140 135, 125 105 C115 85, 120 75, 130 65 Z"
                  fill="#DCFCE7"
                  stroke="#86EFAC"
                  strokeWidth="1.5"
                />

                {/* Primary Roads */}
                <path
                  d="M0 75 L380 75 M115 0 L115 180 M240 0 L240 180 M0 150 L380 150"
                  stroke="#FFFFFF"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Road Centerlines */}
                <path
                  d="M0 75 L380 75 M115 0 L115 180 M240 0 L240 180"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Compass Marker */}
                <circle cx="345" cy="28" r="12" fill="#FFFFFF" opacity="0.9" />
                <path d="M345 19 L348 28 L345 25 L342 28 Z" fill="#EF4444" />
                <path d="M345 37 L348 28 L345 31 L342 28 Z" fill="#64748B" />

                {/* Delivery Pin Ripple Pulse */}
                <circle cx="190" cy="85" r="22" fill={currentStatus === "Cancelled" ? "#DC2626" : currentStatus === "Delivered" ? "#10B981" : "#F97316"} fillOpacity="0.15" />
                <circle cx="190" cy="85" r="16" fill={currentStatus === "Cancelled" ? "#DC2626" : currentStatus === "Delivered" ? "#10B981" : "#F97316"} fillOpacity="0.25" />

                {/* Delivery Pin Circle & Icon */}
                <circle cx="190" cy="85" r="14" fill="#FFFFFF" stroke={currentStatus === "Cancelled" ? "#DC2626" : currentStatus === "Delivered" ? "#10B981" : "#F97316"} strokeWidth="2.5" />
                <path
                  d="M190 78 C186.7 78 184 80.7 184 84 C184 88.5 190 94 190 94 C190 94 196 88.5 196 84 C196 80.7 193.3 78 190 78 Z M190 86 C188.9 86 188 85.1 188 84 C188 82.9 188.9 82 190 82 C191.1 82 192 82.9 192 84 C192 85.1 191.1 86 190 86 Z"
                  fill={currentStatus === "Cancelled" ? "#DC2626" : currentStatus === "Delivered" ? "#10B981" : "#EA580C"}
                />
              </svg>
            </div>
          </section>

          {/* Order Acceptance Countdown Alert (if Order Placed) */}
          {currentStatus === "Order Placed" && !isExpired && (
            <div style={{
              margin: "0 16px 14px 16px",
              padding: "10px 14px",
              backgroundColor: remainingSec <= 60 ? "#FEF2F2" : "#FFF7ED",
              border: `1.5px solid ${remainingSec <= 60 ? "#FECACA" : "#FED7AA"}`,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: remainingSec <= 60 ? "#DC2626" : "#C2410C",
              fontSize: "0.84rem",
              fontWeight: 600,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} />
                <span>Acceptance Window</span>
              </div>
              <div style={{
                backgroundColor: remainingSec <= 60 ? "#DC2626" : "#EA580C",
                color: "#FFFFFF",
                padding: "3px 10px",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "0.8rem",
                fontVariantNumeric: "tabular-nums"
              }}>
                ⏱️ {String(Math.floor(remainingSec / 60)).padStart(2, "0")}:{String(remainingSec % 60).padStart(2, "0")}
              </div>
            </div>
          )}

          {/* 2. Stepper Progress Bar */}
          <section className={styles.stepperCard}>
            <div className={styles.stepperRow}>
              {currentStatus === "Cancelled" ? (
                <>
                  {/* Step 1: Order Placed */}
                  <div className={styles.stepCol}>
                    <div className={`${styles.stepCircle} ${styles.stepCircleCompleted}`}>
                      <FileText size={16} />
                    </div>
                    <span className={`${styles.stepLabel} ${styles.stepLabelCompleted}`}>
                      Order Placed
                    </span>
                  </div>

                  {/* Dotted Line Cancelled */}
                  <div className={`${styles.dottedLine} ${styles.dottedLineCancelled}`} />

                  {/* Step 2: Cancelled */}
                  <div className={styles.stepCol}>
                    <div className={`${styles.stepCircle} ${styles.stepCircleCancelled}`}>
                      <XCircle size={16} />
                    </div>
                    <span className={`${styles.stepLabel} ${styles.stepLabelCancelled}`}>
                      Cancelled
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 1: Order Placed */}
                  <div className={styles.stepCol}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => handleUpdateStatus("Order Placed")}
                      disabled={updatingStatus || currentStatus === "Delivered"}
                      title="Step 1: Order Placed"
                      aria-label="Step 1: Order Placed"
                    >
                      <div
                        className={`${styles.stepCircle} ${
                          getStepStatus("Order Placed") === "active"
                            ? styles.stepCircleActivePulse
                            : styles.stepCircleCompleted
                        }`}
                      >
                        {getStepStatus("Order Placed") === "completed" ? (
                          <Check size={16} strokeWidth={2.8} />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>
                      <span
                        className={`${styles.stepLabel} ${
                          getStepStatus("Order Placed") === "active"
                            ? styles.stepLabelActive
                            : styles.stepLabelCompleted
                        }`}
                      >
                        Order Placed
                      </span>
                    </button>
                  </div>

                  {/* Dotted Line 1-2 */}
                  <div
                    className={`${styles.dottedLine} ${
                      getStepStatus("Preparing") === "active"
                        ? styles.dottedLineFlowing
                        : getStepStatus("Preparing") === "completed"
                        ? styles.dottedLineCompleted
                        : styles.dottedLineInactive
                    }`}
                  />

                  {/* Step 2: Preparing */}
                  <div className={styles.stepCol}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => handleUpdateStatus("Preparing")}
                      disabled={updatingStatus || currentStatus === "Delivered"}
                      title={
                        currentStatus === "Order Placed"
                          ? "Tap to Accept & Start Cooking"
                          : "Step 2: Preparing"
                      }
                      aria-label="Step 2: Preparing"
                    >
                      <div
                        className={`${styles.stepCircle} ${
                          getStepStatus("Preparing") === "active"
                            ? styles.stepCircleActivePulse
                            : getStepStatus("Preparing") === "completed"
                            ? styles.stepCircleCompleted
                            : styles.stepCircleInactive
                        }`}
                      >
                        {getStepStatus("Preparing") === "completed" ? (
                          <Check size={16} strokeWidth={2.8} />
                        ) : (
                          <CookingPot size={16} />
                        )}
                      </div>
                      <span
                        className={`${styles.stepLabel} ${
                          getStepStatus("Preparing") === "active"
                            ? styles.stepLabelActive
                            : getStepStatus("Preparing") === "completed"
                            ? styles.stepLabelCompleted
                            : styles.stepLabelInactive
                        }`}
                      >
                        Preparing
                      </span>
                    </button>
                  </div>

                  {/* Dotted Line 2-3 */}
                  <div
                    className={`${styles.dottedLine} ${
                      getStepStatus("On the way") === "active"
                        ? styles.dottedLineFlowing
                        : getStepStatus("On the way") === "completed"
                        ? styles.dottedLineCompleted
                        : styles.dottedLineInactive
                    }`}
                  />

                  {/* Step 3: On the way */}
                  <div className={styles.stepCol}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => handleUpdateStatus("On the way")}
                      disabled={updatingStatus || currentStatus === "Delivered"}
                      title={
                        currentStatus === "Preparing"
                          ? "Tap to Mark Out for Delivery"
                          : "Step 3: On the way"
                      }
                      aria-label="Step 3: On the way"
                    >
                      <div
                        className={`${styles.stepCircle} ${
                          getStepStatus("On the way") === "active"
                            ? styles.stepCircleActivePulse
                            : getStepStatus("On the way") === "completed"
                            ? styles.stepCircleCompleted
                            : styles.stepCircleInactive
                        }`}
                      >
                        {getStepStatus("On the way") === "completed" ? (
                          <Check size={16} strokeWidth={2.8} />
                        ) : (
                          <Bike size={16} />
                        )}
                      </div>
                      <span
                        className={`${styles.stepLabel} ${
                          getStepStatus("On the way") === "active"
                            ? styles.stepLabelActive
                            : getStepStatus("On the way") === "completed"
                            ? styles.stepLabelCompleted
                            : styles.stepLabelInactive
                        }`}
                      >
                        On the way
                      </span>
                    </button>
                  </div>

                  {/* Dotted Line 3-4 */}
                  <div
                    className={`${styles.dottedLine} ${
                      currentStatus === "Delivered"
                        ? styles.dottedLineDeliveredGreen
                        : styles.dottedLineInactive
                    }`}
                  />

                  {/* Step 4: Delivered (COMPLETION SHOWS AS GREEN) */}
                  <div className={styles.stepCol}>
                    <button
                      type="button"
                      className={styles.stepBtn}
                      onClick={() => handleUpdateStatus("Delivered")}
                      disabled={updatingStatus || currentStatus === "Delivered"}
                      title={
                        currentStatus === "On the way"
                          ? "Tap to Mark as Delivered"
                          : "Step 4: Delivered"
                      }
                      aria-label="Step 4: Delivered"
                    >
                      <div
                        className={`${styles.stepCircle} ${
                          currentStatus === "Delivered"
                            ? styles.stepCircleDeliveredGreen
                            : styles.stepCircleInactive
                        }`}
                      >
                        {currentStatus === "Delivered" ? (
                          <Check size={18} strokeWidth={2.8} />
                        ) : (
                          <Package size={16} />
                        )}
                      </div>
                      <span
                        className={`${styles.stepLabel} ${
                          currentStatus === "Delivered"
                            ? styles.stepLabelDeliveredGreen
                            : styles.stepLabelInactive
                        }`}
                      >
                        {currentStatus === "Delivered" ? "Delivered ✓" : "Delivered"}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Contextual Action Bar below stepper */}
            {currentStatus !== "Cancelled" && (
              <div className={styles.stepperActionBox}>
                {currentStatus === "Order Placed" && (
                  <button
                    type="button"
                    className={styles.advanceStepBtn}
                    onClick={() => handleUpdateStatus("Preparing")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Loader2 size={16} className={styles.spin} /> : <CookingPot size={16} />}
                    <span>Accept &amp; Start Preparing Food</span>
                  </button>
                )}

                {currentStatus === "Preparing" && (
                  <button
                    type="button"
                    className={styles.advanceStepBtn}
                    onClick={() => handleUpdateStatus("On the way")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Loader2 size={16} className={styles.spin} /> : <Bike size={16} />}
                    <span>Mark Out for Delivery (On the way)</span>
                  </button>
                )}

                {currentStatus === "On the way" && (
                  <button
                    type="button"
                    className={`${styles.advanceStepBtn} ${styles.advanceStepBtnGreen}`}
                    onClick={() => handleUpdateStatus("Delivered")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Loader2 size={16} className={styles.spin} /> : <CheckCircle2 size={16} />}
                    <span>Mark as Delivered &amp; Complete ✓</span>
                  </button>
                )}

                {currentStatus === "Delivered" && (
                  <div className={styles.completedNoticeBanner}>
                    <div className={styles.completedNoticeHeader}>
                      <CheckCircle2 size={17} color="#059669" />
                      <span className={styles.completedNoticeTitle}>Order Successfully Delivered</span>
                    </div>
                    <p className={styles.completedNoticeText}>
                      All preparation, courier dispatch, and customer delivery stages have concluded.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 3. Rider Quick Status Card or Cancelled Notice */}
          {currentStatus === "Cancelled" ? (
            <section className={styles.cancelledNoticeCard}>
              <div className={styles.cancelledNoticeHeader}>
                <XCircle size={18} />
                <span>Order Rejected / Cancelled</span>
              </div>
              <p className={styles.cancelledNoticeText}>
                This order was rejected/cancelled. All preparation, rider assignment, and delivery stages have concluded.
              </p>
            </section>
          ) : (
            <section className={styles.riderCard}>
              <div className={styles.riderLeft}>
                <div className={styles.avatarCircle}>{riderInitials || "DP"}</div>
                <div className={styles.riderInfo}>
                  <h3 className={styles.riderName}>{riderName || "Delivery Partner"}</h3>
                  <p className={styles.riderEta}>{riderEta || (riderName ? "Assigned" : "Assigning shortly")}</p>
                </div>
              </div>

              {riderPhone && (
                <a
                  href={`tel:${riderPhone}`}
                  className={styles.riderCallBtn}
                  onClick={(e) => {
                    if (onCallRider) {
                      e.preventDefault();
                      onCallRider();
                    }
                  }}
                  aria-label={`Call ${riderName}`}
                >
                  <Phone size={18} />
                </a>
              )}
            </section>
          )}

          {/* 4. Delivery To & Item Details Card */}
          <section className={styles.detailsCard}>
            <div className={styles.deliveryToHeader}>
              <span className={styles.sectionLabelUpper}>DELIVERY TO</span>
              <h3 className={styles.customerName}>{customerName}</h3>
              <p className={styles.addressText}>{deliveryAddress}</p>
            </div>

            <div className={styles.cardDivider} />

            {/* Items List */}
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <span className={styles.itemTitle}>
                    {item.name} <strong className={styles.itemMultiply}>×{item.qty}</strong>
                  </span>
                  <span className={styles.itemPrice}>{item.price}</span>
                </div>
              ))}
            </div>

            <div className={styles.cardDivider} />

            {/* Price breakdown */}
            {subtotal && (
              <div className={styles.itemRow} style={{ color: "#64748B", fontSize: "0.88rem" }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>{subtotal}</span>
              </div>
            )}
            <div className={styles.itemRow} style={{ color: "#64748B", fontSize: "0.88rem" }}>
              <span>Service Fee &amp; Delivery</span>
              <span style={{ color: "#F97316", fontWeight: 600 }}>{deliveryFee || "Free"}</span>
            </div>
            {discount && (
              <div className={styles.itemRow} style={{ color: "#16A34A", fontSize: "0.88rem", fontWeight: 600 }}>
                <span>Discount / Coupon</span>
                <span>-{discount}</span>
              </div>
            )}

            <div className={styles.cardDivider} />

            {/* Total Row */}
            <div className={styles.totalRow}>
              <div className={styles.totalLeft}>
                <span className={styles.totalLabel}>Grand Total</span>
                <span className={styles.paymentBadge}>{paymentMethod}</span>
              </div>
              <span className={styles.totalPrice}>{total}</span>
            </div>
          </section>

          {/* 5. Bottom Action Buttons */}
          <div className={styles.bottomActions}>
            <button
              type="button"
              className={`${styles.callRiderButton} ${isCancelled ? styles.callRiderButtonDisabled : ""}`}
              disabled={isCancelled}
              onClick={handleCallRider}
              title={isCancelled ? "Order cancelled - rider calls disabled" : undefined}
            >
              Call Rider
            </button>

            <button
              type="button"
              className={`${styles.assignRiderButton} ${isCancelled || currentStatus === "Delivered" ? styles.assignRiderButtonDisabled : ""}`}
              disabled={isCancelled || currentStatus === "Delivered"}
              onClick={() => {
                if (!isCancelled && currentStatus !== "Delivered") {
                  router.push(`/seller/orders/assign-rider?orderId=${encodeURIComponent(orderId)}`);
                }
              }}
              title={
                isCancelled
                  ? "Order cancelled - rider assignment disabled"
                  : currentStatus === "Delivered"
                  ? "Order completed and delivered"
                  : undefined
              }
            >
              {currentStatus === "Delivered" ? "Order Delivered ✓" : "Assign / Reassign Rider →"}
            </button>
          </div>
        </main>

        {/* Toast Notification */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveSellerOrdersDetails;
