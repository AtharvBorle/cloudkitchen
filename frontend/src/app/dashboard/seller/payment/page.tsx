"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import SellerPaymentClient from "./client-page";

export default function SellerPaymentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "SELLER") {
            router.push("/seller");
            return;
        }

        const verifyAndFetch = async () => {
            try {
                // Verify profile status and active sub via our overview status endpoint
                const statusRes = await fetchApi("/api/seller/dashboard/status");
                if (!statusRes.ok) {
                    router.push("/dashboard/seller");
                    return;
                }
                const statusData = await statusRes.json();
                
                if (statusData.sellerProfile?.verificationStatus !== "APPROVED") {
                    router.push("/dashboard/seller");
                    return;
                }

                if (statusData.hasActiveSub) {
                    router.push("/dashboard/seller");
                    return;
                }

                // Fetch subscription plans
                const plansRes = await fetchApi("/api/seller/subscription/plans");
                if (plansRes.ok) {
                    const plansData = await plansRes.json();
                    setPlans(plansData);
                }
            } catch (error) {
                console.error("Payment overview check failed:", error);
            } finally {
                setLoading(false);
            }
        };

        verifyAndFetch();
    }, [session, status, router]);

    if (status === "loading" || loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading payment options...</div>;
    }

    return <SellerPaymentClient plans={plans} />;
}
