"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ResponsiveManageRiders.module.css";

export interface ManagedRiderItem {
  id: string;
  name: string;
  initials: string;
  phone: string;
  status: "Online" | "Offline";
}

export interface ResponsiveManageRidersProps {
  activeRidersCount?: number;
  totalCodAmount?: string;
  riders?: ManagedRiderItem[];
  onInviteRider?: () => void;
  onSelectRider?: (rider: ManagedRiderItem) => void;
  onBack?: () => void;
}

const DEFAULT_MANAGED_RIDERS: ManagedRiderItem[] = [
  {
    id: "r1",
    name: "Rahul Kumar",
    initials: "RK",
    phone: "+91 98765 00101",
    status: "Online",
  },
  {
    id: "r2",
    name: "Amit Sharma",
    initials: "AS",
    phone: "+91 98765 00102",
    status: "Online",
  },
  {
    id: "r3",
    name: "Vikram Singh",
    initials: "VS",
    phone: "+91 98765 00103",
    status: "Offline",
  },
  {
    id: "r4",
    name: "Suresh Raina",
    initials: "SR",
    phone: "+91 98765 00104",
    status: "Offline",
  },
];

export const ResponsiveManageRiders: React.FC<ResponsiveManageRidersProps> = ({
  activeRidersCount = 4,
  totalCodAmount = "\u20B914,800",
  riders = DEFAULT_MANAGED_RIDERS,
  onInviteRider,
  onSelectRider,
  onBack,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/res/delivery");
    }
  };

  const handleRiderClick = (rider: ManagedRiderItem) => {
    if (onSelectRider) {
      onSelectRider(rider);
    } else {
      router.push("/seller/res/delivery/handover");
    }
  };

  const handleInvite = () => {
    if (onInviteRider) {
      onInviteRider();
    } else {
      router.push("/seller/riderMng");
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

          <h1 className={styles.headerTitle}>Manage Riders</h1>

          <div className={styles.headerPlaceholder} />
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Top Metric Strip */}
          <section className={styles.metricRow}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Active Riders</span>
              <span className={styles.metricValue}>{activeRidersCount}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total COD</span>
              <span className={styles.metricValue}>{totalCodAmount}</span>
            </div>
          </section>

          {/* Riders List Section */}
          <section>
            <h2 className={styles.sectionLabel}>YOUR RIDERS</h2>

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
                  <div className={styles.riderLeft}>
                    <div className={styles.avatarCircle}>{rider.initials}</div>
                    <div className={styles.riderInfo}>
                      <h3 className={styles.riderName}>{rider.name}</h3>
                      <p className={styles.riderPhone}>{rider.phone}</p>
                    </div>
                  </div>

                  <div className={styles.riderRight}>
                    <span
                      className={`${styles.statusPill} ${
                        rider.status === "Online"
                          ? styles.statusOnline
                          : styles.statusOffline
                      }`}
                    >
                      {rider.status}
                    </span>
                    <ChevronRight size={18} className={styles.chevronIcon} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Invite Rider Button */}
          <button
            type="button"
            className={styles.inviteButton}
            onClick={handleInvite}
          >
            + Invite Rider
          </button>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveManageRiders;

