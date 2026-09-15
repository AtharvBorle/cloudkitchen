"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import {
  Settings,
  Calendar,
  Bell,
  CreditCard,
  MapPin,
  History,
  HelpCircle,
  FileText,
  Shield,
  Star,
  ChevronRight,
  LogOut,
  LogIn,
} from "lucide-react";
import styles from "./SettingsSidebar.module.css";
import rahulAvatar from "./Rectangle.jpg";

export interface SettingsSidebarProps {
  activeTabId?: string;
  onTabSelect?: (tabId: string) => void;
  onLogout?: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTabId,
  onTabSelect,
  onLogout,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const getActiveTab = (): string => {
    if (activeTabId) return activeTabId;
    if (pathname === "/settings-desktop" || pathname === "/settings") return "general-overview";
    if (pathname?.startsWith("/my-subscription") || pathname?.startsWith("/my-subscriptions-desktop")) return "my-subscriptions";
    if (pathname?.startsWith("/notifications-desktop") || pathname?.startsWith("/notifications")) return "notifications";
    if (pathname?.startsWith("/payment-methods-desktop") || pathname?.startsWith("/payment-methods")) return "payment-methods";
    if (pathname?.startsWith("/delivery-addresses-desktop") || pathname?.startsWith("/delivery-addresses")) return "delivery-addresses";
    if (pathname?.startsWith("/order-history-desktop") || pathname?.startsWith("/order-history")) return "order-history";
    if (pathname?.startsWith("/support")) return "help-faq";
    if (pathname?.startsWith("/terms")) return "terms";
    if (pathname?.startsWith("/privacy")) return "privacy";
    if (pathname?.startsWith("/rate")) return "rate";
    return "general-overview";
  };

  const currentTab = getActiveTab();

  const handleTabClick = (tabId: string) => {
    if (onTabSelect) {
      onTabSelect(tabId);
    } else {
      if (tabId === "general-overview") {
        router.push("/settings-desktop");
      } else if (tabId === "my-subscriptions") {
        router.push("/my-subscriptions-desktop");
      } else if (tabId === "notifications") {
        router.push("/notifications-desktop");
      } else if (tabId === "payment-methods") {
        router.push("/payment-methods-desktop");
      } else if (tabId === "delivery-addresses") {
        router.push("/delivery-addresses-desktop");
      } else if (tabId === "order-history") {
        router.push("/order-history-desktop");
      } else if (tabId === "help-faq") {
        router.push("/support");
      } else if (tabId === "terms") {
        router.push("/terms");
      } else if (tabId === "privacy") {
        router.push("/privacy");
      } else if (tabId === "rate") {
        router.push("/rate-app");
      }
    }
  };

  const handleAuthAction = () => {
    if (session?.user) {
      if (onLogout) {
        onLogout();
      } else {
        performLogout({ role: "USER" });
      }
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/settings-desktop")}`);
    }
  };

  return (
    <aside className={styles.sidebarContainer} aria-label="Settings Sidebar">
      <div className={styles.sidebarCard}>
        {/* 1. User Profile Section */}
        <div className={styles.userSection}>
          <div className={styles.avatarWrapper}>
            {session?.user?.name ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "#FF5500",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "16px",
                }}
              >
                {session.user.name.trim().charAt(0).toUpperCase()}
              </div>
            ) : (
              <Image
                src={rahulAvatar}
                alt="User Profile"
                fill
                sizes="40px"
                className={styles.avatarImg}
              />
            )}
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName} title={session?.user?.name || "Rahul Sharma"}>
              {session?.user?.name || "Rahul Sharma"}
            </h3>
            <p className={styles.userPhone} title={session?.user?.email || "+91 98765 43210"}>
              {session?.user?.email || "+91 98765 43210"}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className={styles.divider} />

        {/* 2. Navigation Groups */}
        <div className={styles.navGroupsWrapper}>
          {/* Group 1: General Settings */}
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>GENERAL SETTINGS</span>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "general-overview" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("general-overview")}
            >
              <div className={styles.navItemLeft}>
                <Settings size={18} className={styles.navIcon} />
                <span>General Overview</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "my-subscriptions" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("my-subscriptions")}
            >
              <div className={styles.navItemLeft}>
                <Calendar size={18} className={styles.navIcon} />
                <span>My Subscriptions</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "notifications" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("notifications")}
            >
              <div className={styles.navItemLeft}>
                <Bell size={18} className={styles.navIcon} />
                <span>Notifications</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "payment-methods" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("payment-methods")}
            >
              <div className={styles.navItemLeft}>
                <CreditCard size={18} className={styles.navIcon} />
                <span>Payment Methods</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "delivery-addresses" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("delivery-addresses")}
            >
              <div className={styles.navItemLeft}>
                <MapPin size={18} className={styles.navIcon} />
                <span>Delivery Addresses</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "order-history" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("order-history")}
            >
              <div className={styles.navItemLeft}>
                <History size={18} className={styles.navIcon} />
                <span>Order History</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>
          </div>

          {/* Group 2: Support & Legal */}
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>SUPPORT & LEGAL</span>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "help-faq" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("help-faq")}
            >
              <div className={styles.navItemLeft}>
                <HelpCircle size={18} className={styles.navIcon} />
                <span>Help & FAQ</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "terms" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("terms")}
            >
              <div className={styles.navItemLeft}>
                <FileText size={18} className={styles.navIcon} />
                <span>Terms & Conditions</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "privacy" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("privacy")}
            >
              <div className={styles.navItemLeft}>
                <Shield size={18} className={styles.navIcon} />
                <span>Privacy Policy</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${
                currentTab === "rate" ? styles.navItemActive : ""
              }`}
              onClick={() => handleTabClick("rate")}
            >
              <div className={styles.navItemLeft}>
                <Star size={18} className={styles.navIcon} />
                <span>Rate Our App</span>
              </div>
              <ChevronRight size={16} className={styles.chevronIcon} />
            </button>
          </div>
        </div>

        {/* Separator before Log Out with light spacing */}
        <div className={styles.logoutDivider} />

        {/* 3. Log Out / Sign In Button */}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleAuthAction}
          aria-label={session?.user ? "Log Out" : "Sign In"}
        >
          {session?.user ? (
            <>
              <LogOut size={18} strokeWidth={2.4} />
              <span>Log Out</span>
            </>
          ) : (
            <>
              <LogIn size={18} strokeWidth={2.4} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default SettingsSidebar;

