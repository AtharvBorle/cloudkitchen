"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";

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

        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                window.location.reload();
            }
        };
        window.addEventListener("pageshow", handlePageShow);

        return () => {
            document.removeEventListener('wheel', handleWheel);
            window.removeEventListener("pageshow", handlePageShow);
        };
    }, []);

    const authBasePath = apiBaseUrl && !apiBaseUrl.includes("localhost") && !apiBaseUrl.includes("127.0.0.1")
        ? `${apiBaseUrl.replace(/\/$/, "")}/api/auth`
        : "/api/auth";

    return (
        <SessionProvider basePath={authBasePath} refetchOnWindowFocus={false}>
            {children}
        </SessionProvider>
    );
}
