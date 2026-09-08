"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Phone, MapPin } from "lucide-react";
import styles from "./ResponsiveSellerOrdersDetails.module.css";

export interface ResponsiveOrderItemLine {
  id: string;
  name: string;
  qty: number;
  price: string;
}

export type OrderTimelineStep = "Pending" | "Preparing" | "Out for delivery" | "Delivered";

export interface ResponsiveSellerOrdersDetailsProps {
  orderId?: string;
  customerName?: string;
  customerRole?: string;
  customerInitials?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items?: ResponsiveOrderItemLine[];
  subtotal?: string;
  deliveryFee?: string;
  total?: string;
  paymentMethod?: string;
  initialStatus?: OrderTimelineStep;
  onBack?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onCallCustomer?: () => void;
}

const DEFAULT_ITEMS: ResponsiveOrderItemLine[] = [
  { id: "1", name: "Butter Chicken", qty: 2, price: "₹450" },
  { id: "2", name: "Naan", qty: 4, price: "₹120" },
  { id: "3", name: "Dal Makhani", qty: 1, price: "₹280" },
];

const TIMELINE_STEPS: OrderTimelineStep[] = [
  "Pending",
  "Preparing",
  "Out for delivery",
  "Delivered",
];

export const ResponsiveSellerOrdersDetails: React.FC<ResponsiveSellerOrdersDetailsProps> = ({
  orderId = "#1234",
  customerName = "Priya Mehta",
  customerRole = "Customer",
  customerInitials = "PM",
  customerPhone = "+919876543210",
  deliveryAddress = "Flat 402, Building 5A, Horizon Heights, Powai, Mumbai - 400076",
  items = DEFAULT_ITEMS,
  subtotal = "₹850",
  deliveryFee = "Free",
  total = "₹850",
  paymentMethod = "COD",
  initialStatus = "Pending",
  onBack,
  onAccept,
  onReject,
  onCallCustomer,
}) => {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderTimelineStep>(initialStatus);
  const [isRejected, setIsRejected] = useState(false);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/res/orders");
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    } else {
      setCurrentStatus("Preparing");
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject();
    } else {
      setIsRejected(true);
    }
  };

  const getStepIndex = (status: OrderTimelineStep) => {
    return TIMELINE_STEPS.indexOf(status);
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile Frame with Specifications */}
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
            <ChevronLeft size={24} />
          </button>

          <h1 className={styles.orderHeaderTitle}>Order {orderId}</h1>

          <div className={styles.headerPlaceholder} />
        </header>

        {/* Scrollable Content */}
        <main className={styles.contentArea}>
          {/* 1. Customer Card */}
          <section className={`${styles.card} ${styles.customerCard}`}>
            <div className={styles.customerLeft}>
              <div className={styles.avatarCircle}>{customerInitials}</div>
              <div className={styles.customerInfo}>
                <h2 className={styles.customerName}>{customerName}</h2>
                <p className={styles.customerTag}>{customerRole}</p>
              </div>
            </div>

            <a
              href={`tel:${customerPhone}`}
              className={styles.callButton}
              onClick={(e) => {
                if (onCallCustomer) {
                  e.preventDefault();
                  onCallCustomer();
                }
              }}
              aria-label={`Call ${customerName}`}
              title="Call Customer"
            >
              <Phone size={18} />
            </a>
          </section>

          {/* 2. Delivery Address Card */}
          <section className={`${styles.card} ${styles.addressCard}`}>
            <div className={styles.addressIconWrapper}>
              <MapPin size={18} />
            </div>
            <div className={styles.addressContent}>
              <span className={styles.sectionLabel}>DELIVERY ADDRESS</span>
              <p className={styles.addressText}>{deliveryAddress}</p>
            </div>
          </section>

          {/* 3. Items Ordered Card */}
          <section className={`${styles.card} ${styles.itemsCard}`}>
            <span className={styles.sectionLabel}>ITEMS ORDERED</span>

            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemMultiply}>×</span>
                    <span className={styles.itemQty}>{item.qty}</span>
                  </div>
                  <span className={styles.itemPrice}>{item.price}</span>
                </div>
              ))}
            </div>

            <div className={styles.divider} />

            {/* Bill Breakdown */}
            <div className={styles.billBreakdown}>
              <div className={styles.billRow}>
                <span className={styles.billLabel}>Subtotal</span>
                <span className={styles.billValue}>{subtotal}</span>
              </div>
              <div className={styles.billRow}>
                <span className={styles.billLabel}>Delivery fee</span>
                <span className={styles.freeDelivery}>{deliveryFee}</span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>{total}</span>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Payment Method */}
            <div className={styles.paymentRow}>
              <span className={styles.paymentLabel}>Payment Method</span>
              <span className={styles.codBadge}>{paymentMethod}</span>
            </div>
          </section>

          {/* 4. Status Timeline Card */}
          <section className={`${styles.card} ${styles.timelineCard}`}>
            <span className={styles.sectionLabel}>STATUS TIMELINE</span>

            <div className={styles.timelineList}>
              {TIMELINE_STEPS.map((step, index) => {
                const isActive = index <= activeIndex;
                const isCurrent = index === activeIndex;
                const isLast = index === TIMELINE_STEPS.length - 1;

                return (
                  <div key={step} className={styles.timelineStep}>
                    <div className={styles.indicatorWrapper}>
                      <div className={isActive ? styles.dotActive : styles.dotInactive} />
                      {!isLast && <div className={styles.connectingLine} />}
                    </div>
                    <p
                      className={
                        isCurrent ? styles.stepTitleActive : styles.stepTitleInactive
                      }
                    >
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {/* Bottom Actions: Accept order / Reject order */}
        <footer className={styles.bottomActions}>
          {!isRejected ? (
            <>
              <button
                type="button"
                className={styles.acceptButton}
                onClick={handleAccept}
              >
                {currentStatus === "Pending"
                  ? "Accept order"
                  : currentStatus === "Preparing"
                  ? "Mark Ready for Delivery"
                  : currentStatus === "Out for delivery"
                  ? "Mark as Delivered"
                  : "Order Completed"}
              </button>
              {currentStatus === "Pending" && (
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={handleReject}
                >
                  Reject order
                </button>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#EF4444", fontWeight: 700, padding: "10px" }}>
              Order Rejected
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ResponsiveSellerOrdersDetails;
