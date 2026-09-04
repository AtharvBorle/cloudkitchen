"use client";

import React from "react";
import styles from "./SubscriptionPlanCard.module.css";
import { XCircle } from "lucide-react";

export interface SubscriptionPlanCardProps {
  title?: string;
  subtitle?: string;
  statusText?: string;
  startedOn?: string;
  renewalDate?: string;
  planPrice?: string;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  title = "Daily Meal Plan",
  subtitle = "Standard Gourmet Subscription",
  statusText = "ACTIVE",
  startedOn = "05 Jan, 2026",
  renewalDate = "05 Feb, 2026",
  planPrice = "₹2,999/month",
}) => {
  return (
    <div className={styles.cardContainer}>
      {/* Top Row: Plan Info + ACTIVE badge */}
      <div className={styles.topRow}>
        <div className={styles.leftInfo}>
          <div className={styles.iconCircle}>
            <XCircle size={22} className={styles.icon} />
          </div>
          <div>
            <h2 className={styles.planTitle}>{title}</h2>
            <p className={styles.planSubtitle}>{subtitle}</p>
          </div>
        </div>

        <span className={styles.activeBadge}>{statusText}</span>
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
