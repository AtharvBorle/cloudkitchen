"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoreStatusToggle } from "@/components/store-status-toggle";
import { LogOut, AlertTriangle } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { fetchApi } from "@/lib/fetch-api";

export default function SellerDashboardOverview() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await fetchApi("/api/seller/dashboard/overview");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else {
                    if (res.status === 404) {
                        setError("PROFILE_NOT_FOUND");
                    } else {
                        setError("API_ERROR");
                    }
                }
            } catch (error) {
                console.error("Overview stats error:", error);
                setError("API_ERROR");
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, []);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading dashboard overview...</div>;
    }

    if (error === "PROFILE_NOT_FOUND" || !data) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxWidth: '450px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                    <div style={{ backgroundColor: '#FFF7ED', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                        <AlertTriangle size={32} color="#F97316" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1A1C23', marginBottom: '12px' }}>Profile Not Found</h2>
                    <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '32px' }}>
                        We couldn't find your seller profile. Your account might have been removed or the database was recently reset.
                    </p>
                    <button
                        onClick={async () => {
                            await signOut({ callbackUrl: window.location.origin + "/seller" });
                        }}
                        className="btn btn-coral"
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                    >
                        <LogOut size={20} /> Logout & Sign In Again
                    </button>
                </div>
            </div>
        );
    }

    const { sellerProfile, todayOrdersCount, totalRevenue, menuItemsCount, roomsCount, validUntilDate, isFoodActive, isPropertyActive } = data;

    const formattedValidUntilDate = validUntilDate
        ? new Date(validUntilDate).toLocaleDateString()
        : "None";

    return (
        <div>
            {/* Header Section */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                    {sellerProfile?.businessName || "My Kitchen"}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px' }}>
                    <StoreStatusToggle initialStatus={sellerProfile?.isOnline ?? true} />
                    <div className="badge" style={{ backgroundColor: 'var(--secondary)', color: 'white', padding: '8px 16px', borderRadius: '30px', margin: 0, whiteSpace: 'nowrap' }}>
                        Sub Valid: {formattedValidUntilDate}
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>Today's Orders</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{todayOrdersCount}</div>
                </div>

                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>Total Revenue</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>₹{totalRevenue.toFixed(2)}</div>
                </div>

                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>Menu Items</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{menuItemsCount}</div>
                </div>

                <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600' }}>Room Bookings</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{roomsCount}</div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {isFoodActive ? (
                    <Link href="/dashboard/seller/menu" className="btn btn-coral" style={{ flex: '1 1 auto', textAlign: 'center', padding: '15px 20px', borderRadius: '8px' }}>
                        Add New Menu Item
                    </Link>
                ) : (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("open-category-upgrade", { detail: { category: "FOOD" } }));
                        }}
                        className="btn btn-coral"
                        style={{ flex: '1 1 auto', textAlign: 'center', padding: '15px 20px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Add New Menu Item
                    </button>
                )}

                {isPropertyActive ? (
                    <Link href="/dashboard/seller/rooms" className="btn btn-teal" style={{ flex: '1 1 auto', textAlign: 'center', padding: '15px 20px', borderRadius: '8px' }}>
                        List a Room
                    </Link>
                ) : (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("open-category-upgrade", { detail: { category: "PROPERTY" } }));
                        }}
                        className="btn btn-teal"
                        style={{ flex: '1 1 auto', textAlign: 'center', padding: '15px 20px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        List a Room
                    </button>
                )}
            </div>
        </div>
    );
}
