"use client";

import React from "react";
import styles from "./SubscriptionPlanCard.module.css";
import { Utensils, PauseCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { getTierColors } from "@/lib/meal-subscriptions";

export interface SubscriptionPlanCardProps {
  title?: string;
  subtitle?: string;
  tier?: string;
  statusText?: string;
  isPaused?: boolean;
  isExpired?: boolean;
  startedOn?: string;
  renewalDate?: string;
  planPrice?: string;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  title = "Daily Meal Plan",
  subtitle = "Standard Gourmet Subscription",
  tier = "Bronze",
  statusText = "ACTIVE",
  isPaused = false,
  isExpired: isExpiredProp,
  startedOn = "05 Jan, 2026",
  renewalDate = "05 Feb, 2026",
  planPrice = "₹2,999/month",
}) => {
  const tierColors = getTierColors(tier);
  const isCancelled = statusText?.toUpperCase() === "CANCELLED";

  // Check if renewal/expiry date has reached or passed
  const isDateReached = (() => {
    if (isExpiredProp) return true;
    if (statusText?.toUpperCase() === "EXPIRED") return true;
    if (!renewalDate) return false;
    if (renewalDate.toLowerCase().includes("expired")) return true;
    const cleanDateStr = renewalDate.replace(/\(expired\)/i, "").trim();
    const parsed = new Date(cleanDateStr);
    if (!isNaN(parsed.getTime())) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const parsedDayStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
      return parsedDayStart <= todayStart || parsed <= today;
    }
    return false;
  })();

  const isExpired = Boolean(isExpiredProp) || statusText?.toUpperCase() === "EXPIRED" || isDateReached;
  const isInactive = !isExpired && (statusText?.toUpperCase() === "INACTIVE" || statusText?.toUpperCase() === "DEACTIVATED");
  const isEffectivelyPaused = !isExpired && !isCancelled && !isInactive && isPaused;

  const displayStatus = isCancelled
    ? "CANCELLED"
    : isExpired
    ? "EXPIRED"
    : isInactive
    ? "INACTIVE"
    : isEffectivelyPaused
    ? "PAUSED"
    : (statusText?.toUpperCase() === "EXPIRED" ? "EXPIRED" : statusText || "ACTIVE");

  const displayRenewalDate = isExpired && renewalDate && !renewalDate.includes("(Expired)")
    ? `${renewalDate} (Expired)`
    : renewalDate;

  return (
    <div className={styles.cardContainer}>
      {/* Top Row: Plan Info + Status badge */}
      <div className={styles.topRow}>
        <div className={styles.leftInfo}>
          <div className={styles.iconCircle}>
            {isEffectivelyPaused ? (
              <PauseCircle size={24} className={styles.pauseIcon} />
            ) : isExpired ? (
              <AlertCircle size={22} className={styles.icon} color="#DC2626" />
            ) : (
              <Utensils size={22} className={styles.icon} />
            )}
          </div>
          <div>
            <div className={styles.titleWithTier}>
              <h2 className={styles.planTitle}>{title}</h2>
              {tier && (
                <span
                  className={styles.tierPill}
                  style={{
                    color: tierColors.tierColor,
                    backgroundColor: tierColors.tierBg,
                  }}
                >
                  {tier} Tier
                </span>
              )}
            </div>
            <p className={styles.planSubtitle}>{subtitle}</p>
          </div>
        </div>

        <span
          className={`${styles.activeBadge} ${
            isCancelled
              ? styles.cancelledBadge
              : isExpired
              ? styles.expiredBadge
              : isInactive
              ? styles.inactiveBadge
              : isEffectivelyPaused
              ? styles.pausedBadge
              : styles.activeBadgeGreen
          }`}
        >
          {displayStatus}
        </span>
      </div>

      {/* Bottom Stats: Started On, Renewal Date, Plan Price */}
      <div className={styles.statsRow}>
        <div className={styles.statCol}>
          <span className={styles.statLabel}>STARTED ON</span>
          <span className={styles.statValue}>{startedOn}</span>
        </div>

        <div className={styles.statCol}>
          <span className={styles.statLabel}>RENEWAL DATE</span>
          <span className={styles.statValue}>{displayRenewalDate}</span>
        </div>

        <div className={styles.statCol}>
          <span className={styles.statLabel}>PLAN PRICE</span>
          <span className={styles.priceValue}>{planPrice}</span>
        </div>
      </div>
    </div>
  );
};
