"use client";

import React from "react";
import styles from "./SubscriptionBenefits.module.css";
import { CheckCircle2 } from "lucide-react";

export interface SubscriptionBenefitsProps {
  benefits?: string[];
}

const DEFAULT_BENEFITS = [
  "Daily curated menus with fresh farm ingredients",
  "Completely free delivery on all scheduled meals",
  "Flexible customization (easily swap ingredients or meals)",
  "No-lock-in contracts — cancel or pause anytime",
];

export const SubscriptionBenefits: React.FC<SubscriptionBenefitsProps> = ({
  benefits = DEFAULT_BENEFITS,
}) => {
  return (
    <div className={styles.cardContainer}>
      <h3 className={styles.cardHeading}>Subscription Benefits</h3>

      <div className={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <div key={index} className={styles.benefitRow}>
            <div className={styles.checkBadge}>
              <CheckCircle2 size={16} strokeWidth={2.4} className={styles.checkIcon} />
            </div>
            <span className={styles.benefitText}>{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

