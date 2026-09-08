"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  LayoutGrid,
  ShoppingBag,
  BookOpen,
  Home,
  CalendarCheck,
  Truck,
  CreditCard,
  UserCircle,
  RefreshCw,
  Store,
  ChevronRight,
} from "lucide-react";
import styles from "./ResponsiveNavMenu.module.css";

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  href: string;
}

export const RESPONSIVE_SELLER_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/res/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/res/orders" },
  { id: "menu", label: "Menu Management", icon: BookOpen, href: "/seller/res/menu" },
  { id: "rooms", label: "Rooms Config", icon: Home, href: "/seller/res/rooms" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/seller/res/booking" },
  { id: "delivery", label: "Delivery & Riders", icon: Truck, href: "/seller/res/delivery" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/seller/subscription" },
  { id: "profile", label: "Seller Profile", icon: UserCircle, href: "/seller/profile" },
];

export interface ResponsiveNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeItemId?: string;
  ownerName?: string;
  roleTagText?: string;
  onSyncDevices?: () => void;
}

export const ResponsiveNavMenu: React.FC<ResponsiveNavMenuProps> = ({
  isOpen,
  onClose,
  activeItemId,
  ownerName = "Rahul Sharma",
  roleTagText = "OWNER ROLE",
  onSyncDevices,
}) => {
  const pathname = usePathname();

  // Close drawer on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isItemActive = (item: NavItemConfig) => {
    if (activeItemId) {
      return activeItemId === item.id;
    }
    if (item.id === "dashboard") {
      return (
        pathname === "/seller/res/dashboard" ||
        pathname?.startsWith("/seller/dashboard") ||
        pathname === "/dashboard/seller"
      );
    }
    if (item.id === "orders") {
      return (
        pathname === "/seller/res/orders" ||
        pathname?.startsWith("/seller/res/orders") ||
        pathname?.startsWith("/seller/orders") ||
        pathname?.startsWith("/seller/order-default") ||
        pathname?.startsWith("/dashboard/seller/orders")
      );
    }
    if (item.id === "menu") {
      return (
        pathname === "/seller/res/menu" ||
        pathname?.startsWith("/seller/res/menu") ||
        pathname?.startsWith("/seller/menu") ||
        pathname?.startsWith("/seller/edit-menu") ||
        pathname?.startsWith("/dashboard/seller/menu")
      );
    }
    if (item.id === "rooms") {
      return (
        pathname === "/seller/res/rooms" ||
        pathname?.startsWith("/seller/res/rooms") ||
        pathname?.startsWith("/seller/rooms") ||
        pathname?.startsWith("/dashboard/seller/rooms")
      );
    }
    if (item.id === "bookings") {
      return (
        pathname === "/seller/res/booking" ||
        pathname?.startsWith("/seller/res/booking") ||
        pathname?.startsWith("/seller/booking") ||
        pathname?.startsWith("/dashboard/seller/bookings")
      );
    }
    if (item.id === "delivery") {
      return (
        pathname === "/seller/res/delivery" ||
        pathname?.startsWith("/seller/res/delivery") ||
        pathname?.startsWith("/seller/riderMng") ||
        pathname?.startsWith("/dashboard/seller/delivery")
      );
    }
    if (item.id === "subscription") {
      return (
        pathname?.startsWith("/dashboard/seller/payment") ||
        pathname?.startsWith("/seller/subscription")
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
        aria-label="Navigation Menu"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.brandGroup}>
            <div className={styles.logoIcon}>
              <Store size={20} />
            </div>
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>NEO CLOUD BITES</span>
              <span className={styles.roleTag}>{roleTagText}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Info Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>{getInitials(ownerName)}</div>
          <div className={styles.profileDetails}>
            <span className={styles.profileName}>{ownerName}</span>
            <span className={styles.profileStatus}>
              <span className={styles.statusDot} />
              Store Online
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className={styles.navList}>
          <span className={styles.sectionLabel}>Operations Menu</span>
          {RESPONSIVE_SELLER_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const IconComponent = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
                onClick={onClose}
              >
                <IconComponent size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.syncButton}
            onClick={() => {
              if (onSyncDevices) onSyncDevices();
              onClose();
            }}
          >
            <RefreshCw size={14} />
            <span>Sync Live Orders</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default ResponsiveNavMenu;
