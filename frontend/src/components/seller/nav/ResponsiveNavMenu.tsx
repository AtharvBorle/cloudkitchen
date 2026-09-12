"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  X,
  LayoutGrid,
  ShoppingBag,
  BookOpen,
  Bed,
  CalendarCheck,
  Truck,
  CreditCard,
  UserCircle,
  Settings,
  Bell,
  RefreshCw,
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
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { id: "menu", label: "Menu Management", icon: BookOpen, href: "/seller/menu" },
  { id: "rooms", label: "Rooms Config", icon: Bed, href: "/seller/rooms" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/seller/booking" },
  { id: "delivery", label: "Delivery & Riders", icon: Truck, href: "/seller/delivery" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/seller/subscription" },
  { id: "profile", label: "Seller Profile", icon: UserCircle, href: "/seller/profile" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/seller/notifications" },
  { id: "settings", label: "Settings", icon: Settings, href: "/seller/settings" },
];



import { useSellerProfile, computeInitials } from "@/hooks/useSellerProfile";

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
  ownerName,
  roleTagText = "OWNER ROLE",
  onSyncDevices,
}) => {
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && ownerName !== "Rahul Sharma" && ownerName !== "John Doe" ? ownerName : seller.ownerName;
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
        pathname?.startsWith("/seller/delivery") ||
        pathname?.startsWith("/seller/riderMng") ||
        pathname?.startsWith("/dashboard/seller/delivery")
      );
    }
    if (item.id === "subscription") {
      return (
        pathname === "/seller/res/subscription" ||
        pathname?.startsWith("/seller/res/subscription") ||
        pathname?.startsWith("/dashboard/seller/payment") ||
        pathname?.startsWith("/seller/subscription")
      );
    }
    if (item.id === "profile") {
      return (
        pathname === "/seller/res/profile" ||
        pathname?.startsWith("/seller/res/profile") ||
        pathname?.startsWith("/seller/profile") ||
        pathname?.startsWith("/dashboard/seller/profile")
      );
    }
    if (item.id === "notifications") {
      return (
        pathname === "/seller/res/notifications" ||
        pathname?.startsWith("/seller/res/notifications") ||
        pathname?.startsWith("/seller/notifications")
      );
    }
    if (item.id === "settings") {
      return (
        pathname === "/seller/res/settings" ||
        pathname?.startsWith("/seller/res/settings") ||
        pathname?.startsWith("/seller/settings") ||
        pathname?.startsWith("/dashboard/seller/settings")
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
      {isOpen && (
        <div
          className={`${styles.overlay} ${styles.open}`}
          onClick={onClose}
          aria-hidden="false"
        />
      )}

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
        aria-label="Navigation Menu"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.brandGroup}>
            <div className={styles.logoIcon}>
              <Image
                src="/images/logo-nav.png"
                alt="Neo Cloud Bites Logo"
                width={36}
                height={36}
                className={styles.logoImage}
                priority
              />
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
          <div className={styles.avatar}>{computeInitials(effectiveOwnerName)}</div>
          <div className={styles.profileDetails}>
            <span className={styles.profileName}>{effectiveOwnerName}</span>
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
