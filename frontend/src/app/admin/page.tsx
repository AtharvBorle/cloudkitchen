"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminLoginPage from "@/app/auth/login/admin/page";

export default function AdminPortalRoot() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const role = session.user.role;
            if (role === "SUPERADMIN") {
                router.push("/dashboard/superadmin");
            } else if (role === "AGENT") {
                router.push("/dashboard/admin");
            } else if (role === "SELLER") {
                router.push("/dashboard/seller");
            } else if (role === "DELIVERY") {
                router.push("/dashboard/delivery");
            } else {
                router.push("/dashboard/user");
            }
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1A252F', color: '#FFFFFF' }}>Loading Admin Portal...</div>;
    }

    if (status === "unauthenticated" || !session) {
        return <AdminLoginPage />;
    }

    return null;
}
