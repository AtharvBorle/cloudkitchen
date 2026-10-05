"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

function SellerPortalHistoryManager() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isSeller = status === "authenticated" && session?.user?.role === "SELLER";
  const isLoginPage = Boolean(
    pathname === "/seller/login" ||
    pathname === "/seller/res/login" ||
    pathname === "/seller" ||
    pathname === "/auth/login/seller"
  );

  const isPublicSellerPage = Boolean(
    isLoginPage ||
    pathname?.startsWith("/seller/registration") ||
    pathname?.startsWith("/seller/account-information") ||
    pathname?.startsWith("/seller/business-information") ||
    pathname?.startsWith("/seller/confirm-information") ||
    pathname?.startsWith("/seller/confirm-registration") ||
    pathname?.startsWith("/seller/legal-documents") ||
    pathname?.startsWith("/seller/legal-information") ||
    pathname?.startsWith("/seller/media-gallery") ||
    pathname?.startsWith("/seller/media-information") ||
    pathname?.startsWith("/seller/verification") ||
    pathname?.startsWith("/seller/faq") ||
    pathname?.startsWith("/seller/tc") ||
    pathname?.startsWith("/seller/res/faq") ||
    pathname?.startsWith("/seller/res/tc")
  );

  useEffect(() => {
    // 1. If seller is authenticated and reaches a login route via back-button or direct URL,
    // immediately replace with dashboard without showing login form or logging out
    if (isSeller && isLoginPage) {
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      window.location.replace(isMobile ? "/seller/res/dashboard" : "/seller/dashboard");
      return;
    }

    // 2. Lock back-button on protected seller portal pages to prevent exiting to login
    if (!isSeller || isPublicSellerPage) return;

    window.history.pushState({ sellerPortal: true }, "", window.location.href);

    const handlePopState = () => {
      // If we are at the seller root dashboard, prevent back navigation to login
      if (pathname === "/seller/dashboard" || pathname === "/seller/res/dashboard") {
        window.history.pushState({ sellerPortal: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, isSeller, isLoginPage, isPublicSellerPage]);

  return null;
}

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SellerPortalHistoryManager />
      {children}
    </>
  );
}
