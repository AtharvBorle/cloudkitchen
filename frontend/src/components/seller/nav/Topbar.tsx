"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Menu, X } from "lucide-react";
import styles from "./Topbar.module.css";
import { useSellerProfile, computeInitials, isGenericFallbackName } from "@/hooks/useSellerProfile";

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
  ownerName,
  partnerRole,
  avatarInitials,
  searchPlaceholder,
  unreadCount = 4,
  onSearch,
  onNotificationClick,
  onMenuToggle,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const seller = useSellerProfile();
  const [searchQuery, setSearchQuery] = useState("");

  const effectiveOwnerName =
    ownerName && !isGenericFallbackName(ownerName)
      ? ownerName
      : (seller.businessName || seller.ownerName);
  const effectivePartnerRole =
    partnerRole && partnerRole !== "Neo Cloud Partner" ? partnerRole : seller.partnerRole;
  const effectiveAvatarInitials =
    avatarInitials && !isGenericFallbackName(avatarInitials) && avatarInitials !== "JD" && avatarInitials !== "KP" && avatarInitials !== "SE"
      ? avatarInitials
      : (seller.avatarInitials || computeInitials(effectiveOwnerName));

  const getDynamicPlaceholder = () => {
    if (searchPlaceholder && searchPlaceholder !== "Search order, room, dish...") {
      return searchPlaceholder;
    }
    if (pathname?.startsWith("/seller/menu") || pathname?.startsWith("/seller/res/menu") || pathname?.startsWith("/seller/edit-menu")) {
      return "Search dishes by name, category, or type...";
    }
    if (pathname?.startsWith("/seller/orders") || pathname?.startsWith("/seller/res/orders") || pathname?.startsWith("/seller/order-default")) {
      return "Search orders by ID, customer, dish, room...";
    }
    if (pathname?.startsWith("/seller/rooms") || pathname?.startsWith("/seller/res/rooms")) {
      return "Search rooms by suite, tier, price...";
    }
    if (pathname?.startsWith("/seller/booking") || pathname?.startsWith("/seller/res/booking")) {
      return "Search bookings by guest, room, status...";
    }
    if (pathname?.startsWith("/seller/delivery") || pathname?.startsWith("/seller/riderMng")) {
      return "Search riders by name, phone, status...";
    }
    if (pathname?.startsWith("/seller/subscription")) {
      return "Search subscription plans...";
    }
    if (pathname?.startsWith("/seller/support")) {
      return "Search support tickets, queries...";
    }
    return "Search orders, rooms, dishes...";
  };

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

  const handleClear = () => {
    setSearchQuery("");
    if (onSearch) onSearch("");
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
            placeholder={getDynamicPlaceholder()}
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
            aria-label="Search"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                display: "flex",
                alignItems: "center",
                color: "#94A3B8",
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
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
          <div className={styles.avatarCircle}>{effectiveAvatarInitials}</div>
          <div className={styles.profileInfo}>
            <span className={styles.ownerName}>{effectiveOwnerName}</span>
            <span className={styles.partnerRole}>{effectivePartnerRole}</span>
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

