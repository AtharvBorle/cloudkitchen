"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function AuthHistorySecurityLock() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== "authenticated" || !session?.user) {
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
            pathname === "/seller/login" ||
            pathname === "/seller/res/login" ||
            pathname === "/seller" ||
            pathname === "/auth/login/seller"
        );

        // 1. If authenticated user lands on any login route via back-button, redirect to dashboard
        if (isAuthRoute) {
            window.location.replace(targetDashboard);
            return;
        }

        // 2. Establish continuous history barrier
        window.history.pushState({ authLocked: true }, "", window.location.href);

        const handlePopState = () => {
            // Prevent going back to previous page links or exiting the authenticated session
            window.history.pushState({ authLocked: true }, "", targetDashboard);
            if (window.location.pathname !== targetDashboard) {
                router.replace(targetDashboard);
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
