"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  X,
  ShoppingBag,
  Package,
  Truck,
  Calendar,
  Clock,
  Star,
  CheckCheck,
  ChevronRight,
  Inbox,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import styles from "./Topbar.module.css";
import { useSellerProfile, computeInitials, isGenericFallbackName, toggleSellerOnlineStatus } from "@/hooks/useSellerProfile";
import { useSellerNotifications, broadcastShopTimingAlert } from "@/hooks/useSellerNotifications";
import { NotificationCategory } from "../seller-notifications/notificationData";

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
  unreadCount: unreadCountProp,
  onSearch,
  onNotificationClick,
  onMenuToggle,
  onMenuClick,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const seller = useSellerProfile();
  const {
    notifications,
    unreadCount: liveUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useSellerNotifications();
  const effectiveUnreadCount = typeof unreadCountProp === "number" ? unreadCountProp : liveUnreadCount;
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleMenu = onMenuToggle || onMenuClick;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

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

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "orders":
        return <ShoppingBag size={16} />;
      case "stock":
        return <Package size={16} />;
      case "delivery":
        return <Truck size={16} />;
      case "bookings":
        return <Calendar size={16} />;
      case "timings":
        return <Clock size={16} />;
      case "reviews":
        return <Star size={16} />;
      case "settlements":
        return <DollarSign size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getCategoryClass = (category: NotificationCategory) => {
    switch (category) {
      case "orders":
        return styles.iconOrders;
      case "stock":
        return styles.iconStock;
      case "delivery":
        return styles.iconDelivery;
      case "bookings":
        return styles.iconBookings;
      case "timings":
        return styles.iconTimings;
      case "reviews":
        return styles.iconReviews;
      default:
        return styles.iconOrders;
    }
  };

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
      setIsDropdownOpen((prev) => !prev);
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
            const nextStatus = !seller.isOnline;
            await toggleSellerOnlineStatus(nextStatus);
            try {
              broadcastShopTimingAlert({ isOpen: nextStatus });
            } catch {}
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

        {/* Notification Button & Interactive Popup */}
        <div className={styles.notificationWrapper} ref={dropdownRef}>
          <button
            type="button"
            onClick={handleNotificationClick}
            className={`${styles.notificationBtn} notification-btn`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={22} strokeWidth={2.2} />
            {effectiveUnreadCount > 0 && (
              <span className={styles.notificationBadge}>
                {effectiveUnreadCount > 99 ? "99+" : effectiveUnreadCount}
              </span>
            )}
          </button>

          {/* Notification Popup Dropdown */}
          {isDropdownOpen && (
            <div className={styles.notificationDropdown} role="dialog" aria-label="Notifications list">
              {/* Header */}
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownHeaderLeft}>
                  <h4 className={styles.dropdownTitle}>Notifications</h4>
                  {effectiveUnreadCount > 0 ? (
                    <span className={styles.dropdownBadge}>{effectiveUnreadCount} New</span>
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#16A34A" }}>
                      All caught up
                    </span>
                  )}
                </div>

                {effectiveUnreadCount > 0 && (
                  <button
                    type="button"
                    className={styles.markAllReadBtn}
                    onClick={() => {
                      markAllAsRead();
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className={styles.dropdownList}>
                {notifications.length === 0 ? (
                  <div className={styles.dropdownEmpty}>
                    <Inbox size={28} color="#94A3B8" />
                    <p className={styles.dropdownEmptyTitle}>No Notifications</p>
                    <p className={styles.dropdownEmptyDesc}>You are completely caught up!</p>
                  </div>
                ) : (
                  notifications.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.dropdownItem} ${!item.isRead ? styles.unreadItem : ""}`}
                      onClick={() => {
                        markAsRead(item.id);
                        setIsDropdownOpen(false);
                        if (item.actionHref) {
                          router.push(item.actionHref);
                        }
                      }}
                    >
                      <div className={`${styles.dropdownIconWrapper} ${getCategoryClass(item.category)}`}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className={styles.dropdownItemContent}>
                        <div className={styles.dropdownItemHeader}>
                          <h5 className={styles.dropdownItemTitle}>
                            {!item.isRead && <span className={styles.unreadDot} />}
                            {item.title}
                          </h5>
                          <span className={styles.dropdownItemTime}>{item.timeAgo}</span>
                        </div>
                        <p className={styles.dropdownItemMessage}>{item.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className={styles.dropdownFooter}>
                <button
                  type="button"
                  className={styles.viewAllBtn}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/seller/notifications");
                  }}
                >
                  <span>Open Notifications Center</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>


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

