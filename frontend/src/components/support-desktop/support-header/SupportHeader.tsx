import React from "react";
import styles from "./SupportHeader.module.css";

export interface SupportHeaderProps {
  title?: string;
  subtitle?: string;
}

export const SupportHeader: React.FC<SupportHeaderProps> = ({
  title = "Help & FAQ",
  subtitle = "Find quick answers to common questions about orders, meal subscriptions, room bookings, and payments.",
}) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerTopRow}>
        <div className={styles.headerTitleCol}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default SupportHeader;
