"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function SupportRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams?.get("id") || searchParams?.get("ticketId");
        if (id) {
            router.replace(`/support/tickets?id=${encodeURIComponent(id)}`);
        } else {
            router.replace("/support/tickets");
        }
    }, [router, searchParams]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
            <Loader2 className="animate-spin" color="#FF5500" size={32} />
        </div>
    );
}

export default function UserSupportPage() {
    return (
        <Suspense
            fallback={
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                    <Loader2 className="animate-spin" color="#FF5500" size={32} />
                </div>
            }
        >
            <SupportRedirect />
        </Suspense>
    );
}
