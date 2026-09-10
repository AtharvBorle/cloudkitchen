"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Phone,
  FileText,
  CookingPot,
  Bike,
  Package,
  CheckCircle2,
} from "lucide-react";
import styles from "./ResponsiveSellerOrdersDetails.module.css";

export interface ResponsiveOrderItemLine {
  id: string;
  name: string;
  qty: number;
  price: string;
}

export type OrderTimelineStep = "Order Placed" | "Preparing" | "On the way" | "Delivered";

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
  total?: string;
  paymentMethod?: string;
  initialStatus?: OrderTimelineStep;
  onBack?: () => void;
  onCallRider?: () => void;
}

const DEFAULT_ITEMS: ResponsiveOrderItemLine[] = [
  { id: "1", name: "Butter Chicken", qty: 2, price: "₹450" },
  { id: "2", name: "Naan", qty: 4, price: "₹120" },
  { id: "3", name: "Dal Makhani", qty: 1, price: "₹280" },
];

export const ResponsiveSellerOrdersDetails: React.FC<
  ResponsiveSellerOrdersDetailsProps
> = ({
  orderId = "#1234",
  customerName = "Priya Mehta",
  customerPhone = "+919876543210",
  deliveryAddress = "Flat 402, Powai, Mumbai - 400076",
  riderName = "Rahul Kumar",
  riderInitials = "RK",
  riderPhone = "+919876500101",
  riderEta = "Live ETA: ~12 min",
  items = DEFAULT_ITEMS,
  total = "₹850",
  paymentMethod = "COD",
  initialStatus = "Preparing",
  onBack,
  onCallRider,
}) => {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderTimelineStep>(initialStatus);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/orders");
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

          <div className={styles.headerPlaceholder} />
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
                <circle cx="190" cy="85" r="22" fill="#F97316" fillOpacity="0.15" />
                <circle cx="190" cy="85" r="16" fill="#F97316" fillOpacity="0.25" />

                {/* Delivery Pin Circle & Icon */}
                <circle cx="190" cy="85" r="14" fill="#FFFFFF" stroke="#F97316" strokeWidth="2.5" />
                <path
                  d="M190 78 C186.7 78 184 80.7 184 84 C184 88.5 190 94 190 94 C190 94 196 88.5 196 84 C196 80.7 193.3 78 190 78 Z M190 86 C188.9 86 188 85.1 188 84 C188 82.9 188.9 82 190 82 C191.1 82 192 82.9 192 84 C192 85.1 191.1 86 190 86 Z"
                  fill="#EA580C"
                />
              </svg>
            </div>
          </section>

          {/* 2. Stepper Progress Bar */}
          <section className={styles.stepperCard}>
            <div className={styles.stepperRow}>
              {/* Step 1: Order Placed */}
              <div className={styles.stepCol}>
                <div className={`${styles.stepCircle} ${styles.stepCircleActive}`}>
                  <FileText size={16} />
                </div>
                <span className={`${styles.stepLabel} ${styles.stepLabelActive}`}>
                  Order Placed
                </span>
              </div>

              {/* Dotted Line 1-2 */}
              <div className={`${styles.dottedLine} ${styles.dottedLineActive}`} />

              {/* Step 2: Preparing */}
              <div className={styles.stepCol}>
                <div
                  className={`${styles.stepCircle} ${
                    currentStatus === "Preparing" ||
                    currentStatus === "On the way" ||
                    currentStatus === "Delivered"
                      ? styles.stepCircleActive
                      : styles.stepCircleInactive
                  }`}
                >
                  <CookingPot size={16} />
                </div>
                <span
                  className={`${styles.stepLabel} ${
                    currentStatus === "Preparing" ||
                    currentStatus === "On the way" ||
                    currentStatus === "Delivered"
                      ? styles.stepLabelActive
                      : styles.stepLabelInactive
                  }`}
                >
                  Preparing
                </span>
              </div>

              {/* Dotted Line 2-3 */}
              <div
                className={`${styles.dottedLine} ${
                  currentStatus === "On the way" || currentStatus === "Delivered"
                    ? styles.dottedLineActive
                    : styles.dottedLineInactive
                }`}
              />

              {/* Step 3: On the way */}
              <div className={styles.stepCol}>
                <div
                  className={`${styles.stepCircle} ${
                    currentStatus === "On the way" || currentStatus === "Delivered"
                      ? styles.stepCircleActive
                      : styles.stepCircleInactive
                  }`}
                >
                  <Bike size={16} />
                </div>
                <span
                  className={`${styles.stepLabel} ${
                    currentStatus === "On the way" || currentStatus === "Delivered"
                      ? styles.stepLabelActive
                      : styles.stepLabelInactive
                  }`}
                >
                  On the way
                </span>
              </div>

              {/* Dotted Line 3-4 */}
              <div
                className={`${styles.dottedLine} ${
                  currentStatus === "Delivered"
                    ? styles.dottedLineActive
                    : styles.dottedLineInactive
                }`}
              />

              {/* Step 4: Delivered */}
              <div className={styles.stepCol}>
                <div
                  className={`${styles.stepCircle} ${
                    currentStatus === "Delivered"
                      ? styles.stepCircleActive
                      : styles.stepCircleInactive
                  }`}
                >
                  <Package size={16} />
                </div>
                <span
                  className={`${styles.stepLabel} ${
                    currentStatus === "Delivered"
                      ? styles.stepLabelActive
                      : styles.stepLabelInactive
                  }`}
                >
                  Delivered
                </span>
              </div>
            </div>
          </section>

          {/* 3. Rider Quick Status Card */}
          <section className={styles.riderCard}>
            <div className={styles.riderLeft}>
              <div className={styles.avatarCircle}>{riderInitials}</div>
              <div className={styles.riderInfo}>
                <h3 className={styles.riderName}>{riderName}</h3>
                <p className={styles.riderEta}>{riderEta}</p>
              </div>
            </div>

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
          </section>

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

            {/* Total Row */}
            <div className={styles.totalRow}>
              <div className={styles.totalLeft}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.paymentBadge}>{paymentMethod}</span>
              </div>
              <span className={styles.totalPrice}>{total}</span>
            </div>
          </section>

          {/* 5. Bottom Action Buttons */}
          <div className={styles.bottomActions}>
            <button
              type="button"
              className={styles.callRiderButton}
              onClick={handleCallRider}
            >
              Call Rider
            </button>

            <button
              type="button"
              className={styles.assignRiderButton}
              onClick={() =>
                router.push(`/seller/orders/assign-rider?orderId=${encodeURIComponent(orderId)}`)
              }
            >
              Assign / Reassign Rider →
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
