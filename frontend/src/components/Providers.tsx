"use client";

// Defensive DOM mutation safety guard against Next.js 15/16 + Webpack HMR or extensions throwing removeChild errors
if (typeof window !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (!child) return child;
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  window.addEventListener("error", (event) => {
    if (
      event.message?.includes("removeChild") ||
      event.message?.includes("insertBefore") ||
      event.message?.includes("Cannot read properties of null (reading 'removeChild')")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function AuthHistorySecurityLock() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        const isLoggedOut = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("logged_out") === "true";
        if (isLoggedOut || status !== "authenticated" || !session?.user) {
            return;
        }

        const role = ((session.user as any)?.role || "USER").toUpperCase();
        const isSeller = role === "SELLER";
        const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

        const isSellerOnboarding = Boolean(
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
            pathname?.startsWith("/seller/revision")
        );

        if (isSeller && isSellerOnboarding) {
            return;
        }

        const targetDashboard = isSeller
            ? (pathname?.startsWith("/seller/res") || isMobile ? "/seller/res/dashboard" : "/seller/dashboard")
            : role === "ADMIN" || role === "SUPERADMIN"
            ? "/dashboard/admin"
            : role === "DELIVERY"
            ? "/dashboard/delivery"
            : "/";

        const isAuthRoute = Boolean(
            pathname === "/login" ||
            pathname === "/auth/login" ||
            pathname === "/signup" ||
            pathname === "/auth/register/user" ||
            pathname === "/seller/login" ||
            pathname === "/seller/res/login" ||
            pathname === "/seller" ||
            pathname === "/auth/login/seller"
        );

        if (isAuthRoute) {
            return;
        }

        const handlePopState = () => {
            const isLoggedOutNow = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("logged_out") === "true";
            if (isLoggedOutNow) {
                return;
            }

            const currentPath = window.location.pathname;
            const isTargetAuth = Boolean(
                currentPath === "/login" ||
                currentPath === "/auth/login" ||
                currentPath === "/signup" ||
                currentPath === "/auth/register/user" ||
                currentPath === "/seller/login" ||
                currentPath === "/seller/res/login" ||
                currentPath === "/seller" ||
                currentPath === "/auth/login/seller"
            );

            // Only intercept if browser back navigates to a login/auth page while authenticated
            if (isTargetAuth) {
                window.history.pushState({ authLocked: true }, "", targetDashboard);
                window.location.replace(targetDashboard);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [status, session, pathname, router]);

    return null;
}

export function Providers({ children }: { children: ReactNode }) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
                e.preventDefault();
                (target as HTMLInputElement).blur();
            }
        };
        document.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            document.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return (
        <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false}>
            <AuthHistorySecurityLock />
            {children}
        </SessionProvider>
    );
}
