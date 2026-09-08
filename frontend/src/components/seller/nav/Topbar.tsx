"use client";

import React, { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import styles from "./Topbar.module.css";

export interface TopbarProps {
  title?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onMenuToggle?: () => void;
}

export default function Topbar({
  title = "Owner Operations Console",
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
  searchPlaceholder = "Search order, room, dish...",
  onSearch,
  onNotificationClick,
  onMenuToggle,
}: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className={styles.sellerTopbar}>
      {/* Left: Title + Mobile Menu Trigger */}
      <div className={styles.leftSection}>
        {onMenuToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className={styles.mobileMenuTrigger}
            aria-label="Open sidebar navigation"
            title="Open Menu"
          >
            <Menu size={24} />
          </button>
        )}
        <h2 className={styles.title}>{title}</h2>
      </div>

      {/* Right Controls: Search + Notification + User Pill */}
      <div className={styles.rightControls}>
        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>

        {/* Notification Button */}
        <button
          type="button"
          onClick={onNotificationClick}
          className={styles.notificationBtn}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User Profile Pill */}
        <div className={styles.profilePill}>
          <div className={styles.avatarCircle}>{avatarInitials}</div>
          <div className={styles.profileInfo}>
            <span className={styles.ownerName}>{ownerName}</span>
            <span className={styles.partnerRole}>{partnerRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

