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
        return () => {
            document.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return (
        <SessionProvider basePath={`${apiBaseUrl}/api/auth`} refetchOnWindowFocus={false}>
            {children}
        </SessionProvider>
    );
}
