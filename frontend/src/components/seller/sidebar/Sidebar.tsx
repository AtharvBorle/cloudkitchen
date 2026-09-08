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
}

export const SELLER_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { id: "menu", label: "Menu", icon: BookOpen, href: "/seller/menu" },
  { id: "rooms", label: "Rooms", icon: Home, href: "/seller/rooms/config" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/seller/booking" },
  { id: "delivery", label: "Delivery", icon: Truck, href: "/seller/riderMng" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/seller/subscription" },
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
    if (item.id === "rooms") {
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
        pathname?.startsWith("/seller/riderMng") ||
        pathname?.startsWith("/seller/res/delivery") ||
        pathname?.startsWith("/dashboard/seller/delivery")
      );
    }
    if (item.id === "subscription") {
      return (
        pathname?.startsWith("/seller/subscription") ||
        pathname?.startsWith("/dashboard/seller/payment")
      );
    }
    if (item.id === "profile") {
      return (
        pathname?.startsWith("/seller/profile") ||
        pathname?.startsWith("/dashboard/seller/profile")
      );
    }
    return Boolean(pathname?.startsWith(item.href));
  };

  const sidebarWidth = isEffectiveCollapsed ? "76px" : "240px";

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
          padding: isEffectiveCollapsed ? "24px 10px" : "24px 16px",
          gap: isEffectiveCollapsed ? "24px" : "28px",
        }}
        className={`${styles.sellerSidebar} ${isMobileOpen ? styles.open : ""} ${
          isEffectiveCollapsed ? styles.collapsed : styles.expanded
        }`}
        aria-label="Seller Operations Navigation"
      >
        {/* Brand Header Section */}
        <div
          style={{
            alignItems: isEffectiveCollapsed ? "center" : "stretch",
          }}
          className={styles.brandWrapper}
        >
          {/* Logo Row */}
          <div
            style={{
              justifyContent: isEffectiveCollapsed ? "center" : "space-between",
            }}
            className={styles.logoRow}
          >
            <Link
              href="/dashboard/seller"
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
                  width={36}
                  height={36}
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
                className={styles.sidebarCloseBtn}
                aria-label="Close sidebar"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Role Tag (Expanded mode) */}
          {!isEffectiveCollapsed && (
            <div className={styles.roleTag}>{roleTagText}</div>
          )}

          {/* Compact Toggle Button when Collapsed */}
          {isEffectiveCollapsed && showCollapseToggle && (
            <button
              type="button"
              onClick={handleToggleCollapse}
              className={styles.desktopExpandBtn}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className={styles.navList} aria-label="Seller Navigation">
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
                  padding: isEffectiveCollapsed ? "0" : "10px 14px",
                  justifyContent: isEffectiveCollapsed ? "center" : "flex-start",
                  gap: isEffectiveCollapsed ? "0" : "12px",
                }}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
              >
                <IconComponent
                  size={isEffectiveCollapsed ? 20 : 19}
                  color={active ? "#F97316" : "#64748B"}
                  style={{ flexShrink: 0 }}
                />
                {!isEffectiveCollapsed && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Collapse / Expand Bar (Optional Quick Toggle) */}
        {showCollapseToggle && (
          <div
            style={{
              justifyContent: isEffectiveCollapsed ? "center" : "flex-end",
            }}
            className={styles.sidebarFooter}
          >
            <button
              type="button"
              onClick={handleToggleCollapse}
              className={styles.footerToggleBtn}
              title={isEffectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isEffectiveCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <>
                  <ChevronLeft size={16} />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
