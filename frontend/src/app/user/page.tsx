"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginPage from "@/app/login/page";

export default function UserPortalRoot() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const role = session.user.role;
            if (role === "USER") {
                router.push("/dashboard/user");
            } else if (role === "SUPERADMIN") {
                router.push("/dashboard/superadmin");
            } else if (role === "AGENT") {
                router.push("/dashboard/admin");
            } else if (role === "SUPPORT") {
                router.push("/dashboard/support");
            } else if (role === "SELLER") {
                router.push("/dashboard/seller");
            } else if (role === "DELIVERY") {
                router.push("/dashboard/delivery");
            }
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>Loading Customer Portal...</div>;
    }

    if (status === "unauthenticated" || !session) {
        return <LoginPage />;
    }

    return null;
}
