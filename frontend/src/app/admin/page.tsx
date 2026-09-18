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
            } else if (role === "AGENT" || role === "ADMIN") {
                router.push("/dashboard/admin");
            } else if (role === "SUPPORT") {
                router.push("/dashboard/support");
            }
            // If the user is logged in with a non-admin role (e.g. USER, SELLER, DELIVERY),
            // do NOT auto-redirect away. Let them see Admin login so they can log into Admin.
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1A252F', color: '#FFFFFF' }}>Loading Admin Portal...</div>;
    }

    const isAdminRole = session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN" || session?.user?.role === "AGENT" || session?.user?.role === "SUPPORT";

    if (status === "unauthenticated" || !session || !isAdminRole) {
        return <AdminLoginPage />;
    }

    return null;
}
