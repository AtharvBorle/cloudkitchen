"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SellerLogin, SellerResponsiveWrapper, ResSellerLogin } from "@/components/seller";

export default function SellerPortalRoot() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const role = session.user.role;
            if (role === "SELLER") {
                router.push("/seller/dashboard");
            }
            // If the user is logged in with a non-seller role (e.g. USER, ADMIN, DELIVERY),
            // do NOT auto-redirect away. Let them see Seller login so they can log in cleanly.
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>Loading Seller Portal...</div>;
    }

    const isSellerRole = session?.user?.role === "SELLER";

    if (status === "unauthenticated" || !session || !isSellerRole) {
        return (
            <SellerResponsiveWrapper
                desktop={<SellerLogin />}
                mobile={<ResSellerLogin />}
            />
        );
    }

    return null;
}
