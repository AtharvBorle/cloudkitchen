"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
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
  Pencil,
} from "lucide-react";
import styles from "./SettingsSidebar.module.css";
import rahulAvatar from "./Rectangle.jpg";

export interface SettingsSidebarProps {
  activeTabId?: string;
  onTabSelect?: (tabId: string) => void;
  onLogout?: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTabId = "general-overview",
  onTabSelect,
  onLogout,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentTab, setCurrentTab] = useState<string>(activeTabId);

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (onTabSelect) {
      onTabSelect(tabId);
    } else {
      if (tabId === "general-overview") {
        router.push("/settings-desktop");
      } else if (tabId === "my-subscriptions") {
        router.push("/my-subscription");
      } else if (tabId === "notifications") {
        router.push("/notifications-desktop");
      } else if (tabId === "payment-methods") {
        router.push("/payment-methods-desktop");
      } else if (tabId === "delivery-addresses") {
        router.push("/delivery-addresses-desktop");
      } else if (tabId === "order-history") {
        router.push("/order-history-desktop");
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      signOut({ callbackUrl: "/login" });
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
                  fontSize: "20px",
                }}
              >
                {session.user.name.trim().charAt(0).toUpperCase()}
              </div>
            ) : (
              <Image
                src={rahulAvatar}
                alt="User Profile"
                fill
                sizes="56px"
                className={styles.avatarImg}
              />
            )}
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>{session?.user?.name || "Rahul Sharma"}</h3>
            <p className={styles.userPhone}>{session?.user?.email || "+91 98765 43210"}</p>
            <button type="button" className={styles.editProfileLink}>
              <span>Edit Profile</span>
              <Pencil size={11} strokeWidth={2.5} />
            </button>
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

        {/* 3. Log Out Button */}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
          aria-label="Log Out"
        >
          <LogOut size={18} strokeWidth={2.4} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default SettingsSidebar;

