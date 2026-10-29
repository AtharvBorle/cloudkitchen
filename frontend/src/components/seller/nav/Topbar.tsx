"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Check,
  CheckCheck,
  ChevronRight,
  Inbox,
  AlertCircle,
  DollarSign,
  Trash2,
} from "lucide-react";
import styles from "./Topbar.module.css";
import { useSellerProfile, computeInitials, isGenericFallbackName, toggleSellerOnlineStatus } from "@/hooks/useSellerProfile";
import { useSellerNotifications, broadcastShopTimingAlert } from "@/hooks/useSellerNotifications";
import { NotificationCategory, formatNotificationTime, formatNotificationMessage } from "../seller-notifications/notificationData";

export interface TopbarProps {
  title?: string;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  unreadCount?: number;
  showSearch?: boolean;
  hideSearch?: boolean;
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
  searchQuery: propSearchQuery,
  unreadCount: unreadCountProp,
  showSearch,
  hideSearch,
  onSearch,
  onNotificationClick,
  onMenuToggle,
  onMenuClick,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSettingsPage = pathname?.includes("/seller/settings") || pathname?.includes("/settings");
  const isSupportPage = pathname?.includes("/seller/support") || pathname?.includes("/support");
  const isProfilePage = pathname?.includes("/seller/profile") || pathname?.includes("/profile");
  const shouldShowSearch = showSearch !== undefined ? showSearch : (hideSearch ? false : !isSettingsPage && !isSupportPage && !isProfilePage);
  const seller = useSellerProfile();
  const {
    notifications,
    unreadCount: liveUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSellerNotifications();
  const effectiveUnreadCount = typeof unreadCountProp === "number" ? unreadCountProp : liveUnreadCount;
  const [localSearchQuery, setLocalSearchQuery] = useState(propSearchQuery || "");
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "updates">("all");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleMenu = onMenuToggle || onMenuClick;

  useEffect(() => {
    if (propSearchQuery !== undefined) {
      setLocalSearchQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

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

  useEffect(() => {
    if (!isDropdownOpen) {
      setIsSelectionMode(false);
      setSelectedIds([]);
    }
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

  const filteredNotifications = useMemo(() => {
    if (activeTab === "orders") {
      return notifications.filter(
        (n) => n.category === "orders" || n.title?.toLowerCase().includes("order")
      );
    }
    if (activeTab === "updates") {
      return notifications.filter(
        (n) => n.category !== "orders" && !n.title?.toLowerCase().includes("order")
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  const isAllFilteredSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.includes(n.id));
  const isSomeFilteredSelected =
    filteredNotifications.some((n) => selectedIds.includes(n.id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const handleToggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => deleteNotification(id));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleMarkItemRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const getItemTag = (item: any) => {
    if (item.category === "stock") return { text: "STOCK ALERT", color: "red" };
    if (item.category === "orders") {
      const isCancelled = item.severity === "cancelled" || item.title?.toLowerCase().includes("cancelled");
      return { text: isCancelled ? "CANCELLED" : "ORDER UPDATE", color: isCancelled ? "red" : "orange" };
    }
    if (item.category === "delivery") return { text: "DELIVERY", color: "green" };
    if (item.category === "offers") return { text: "OFFER", color: "green" };
    if (item.category === "timings") return { text: "TIMING ALERT", color: "orange" };
    if (item.category === "reviews") return { text: "REVIEW", color: "purple" };
    return { text: (item.category || "UPDATE").toUpperCase(), color: "blue" };
  };

  const getTagColorClass = (color: string) => {
    switch (color) {
      case "orange":
        return styles.tagOrange;
      case "green":
        return styles.tagGreen;
      case "purple":
        return styles.tagPurple;
      case "blue":
        return styles.tagBlue;
      case "red":
        return styles.tagRed;
      default:
        return styles.tagOrange;
    }
  };

  const getItemActionText = (item: any) => {
    if (item.actionLabel) return item.actionLabel;
    if (item.category === "orders") return "View Details";
    if (item.category === "stock") return "Manage Stock";
    return "View Details";
  };

  const renderItemIcon = (category: NotificationCategory) => {
    switch (category) {
      case "orders":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconOrders}`}>
            <Package size={18} strokeWidth={2.2} />
          </div>
        );
      case "stock":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconStock}`}>
            <Package size={18} strokeWidth={2.2} />
          </div>
        );
      case "delivery":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconDelivery}`}>
            <Truck size={18} strokeWidth={2.2} />
          </div>
        );
      case "offers":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconOffers}`}>
            <ShoppingBag size={18} strokeWidth={2.2} />
          </div>
        );
      case "timings":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconTimings}`}>
            <Clock size={18} strokeWidth={2.2} />
          </div>
        );
      case "reviews":
        return (
          <div className={`${styles.itemIconBox} ${styles.iconReviews}`}>
            <Star size={18} strokeWidth={2.2} />
          </div>
        );
      default:
        return (
          <div className={`${styles.itemIconBox} ${styles.iconSystem}`}>
            <Bell size={18} strokeWidth={2.2} />
          </div>
        );
    }
  };

  const resolveTargetHref = (item: any) => {
    let targetHref = item.actionHref;
    if (
      item.category === "orders" ||
      item.actionLabel === "View Order" ||
      item.actionLabel === "Track Delivery" ||
      item.actionLabel === "Track Dispatch" ||
      item.title?.toLowerCase().includes("order")
    ) {
      let orderId = item.metadata?.orderId;
      if (!orderId) {
        const idMatch = item.id?.match(/^(?:notif-order-|notif-deliv-|ord-[a-z]+-)(.+)$/);
        if (idMatch && idMatch[1]) {
          orderId = idMatch[1].replace(/^ORD-/i, "");
        }
      }
      if (!orderId && targetHref) {
        try {
          const parsed = new URL(targetHref, "http://localhost");
          const paramId = parsed.searchParams.get("orderId") || parsed.searchParams.get("id");
          if (paramId) orderId = paramId.replace(/^#/, "").replace(/^ORD-/i, "");
        } catch {}
      }
      if (!orderId) {
        const match = item.title?.match(/#([A-Za-z0-9-]+)/);
        if (match && match[1]) {
          orderId = match[1].replace(/^(?:ORD|NCR)-/i, "");
        }
      }
      if (orderId) {
        return `/seller/orders/details?orderId=${encodeURIComponent(orderId)}`;
      }
    }
    return targetHref || "/seller/notifications";
  };

  const handleItemClick = (item: any) => {
    if (isSelectionMode) {
      setSelectedIds((prev) =>
        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
      );
      return;
    }
    markAsRead(item.id);
    setIsDropdownOpen(false);
    const target = resolveTargetHref(item);
    if (target) {
      router.push(target);
    }
  };

  const getDynamicPlaceholder = () => {
    if (searchPlaceholder && searchPlaceholder !== "Search order, room, dish...") {
      return searchPlaceholder;
    }
    if (pathname?.startsWith("/seller/menu") || pathname?.startsWith("/seller/res/menu") || pathname?.startsWith("/seller/edit-menu")) {
      return "Search dishes by name, category, or type...";
    }
    if (pathname === "/seller/dashboard" || pathname === "/seller" || pathname?.startsWith("/seller/dashboard") || pathname?.startsWith("/seller/res/dashboard")) {
      return "Search by customer name or order ID...";
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
    if (pathname?.startsWith("/seller/offers") || pathname?.startsWith("/seller/res/offers") || pathname?.startsWith("/dashboard/seller/offers")) {
      return "Search offers, coupons, promo codes...";
    }
    if (pathname?.startsWith("/seller/notifications") || pathname?.startsWith("/seller/res/notifications") || pathname?.startsWith("/dashboard/seller/notifications")) {
      return "Search notifications, alerts, orders...";
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
    setLocalSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleClear = () => {
    setLocalSearchQuery("");
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
    if (pathname?.startsWith("/seller/notifications") || pathname?.startsWith("/seller/res/notifications") || pathname?.startsWith("/dashboard/seller/notifications")) {
      return "Notifications";
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
        {shouldShowSearch && (
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
        )}

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
              {/* Upward pointer arrow */}
              <div className={styles.dropdownArrow} aria-hidden="true" />

              {/* Header */}
              <div className={styles.header}>
                {isSelectionMode ? (
                  <div className={styles.selectionHeaderTop}>
                    <div
                      className={styles.selectAllGroup}
                      onClick={handleToggleSelectAll}
                      role="button"
                      tabIndex={0}
                      aria-label="Select all notifications"
                    >
                      <div
                        className={`${styles.checkbox} ${
                          isAllFilteredSelected
                            ? styles.checkboxChecked
                            : isSomeFilteredSelected
                            ? styles.checkboxIndeterminate
                            : ""
                        }`}
                      >
                        {isAllFilteredSelected && <Check size={12} strokeWidth={3} color="#FFFFFF" />}
                        {!isAllFilteredSelected && isSomeFilteredSelected && (
                          <span className={styles.indeterminateBar} />
                        )}
                      </div>
                      <span className={styles.selectAllText}>Select all</span>
                      {selectedIds.length > 0 && (
                        <span className={styles.selectedCountPill}>{selectedIds.length}</span>
                      )}
                    </div>

                    <div className={styles.selectionActions}>
                      <button
                        type="button"
                        className={styles.deleteSelectedBtn}
                        onClick={handleDeleteSelected}
                        disabled={selectedIds.length === 0}
                        title={
                          selectedIds.length > 0
                            ? `Delete ${selectedIds.length} selected notification${selectedIds.length > 1 ? "s" : ""}`
                            : "Select notifications to delete"
                        }
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                        <span>Delete{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}</span>
                      </button>

                      <button
                        type="button"
                        className={styles.cancelSelectionBtn}
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedIds([]);
                        }}
                        title="Cancel selection"
                      >
                        <X size={14} strokeWidth={2.4} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.headerTop}>
                    <div className={styles.headerTitleGroup}>
                      <div className={styles.headerIconBox}>
                        <Bell size={16} strokeWidth={2.4} />
                      </div>
                      <h4 className={styles.title}>Notifications</h4>
                      {effectiveUnreadCount > 0 ? (
                        <span className={styles.unreadCountPill}>
                          {effectiveUnreadCount} New
                        </span>
                      ) : (
                        <span className={styles.allReadPill}>
                          All caught up
                        </span>
                      )}
                    </div>

                    <div className={styles.headerActions}>
                      {effectiveUnreadCount > 0 && (
                        <button
                          type="button"
                          className={styles.markAllReadBtn}
                          onClick={() => markAllAsRead()}
                          title="Mark all notifications as read"
                        >
                          <CheckCheck size={14} />
                          <span>Read all</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          className={styles.clearAllBtn}
                          onClick={() => setIsSelectionMode(true)}
                          title="Select & delete notifications"
                          aria-label="Select and delete notifications"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Filter Tabs */}
                <div className={styles.tabList} role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "all"}
                    className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "orders"}
                    className={`${styles.tabBtn} ${activeTab === "orders" ? styles.tabBtnActive : ""}`}
                    onClick={() => setActiveTab("orders")}
                  >
                    Orders
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "updates"}
                    className={`${styles.tabBtn} ${activeTab === "updates" ? styles.tabBtnActive : ""}`}
                    onClick={() => setActiveTab("updates")}
                  >
                    Updates
                  </button>
                </div>
              </div>

              {/* Notification Card List */}
              <div className={styles.listContainer}>
                {filteredNotifications.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIconBox}>
                      <Bell size={24} strokeWidth={1.8} />
                    </div>
                    <h5 className={styles.emptyTitle}>All caught up!</h5>
                    <p className={styles.emptyDesc}>
                      You have no notifications in this category.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.slice(0, 8).map((item) => {
                    const isItemSelected = selectedIds.includes(item.id);
                    const tagInfo = getItemTag(item);
                    return (
                      <div
                        key={item.id}
                        className={`${styles.item} ${!item.isRead ? styles.itemUnread : ""} ${
                          isItemSelected ? styles.itemSelected : ""
                        } ${isSelectionMode ? styles.itemInSelectionMode : ""}`}
                        onClick={() => handleItemClick(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleItemClick(item);
                          }
                        }}
                      >
                        {/* Checkbox in selection mode */}
                        {isSelectionMode && (
                          <div
                            className={styles.itemCheckboxWrapper}
                            onClick={(e) => handleToggleSelectItem(item.id, e)}
                            role="checkbox"
                            aria-checked={isItemSelected}
                            aria-label="Select notification"
                          >
                            <div
                              className={`${styles.checkbox} ${
                                isItemSelected ? styles.checkboxChecked : ""
                              }`}
                            >
                              {isItemSelected && (
                                <Check size={12} strokeWidth={3} color="#FFFFFF" />
                              )}
                            </div>
                          </div>
                        )}

                        {renderItemIcon(item.category)}

                        <div className={styles.itemBody}>
                          <div className={styles.itemTopRow}>
                            <h5 className={styles.itemTitle}>{item.title}</h5>
                            <div className={styles.itemMetaRow}>
                              <span
                                className={styles.itemTime}
                                title={item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : undefined}
                              >
                                {formatNotificationTime(item.timestamp, item.timeAgo)}
                              </span>
                              {!isSelectionMode && (
                                <>
                                  {!item.isRead && (
                                    <button
                                      type="button"
                                      className={styles.markReadSingleBtn}
                                      onClick={(e) => handleMarkItemRead(item.id, e)}
                                      title="Mark as read"
                                      aria-label="Mark as read"
                                    >
                                      <Check size={13} strokeWidth={2.4} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className={styles.deleteSingleBtn}
                                    onClick={(e) => handleDeleteSingle(item.id, e)}
                                    title="Delete notification"
                                    aria-label="Delete notification"
                                  >
                                    <Trash2 size={13} strokeWidth={2.2} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <p className={styles.itemMessage}>{formatNotificationMessage(item.message)}</p>

                          <div className={styles.itemFooter}>
                            <span className={`${styles.itemTag} ${getTagColorClass(tagInfo.color)}`}>
                              {tagInfo.text}
                            </span>

                            <span className={styles.itemAction}>
                              <span>{getItemActionText(item)}</span>
                              <ChevronRight size={13} strokeWidth={2.4} />
                            </span>
                          </div>
                        </div>

                        {!item.isRead && (
                          <span className={styles.unreadDot} title="Unread notification" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.openCenterBtn}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/seller/notifications");
                  }}
                >
                  <span>Open Notifications Center</span>
                  <ChevronRight size={14} strokeWidth={2.4} />
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

