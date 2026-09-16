"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Menu, X } from "lucide-react";
import styles from "./Topbar.module.css";
import { useSellerProfile, computeInitials, isGenericFallbackName, toggleSellerOnlineStatus } from "@/hooks/useSellerProfile";

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
  onMenuClick?: () => void;
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
  onMenuClick,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const seller = useSellerProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const handleMenu = onMenuToggle || onMenuClick;

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
    if (pathname?.startsWith("/seller/reviews") || pathname?.startsWith("/seller/res/reviews")) {
      return "Search reviews, feedback, ratings...";
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

  const getEffectiveTitle = () => {
    if (title && title !== "Owner Operations Console") {
      return title;
    }
    if (pathname?.startsWith("/seller/reviews") || pathname?.startsWith("/seller/res/reviews") || pathname?.startsWith("/dashboard/seller/reviews")) {
      return "Reviews & Feedback";
    }
    if (pathname?.startsWith("/seller/offers/create") || pathname?.startsWith("/seller/res/offers/create") || pathname?.startsWith("/dashboard/seller/offers/create")) {
      return "Create New Offer";
    }
    if (pathname?.startsWith("/seller/offers/edit") || pathname?.startsWith("/seller/res/offers/edit") || pathname?.startsWith("/dashboard/seller/offers/edit")) {
      return "Edit Offer";
    }
    if (pathname?.startsWith("/seller/offers") || pathname?.startsWith("/seller/res/offers") || pathname?.startsWith("/dashboard/seller/offers")) {
      return "Offers & Coupons";
    }
    return title || "Owner Operations Console";
  };

  const displayTitle = getEffectiveTitle();

  return (
    <header className={`${styles.sellerTopbar} seller-topbar`}>
      {/* Left: Title + Mobile Menu Trigger */}
      <div className={styles.leftSection}>
        {handleMenu && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMenu();
            }}
            className={styles.mobileMenuTrigger}
            aria-label="Open sidebar navigation"
            title="Open Menu"
          >
            <Menu size={24} strokeWidth={2.2} />
          </button>
        )}
        <h2 className={`${styles.title} topbar-title`}>{displayTitle}</h2>
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

        {/* Store Status Toggle */}
        <button
          type="button"
          onClick={async () => {
            await toggleSellerOnlineStatus(!seller.isOnline);
          }}
          className={`${styles.statusToggleBtn || ""} topbar-status-toggle`}
          title={seller.isOnline ? "Store is ONLINE (Click to switch to Offline)" : "Store is OFFLINE (Click to switch to Online)"}
          aria-label={seller.isOnline ? "Store is Online" : "Store is Offline"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 12px",
            borderRadius: "9999px",
            border: `1px solid ${seller.isOnline ? "#BBF7D0" : "#FECACA"}`,
            backgroundColor: seller.isOnline ? "#F0FDF4" : "#FEF2F2",
            color: seller.isOnline ? "#15803D" : "#B91C1C",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: seller.isOnline ? "#22C55E" : "#EF4444",
              boxShadow: seller.isOnline ? "0 0 6px rgba(34, 197, 94, 0.7)" : "none",
              display: "inline-block",
            }}
          />
          <span>{seller.isOnline ? "Store Open" : "Store Closed"}</span>
        </button>

        {/* Notification Button */}
        <button
          type="button"
          onClick={handleNotificationClick}
          className={`${styles.notificationBtn} notification-btn`}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={22} strokeWidth={2.2} />
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
        @media (max-width: 900px) {
          .seller-topbar {
            padding: 0 16px !important;
            height: 56px !important;
            min-height: 56px !important;
          }
          .topbar-title {
            font-size: 16.5px !important;
            font-weight: 700 !important;
            color: #0F172A !important;
            max-width: none !important;
            white-space: nowrap !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          .topbar-search {
            display: none !important;
          }
          .topbar-status-toggle {
            display: none !important;
          }
          .topbar-user-pill {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .seller-topbar {
            padding: 0 14px !important;
            height: 56px !important;
            min-height: 56px !important;
          }
          .topbar-title {
            font-size: 16px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </header>
  );
}

