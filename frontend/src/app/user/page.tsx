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
            }
            // If the user is logged in with a non-customer role (e.g. SELLER, ADMIN, DELIVERY),
            // do NOT auto-redirect away. Let them see Customer login so they can log in cleanly.
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>Loading Customer Portal...</div>;
    }

    const isCustomerRole = session?.user?.role === "USER";

    if (status === "unauthenticated" || !session || !isCustomerRole) {
        return <LoginPage />;
    }

    return null;
}
