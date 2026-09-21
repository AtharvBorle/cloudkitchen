"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, Bell } from "lucide-react";
import styles from "./ResponsiveAssignRider.module.css";

export interface AvailableRiderItem {
  id: string;
  name: string;
  initials: string;
  distance: string;
  isAssigned?: boolean;
}

export interface ResponsiveAssignRiderProps {
  orderId?: string;
  itemCount?: number;
  orderTotal?: string;
  deliveryArea?: string;
  riders?: AvailableRiderItem[];
  onAssign?: (riderId: string) => void;
  onCopyShareLink?: () => void;
  onBack?: () => void;
}

const DEFAULT_RIDERS: AvailableRiderItem[] = [];

export const ResponsiveAssignRider: React.FC<ResponsiveAssignRiderProps> = ({
  orderId = "#---",
  itemCount = 0,
  orderTotal = "₹0",
  deliveryArea = "—",
  riders = DEFAULT_RIDERS,
  onAssign,
  onCopyShareLink,
  onBack,
}) => {
  const router = useRouter();
  const [assignedRiderId, setAssignedRiderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/res/orders/details");
    }
  };

  const handleAssignClick = (rider: AvailableRiderItem) => {
    setAssignedRiderId(rider.id);
    showToast(`${rider.name} assigned to Order ${orderId}!`);
    if (onAssign) {
      onAssign(rider.id);
    }
    setTimeout(() => {
      router.push(`/seller/orders/details?orderId=${encodeURIComponent(orderId)}`);
    }, 900);
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <h1 className={styles.headerTitle}>Assign Rider</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
          </button>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Order Details Summary */}
          <section className={styles.orderSummaryBox}>
            <h2 className={styles.orderHeading}>Order {orderId}</h2>
            <p className={styles.orderDetailsText}>
              {itemCount} items • {orderTotal} • {deliveryArea}
            </p>
          </section>

          {/* Available Riders List */}
          <section className={styles.ridersSection}>
            <h3 className={styles.sectionLabel}>AVAILABLE RIDERS</h3>

            <div className={styles.ridersList}>
              {riders.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", color: "#64748B", fontSize: "0.85rem" }}>
                  No delivery riders available.
                </div>
              ) : (
                riders.map((rider) => {
                  const isAssigned = assignedRiderId === rider.id;
                  return (
                    <article key={rider.id} className={styles.riderCard}>
                      <div className={styles.riderLeft}>
                        <div className={styles.avatarCircle}>{rider.initials}</div>
                        <div className={styles.riderInfo}>
                          <h4 className={styles.riderName}>{rider.name}</h4>
                          <p className={styles.riderDistance}>{rider.distance}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`${styles.assignButton} ${
                          isAssigned ? styles.assignButtonAssigned : ""
                        }`}
                        onClick={() => handleAssignClick(rider)}
                      >
                        {isAssigned ? "Assigned ✓" : "Assign"}
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </section>
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

export default ResponsiveAssignRider;

