"use client";

import React from "react";
import { Search, Bell, Menu } from "lucide-react";
import styles from "./SellerHeader.module.css";

export interface SellerHeaderProps {
  title?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  onMenuToggle?: () => void;
}

export const SellerHeader: React.FC<SellerHeaderProps> = ({
  title = "Neo Cloud Room Onboarding",
  userName = "John Doe",
  userRole = "Owner Account",
  userInitials = "JD",
  onMenuToggle,
}) => {
  return (
    <header className={styles.header}>
      {/* Left: Menu toggle + Title */}
      <div className={styles.leftSection}>
        {onMenuToggle && (
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onMenuToggle}
            aria-label="Open sidebar"
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
        )}
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

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
