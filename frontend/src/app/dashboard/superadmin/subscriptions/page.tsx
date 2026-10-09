"use client";
import { fetchApi } from "@/lib/fetch-api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/logout";
import { CheckCircle2, AlertCircle, AlertTriangle, Users, Trash2 } from "lucide-react";
import { useRoomModule } from "@/context/RoomModuleContext";

export default function SuperadminSubscriptionsPage() {
    const router = useRouter();
    const { isRoomEnabled } = useRoomModule();
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

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
    const [newPlanCategory, setNewPlanCategory] = useState("BOTH");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const [savingPlan, setSavingPlan] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<any | null>(null);
    const [deletingPlanLoading, setDeletingPlanLoading] = useState(false);

    // Edit Plan Modal State
    const [editingPlan, setEditingPlan] = useState<any | null>(null);
    const [editPlanName, setEditPlanName] = useState("");
    const [editPlanPrice, setEditPlanPrice] = useState("");
    const [editPlanDuration, setEditPlanDuration] = useState("");
    const [editPlanFeatures, setEditPlanFeatures] = useState<string[]>([]);
    const [editPlanCategory, setEditPlanCategory] = useState("BOTH");
    const [editPlanIsActive, setEditPlanIsActive] = useState(true);
    const [newEditPlanFeature, setNewEditPlanFeature] = useState("");

    // Edit Coupon Modal State
    const [editingSubCoupon, setEditingSubCoupon] = useState<any | null>(null);
    const [editSubCouponCode, setEditSubCouponCode] = useState("");
    const [editSubCouponDesc, setEditSubCouponDesc] = useState("");
    const [editSubCouponPercent, setEditSubCouponPercent] = useState("");
    const [editSubCouponAmount, setEditSubCouponAmount] = useState("");
    const [editSubCouponPlanId, setEditSubCouponPlanId] = useState("");
    const [editSubCouponMaxUsage, setEditSubCouponMaxUsage] = useState("");
    const [editSubCouponIsActive, setEditSubCouponIsActive] = useState(true);

    const handleDiscountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Block scientific notation 'e', signs '+', '-', which are allowed by default in number inputs
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handlePercentChange = (val: string) => {
        setNewDiscountAmount("");
        if (!val) {
            setNewDiscountPercent("");
            return;
        }
        const clean = val.replace(/[^0-9.]/g, "");
        const num = parseFloat(clean);
        if (!isNaN(num) && num > 100) {
            showToast("Discount percentage cannot exceed 100%.", "error");
            setNewDiscountPercent("100");
            return;
        }
        setNewDiscountPercent(clean);
    };

    const handleAmountChange = (val: string) => {
        setNewDiscountPercent("");
        if (!val) {
            setNewDiscountAmount("");
            return;
        }
        const clean = val.replace(/[^0-9.]/g, "");
        const num = parseFloat(clean);
        const selectedPlan = plans.find(p => p.id === newPlanId);
        if (selectedPlan && !isNaN(num) && num > selectedPlan.price) {
            showToast(`Flat discount amount (₹${num}) cannot exceed selected plan price (₹${selectedPlan.price}).`, "error");
            setNewDiscountAmount(String(selectedPlan.price));
            return;
        }
        setNewDiscountAmount(clean);
    };

    const handleEditPercentChange = (val: string) => {
        setEditSubCouponAmount("");
        if (!val) {
            setEditSubCouponPercent("");
            return;
        }
        const clean = val.replace(/[^0-9.]/g, "");
        const num = parseFloat(clean);
        if (!isNaN(num) && num > 100) {
            showToast("Discount percentage cannot exceed 100%.", "error");
            setEditSubCouponPercent("100");
            return;
        }
        setEditSubCouponPercent(clean);
    };

    const handleEditAmountChange = (val: string) => {
        setEditSubCouponPercent("");
        if (!val) {
            setEditSubCouponAmount("");
            return;
        }
        const clean = val.replace(/[^0-9.]/g, "");
        const num = parseFloat(clean);
        const selectedPlan = plans.find(p => p.id === editSubCouponPlanId);
        if (selectedPlan && !isNaN(num) && num > selectedPlan.price) {
            showToast(`Flat discount amount (₹${num}) cannot exceed selected plan price (₹${selectedPlan.price}).`, "error");
            setEditSubCouponAmount(String(selectedPlan.price));
            return;
        }
        setEditSubCouponAmount(clean);
    };

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
        if (!newPlanName || !newPlanPrice || !newPlanDuration) {
            showToast("Please fill all required plan fields.", "error");
            return;
        }
        setSavingPlan(true);
        try {
            const res = await fetchApi("/api/superadmin/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newPlanName,
                    price: newPlanPrice,
                    durationMonths: newPlanDuration,
                    features: planFeatures,
                    category: newPlanCategory
                })
            });
            if (res.ok) {
                showToast("Subscription plan created successfully!", "success");
                setNewPlanName("");
                setNewPlanPrice("");
                setNewPlanDuration("");
                setPlanFeatures([]);
                setNewPlanCategory("BOTH");
                fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                showToast(data.message || "Failed to create subscription plan.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to create subscription plan.", "error");
        } finally {
            setSavingPlan(false);
        }
    };

    const handleConfirmDeletePlan = async () => {
        if (!planToDelete) return;
        setDeletingPlanLoading(true);
        try {
            const res = await fetchApi(`/api/superadmin/plans/${planToDelete.id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                showToast(data.message || "Subscription plan deleted successfully.", "success");
                setPlanToDelete(null);
                fetchData();
            } else {
                showToast(data.message || "Failed to delete plan.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to delete plan.", "error");
        } finally {
            setDeletingPlanLoading(false);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newCode.trim()) {
            showToast("Please enter a coupon code.", "error");
            return;
        }

        if (!newDiscountPercent && !newDiscountAmount) {
            showToast("Please enter either a discount percentage or flat discount amount.", "error");
            return;
        }

        const selectedPlan = plans.find(p => p.id === newPlanId);

        if (newDiscountPercent) {
            const pct = parseFloat(newDiscountPercent);
            if (isNaN(pct) || pct <= 0 || pct > 100) {
                showToast("Discount percentage must be between 1% and 100%.", "error");
                return;
            }
        }

        if (newDiscountAmount) {
            const amt = parseFloat(newDiscountAmount);
            if (isNaN(amt) || amt <= 0) {
                showToast("Flat discount amount must be greater than 0.", "error");
                return;
            }
            if (selectedPlan && amt > selectedPlan.price) {
                showToast(`Flat discount amount (₹${amt}) cannot exceed the selected plan price (₹${selectedPlan.price}).`, "error");
                return;
            }
        }

        setLoading(true);
        const resolvedCategory = selectedPlan ? (selectedPlan.category || "BOTH") : "BOTH";

        try {
            const res = await fetchApi("/api/superadmin/subscriptions/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: newCode.trim().toUpperCase(),
                    discountPercentage: newDiscountPercent ? parseFloat(newDiscountPercent) : null,
                    discountAmount: newDiscountAmount ? parseFloat(newDiscountAmount) : null,
                    maxUsage: newMaxUsage ? parseInt(newMaxUsage) : 0,
                    planId: newPlanId || null,
                    category: resolvedCategory
                })
            });

            if (res.ok) {
                showToast("Subscription coupon created successfully!", "success");
                setNewCode(""); setNewDiscountPercent(""); setNewDiscountAmount(""); setNewMaxUsage(""); setNewPlanId("");
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to create coupon or code already exists.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to create coupon.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm("Delete this subscription coupon?")) return;
        try {
            const res = await fetchApi(`/api/superadmin/subscriptions/coupons/${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Subscription coupon deleted successfully.", "success");
                fetchData();
            } else {
                showToast("Failed to delete coupon.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to delete coupon.", "error");
        }
    };

    const handleOpenEditPlan = (plan: any) => {
        setEditingPlan(plan);
        setEditPlanName(plan.name);
        setEditPlanPrice(String(plan.price));
        setEditPlanDuration(String(plan.durationMonths));
        try {
            setEditPlanFeatures(JSON.parse(plan.features || "[]"));
        } catch {
            setEditPlanFeatures([]);
        }
        setEditPlanCategory(plan.category || "BOTH");
        setEditPlanIsActive(plan.isActive);
    };

    const handleUpdatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;
        try {
            const res = await fetchApi(`/api/superadmin/plans/${editingPlan.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editPlanName,
                    price: parseFloat(editPlanPrice),
                    durationMonths: parseInt(editPlanDuration, 10),
                    features: editPlanFeatures,
                    category: editPlanCategory,
                    isActive: editPlanIsActive
                })
            });
            if (res.ok) {
                showToast("Subscription plan updated successfully!", "success");
                setEditingPlan(null);
                fetchData();
            } else {
                showToast("Failed to update plan.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to update plan.", "error");
        }
    };

    const handleTogglePlanActive = async (plan: any) => {
        try {
            const res = await fetchApi(`/api/superadmin/plans/${plan.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive: !plan.isActive
                })
            });
            if (res.ok) {
                showToast(`Subscription plan ${!plan.isActive ? "activated" : "deactivated"} successfully.`, "success");
                fetchData();
            } else {
                showToast("Failed to update plan status.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to update plan status.", "error");
        }
    };

    const handleOpenEditSubCoupon = (coupon: any) => {
        setEditingSubCoupon(coupon);
        setEditSubCouponCode(coupon.code);
        setEditSubCouponDesc(coupon.description || "");
        setEditSubCouponPercent(coupon.discountPercentage ? String(coupon.discountPercentage) : "");
        setEditSubCouponAmount(coupon.discountAmount ? String(coupon.discountAmount) : "");
        setEditSubCouponPlanId(coupon.planId || "");
        setEditSubCouponMaxUsage(String(coupon.maxUsage));
        setEditSubCouponIsActive(coupon.isActive);
    };

    const handleUpdateSubCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubCoupon) return;

        const selectedPlan = plans.find(p => p.id === editSubCouponPlanId);

        if (editSubCouponPercent) {
            const pct = parseFloat(editSubCouponPercent);
            if (isNaN(pct) || pct <= 0 || pct > 100) {
                showToast("Discount percentage must be between 1% and 100%.", "error");
                return;
            }
        }

        if (editSubCouponAmount) {
            const amt = parseFloat(editSubCouponAmount);
            if (isNaN(amt) || amt <= 0) {
                showToast("Flat discount amount must be greater than 0.", "error");
                return;
            }
            if (selectedPlan && amt > selectedPlan.price) {
                showToast(`Flat discount amount (₹${amt}) cannot exceed the selected plan price (₹${selectedPlan.price}).`, "error");
                return;
            }
        }

        const resolvedCategory = selectedPlan ? (selectedPlan.category || "BOTH") : "BOTH";

        try {
            const res = await fetchApi(`/api/superadmin/subscriptions/coupons/${editingSubCoupon.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: editSubCouponCode.trim().toUpperCase(),
                    description: editSubCouponDesc,
                    discountPercentage: editSubCouponPercent ? parseFloat(editSubCouponPercent) : null,
                    discountAmount: editSubCouponAmount ? parseFloat(editSubCouponAmount) : null,
                    planId: editSubCouponPlanId || null,
                    maxUsage: parseInt(editSubCouponMaxUsage) || 0,
                    category: resolvedCategory,
                    isActive: editSubCouponIsActive
                })
            });
            if (res.ok) {
                showToast("Subscription coupon updated successfully!", "success");
                setEditingSubCoupon(null);
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to update coupon.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to update coupon.", "error");
        }
    };

    const handleToggleSubCouponActive = async (coupon: any) => {
        try {
            const res = await fetchApi(`/api/superadmin/subscriptions/coupons/${coupon.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive: !coupon.isActive
                })
            });
            if (res.ok) {
                showToast(`Subscription coupon ${!coupon.isActive ? "activated" : "deactivated"} successfully.`, "success");
                fetchData();
            } else {
                showToast("Failed to update coupon status.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to update coupon status.", "error");
        }
    };

    const handleLogout = () => {
        performLogout({ role: "SUPERADMIN" });
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
            {/* Toast Notification */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: "24px",
                        right: "24px",
                        zIndex: 99999,
                        backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444",
                        color: "#FFFFFF",
                        padding: "12px 20px",
                        borderRadius: "10px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                    }}
                >
                    {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

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
                <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {plans.filter((plan: any) => isRoomEnabled || plan.category !== "PROPERTY").map((plan) => (
                        <div key={plan.id} style={{ border: '1px solid #EAEAEA', borderRadius: '8px', padding: '20px', backgroundColor: '#F8F9F9', position: 'relative', opacity: plan.isActive ? 1 : 0.7, borderLeft: plan.isActive ? 'none' : '4px solid var(--text-muted)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>{plan.name}</span>
                                    {!plan.isActive && <span style={{ fontSize: '0.75rem', backgroundColor: '#E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>INACTIVE</span>}
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                    <button onClick={() => handleOpenEditPlan(plan)} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Edit</button>
                                    <button onClick={() => handleTogglePlanActive(plan)} style={{ background: 'none', border: 'none', color: plan.isActive ? '#E74C3C' : '#27AE60', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                        {plan.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button onClick={() => setPlanToDelete(plan)} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Delete</button>
                                </div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '6px', whiteSpace: 'nowrap' }}>₹{plan.price}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
                                <span>Duration: {plan.durationMonths} Month(s)</span>
                                <span style={{ backgroundColor: '#E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {plan.category || "BOTH"}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: '#475569', marginBottom: '14px', backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', width: 'fit-content', whiteSpace: 'nowrap' }}>
                                <Users size={14} color={plan.activeSubscribersCount > 0 ? '#16A34A' : '#64748B'} />
                                <span>Active Subscribers: <strong style={{ color: plan.activeSubscribersCount > 0 ? '#16A34A' : '#0F172A' }}>{plan.activeSubscribersCount || 0}</strong></span>
                            </div>
                            <ul style={{ paddingLeft: '20px', color: '#555', fontSize: '0.9rem', margin: 0 }}>
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(plan.features);
                                        return parsed.map((feat: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}>{feat}</li>);
                                    } catch (e) { return null; }
                                })()}
                            </ul>
                        </div>
                    ))}
                    {plans.filter((plan: any) => isRoomEnabled || plan.category !== "PROPERTY").length === 0 && <p style={{ color: 'var(--text-muted)' }}>No plans created yet.</p>}
                </div>

                <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #EAEAEA' }} />

                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>Create New Plan</h2>
                <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) minmax(130px, 1fr) minmax(110px, 1fr)', gap: '14px', alignItems: 'center' }}>
                        <input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} className="input-field" placeholder="Plan Name (e.g., Monthly Pro)" style={{ marginBottom: 0, width: '100%' }} required />
                        <div style={{ position: "relative", width: '100%' }}>
                            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#555", fontWeight: "bold" }}>₹</span>
                            <input type="number" value={newPlanPrice} onChange={e => setNewPlanPrice(e.target.value)} className="input-field" placeholder="Price" style={{ paddingLeft: "32px", marginBottom: 0, width: '100%' }} min="0" required />
                        </div>
                        <input type="number" value={newPlanDuration} onChange={e => setNewPlanDuration(e.target.value)} className="input-field" placeholder="Months" style={{ marginBottom: 0, width: '100%' }} min="1" required />
                    </div>

                    <div>
                        <select value={newPlanCategory} onChange={e => setNewPlanCategory(e.target.value)} className="input-field" style={{ marginBottom: 0, width: '100%' }}>
                            {isRoomEnabled ? (
                                <>
                                    <option value="BOTH">All/Both Categories (FOOD & PROPERTY)</option>
                                    <option value="FOOD">Food Focus Only (FOOD)</option>
                                    <option value="PROPERTY">Property Focus Only (PROPERTY)</option>
                                </>
                            ) : (
                                <>
                                    <option value="BOTH">All Categories (Food)</option>
                                    <option value="FOOD">Food Focus Only (FOOD)</option>
                                </>
                            )}
                        </select>
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
                            <button type="button" onClick={handleAddFeature} className="btn btn-secondary" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Add</button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-coral" style={{ width: '100%', padding: '14px 25px', whiteSpace: 'nowrap' }} disabled={savingPlan}>
                        {savingPlan ? "Creating..." : "Create Plan"}
                    </button>
                </form>
            </div>

            {/* Subscription Coupons Management Area */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '4px solid #1ABC9C' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Subscription Coupons</h2>
                <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '840px', marginBottom: '30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(320px, 2fr)', gap: '16px', alignItems: 'center' }}>
                        <div>
                            <input
                                type="text"
                                value={newCode}
                                onChange={e => setNewCode(e.target.value)}
                                className="input-field"
                                placeholder="Code (e.g., SAVE50)"
                                style={{ textTransform: 'uppercase', marginBottom: 0, width: '100%' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                            <input
                                type="number"
                                value={newDiscountPercent}
                                onKeyDown={handleDiscountKeyDown}
                                onChange={e => handlePercentChange(e.target.value)}
                                className="input-field"
                                placeholder="Discount %"
                                style={{ flex: 1, marginBottom: 0 }}
                                min="1"
                                max="100"
                            />
                            <span style={{ color: '#64748B', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0, padding: '0 4px', whiteSpace: 'nowrap' }}>OR</span>
                            <input
                                type="number"
                                value={newDiscountAmount}
                                onKeyDown={handleDiscountKeyDown}
                                onChange={e => handleAmountChange(e.target.value)}
                                className="input-field"
                                placeholder="Flat Discount ₹"
                                style={{ flex: 1, marginBottom: 0 }}
                                min="1"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.8fr) minmax(180px, 1.2fr)', gap: '16px', alignItems: 'center' }}>
                        <select
                            value={newPlanId}
                            onChange={e => {
                                const pId = e.target.value;
                                setNewPlanId(pId);
                                if (pId && newDiscountAmount) {
                                    const selPlan = plans.find(p => p.id === pId);
                                    if (selPlan && parseFloat(newDiscountAmount) > selPlan.price) {
                                        showToast(`Flat discount adjusted to match selected plan price (₹${selPlan.price}).`, "error");
                                        setNewDiscountAmount(String(selPlan.price));
                                    }
                                }
                            }}
                            className="input-field"
                            style={{ marginBottom: 0, width: '100%' }}
                        >
                            <option value="">All Plans (Global)</option>
                            {plans.filter((plan: any) => isRoomEnabled || plan.category !== "PROPERTY").map((plan: any) => (
                                <option key={plan.id} value={plan.id}>{plan.name} (₹{plan.price})</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={newMaxUsage}
                            onKeyDown={handleDiscountKeyDown}
                            onChange={e => setNewMaxUsage(e.target.value.replace(/[^0-9]/g, ''))}
                            className="input-field"
                            placeholder="Max Usage (0 for unlimited)"
                            style={{ marginBottom: 0, width: '100%' }}
                            min="0"
                        />
                    </div>

                    <div>
                        <button type="submit" className="btn btn-teal" style={{ padding: '12px 28px', whiteSpace: 'nowrap' }} disabled={loading}>
                            {loading ? "Creating..." : "Create Coupon"}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '20px' }}>
                    {coupons.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No subscription coupons generated.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                            {coupons.map((coupon: any) => (
                                <div key={coupon.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: coupon.isActive ? '#E8F8F5' : '#F2F4F4', padding: '20px', borderRadius: '12px', border: coupon.isActive ? '1px solid #1ABC9C' : '1px solid #BDC3C7', opacity: coupon.isActive ? 1 : 0.8 }}>
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
                                            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: coupon.isActive ? '#16A085' : '#7F8C8D', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{coupon.code}</div>
                                            {!coupon.isActive && <span style={{ fontSize: '0.7rem', backgroundColor: '#7F8C8D', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>INACTIVE</span>}
                                        </div>

                                        <div style={{ fontSize: '1rem', color: '#333', marginTop: '6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            {coupon.discountPercentage ? `${coupon.discountPercentage}% OFF` : `₹${coupon.discountAmount} OFF`}
                                        </div>

                                        <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Valid for: <span style={{ fontWeight: 'bold' }}>{coupon.plan ? coupon.plan.name : 'All Plans'}</span></div>
                                            <div style={{ whiteSpace: 'nowrap' }}>Category: <span style={{ fontWeight: 'bold', color: coupon.isActive ? '#16a085' : '#7f8c8d', backgroundColor: coupon.isActive ? '#e8f8f5' : '#f2f4f4', padding: '2px 6px', borderRadius: '4px' }}>{coupon.category || 'BOTH'}</span></div>
                                            <div style={{ whiteSpace: 'nowrap' }}>
                                                Usage: <span style={{ fontWeight: 'bold', color: coupon.maxUsage > 0 && coupon.currentUsage >= coupon.maxUsage ? '#E74C3C' : '#27AE60' }}>
                                                    {coupon.currentUsage} / {coupon.maxUsage > 0 ? coupon.maxUsage : 'Unlimited'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                        <button onClick={() => handleOpenEditSubCoupon(coupon)} style={{ border: 'none', color: '#16A085', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#E8F8F5', whiteSpace: 'nowrap' }}>Edit</button>
                                        <button onClick={() => handleToggleSubCouponActive(coupon)} style={{ border: 'none', color: coupon.isActive ? '#E67E22' : '#27AE60', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: coupon.isActive ? '#FDF2E9' : '#EAF2F8', whiteSpace: 'nowrap' }}>
                                            {coupon.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                        <button onClick={() => handleDeleteCoupon(coupon.id)} style={{ border: 'none', color: '#E74C3C', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#FDEDEC', whiteSpace: 'nowrap' }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Subscriptions Overview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap' }}>Active Seller Subscriptions</h2>
                <input
                    type="text"
                    placeholder="Search by ID, Name, Plan, or Coupon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '280px' }}
                />
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                    <thead style={{ backgroundColor: '#F8F9F9' }}>
                        <tr>
                            <th onClick={() => handleSort('sellerId')} style={{ padding: '16px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Seller ID {sortConfig?.key === 'sellerId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </span>
                            </th>
                            <th onClick={() => handleSort('seller')} style={{ padding: '16px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Seller {sortConfig?.key === 'seller' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </span>
                            </th>
                            <th onClick={() => handleSort('plan')} style={{ padding: '16px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Plan {sortConfig?.key === 'plan' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </span>
                            </th>
                            <th onClick={() => handleSort('coupon')} style={{ padding: '16px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Coupon {sortConfig?.key === 'coupon' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </span>
                            </th>
                            <th onClick={() => handleSort('amount')} style={{ padding: '16px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Amount Paid {sortConfig?.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </span>
                            </th>
                            <th onClick={() => handleSort('validUntil')} style={{ padding: '16px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Valid Until {sortConfig?.key === 'validUntil' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </span>
                            </th>
                            <th style={{ padding: '16px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedSubscriptions.map((sub: any) => {
                            const validDate = new Date(sub.validUntil);
                            const isExpired = validDate < new Date();
                            return (
                                <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '16px 20px', color: '#555', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{sub.seller?.trackingId || sub.sellerId.substring(0, 8)}</td>
                                    <td style={{ padding: '16px 20px', color: '#1E293B', fontWeight: '600', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{sub.seller?.businessName || "Unknown Seller"}</td>
                                    <td style={{ padding: '16px 20px', color: '#475569', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{sub.plan?.name || "Unknown Plan"}</td>
                                    <td style={{ padding: '16px 20px', color: '#475569', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                        {sub.appliedCoupon ? (
                                            <span style={{ backgroundColor: '#E8F8F5', color: '#16A085', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                {sub.appliedCoupon}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#aaa', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>None</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#1E293B', fontWeight: '600', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>₹{sub.amount}</td>
                                    <td style={{ padding: '16px 20px', color: '#475569', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{validDate.toLocaleDateString()}</td>
                                    <td style={{ padding: '16px 20px', color: '#555', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: isExpired ? '#F2D7D5' : '#D4EFDF',
                                            color: isExpired ? '#E74C3C' : '#27AE60',
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block'
                                        }}>
                                            {isExpired ? "EXPIRED" : "ACTIVE"}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                        {processedSubscriptions.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {subscriptions.length === 0 ? "No live subscriptions found." : "No subscriptions match your search."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {/* Edit Plan Modal */}
            {editingPlan && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Edit Subscription Plan</h2>
                        <form onSubmit={handleUpdatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Plan Name</label>
                                <input type="text" value={editPlanName} onChange={e => setEditPlanName(e.target.value)} className="input-field" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Price (₹)</label>
                                    <input type="number" value={editPlanPrice} onChange={e => setEditPlanPrice(e.target.value)} className="input-field" min="0" required />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Duration (Months)</label>
                                    <input type="number" value={editPlanDuration} onChange={e => setEditPlanDuration(e.target.value)} className="input-field" min="1" required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Plan Category</label>
                                <select value={editPlanCategory} onChange={e => setEditPlanCategory(e.target.value)} className="input-field">
                                    {isRoomEnabled ? (
                                        <>
                                            <option value="BOTH">All/Both Categories (FOOD & PROPERTY)</option>
                                            <option value="FOOD">Food Focus Only (FOOD)</option>
                                            <option value="PROPERTY">Property Focus Only (PROPERTY)</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="BOTH">All Categories (Food)</option>
                                            <option value="FOOD">Food Focus Only (FOOD)</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Plan Status</label>
                                <select value={editPlanIsActive ? "true" : "false"} onChange={e => setEditPlanIsActive(e.target.value === "true")} className="input-field">
                                    <option value="true">Active / Visible to Sellers</option>
                                    <option value="false">Inactive / Hidden</option>
                                </select>
                            </div>

                            <div style={{ backgroundColor: '#F8F9F9', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '15px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Plan Features</h4>
                                <div style={{ marginBottom: '15px' }}>
                                    {editPlanFeatures.map((feature, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #EAEAEA' }}>
                                            <span style={{ color: '#555', fontSize: '0.9rem' }}>{feature}</span>
                                            <button type="button" onClick={() => setEditPlanFeatures(editPlanFeatures.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Remove</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" value={newEditPlanFeature} onChange={e => setNewEditPlanFeature(e.target.value)} className="input-field" placeholder="Add feature..." style={{ flex: 1, marginBottom: 0 }} />
                                    <button type="button" onClick={() => { if (newEditPlanFeature.trim()) { setEditPlanFeatures([...editPlanFeatures, newEditPlanFeature.trim()]); setNewEditPlanFeature(""); } }} className="btn btn-secondary" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.9rem' }}>Add</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setEditingPlan(null)} className="btn" style={{ backgroundColor: '#f1f5f9', color: '#475569', width: 'auto', padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px 24px', borderRadius: '8px' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Coupon Modal */}
            {editingSubCoupon && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Edit Subscription Coupon</h2>
                        <form onSubmit={handleUpdateSubCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Coupon Code</label>
                                <input type="text" value={editSubCouponCode} onChange={e => setEditSubCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))} className="input-field" style={{ textTransform: 'uppercase' }} required />
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Description</label>
                                <input type="text" value={editSubCouponDesc} onChange={e => setEditSubCouponDesc(e.target.value)} className="input-field" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Discount %</label>
                                    <input
                                        type="number"
                                        value={editSubCouponPercent}
                                        onKeyDown={handleDiscountKeyDown}
                                        onChange={e => handleEditPercentChange(e.target.value)}
                                        className="input-field"
                                        min="1"
                                        max="100"
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Flat Discount ₹</label>
                                    <input
                                        type="number"
                                        value={editSubCouponAmount}
                                        onKeyDown={handleDiscountKeyDown}
                                        onChange={e => handleEditAmountChange(e.target.value)}
                                        className="input-field"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Applicable Plan</label>
                                <select
                                    value={editSubCouponPlanId}
                                    onChange={e => {
                                        const pId = e.target.value;
                                        setEditSubCouponPlanId(pId);
                                        if (pId && editSubCouponAmount) {
                                            const selPlan = plans.find(p => p.id === pId);
                                            if (selPlan && parseFloat(editSubCouponAmount) > selPlan.price) {
                                                showToast(`Flat discount adjusted to match selected plan price (₹${selPlan.price}).`, "error");
                                                setEditSubCouponAmount(String(selPlan.price));
                                            }
                                        }
                                    }}
                                    className="input-field"
                                >
                                    <option value="">All Plans (Global)</option>
                                    {plans.filter((plan: any) => isRoomEnabled || plan.category !== "PROPERTY").map((plan: any) => (
                                        <option key={plan.id} value={plan.id}>{plan.name} (₹{plan.price})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Max Usage</label>
                                    <input type="number" value={editSubCouponMaxUsage} onKeyDown={handleDiscountKeyDown} onChange={e => setEditSubCouponMaxUsage(e.target.value.replace(/[^0-9]/g, ''))} className="input-field" min="0" required />
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Status</label>
                                <select value={editSubCouponIsActive ? "true" : "false"} onChange={e => setEditSubCouponIsActive(e.target.value === "true")} className="input-field">
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setEditingSubCoupon(null)} className="btn" style={{ backgroundColor: '#f1f5f9', color: '#475569', width: 'auto', padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px 24px', borderRadius: '8px' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Plan Delete Confirmation Modal */}
            {planToDelete && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#0F172A' }}>
                                    Delete Subscription Plan
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                                    Are you sure you want to delete <strong style={{ color: '#0F172A' }}>{planToDelete.name}</strong> (₹{planToDelete.price})?
                                </p>
                            </div>
                        </div>

                        <div style={{ backgroundColor: (planToDelete.activeSubscribersCount || 0) > 0 ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${(planToDelete.activeSubscribersCount || 0) > 0 ? '#FECACA' : '#E2E8F0'}`, borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: (planToDelete.activeSubscribersCount || 0) > 0 ? '#991B1B' : '#334155', marginBottom: '4px' }}>
                                👥 Current Active Subscribers: {planToDelete.activeSubscribersCount || 0}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: (planToDelete.activeSubscribersCount || 0) > 0 ? '#7F1D1D' : '#64748B', lineHeight: 1.4 }}>
                                {(planToDelete.activeSubscribersCount || 0) > 0
                                    ? `This plan currently has ${planToDelete.activeSubscribersCount} active subscriber(s). Deleting it will remove the plan from new seller purchases, while preserving full access and features for existing subscribers until their validity expires.`
                                    : "No active sellers are currently subscribed to this plan. It will be permanently removed."}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                disabled={deletingPlanLoading}
                                onClick={() => setPlanToDelete(null)}
                                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingPlanLoading}
                                onClick={handleConfirmDeletePlan}
                                style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {deletingPlanLoading ? "Deleting..." : "Delete Plan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
