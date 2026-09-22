"use client";

import React from "react";
import { Menu, LogOut } from "lucide-react";
import styles from "./SellerHeader.module.css";

import { useSellerProfile } from "@/hooks/useSellerProfile";
import { performLogout } from "@/lib/logout";

export interface SellerHeaderProps {
  title?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  onMenuToggle?: () => void;
}

export const SellerHeader: React.FC<SellerHeaderProps> = ({
  title = "Neo Cloud Room Onboarding",
  userName,
  userRole,
  userInitials,
  onMenuToggle,
}) => {
  const seller = useSellerProfile();
  const effectiveUserName =
    userName &&
    userName !== "Rahul Sharma" &&
    userName !== "Rahul" &&
    userName !== "John Doe" &&
    userName !== "Kitchen Owner"
      ? userName
      : seller.ownerName;
  const effectiveUserRole = userRole || seller.partnerRole;
  const effectiveUserInitials =
    userInitials && userInitials !== "JD" && userInitials !== "KP"
      ? userInitials
      : seller.avatarInitials;

  return (
    <header className={styles.header}>
      {/* Left: Menu toggle + Title */}
      <div className={styles.leftSection}>
        {onMenuToggle && (
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onMenuToggle}
            aria-label="Open sidebar"
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
        )}
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      {/* Right: Profile + Logout */}
      <div className={styles.rightSection}>
        <div className={styles.profileSection}>
          <div className={styles.avatar}>{effectiveUserInitials}</div>
          <div className={styles.profileInfo}>
            <span className={styles.userName}>{effectiveUserName}</span>
            <span className={styles.userRole}>{effectiveUserRole}</span>
          </div>
        </div>

        {seller.authStatus === "authenticated" && (
          <button
            type="button"
            onClick={() => performLogout({ role: "SELLER" })}
            className={styles.logoutBtn}
            title="Log out of partner account"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default SellerHeader;
