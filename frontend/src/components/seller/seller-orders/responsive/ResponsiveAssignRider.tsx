"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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

const DEFAULT_RIDERS: AvailableRiderItem[] = [
  { id: "r1", name: "Rahul Kumar", initials: "RK", distance: "2.3 km away" },
  { id: "r2", name: "Amit Sharma", initials: "AS", distance: "3.1 km away" },
  { id: "r3", name: "Vikram Singh", initials: "VS", distance: "4.5 km away" },
];

export const ResponsiveAssignRider: React.FC<ResponsiveAssignRiderProps> = ({
  orderId = "#1234",
  itemCount = 3,
  orderTotal = "\u20B9850",
  deliveryArea = "Powai",
  riders = DEFAULT_RIDERS,
  onAssign,
  onCopyShareLink,
  onBack,
}) => {
  const router = useRouter();
  const [assignedRiderId, setAssignedRiderId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/res/orders");
    }
  };

  const handleAssignClick = (riderId: string) => {
    setAssignedRiderId(riderId);
    if (onAssign) {
      onAssign(riderId);
    } else {
      setTimeout(() => {
        router.push("/seller/res/orders");
      }, 600);
    }
  };

  const handleCopyLink = () => {
    if (onCopyShareLink) {
      onCopyShareLink();
    } else {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(
          `https://neocloud.app/order/${orderId.replace("#", "")}/pickup`
        );
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
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
            <ChevronLeft size={24} />
          </button>

          <h1 className={styles.headerTitle}>Assign Rider</h1>

          <div className={styles.headerPlaceholder} />
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Order Details Summary */}
          <section className={styles.orderSummaryBox}>
            <h2 className={styles.orderHeading}>Order {orderId}</h2>
            <p className={styles.orderDetailsText}>
              {itemCount} items · {orderTotal} · {deliveryArea}
            </p>
          </section>

          {/* Available Riders List */}
          <section>
            <h3 className={styles.sectionLabel}>AVAILABLE RIDERS</h3>

            <div className={styles.ridersList}>
              {riders.map((rider) => {
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
                      onClick={() => handleAssignClick(rider.id)}
                    >
                      {isAssigned ? "Assigned ✓" : "Assign"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Share Pickup Link Section */}
          <section>
            <h3 className={styles.sectionLabel}>OR SHARE PICKUP LINK</h3>

            <button
              type="button"
              className={styles.copyLinkButton}
              onClick={handleCopyLink}
            >
              {copied ? "Link Copied! ✓" : "Copy Share Link"}
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveAssignRider;

