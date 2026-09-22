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
  startedOn = "05 Jan, 2026",
  renewalDate = "05 Feb, 2026",
  planPrice = "₹2,999/month",
}) => {
  const tierColors = getTierColors(tier);
  const isCancelled = statusText?.toUpperCase() === "CANCELLED";

  return (
    <div className={styles.cardContainer}>
      {/* Top Row: Plan Info + ACTIVE badge */}
      <div className={styles.topRow}>
        <div className={styles.leftInfo}>
          <div className={styles.iconCircle}>
            {isPaused ? (
              <PauseCircle size={24} className={styles.pauseIcon} />
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
              : isPaused
              ? styles.pausedBadge
              : styles.activeBadgeGreen
          }`}
        >
          {isCancelled ? "CANCELLED" : isPaused ? "PAUSED" : statusText}
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
          <span className={styles.statValue}>{renewalDate}</span>
        </div>

        <div className={styles.statCol}>
          <span className={styles.statLabel}>PLAN PRICE</span>
          <span className={styles.priceValue}>{planPrice}</span>
        </div>
      </div>
    </div>
  );
};
