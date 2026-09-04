"use client";

import React from "react";
import styles from "./NotificationsHeader.module.css";

export interface NotificationsHeaderProps {
  title?: string;
  subtitle?: string;
}

export const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({
  title = "Notifications",
  subtitle = "Manage how and when you receive order updates, menu alerts, and promotional newsletters.",
}) => {
  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
};