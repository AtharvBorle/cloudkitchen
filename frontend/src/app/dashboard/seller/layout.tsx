"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import SellerLayoutClient from "@/components/seller-layout-client";
import SubscriptionGate from "@/components/subscription-gate";

export default function SellerDashboardLayout({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState<{ sellerProfile: any; hasActiveSub: boolean } | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "SELLER") {
            router.push("/seller");
            return;
        }

        const fetchStatus = async () => {
            try {
                const res = await fetchApi("/api/seller/dashboard/status");
                if (res.ok) {
                    const data = await res.json();
                    setStatusData(data.data || data);
                }
            } catch (error) {
                console.error("Error fetching seller dashboard status:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [session, status, router]);

    if (status === "loading" || loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>;
    }

    if (!statusData) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Profile not found. Please contact support.</div>;
    }

    return (
        <SubscriptionGate
            verificationStatus={statusData.sellerProfile.verificationStatus}
            hasActiveSub={statusData.hasActiveSub}
        >
            <SellerLayoutClient>{children}</SellerLayoutClient>
        </SubscriptionGate>
    );
}
