"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import navLogoImg from "@/components/navbar/logo-nav.png";
import {
  LayoutGrid,
  ShoppingBag,
  BookOpen,
  Home,
  CalendarCheck,
  Truck,
  CreditCard,
  UserCircle,
  Headphones,
  Compass,
  BedDouble,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import styles from "./ConsoleSidebar.module.css";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;
  href: string;
  badge?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "explore", label: "Explore", icon: Compass, href: "/explore-desktop" },
  { id: "my-orders", label: "Orders", icon: ShoppingBag, href: "/orders-desktop" },
  { id: "rooms", label: "Rooms", icon: BedDouble, href: "/room-booking", badge: "NEW" },
];

export const SELLER_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { id: "menu", label: "Menu", icon: BookOpen, href: "/seller/menu" },
  { id: "rooms-seller", label: "Rooms", icon: Home, href: "/seller/rooms" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/seller/booking" },
  { id: "delivery", label: "Delivery", icon: Truck, href: "/seller/delivery" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/seller/subscription" },
  { id: "support", label: "Support Tickets", icon: Headphones, href: "/seller/support" },
  { id: "profile", label: "Profile", icon: UserCircle, href: "/seller/profile" },
];

export interface SellerSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  activeItemId?: string;
  logoSrc?: string | StaticImageData;
  roleTagText?: string;
  isCollapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
}

