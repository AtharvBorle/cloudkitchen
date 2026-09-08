"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, ChevronRight } from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveDelivery.module.css";

export interface ResponsiveRiderItem {
  id: string;
  name: string;
  initials: string;
  phone: string;
  outstandingAmount: string;
}

export interface ResponsiveDeliveryProps {
  ownerName?: string;
  totalOutstanding?: string;
  riders?: ResponsiveRiderItem[];
  onSelectRider?: (rider: ResponsiveRiderItem) => void;
  onSyncDevices?: () => void;
}

const DEFAULT_RIDERS: ResponsiveRiderItem[] = [
  {
    id: "r1",
    name: "Rahul Kumar",
    initials: "RK",
    phone: "+91 98765 00101",
    outstandingAmount: "\u20B94,200",
  },
  {
    id: "r2",
    name: "Amit Sharma",
    initials: "AS",
    phone: "+91 98765 00102",
    outstandingAmount: "\u20B93,850",
  },
  {
    id: "r3",
    name: "Vikram Singh",
    initials: "VS",
    phone: "+91 98765 00103",
    outstandingAmount: "\u20B93,150",
  },
  {
    id: "r4",
    name: "Suresh Raina",
    initials: "SR",
    phone: "+91 98765 00104",
    outstandingAmount: "\u20B93,600",
  },
];

export const ResponsiveDelivery: React.FC<ResponsiveDeliveryProps> = ({
  ownerName = "Rahul Sharma",
  totalOutstanding = "\u20B914,800",
  riders = DEFAULT_RIDERS,
  onSelectRider,
  onSyncDevices,
}) => {
  const router = useRouter();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const handleRiderClick = (rider: ResponsiveRiderItem) => {
    if (onSelectRider) {
      onSelectRider(rider);
    } else {
      router.push("/seller/riderMng/settlements");
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="delivery"
        ownerName={ownerName}
        onSyncDevices={onSyncDevices}
      />

      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar with Hamburger Icon */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsNavMenuOpen(true);
            }}
            aria-label="Open Navigation Menu"
            title="Menu"
          >
            <MenuIcon size={24} />
          </button>

          <h1 className={styles.pageTitle}>Delivery &amp; COD</h1>

          <div className={styles.headerPlaceholder} />
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Total Outstanding Card */}
          <section className={styles.totalCard}>
            <span className={styles.totalLabel}>Total Outstanding</span>
            <span className={styles.totalAmount}>{totalOutstanding}</span>
          </section>

          {/* Riders List Section */}
          <section className={styles.ridersSection}>
            <h2 className={styles.sectionLabel}>RIDERS</h2>

            {riders.length > 0 ? (
              <div className={styles.ridersList}>
                {riders.map((rider) => (
                  <article
                    key={rider.id}
                    className={styles.riderCard}
                    onClick={() => handleRiderClick(rider)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleRiderClick(rider);
                      }
                    }}
                  >
                    {/* Left: Avatar & Info */}
                    <div className={styles.riderLeft}>
                      <div className={styles.avatarCircle}>
                        {rider.initials}
                      </div>
                      <div className={styles.riderInfo}>
                        <h3 className={styles.riderName}>{rider.name}</h3>
                        <p className={styles.riderPhone}>{rider.phone}</p>
                      </div>
                    </div>

                    {/* Right: Amount & Chevron */}
                    <div className={styles.riderRight}>
                      <span className={styles.riderAmount}>
                        {rider.outstandingAmount}
                      </span>
                      <ChevronRight size={18} className={styles.chevronIcon} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No active riders found.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveDelivery;

