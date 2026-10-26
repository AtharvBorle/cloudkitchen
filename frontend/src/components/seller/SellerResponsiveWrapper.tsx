"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./SellerResponsiveWrapper.module.css";

export interface SellerResponsiveWrapperProps {
  desktop: ReactNode;
  mobile: ReactNode;
}

export default function SellerResponsiveWrapper({
  desktop,
  mobile,
}: SellerResponsiveWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Routes that are ALWAYS permitted even when onboarding readiness is incomplete
    const isExempt =
      !pathname ||
      pathname === "/seller/settings" ||
      pathname.startsWith("/seller/settings") ||
      pathname.startsWith("/seller/res/settings") ||
      pathname === "/seller/profile" ||
      pathname.startsWith("/seller/profile") ||
      pathname.startsWith("/seller/res/profile") ||
      pathname === "/seller/readiness" ||
      pathname === "/seller/menu/item" ||
      pathname.startsWith("/seller/menu/item") ||
      pathname.startsWith("/seller/res/menu/item") ||
      pathname === "/seller/login" ||
      pathname.startsWith("/seller/res/login") ||
      pathname === "/seller" ||
      pathname.startsWith("/seller/registration") ||
      pathname.startsWith("/seller/confirm") ||
      pathname.startsWith("/seller/account") ||
      pathname.startsWith("/seller/business") ||
      pathname.startsWith("/seller/legal") ||
      pathname.startsWith("/seller/media") ||
      pathname.startsWith("/seller/verification") ||
      pathname === "/seller/revision" ||
      pathname.startsWith("/seller/revision") ||
      pathname === "/seller/register" ||
      pathname.startsWith("/seller/register") ||
      pathname === "/seller/reapply" ||
      pathname.startsWith("/seller/reapply") ||
      pathname.startsWith("/seller/faq") ||
      pathname.startsWith("/seller/res/faq") ||
      pathname.startsWith("/seller/tc") ||
      pathname.startsWith("/seller/res/tc");

    if (isExempt) {
      setIsBlocked(false);
      return;
    }

    let isMounted = true;
    async function checkReadiness() {
      try {
        const res = await fetchApi("/api/seller/dashboard/status");
        if (res.ok && isMounted) {
          const json = await res.json();
          const status = json.data || json;
          // If seller has an account and readiness is not completed, lock non-settings/profile pages
          if (status && !status.isReadinessCompleted) {
            setIsBlocked(true);
            router.replace("/seller/readiness");
          } else {
            setIsBlocked(false);
          }
        }
      } catch (err) {
        // fail gracefully
      }
    }

    checkReadiness();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isBlocked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#F8FAFC" }}>
        <div style={{ textAlign: "center", padding: "32px", maxWidth: "420px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "24px", backgroundColor: "#FFF1E8", color: "#FF5500", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "20px" }}>
            🔒
          </div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>Section Locked</h2>
          <p style={{ fontSize: "0.88rem", color: "#64748B", marginBottom: "16px", lineHeight: 1.5 }}>
            Please complete your onboarding readiness checklist to unlock this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.desktopView}>{desktop}</div>
      <div className={styles.mobileView}>{mobile}</div>
    </div>
  );
}
