"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import AdminCouponsClient from "@/app/dashboard/superadmin/coupons/client-page";

export default function AdminCouponsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sellers, setSellers] = useState<any[]>([]);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
            router.push("/auth/login");
            return;
        }

        const fetchSellers = async () => {
            try {
                const res = await fetchApi("/api/superadmin/dashboard/available-sellers");
                if (res.ok) {
                    const data = await res.json();
                    setSellers(data);
                }
            } catch (error) {
                console.error("Error fetching sellers list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSellers();
    }, [session, status, router]);
    if (status === "loading" || loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading coupon manager...</div>;
    }

    if (!session || !session.user) {
        return null;
    }

    return <AdminCouponsClient availableSellers={sellers} userRole={session.user.role} />;
}
