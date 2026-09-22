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
            }
            // If the user is logged in with a non-delivery role (e.g. USER, ADMIN, SELLER),
            // do NOT auto-redirect away. Let them see Delivery login so they can log in cleanly.
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>Loading Delivery Portal...</div>;
    }

    const isDeliveryRole = session?.user?.role === "DELIVERY";

    if (status === "unauthenticated" || !session || !isDeliveryRole) {
        return <DeliveryLoginPage />;
    }

    return null;
}