export default function SellerSidebar({
  isMobileOpen = false,
  onClose,
  activeItemId,
  logoSrc = navLogoImg,
  roleTagText = "OWNER ROLE",
  isCollapsed,
  defaultCollapsed = false,
  onToggleCollapse,
  showCollapseToggle = true,
  ownerName = "John Doe",
  partnerRole = "Neo Cloud Partner",
  avatarInitials = "JD",
}: SellerSidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  // Controlled or uncontrolled collapse state
  const isEffectiveCollapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Helper to determine if a nav item is currently active
  const isItemActive = (item: NavItem) => {
    if (activeItemId) {
      return activeItemId === item.id;
    }
    if (item.id === "dashboard") {
      return (
        pathname?.startsWith("/seller/dashboard") ||
        pathname?.startsWith("/seller/res/dashboard") ||
        pathname === "/dashboard/seller" ||
        pathname === "/dashboard/seller/"
      );
    }
    if (item.id === "orders") {
      return (
        pathname?.startsWith("/seller/orders") ||
        pathname?.startsWith("/seller/order-default") ||
        pathname?.startsWith("/seller/res/orders") ||
        pathname?.startsWith("/dashboard/seller/orders")
      );
    }
    if (item.id === "menu") {
      return (
        pathname?.startsWith("/seller/menu") ||
        pathname?.startsWith("/seller/edit-menu") ||
        pathname?.startsWith("/seller/res/menu") ||
        pathname?.startsWith("/dashboard/seller/menu") ||
        pathname?.startsWith("/dashboard/seller/edit-menu")
      );
    }
    if (item.id === "rooms-seller") {
      return (
        pathname?.startsWith("/seller/rooms") ||
        pathname?.startsWith("/seller/res/rooms") ||
        pathname?.startsWith("/dashboard/seller/rooms")
      );
    }
    if (item.id === "bookings") {
      return (
        pathname?.startsWith("/seller/booking") ||
        pathname?.startsWith("/seller/res/booking") ||
        pathname?.startsWith("/dashboard/seller/bookings")
      );
    }
    if (item.id === "delivery") {
      return (
        pathname?.startsWith("/seller/delivery") ||
        pathname?.startsWith("/seller/riderMng") ||
        pathname?.startsWith("/seller/res/delivery") ||
        pathname?.startsWith("/dashboard/seller/delivery")
      );
    }
    if (item.id === "subscription") {
      return (
        pathname?.startsWith("/seller/subscription") ||
        pathname?.startsWith("/seller/create-subscription-plan") ||
        pathname?.startsWith("/seller/res/subscription") ||
        pathname?.startsWith("/dashboard/seller/payment")
      );
    }
    if (item.id === "support") {
      return (
        pathname?.startsWith("/seller/support") ||
        pathname?.startsWith("/dashboard/seller/support")
      );
    }
    if (item.id === "profile") {
      return (
        pathname?.startsWith("/seller/profile") ||
        pathname?.startsWith("/seller/res/profile") ||
        pathname?.startsWith("/dashboard/seller/profile")
      );
    }
    return Boolean(pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)));
  };

  const sidebarWidth = isEffectiveCollapsed ? "76px" : "250px";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`${styles.backdrop} ${isMobileOpen ? styles.open : ""}`}
        aria-hidden={!isMobileOpen}
      />

      {/* Main Sidebar Container */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
          height: "100vh",
          maxHeight: "100vh",
          overflowY: "auto",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #F1F5F9",
          padding: isEffectiveCollapsed ? "20px 10px" : "20px 16px 28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: isEffectiveCollapsed ? "20px" : "20px",
          boxSizing: "border-box",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          zIndex: 50,
          transition: "width 0.25s ease, transform 0.3s ease",
        }}
        className={`${styles.sellerSidebar} seller-sidebar ${isMobileOpen ? "open" : ""} ${
          isEffectiveCollapsed ? styles.collapsed : styles.expanded
        }`}
        aria-label="Seller Operations Navigation"
      >
        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
          }}
          className={styles.brandWrapper}
        >
          {/* Logo Row */}
          <div
            style={{
              width: "100%",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: isEffectiveCollapsed ? "center" : "space-between",
              gap: "8px",
            }}
            className={styles.logoRow}
          >
            <Link
              href="/seller/dashboard"
              className={styles.logoLink}
              title="Neo Cloud Bites Seller Dashboard"
              onClick={() => {
                if (onClose) onClose();
              }}
            >
              <div className={styles.logoImgWrapper}>
                <Image
                  src={logoSrc}
                  alt="Neo Cloud Bites Logo"
                  width={34}
                  height={34}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  priority
                />
              </div>

              {!isEffectiveCollapsed && (
                <span className={styles.brandTitle}>NEO CLOUD BITES</span>
              )}
            </Link>

            {/* Desktop Collapse / Expand Button in Header */}
            {!isEffectiveCollapsed && showCollapseToggle && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                className={styles.desktopCollapseBtn}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            )}

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`${styles.sidebarCloseBtn} sidebar-close-btn`}
                aria-label="Close sidebar"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* User Profile Card inside Sidebar (Expanded only) */}
        {!isEffectiveCollapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              backgroundColor: "#F8FAFC",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              boxSizing: "border-box",
              width: "100%",
            }}
            className="sidebar-user-card"
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: "#FF5500",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "13.5px",
                letterSpacing: "0.5px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
              }}
            >
              {avatarInitials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, overflow: "hidden" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0F172A",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                }}
              >
                {ownerName}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#F97316",
                    backgroundColor: "#FFF1E8",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {roleTagText}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Nav Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
            width: "100%",
          }}
        >
          {/* Section 1: Main Top Navigation Bar Links (Expanded only) */}
          {!isEffectiveCollapsed && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  padding: "0 12px",
                  marginBottom: "4px",
                }}
              >
                MAIN NAVIGATION
              </span>

              {MAIN_NAV_ITEMS.map((item) => {
                const active = isItemActive(item);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      width: "100%",
                      height: "38px",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textDecoration: "none",
                      boxSizing: "border-box",
                      backgroundColor: active ? "#FFF1E8" : "transparent",
                      color: active ? "#F97316" : "#475569",
                      fontWeight: active ? 700 : 500,
                      fontSize: "13px",
                      transition: "all 0.18s ease",
                    }}
                    className={`nav-item ${active ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <IconComponent
                        size={18}
                        color={active ? "#F97316" : "#64748B"}
                      />
                      <span style={{ lineHeight: 1 }}>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          backgroundColor: "#FF5500",
                          color: "#FFFFFF",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          lineHeight: 1,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Section 2: Seller Operations Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!isEffectiveCollapsed && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  padding: "0 12px",
                  marginBottom: "4px",
                }}
              >
                SELLER OPERATIONS
              </span>
            )}

            {SELLER_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  title={item.label}
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "8px",
                    padding: isEffectiveCollapsed ? "0" : "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isEffectiveCollapsed ? "center" : "flex-start",
                    gap: isEffectiveCollapsed ? "0" : "10px",
                    textDecoration: "none",
                    boxSizing: "border-box",
                    backgroundColor: active ? "#FFF1E8" : "transparent",
                    color: active ? "#F97316" : "#475569",
                    fontWeight: active ? 700 : 500,
                    fontSize: "13px",
                    transition: "all 0.18s ease",
                  }}
                  className={`nav-item ${active ? "active" : ""}`}
                >
                  <IconComponent
                    size={18}
                    color={active ? "#F97316" : "#64748B"}
                  />
                  {!isEffectiveCollapsed && (
                    <span style={{ lineHeight: 1, whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer with Logout Action & Collapse Trigger */}
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "8px" }}>
          {!isEffectiveCollapsed && (
            <Link
              href="/auth/login"
              onClick={onClose}
              style={{
                width: "100%",
                height: "38px",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "#EF4444",
                fontWeight: 600,
                fontSize: "13px",
                boxSizing: "border-box",
                transition: "all 0.18s ease",
              }}
              className="nav-logout-btn"
            >
              <LogOut size={18} color="#EF4444" />
              <span>Log Out</span>
            </Link>
          )}

          {showCollapseToggle && (
            <button
              type="button"
              onClick={handleToggleCollapse}
              className={styles.footerToggleBtn}
              title={isEffectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                width: "100%",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: isEffectiveCollapsed ? "center" : "space-between",
                padding: isEffectiveCollapsed ? "0" : "6px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "transparent",
                color: "#64748B",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {isEffectiveCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Collapse Sidebar</span>
                  <ChevronLeft size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </aside>

      <style jsx>{`
        .nav-item:hover:not(.active) {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
        }
        .nav-item:hover:not(.active) :global(svg) {
          color: #0F172A !important;
        }
        .nav-logout-btn:hover {
          background-color: #FEF2F2 !important;
        }
        @media (max-width: 900px) {
          .seller-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            z-index: 1000 !important;
          }
          .seller-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}

