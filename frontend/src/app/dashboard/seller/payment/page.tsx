"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import SellerPaymentClient from "./client-page";

export default function SellerPaymentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryCategory = searchParams.get("category");
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
                const statusDataRaw = await statusRes.json();
                const statusData = statusDataRaw.data || statusDataRaw;
                
                if (statusData.sellerProfile?.verificationStatus !== "APPROVED") {
                    router.push("/dashboard/seller");
                    return;
                }

                // If they already have both active, they don't need another plan
                if (statusData.isFoodActive && statusData.isPropertyActive) {
                    router.push("/dashboard/seller");
                    return;
                }

                // Fetch subscription plans
                const url = queryCategory 
                    ? `/api/seller/subscription/plans?category=${queryCategory}` 
                    : "/api/seller/subscription/plans";
                const plansRes = await fetchApi(url);
                if (plansRes.ok) {
                    const plansData = await plansRes.json();
                    setPlans(plansData.data || plansData || []);
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
