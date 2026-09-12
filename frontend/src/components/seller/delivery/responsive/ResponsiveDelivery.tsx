"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, ChevronRight, Settings, Bell } from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveDelivery.module.css";
import { useSellerProfile } from "@/hooks/useSellerProfile";

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

export const ResponsiveDelivery: React.FC<ResponsiveDeliveryProps> = ({
  ownerName,
  totalOutstanding = "₹0",
  riders = [],
  onSelectRider,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && ownerName !== "Rahul Sharma" && ownerName !== "John Doe" ? ownerName : seller.ownerName;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const handleRiderClick = (rider: ResponsiveRiderItem) => {
    if (onSelectRider) {
      onSelectRider(rider);
    } else {
      router.push("/seller/delivery/handover");
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="delivery"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar with Hamburger Icon & Logo */}
        <header className={styles.topBar}>
          <div className={styles.headerLeftGroup}>
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
            <Link href="/seller/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          <h1 className={styles.pageTitle}>Delivery &amp; COD</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.push("/seller/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={22} />
              <span className={styles.notificationDot} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.push("/seller/delivery/settings")}
              aria-label="Delivery Settings"
              title="Delivery Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Total Outstanding Card */}
          <section
            className={styles.totalCard}
            onClick={() => router.push("/seller/delivery/riders")}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.totalCardHeader}>
              <span className={styles.totalLabel}>Total Outstanding</span>
              <span className={styles.viewRidersLink}>Manage Riders →</span>
            </div>
            <span className={styles.totalAmount}>{totalOutstanding}</span>
          </section>

          {/* Riders List Section */}
          <section className={styles.ridersSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionLabel}>RIDERS</h2>
              <button
                type="button"
                className={styles.sectionActionBtn}
                onClick={() => router.push("/seller/delivery/riders")}
              >
                View All Riders
              </button>
            </div>

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

