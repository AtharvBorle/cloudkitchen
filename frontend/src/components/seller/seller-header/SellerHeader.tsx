"use client";

import React from "react";
import { Search, Bell } from "lucide-react";
import styles from "./SellerHeader.module.css";

export interface SellerHeaderProps {
  title?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
}

export const SellerHeader: React.FC<SellerHeaderProps> = ({
  title = "Neo Cloud Room Onboarding",
  userName = "John Doe",
  userRole = "Owner Account",
  userInitials = "JD",
}) => {
  return (
    <header className={styles.header}>
      {/* Left: Title */}
      <h1 className={styles.pageTitle}>{title}</h1>

      {/* Right: Search + Notifications + Profile */}
      <div className={styles.rightSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search properties..."
            className={styles.searchInput}
          />
        </div>

        <button
          type="button"
          className={styles.notificationBtn}
          aria-label="Notifications"
        >
          <Bell className={styles.bellIcon} />
        </button>

        <div className={styles.profileSection}>
          <div className={styles.avatar}>{userInitials}</div>
          <div className={styles.profileInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;
