"use client";

import React from "react";
import { LogOut } from "lucide-react";
import styles from "./SellerNavbar.module.css";
import { useSellerProfile, computeInitials, isGenericFallbackName } from "@/hooks/useSellerProfile";
import { performLogout } from "@/lib/logout";

export interface SellerNavbarProps {
  title?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  onSearch?: (query: string) => void;
}

export const SellerNavbar: React.FC<SellerNavbarProps> = ({
  title = "Neo Cloud Room Onboarding",
  userName,
  userRole,
  userInitials,
  onSearch,
}) => {
  const seller = useSellerProfile();
  const effectiveUserName =
    userName && !isGenericFallbackName(userName)
      ? userName
      : (seller.businessName || seller.ownerName);
  const effectiveUserRole = userRole || seller.partnerRole;
  const effectiveUserInitials =
    userInitials && !isGenericFallbackName(userInitials) && userInitials !== "JD" && userInitials !== "KP" && userInitials !== "SE"
      ? userInitials
      : (seller.avatarInitials || computeInitials(effectiveUserName));
  return (
    <nav
      className={styles.navbar}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 72,
        minHeight: 72,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 32px 0 28px",
        boxSizing: "border-box",
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
      aria-label="Top Navigation Bar"
    >
      {/* 1. Left Side: Spacing + Title */}
      <div
        className={styles.leftSection}
        style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
      >
        <h1
          className={styles.pageTitle}
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h1>
      </div>

      {/* 2. Right Side: Profile Info + Logout (when authenticated) */}
      <div
        className={styles.rightSection}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
        }}
      >
        {/* Profile Circle + Name & Designation */}
        <div
          className={styles.profileSection}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <div
            className={styles.avatar}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "#ea580c",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {effectiveUserInitials}
          </div>
          <div
            className={styles.profileInfo}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              whiteSpace: "nowrap",
            }}
          >
            <span
              className={styles.userName}
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              {effectiveUserName}
            </span>
            <span
              className={styles.userRole}
              style={{
                fontSize: "0.74rem",
                color: "#94a3b8",
                lineHeight: 1.2,
                fontWeight: 500,
              }}
            >
              {effectiveUserRole}
            </span>
          </div>
        </div>

        {/* Logout button: only visible when authenticated */}
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
    </nav>
  );
};

export default SellerNavbar;
