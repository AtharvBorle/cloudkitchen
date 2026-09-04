"use client";

import React from "react";
import styles from "./SettingsHeader.module.css";

export interface SettingsHeaderProps {
  title?: string;
  subtitle?: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title = "General Settings",
  subtitle = "Manage your personal information, meal subscriptions, address book, and secure payment methods.",
}) => {
  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
};

export default SettingsHeader;
