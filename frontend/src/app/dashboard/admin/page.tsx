"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import AdminDashboardClient from "./client-page";

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ verifications: any[]; stats: any } | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || !session.user || (session.user.role !== "AGENT" && session.user.role !== "SUPERADMIN")) {
            router.push("/admin");
            return;
        }

        const fetchAdminData = async () => {
            try {
                const res = await fetchApi("/api/admin/dashboard");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching admin dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [session, status, router]);

    if (status === "loading" || loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading Admin Panel...</div>;
    }

    if (!session || !session.user) {
        return null;
    }

    if (!data) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Failed to load Admin Panel.</div>;
    }

    return <AdminDashboardClient verifications={data.verifications} stats={data.stats} />;
}
