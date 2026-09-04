"use client";

import React from "react";
import styles from "./SubscriptionHeader.module.css";

export interface SubscriptionHeaderProps {
  title?: string;
  subtitle?: string;
}

export const SubscriptionHeader: React.FC<SubscriptionHeaderProps> = ({
  title = "My Subscriptions",
  subtitle = "Manage your active daily meals, delivery schedule, and billing preferences.",
}) => {
  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
};
