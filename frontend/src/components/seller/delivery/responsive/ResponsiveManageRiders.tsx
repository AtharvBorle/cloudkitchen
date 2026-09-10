"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, UserPlus, CheckCircle2, Copy, X, Bell } from "lucide-react";
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
  totalCodAmount = "₹14,800",
  riders = DEFAULT_MANAGED_RIDERS,
  onInviteRider,
  onSelectRider,
  onBack,
}) => {
  const router = useRouter();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/delivery");
    }
  };

  const handleRiderClick = (rider: ManagedRiderItem) => {
    if (onSelectRider) {
      onSelectRider(rider);
    } else {
      router.push("/seller/delivery/handover");
    }
  };

  const handleInvite = () => {
    if (onInviteRider) {
      onInviteRider();
    } else {
      setIsInviteModalOpen(true);
    }
  };

  const handleCopyInviteLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://neocloud.app/rider/join?hub=bangalore-central");
      showToast("Rider onboarding link copied!");
    } else {
      showToast("Rider link ready to share!");
    }
    setIsInviteModalOpen(false);
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

          <h1 className={styles.headerTitle}>Manage Riders</h1>

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
          <section className={styles.ridersSection}>
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

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              className={styles.inviteButton}
              onClick={() => router.push("/seller/delivery/add-agent")}
            >
              + Add Delivery Agent
            </button>

            <button
              type="button"
              onClick={handleInvite}
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#FFFFFF",
                color: "#F97316",
                border: "1.5px solid #FFEDD5",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              Share Onboarding Link
            </button>
          </div>
        </main>

        {/* Invite Rider Modal */}
        {isInviteModalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsInviteModalOpen(false)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalIconBox}>
                  <UserPlus size={22} color="#F97316" />
                </div>
                <div className={styles.modalTitleGroup}>
                  <h3 className={styles.modalTitle}>Invite Delivery Partner</h3>
                  <p className={styles.modalSubtext}>Share instant onboarding link</p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsInviteModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <p className={styles.modalBodyText}>
                Send this secure link to your delivery rider. They will be automatically registered to your kitchen hub upon signup.
              </p>

              <button
                type="button"
                className={styles.modalCopyBtn}
                onClick={handleCopyInviteLink}
              >
                <Copy size={16} />
                <span>Copy Onboarding Link</span>
              </button>
            </div>
          </div>
        )}

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

export default ResponsiveManageRiders;

