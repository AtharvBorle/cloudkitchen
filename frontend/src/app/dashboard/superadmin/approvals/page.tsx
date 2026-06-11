"use client";

import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, RotateCcw } from "lucide-react";

export default function SuperadminApprovals() {
    const router = useRouter();
    const [banners, setBanners] = useState<any[]>([]);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [adminNote, setAdminNote] = useState("");

    const fetchApprovals = async () => {
        try {
            const res = await fetchApi("/api/superadmin/approvals");
            const data = await res.json();
            if (res.ok) {
                setBanners(data.banners);
                setCoupons(data.coupons);
            }
        } catch (error) {
            console.error("Failed to fetch approvals");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleAction = async (type: string, id: string, action: string) => {
        if (action !== "APPROVE" && !adminNote) {
            alert("Please provide an Admin Note explaining why this was Rejected or Reverted.");
            return;
        }

        if (!confirm(`Are you sure you want to ${action} this ${type}?`)) return;

        setActionLoading(`${type}-${id}`);

        try {
            const res = await fetchApi(`/api/superadmin/approvals/${type}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, adminNote })
            });

            if (res.ok) {
                setAdminNote("");
                fetchApprovals();
            } else {
                alert(`Failed to ${action} ${type}`);
            }
        } catch (error) {
            console.error("Action error", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = async () => {
        router.push("/api/auth/signout");
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', padding: '40px', fontFamily: "var(--font-sans)" }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Global Approvals</h1>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <Link href="/dashboard/superadmin" style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '500' }}>Overview</Link>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontWeight: 'bold', color: 'var(--coral)', cursor: 'pointer', fontSize: '1rem' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #EAEAEA', marginBottom: '30px', overflowX: 'auto', gap: '5px' }}>
                <Link href="/dashboard/superadmin" style={{ padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Dashboard Overview
                </Link>
                <Link href="/dashboard/superadmin/admins" style={{ padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Manage Admins
                </Link>
                <Link href="/dashboard/superadmin/sellers" style={{ padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Manage Sellers
                </Link>
                <div style={{ padding: '10px 20px', borderBottom: '2px solid var(--coral)', color: 'var(--coral)', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Global Approvals
                </div>
                <Link href="/dashboard/superadmin/subscriptions" style={{ padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    System Settings
                </Link>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading pending approvals...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {/* Banners */}
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', color: '#0f172a' }}>Pending Global Banners</h2>
                        {banners.length === 0 ? (
                            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>No pending banners.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {banners.map((banner) => (
                                    <div key={banner.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <div style={{ height: '160px', backgroundImage: `url(${banner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                        <div style={{ padding: '20px' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>{banner.title}</h3>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                                                {banner.redirectUrl ? <a href={banner.redirectUrl} target="_blank" rel="noopener noreferrer">Link</a> : 'No redirection link'}
                                            </div>

                                            <textarea
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                                placeholder="Admin Note (required for Reject/Revert)"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '0.9rem', resize: 'vertical' }}
                                                rows={2}
                                            />

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => handleAction('banner', banner.id, 'APPROVE')} disabled={actionLoading !== null} style={{ flex: 1, backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button onClick={() => handleAction('banner', banner.id, 'REVISION')} disabled={actionLoading !== null} style={{ flex: 1, backgroundColor: '#eab308', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                    <RotateCcw size={16} /> Revert
                                                </button>
                                                <button onClick={() => handleAction('banner', banner.id, 'REJECT')} disabled={actionLoading !== null} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Coupons */}
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '20px', color: '#0f172a' }}>Pending Global Offers (Coupons)</h2>
                        {coupons.length === 0 ? (
                            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>No pending offers.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {coupons.map((coupon) => (
                                    <div key={coupon.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--coral)', border: '1px dashed var(--coral)', padding: '5px 10px', borderRadius: '6px' }}>{coupon.code}</h3>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {coupon.discountPercentage ? `${coupon.discountPercentage}% OFF` : `₹${coupon.discountAmount} OFF`}
                                            </span>
                                        </div>
                                        <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '15px' }}>{coupon.description || 'No description provided.'}</p>

                                        <textarea
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Admin Note (required for Reject/Revert)"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '0.9rem', resize: 'vertical' }}
                                            rows={2}
                                        />

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleAction('coupon', coupon.id, 'APPROVE')} disabled={actionLoading !== null} style={{ flex: 1, backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                <Check size={16} /> Approve
                                            </button>
                                            <button onClick={() => handleAction('coupon', coupon.id, 'REVISION')} disabled={actionLoading !== null} style={{ flex: 1, backgroundColor: '#eab308', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                <RotateCcw size={16} /> Revert
                                            </button>
                                            <button onClick={() => handleAction('coupon', coupon.id, 'REJECT')} disabled={actionLoading !== null} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                <X size={16} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
