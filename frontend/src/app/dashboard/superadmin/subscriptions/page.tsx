"use client";
import { fetchApi } from "@/lib/fetch-api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperadminSubscriptionsPage() {
    const router = useRouter();
    const [coupons, setCoupons] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [newCode, setNewCode] = useState("");
    const [newDiscountPercent, setNewDiscountPercent] = useState("");
    const [newDiscountAmount, setNewDiscountAmount] = useState("");
    const [newMaxUsage, setNewMaxUsage] = useState("");
    const [newPlanId, setNewPlanId] = useState("");

    const [plans, setPlans] = useState<any[]>([]);
    const [newPlanName, setNewPlanName] = useState("");
    const [newPlanPrice, setNewPlanPrice] = useState("");
    const [newPlanDuration, setNewPlanDuration] = useState("");
    const [planFeatures, setPlanFeatures] = useState<string[]>([]);
    const [newFeature, setNewFeature] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const [savingPlan, setSavingPlan] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetchApi("/api/superadmin/subscriptions/coupons");
            const data = await res.json();
            if (res.ok) {
                setCoupons(data.coupons || []);
            }

            const subsRes = await fetchApi("/api/superadmin/subscriptions");
            if (subsRes.ok) {
                const subsData = await subsRes.json();
                setSubscriptions(subsData.recentSubscriptions || []);
            }

            const plansRes = await fetchApi("/api/superadmin/plans");
            if (plansRes.ok) {
                const plansData = await plansRes.json();
                setPlans(plansData.plans || []);
            }
        } catch (error) {
            console.error("Failed to fetch data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setPlanFeatures([...planFeatures, newFeature.trim()]);
            setNewFeature("");
        }
    };

    const handleRemoveFeature = (index: number) => {
        setPlanFeatures(planFeatures.filter((_, i) => i !== index));
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlanName || !newPlanPrice || !newPlanDuration) return;
        setSavingPlan(true);
        try {
            const res = await fetchApi("/api/superadmin/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newPlanName,
                    price: newPlanPrice,
                    durationMonths: newPlanDuration,
                    features: planFeatures
                })
            });
            if (res.ok) {
                alert("Plan created successfully!");
                setNewPlanName("");
                setNewPlanPrice("");
                setNewPlanDuration("");
                setPlanFeatures([]);
                fetchData();
            } else {
                alert("Failed to create plan.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSavingPlan(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            const res = await fetchApi(`/api/superadmin/plans/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete plan.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetchApi("/api/superadmin/subscriptions/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: newCode,
                    discountPercentage: newDiscountPercent ? parseFloat(newDiscountPercent) : null,
                    discountAmount: newDiscountAmount ? parseFloat(newDiscountAmount) : null,
                    maxUsage: newMaxUsage ? parseInt(newMaxUsage) : 0,
                    planId: newPlanId || null
                })
            });

            if (res.ok) {
                setNewCode(""); setNewDiscountPercent(""); setNewDiscountAmount(""); setNewMaxUsage(""); setNewPlanId("");
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to create coupon or code already exists");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm("Delete this subscription coupon?")) return;
        try {
            const res = await fetchApi(`/api/superadmin/subscriptions/coupons/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete coupon");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        router.push("/api/auth/signout");
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedAndFilteredSubscriptions = () => {
        let filtered = subscriptions.filter(sub => {
            const searchTerm = searchQuery.toLowerCase();
            const sellerId = sub.seller?.trackingId ? sub.seller.trackingId.toLowerCase() : sub.sellerId.substring(0, 8).toLowerCase();
            const sellerName = sub.seller?.businessName ? sub.seller.businessName.toLowerCase() : "";
            const planName = sub.plan?.name ? sub.plan.name.toLowerCase() : "";
            const coupon = sub.appliedCoupon ? sub.appliedCoupon.toLowerCase() : "";

            return sellerId.includes(searchTerm) ||
                sellerName.includes(searchTerm) ||
                planName.includes(searchTerm) ||
                coupon.includes(searchTerm);
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'sellerId') {
                    aValue = a.seller?.trackingId || a.sellerId;
                    bValue = b.seller?.trackingId || b.sellerId;
                } else if (sortConfig.key === 'seller') {
                    aValue = a.seller?.businessName || "";
                    bValue = b.seller?.businessName || "";
                } else if (sortConfig.key === 'plan') {
                    aValue = a.plan?.name || "";
                    bValue = b.plan?.name || "";
                } else if (sortConfig.key === 'coupon') {
                    aValue = a.appliedCoupon || "";
                    bValue = b.appliedCoupon || "";
                } else if (sortConfig.key === 'amount') {
                    aValue = parseFloat(a.amount) || 0;
                    bValue = parseFloat(b.amount) || 0;
                } else if (sortConfig.key === 'validUntil') {
                    aValue = new Date(a.validUntil).getTime();
                    bValue = new Date(b.validUntil).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return filtered;
    };

    const processedSubscriptions = getSortedAndFilteredSubscriptions();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', padding: '40px', fontFamily: "var(--font-sans)" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Subscriptions & Coupons</h1>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1rem' }}>
                    Logout
                </button>
            </div>

            {/* Subscription Plans Builder */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '4px solid var(--primary)' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Subscription Plans</h2>

                {/* Active Plans List */}
                <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {plans.map((plan) => (
                        <div key={plan.id} style={{ border: '1px solid #EAEAEA', borderRadius: '8px', padding: '20px', backgroundColor: '#F8F9F9', position: 'relative' }}>
                            <button onClick={() => handleDeletePlan(plan.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '10px' }}>{plan.name}</h3>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '5px' }}>₹{plan.price}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>Duration: {plan.durationMonths} Month(s)</div>
                            <ul style={{ paddingLeft: '20px', color: '#555', fontSize: '0.9rem' }}>
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(plan.features);
                                        return parsed.map((feat: string, i: number) => <li key={i}>{feat}</li>);
                                    } catch (e) { return null; }
                                })()}
                            </ul>
                        </div>
                    ))}
                    {plans.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No plans created yet.</p>}
                </div>

                <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #EAEAEA' }} />

                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-main)' }}>Create New Plan</h2>
                <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} className="input-field" placeholder="Plan Name (e.g., Monthly Pro)" style={{ flex: 2, marginBottom: 0 }} required />
                        <div style={{ position: "relative", flex: 1 }}>
                            <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#555", fontWeight: "bold" }}>₹</span>
                            <input type="number" value={newPlanPrice} onChange={e => setNewPlanPrice(e.target.value)} className="input-field" placeholder="Price" style={{ paddingLeft: "35px", marginBottom: 0, width: '100%' }} min="0" required />
                        </div>
                        <input type="number" value={newPlanDuration} onChange={e => setNewPlanDuration(e.target.value)} className="input-field" placeholder="Months" style={{ flex: 1, marginBottom: 0 }} min="1" required />
                    </div>

                    <div style={{ backgroundColor: '#F8F9F9', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '15px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Plan Features</h4>
                        <div style={{ marginBottom: '15px' }}>
                            {planFeatures.map((feature, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #EAEAEA' }}>
                                    <span style={{ color: '#555', fontSize: '0.9rem' }}>{feature}</span>
                                    <button type="button" onClick={() => handleRemoveFeature(idx)} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Remove</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" value={newFeature} onChange={e => setNewFeature(e.target.value)} className="input-field" placeholder="E.g., 24/7 Support" style={{ flex: 1, marginBottom: 0 }} />
                            <button type="button" onClick={handleAddFeature} className="btn btn-secondary" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.9rem' }}>Add</button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-coral" style={{ width: '100%', padding: '14px 25px' }} disabled={savingPlan}>
                        {savingPlan ? "Creating..." : "Create Plan"}
                    </button>
                </form>
            </div>

            {/* Subscription Coupons Management Area */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '4px solid #1ABC9C' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Subscription Coupons</h2>
                <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} className="input-field" placeholder="Code (e.g., SAVE50)" style={{ flex: 1, minWidth: '150px', textTransform: 'uppercase', marginBottom: 0 }} required />

                        <div style={{ display: 'flex', gap: '10px', flex: 2, minWidth: '250px' }}>
                            <input type="number" value={newDiscountPercent} onChange={e => { setNewDiscountPercent(e.target.value); setNewDiscountAmount(""); }} className="input-field" placeholder="Discount %" style={{ flex: 1, marginBottom: 0 }} min="1" max="100" />
                            <span style={{ alignSelf: 'center', color: '#555', fontWeight: 'bold' }}>OR</span>
                            <input type="number" value={newDiscountAmount} onChange={e => { setNewDiscountAmount(e.target.value); setNewDiscountPercent(""); }} className="input-field" placeholder="Flat Discount ₹" style={{ flex: 1, marginBottom: 0 }} min="1" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <select value={newPlanId} onChange={e => setNewPlanId(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                            <option value="">All Plans (Global)</option>
                            {plans.map((plan: any) => (
                                <option key={plan.id} value={plan.id}>{plan.name} (₹{plan.price})</option>
                            ))}
                        </select>
                        <input type="number" value={newMaxUsage} onChange={e => setNewMaxUsage(e.target.value)} className="input-field" placeholder="Max Usage (0 for unlimited)" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }} min="0" />
                    </div>

                    <button type="submit" className="btn btn-teal" style={{ width: '200px', padding: '14px 25px' }} disabled={loading}>
                        {loading ? "Creating..." : "Create Coupon"}
                    </button>
                </form>

                <div style={{ marginTop: '20px' }}>
                    {coupons.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No subscription coupons generated.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
                            {coupons.map((coupon: any) => (
                                <div key={coupon.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F8F5', padding: '20px', borderRadius: '12px', border: '1px solid #1ABC9C' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#16A085', letterSpacing: '1px' }}>{coupon.code}</div>
                                            {!coupon.isActive && <span style={{ fontSize: '0.7rem', backgroundColor: '#E74C3C', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>INACTIVE</span>}
                                        </div>

                                        <div style={{ fontSize: '1rem', color: '#333', marginTop: '8px', fontWeight: 'bold' }}>
                                            {coupon.discountPercentage ? `${coupon.discountPercentage}% OFF` : `₹${coupon.discountAmount} OFF`}
                                        </div>

                                        <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div>Valid for: <span style={{ fontWeight: 'bold' }}>{coupon.plan ? coupon.plan.name : 'All Plans'}</span></div>
                                            <div>
                                                Usage: <span style={{ fontWeight: 'bold', color: coupon.maxUsage > 0 && coupon.currentUsage >= coupon.maxUsage ? '#E74C3C' : '#27AE60' }}>
                                                    {coupon.currentUsage} / {coupon.maxUsage > 0 ? coupon.maxUsage : 'Unlimited'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteCoupon(coupon.id)} style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: '10px', borderRadius: '8px', backgroundColor: '#FDEDEC' }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Subscriptions Overview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Active Seller Subscriptions</h2>
                <input
                    type="text"
                    placeholder="Search by ID, Name, Plan, or Coupon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '300px' }}
                />
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#F8F9F9' }}>
                        <tr>
                            <th onClick={() => handleSort('sellerId')} style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>Seller ID {sortConfig?.key === 'sellerId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                            <th onClick={() => handleSort('seller')} style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>Seller {sortConfig?.key === 'seller' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                            <th onClick={() => handleSort('plan')} style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>Plan {sortConfig?.key === 'plan' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                            <th onClick={() => handleSort('coupon')} style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>Coupon {sortConfig?.key === 'coupon' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                            <th onClick={() => handleSort('amount')} style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>Amount Paid {sortConfig?.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                            <th onClick={() => handleSort('validUntil')} style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>Valid Until {sortConfig?.key === 'validUntil' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                            <th style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedSubscriptions.map((sub: any) => {
                            const validDate = new Date(sub.validUntil);
                            const isExpired = validDate < new Date();
                            return (
                                <tr key={sub.id}>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', color: '#555', fontSize: '0.85rem', fontFamily: 'monospace' }}>{sub.seller?.trackingId || sub.sellerId.substring(0, 8)}</td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', color: '#555', fontWeight: 'bold' }}>{sub.seller?.businessName || "Unknown Seller"}</td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', color: '#555' }}>{sub.plan?.name || "Unknown Plan"}</td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', color: '#555' }}>
                                        {sub.appliedCoupon ? (
                                            <span style={{ backgroundColor: '#E8F8F5', color: '#16A085', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                {sub.appliedCoupon}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>None</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', color: '#555' }}>₹{sub.amount}</td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', color: '#555' }}>{validDate.toLocaleDateString()}</td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #EAEAEA', color: '#555' }}>
                                        <span style={{
                                            padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: isExpired ? '#F2D7D5' : '#D4EFDF',
                                            color: isExpired ? '#E74C3C' : '#27AE60'
                                        }}>
                                            {isExpired ? "EXPIRED" : "ACTIVE"}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                        {processedSubscriptions.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {subscriptions.length === 0 ? "No live subscriptions found." : "No subscriptions match your search."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
