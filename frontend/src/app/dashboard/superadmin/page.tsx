"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";

export default function SuperadminOverview() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{ totalAgents: number; activeSellers: number; totalSubscriptions: number } | null>(null);

    useEffect(() => {
        if (status === "loading") return;
        if (status === "unauthenticated" || (session?.user as any)?.role !== "SUPERADMIN") {
            router.push("/dashboard/admin");
            return;
        }

        async function fetchStats() {
            try {
                const res = await fetchApi("/api/superadmin/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch superadmin stats", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [status, session, router]);

    if (loading || status === "loading") {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading Superadmin Panel...</div>;
    }

    if (!stats) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Failed to load dashboard statistics.</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', padding: '40px', fontFamily: "var(--font-sans)" }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Super Admin Panel Overview</h1>
                <button onClick={() => performLogout({ role: "SUPERADMIN" })} style={{ fontWeight: 'bold', color: 'var(--text-main)', border: '1px solid #CCC', borderRadius: '8px', backgroundColor: 'white', padding: '8px 16px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Total Admins</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalAgents}</p>
                </div>
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Active Sellers</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--coral)' }}>{stats.activeSellers}</p>
                </div>
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Total Subscriptions</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--teal)' }}>{stats.totalSubscriptions}</p>
                </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px' }}>Quick Actions</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    Select an option from the sidebar to manage admins, review seller categories, or configure platform subscription pricing and global coupons.
                </p>
            </div>
        </div>
    );
}
