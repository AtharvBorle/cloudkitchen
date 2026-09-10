"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import styles from "./Topbar.module.css";

export interface TopbarProps {
  title?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  searchPlaceholder?: string;
  unreadCount?: number;
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
  unreadCount = 4,
  onSearch,
  onNotificationClick,
  onMenuToggle,
}: TopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      router.push("/seller/notifications");
    }
  };


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className={`${styles.sellerTopbar} seller-topbar`}>
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
        <h2 className={`${styles.title} topbar-title`}>{title}</h2>
      </div>

      {/* Right Controls: Search + Notification + User Pill */}
      <div className={styles.rightControls}>
        {/* Search Bar */}
        <div className={`${styles.searchWrapper} topbar-search`}>
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
          onClick={handleNotificationClick}
          className={`${styles.notificationBtn} notification-btn`}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className={styles.notificationBadge}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>


        {/* User Profile Pill */}
        <div className={`${styles.profilePill} topbar-user-pill`}>
          <div className={styles.avatarCircle}>{avatarInitials}</div>
          <div className={styles.profileInfo}>
            <span className={styles.ownerName}>{ownerName}</span>
            <span className={styles.partnerRole}>{partnerRole}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notification-btn:hover {
          background-color: #F1F5F9 !important;
          color: #0F172A !important;
        }
        @media (max-width: 900px) {
          .seller-topbar {
            padding: 0 16px !important;
          }
          .topbar-title {
            font-size: 15px !important;
            max-width: 220px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .topbar-search {
            display: none !important;
          }
          .topbar-user-pill {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .seller-topbar {
            padding: 0 12px !important;
          }
          .topbar-title {
            font-size: 14px !important;
            max-width: 180px !important;
          }
        }
      `}</style>
    </header>
  );
}

