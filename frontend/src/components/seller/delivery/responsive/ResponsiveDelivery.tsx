"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu as MenuIcon, ChevronRight, Settings, Bell, Search, X } from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResponsiveDelivery.module.css";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";

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
  cashCollectedToday?: string;
  riders?: ResponsiveRiderItem[];
  onSelectRider?: (rider: ResponsiveRiderItem) => void;
  onSyncDevices?: () => void;
}

export const ResponsiveDelivery: React.FC<ResponsiveDeliveryProps> = ({
  ownerName,
  totalOutstanding = "₹0",
  cashCollectedToday = "₹0",
  riders = [],
  onSelectRider,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const { unreadCount } = useSellerNotifications();
  const effectiveOwnerName =
    ownerName &&
    ownerName !== "Rahul Sharma" &&
    ownerName !== "Rahul" &&
    ownerName !== "John Doe" &&
    ownerName !== "Kitchen Owner"
      ? ownerName
      : seller.ownerName;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRiders = React.useMemo(() => {
    if (!searchQuery.trim()) return riders;
    const q = searchQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    return riders.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const phone = (r.phone || "").toLowerCase();
      const id = (r.id || "").toLowerCase();
      if (name.includes(q) || phone.includes(q) || id.includes(q)) return true;
      if (tokens.length > 1) {
        return tokens.every((t) => name.includes(t) || phone.includes(t) || id.includes(t));
      }
      return false;
    });
  }, [riders, searchQuery]);

  const handleRiderClick = (rider: ResponsiveRiderItem) => {
    if (onSelectRider) {
      onSelectRider(rider);
    } else {
      router.push(`/seller/delivery/handover?riderId=${encodeURIComponent(rider.id)}`);
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
              {unreadCount > 0 && <span className={styles.notificationDot} />}
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
          {/* Delivery & COD Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Total Outstanding Card */}
            <section
              className={styles.totalCard}
              onClick={() => router.push("/seller/delivery/riders")}
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer", padding: "14px 16px" }}
            >
              <div className={styles.totalCardHeader}>
                <span className={styles.totalLabel} style={{ fontSize: "11px", fontWeight: 700 }}>COD Outstanding</span>
              </div>
              <span className={styles.totalAmount} style={{ fontSize: "20px" }}>{totalOutstanding}</span>
            </section>

            {/* Cash Collected Today Card */}
            <section
              className={styles.totalCard}
              style={{ padding: "14px 16px" }}
            >
              <div className={styles.totalCardHeader}>
                <span className={styles.totalLabel} style={{ fontSize: "11px", fontWeight: 700 }}>Cash Collected</span>
              </div>
              <span className={styles.totalAmount} style={{ fontSize: "20px", color: "#16A34A" }}>
                {cashCollectedToday}
              </span>
            </section>
          </div>

          {/* Riders List Section */}
          <section className={styles.ridersSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionLabel}>
                RIDERS ({filteredRiders.length}{searchQuery.trim() ? ` / ${riders.length}` : ""})
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  className={styles.sectionActionBtn}
                  onClick={() => router.push("/seller/delivery/add-agent")}
                  style={{ color: "#F97316", fontWeight: 700 }}
                >
                  + Add Delivery Boy
                </button>
                <button
                  type="button"
                  className={styles.sectionActionBtn}
                  onClick={() => router.push("/seller/delivery/riders")}
                >
                  View All
                </button>
              </div>
            </div>

            {/* Mobile Rider Search Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                padding: "8px 12px",
                gap: "8px",
                marginBottom: "12px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search riders by name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  outline: "none",
                  fontSize: "13px",
                  color: "#1E293B",
                  width: "100%",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {filteredRiders.length > 0 ? (
              <div className={styles.ridersList}>
                {filteredRiders.map((rider) => (
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
            ) : searchQuery.trim() ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No delivery persons found matching &quot;{searchQuery}&quot;.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#F1F5F9",
                    color: "#334155",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    padding: "7px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No active riders found.</p>
                <button
                  type="button"
                  onClick={() => router.push("/seller/delivery/add-agent")}
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#F97316",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Delivery Boy
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveDelivery;

