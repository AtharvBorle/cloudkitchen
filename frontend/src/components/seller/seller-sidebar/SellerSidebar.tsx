"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ShieldCheck, Lock } from "lucide-react";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import styles from "./SellerSidebar.module.css";

export interface SellerSidebarProps {
  activeItem?: "registration" | "verification";
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  activeItem,
}) => {
  const pathname = usePathname();
  const seller = useSellerProfile();
  const isRejected = seller.profile?.verificationStatus === "REJECTED";

  // Determine active item based on prop or pathname
  const isVerification =
    activeItem === "verification" ||
    (!activeItem &&
      (pathname?.includes("/seller/verification") ||
        pathname?.includes("/seller/revision")));

  const isRegistration =
    !isRejected &&
    (activeItem === "registration" ||
      (!isVerification &&
        (pathname?.includes("/seller/registration") ||
          pathname?.includes("/seller/account-information") ||
          pathname?.includes("/seller/business-information") ||
          pathname?.includes("/seller/legal-documents") ||
          pathname?.includes("/seller/legal-information") ||
          pathname?.includes("/seller/media-gallery") ||
          pathname?.includes("/seller/media-information") ||
          pathname?.includes("/seller/confirm-registration") ||
          pathname?.includes("/seller/confirm-information") ||
          pathname?.includes("/seller-onboarding") ||
          !pathname ||
          pathname === "/seller")));

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header & Role Badge */}
      <div className={styles.brandContainer}>
        <div className={styles.logoSection}>
          <Image
            src="/images/logo-nav.png"
            alt="Neo Cloud Bite Logo"
            width={48}
            height={48}
            className={styles.logoImg}
            priority
          />
          <span className={styles.brandName}>Neo Cloud Bite</span>
        </div>

        <div className={styles.roleBadgeWrapper}>
          <span className={styles.roleBadge}>OWNER ROLE</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.navMenu}>
        {/* Registration Item */}
        {isRejected ? (
          <div
            className={`${styles.navItem} ${styles.navItemBlocked}`}
            title="Registration is blocked for rejected accounts"
            aria-disabled="true"
          >
            <ClipboardList className={styles.navIcon} />
            <span className={styles.navLabel}>Registration</span>
            <span className={styles.blockedBadge}>
              <Lock size={10} /> Blocked
            </span>
          </div>
        ) : (
          <Link
            href="/seller/registration"
            className={`${styles.navItem} ${isRegistration ? styles.active : ""}`}
          >
            {isRegistration && <span className={styles.activeIndicator} />}
            <ClipboardList className={styles.navIcon} />
            <span className={styles.navLabel}>Registration</span>
          </Link>
        )}

        {/* Verification Item */}
        <Link
          href="/seller/verification"
          className={`${styles.navItem} ${isVerification ? styles.active : ""}`}
        >
          {isVerification && <span className={styles.activeIndicator} />}
          <ShieldCheck className={styles.navIcon} />
          <span className={styles.navLabel}>Verification</span>
        </Link>
      </nav>
    </aside>
  );
};

export default SellerSidebar;
