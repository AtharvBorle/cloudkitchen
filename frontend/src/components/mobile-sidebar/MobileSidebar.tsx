"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  X,
  Home,
  Search,
  ShoppingBag,
  Tag,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Calendar,
  Bell,
  CreditCard,
  MapPin,
  History,
  FileText,
  Shield,
  Star,
  Pencil,
} from "lucide-react";
import styles from "./MobileSidebar.module.css";
import userAvatar from "../settings-desktop/settings-sidebar/rahul-sharma-avatar.jpg";
import logoImg from "../room-booking-desktop/navbar/logo-nav.png";

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?:
    | "Home"
    | "Explore"
    | "My Orders"
    | "Orders"
    | "Food"
    | "Rooms"
    | "Settings"
    | "General Overview"
    | "My Subscriptions"
    | "Notifications"
    | "Payment Methods"
    | "Delivery Addresses"
    | "Order History"
    | "Help & FAQ"
    | "Terms & Conditions"
    | "Privacy Policy"
    | "Rate Our App"
    | "Help & Support"
    | string;
  userName?: string;
  userPhone?: string;
  isGoldMember?: boolean;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  activeItem = "Rooms",
  userName: customUserName,
  userPhone: customUserPhone,
  isGoldMember = false,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const userName = customUserName || session?.user?.name || "Rahul Sharma";
  const userPhone = customUserPhone || (session?.user as any)?.phone || session?.user?.email || "+91 98765 43210";

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

  const handleLogout = () => {
    onClose();
    if (session?.user) {
      signOut({ callbackUrl: "/login" });
    } else {
      router.push("/login");
    }
  };

  const mainNavLinks = [
    {
      label: "Home",
      href: "/explore-desktop",
      icon: <Home className={styles.navIcon} size={18} />,
      hasBadge: false,
    },
    {
      label: "Explore",
      href: "/restaurant",
      icon: <Search className={styles.navIcon} size={18} />,
      hasBadge: false,
    },
    {
      label: "My Orders",
      href: "/orders-desktop",
      icon: <ShoppingBag className={styles.navIcon} size={18} />,
      hasBadge: false,
    },
    {
      label: "Rooms",
      href: "/room-booking",
      icon: <Tag className={styles.navIcon} size={18} />,
      hasBadge: true,
      badgeText: "NEW",
    },
  ];

  const generalSettingsLinks = [
    {
      label: "General Overview",
      href: "/settings-desktop",
      icon: <Settings className={styles.navIcon} size={18} />,
    },
    {
      label: "My Subscriptions",
      href: "/my-subscription",
      icon: <Calendar className={styles.navIcon} size={18} />,
    },
    {
      label: "Notifications",
      href: "/notifications-desktop",
      icon: <Bell className={styles.navIcon} size={18} />,
    },
    {
      label: "Payment Methods",
      href: "/payment-methods-desktop",
      icon: <CreditCard className={styles.navIcon} size={18} />,
    },
    {
      label: "Delivery Addresses",
      href: "/delivery-addresses-desktop",
      icon: <MapPin className={styles.navIcon} size={18} />,
    },
    {
      label: "Order History",
      href: "/order-history-desktop",
      icon: <History className={styles.navIcon} size={18} />,
    },
  ];

  const supportLegalLinks = [
    {
      label: "Help & FAQ",
      href: "/support",
      icon: <HelpCircle className={styles.navIcon} size={18} />,
    },
    {
      label: "Terms & Conditions",
      href: "/support",
      icon: <FileText className={styles.navIcon} size={18} />,
    },
    {
      label: "Privacy Policy",
      href: "/support",
      icon: <Shield className={styles.navIcon} size={18} />,
    },
    {
      label: "Rate Our App",
      href: "/support",
      icon: <Star className={styles.navIcon} size={18} />,
    },
  ];

  const isLinkActive = (label: string) => {
    if (activeItem === label) return true;
    if (label === "General Overview" && activeItem === "Settings") return true;
    if (label === "My Orders" && activeItem === "Orders") return true;
    if (label === "Explore" && activeItem === "Food") return true;
    return false;
  };

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Slide-out Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        aria-label="Navigation Drawer"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.brandGroup}>
            <div className={styles.logoCircle}>
              <Image
                src={logoImg}
                alt="Cloud Kitchen Logo"
                width={32}
                height={32}
                className={styles.logoImg}
              />
            </div>
            <span className={styles.brandText}>Cloud Kitchen</span>
          </div>

          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* User Profile Card */}
        <div className={styles.profileSection}>
          <div className={styles.avatarWrapper}>
            <Image
              src={userAvatar}
              alt={userName}
              fill
              className={styles.avatarImg}
            />
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>{userName}</h3>
            <p className={styles.userPhone}>{userPhone}</p>
            <Link
              href="/settings-desktop"
              className={styles.editProfileLink}
              onClick={onClose}
            >
              <span>Edit Profile</span>
              <Pencil size={11} strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className={styles.navContainer}>
          {/* Main Navigation Group */}
          <div className={styles.navGroup}>
            {mainNavLinks.map((item) => {
              const isActive = isLinkActive(item.label);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  onClick={onClose}
                >
                  <div className={styles.navItemLeft}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.hasBadge ? (
                    <span className={styles.newBadge}>{item.badgeText}</span>
                  ) : (
                    <ChevronRight size={16} className={styles.navChevron} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Group 1: General Settings */}
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>GENERAL SETTINGS</span>
            {generalSettingsLinks.map((item) => {
              const isActive = isLinkActive(item.label);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  onClick={onClose}
                >
                  <div className={styles.navItemLeft}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={16} className={styles.navChevron} />
                </Link>
              );
            })}
          </div>

          {/* Group 2: Support & Legal */}
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>SUPPORT & LEGAL</span>
            {supportLegalLinks.map((item) => {
              const isActive = isLinkActive(item.label);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  onClick={onClose}
                >
                  <div className={styles.navItemLeft}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={16} className={styles.navChevron} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer with Log Out matching Image */}
        <div className={styles.drawerFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut className={styles.logoutIcon} size={18} strokeWidth={2.4} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
