"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SellerLoginPage from "@/app/auth/login/seller/page";

export default function SellerPortalRoot() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const role = session.user.role;
            if (role === "SELLER") {
                router.push("/dashboard/seller");
            } else if (role === "SUPERADMIN") {
                router.push("/dashboard/superadmin");
            } else if (role === "AGENT") {
                router.push("/dashboard/admin");
            } else if (role === "DELIVERY") {
                router.push("/dashboard/delivery");
            } else {
                router.push("/dashboard/user");
            }
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>Loading Seller Portal...</div>;
    }

    if (status === "unauthenticated" || !session) {
        return <SellerLoginPage />;
    }

    return null;
}
