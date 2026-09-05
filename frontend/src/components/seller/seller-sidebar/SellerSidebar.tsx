"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ShieldCheck } from "lucide-react";
import styles from "./SellerSidebar.module.css";

export interface SellerSidebarProps {
  activeItem?: "registration" | "verification";
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  activeItem = "registration",
}) => {
  const pathname = usePathname();

  const isRegistration =
    activeItem === "registration" ||
    pathname?.includes("registration") ||
    pathname?.includes("onboarding");

  return (
    <aside
      className={styles.sidebar}
      style={{
        width: 260,
        minWidth: 260,
        height: "100vh",
        position: "sticky",
        top: 0,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        padding: "28px 18px 28px 24px",
        boxSizing: "border-box",
      }}
    >
      {/* Brand Header & Role Badge */}
      <div
        className={styles.brandContainer}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 32,
        }}
      >
        <div
          className={styles.logoSection}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <Image
            src="/images/logo-nav.png"
            alt="Neo Cloud Bite Logo"
            width={48}
            height={48}
            className={styles.logoImg}
            priority
          />
          <span
            className={styles.brandName}
            style={{
              fontSize: "1.32rem",
              fontWeight: 800,
              color: "#ea580c",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            Neo Cloud Bite
          </span>
        </div>

        <div className={styles.roleBadgeWrapper} style={{ display: "flex" }}>
          <span
            className={styles.roleBadge}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fff1e8",
              color: "#ea580c",
              fontSize: "0.76rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              padding: "6px 14px",
              borderRadius: 8,
              textTransform: "uppercase",
              border: "none",
            }}
          >
            OWNER ROLE
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav
        className={styles.navMenu}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <Link
          href="/seller/registration"
          className={`${styles.navItem} ${isRegistration ? styles.active : ""}`}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            borderRadius: 12,
            fontSize: "1.02rem",
            fontWeight: isRegistration ? 700 : 600,
            textDecoration: "none",
            color: isRegistration ? "#ea580c" : "#8b9eb3",
            backgroundColor: isRegistration ? "#fff1e8" : "transparent",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {isRegistration && (
            <span
              className={styles.activeIndicator}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 6,
                backgroundColor: "#ea580c",
                borderRadius: "4px 0 0 4px",
              }}
            />
          )}
          <ClipboardList className={styles.navIcon} style={{ width: 22, height: 22 }} />
          <span className={styles.navLabel}>Registration</span>
        </Link>

        <Link
          href="/seller/verification"
          className={`${styles.navItem} ${!isRegistration && activeItem === "verification" ? styles.active : ""}`}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            borderRadius: 12,
            fontSize: "1.02rem",
            fontWeight: 600,
            textDecoration: "none",
            color: "#8b9eb3",
            backgroundColor: "transparent",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <ShieldCheck className={styles.navIcon} style={{ width: 22, height: 22 }} />
          <span className={styles.navLabel}>Verification</span>
        </Link>
      </nav>
    </aside>
  );
};

export default SellerSidebar;
