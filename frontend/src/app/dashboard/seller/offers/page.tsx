"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import SellerOffersClient from "./client-page";

export default function SellerOffersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ sellerId: string; products: any[] } | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "SELLER") {
            router.push("/seller");
            return;
        }

        const fetchOffers = async () => {
            try {
                const res = await fetchApi("/api/seller/dashboard/offers");
                if (res.ok) {
                    const result = await res.json();
                    const parsed = result.data || result;
                    setData({
                        sellerId: parsed.sellerId || "seller",
                        products: Array.isArray(parsed.products) ? parsed.products : [],
                    });
                } else {
                    router.push("/dashboard/seller");
                }
            } catch (error) {
                console.error("Error fetching offers data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, [session, status, router]);

    if (status === "loading" || loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading offers...</div>;
    }

    if (!data) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Failed to load offers.</div>;
    }

    return <SellerOffersClient sellerId={data.sellerId} products={data.products} />;
}
