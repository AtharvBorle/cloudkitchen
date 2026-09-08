"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Home,
  Search,
  ShoppingBag,
  Tag,
  Settings,
  HelpCircle,
  LogOut,
  Star,
  ChevronRight,
} from "lucide-react";
import styles from "./MobileSidebar.module.css";
import userAvatar from "../settings-desktop/settings-sidebar/rahul-sharma-avatar.jpg";
import logoImg from "../room-booking-desktop/navbar/logo-nav.png";

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: "Home" | "Explore" | "My Orders" | "Orders" | "Food" | "Rooms" | "Settings" | "Help & Support" | string;
  userName?: string;
  isGoldMember?: boolean;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  activeItem = "Rooms",
  userName = "Siddharth Sharma",
  isGoldMember = true,
}) => {
  const router = useRouter();

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
    router.push("/login");
  };

  const navLinks = [
    {
      label: "Home",
      href: "/explore-desktop",
      icon: <Home className={styles.navIcon} size={19} />,
      hasBadge: false,
    },
    {
      label: "Explore",
      href: "/restaurant",
      icon: <Search className={styles.navIcon} size={19} />,
      hasBadge: false,
    },
    {
      label: "My Orders",
      href: "/orders-desktop",
      icon: <ShoppingBag className={styles.navIcon} size={19} />,
      hasBadge: false,
    },
    {
      label: "Rooms",
      href: "/room-booking",
      icon: <Tag className={styles.navIcon} size={19} />,
      hasBadge: true,
      badgeText: "NEW",
    },
    {
      label: "Settings",
      href: "/settings-desktop",
      icon: <Settings className={styles.navIcon} size={19} />,
      hasBadge: false,
    },
    {
      label: "Help & Support",
      href: "/support",
      icon: <HelpCircle className={styles.navIcon} size={19} />,
      hasBadge: false,
    },
  ];

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
            {isGoldMember && (
              <div className={styles.goldMemberBadge}>
                <Star size={10} className={styles.starIcon} />
                <span>Gold Member</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <nav className={styles.navContainer}>
          {navLinks.map((item) => {
            const isActive =
              activeItem === item.label ||
              (activeItem === "Orders" && item.label === "My Orders") ||
              (activeItem === "Food" && item.label === "Explore");
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
        </nav>

        {/* Footer with Log Out and Meta info */}
        <div className={styles.drawerFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut className={styles.logoutIcon} size={18} />
            <span>Log Out</span>
          </button>

          <div className={styles.footerMeta}>
            <span>v2.4.1 (Stable)</span>
            <span className={styles.footerBrand}>CLOUD KITCHEN</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
