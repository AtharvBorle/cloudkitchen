import React from "react";
import styles from "./SettingsHeader.module.css";

export interface SettingsHeaderProps {
  title?: string;
  subtitle?: string;
  activeTabId?: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title = "General Settings",
  subtitle = "Manage your personal information, meal subscriptions, address book, and secure payment methods.",
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

export default SettingsHeader;
