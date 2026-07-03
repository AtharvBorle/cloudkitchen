"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DeliveryLoginPage from "@/app/auth/login/delivery/page";

export default function DeliveryPortalRoot() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const role = session.user.role;
            if (role === "DELIVERY") {
                router.push("/dashboard/delivery");
            } else if (role === "SUPERADMIN") {
                router.push("/dashboard/superadmin");
            } else if (role === "AGENT") {
                router.push("/dashboard/admin");
            } else if (role === "SUPPORT") {
                router.push("/dashboard/support");
            } else if (role === "SELLER") {
                router.push("/dashboard/seller");
            } else {
                router.push("/dashboard/user");
            }
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>Loading Delivery Portal...</div>;
    }

    if (status === "unauthenticated" || !session) {
        return <DeliveryLoginPage />;
    }

    return null;
}
