"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    return (
        <SessionProvider basePath={`${apiBaseUrl}/api/auth`}>
            {children}
        </SessionProvider>
    );
}
