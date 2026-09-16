"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import { Plus, Tag, Calendar, Check, X, Percent, DollarSign, Store, Box, Trash2, Edit2, Copy, Pencil } from "lucide-react";

export interface OfferItem {
    id: string;
    code: string;
    description: string;
    scopeText: string;
    scopeColor: string;
    discountText: string;
    discountType: string;
    status: "Active" | "Pending" | "Expired";
    usageCount: number;
    usageMax: number;
    savings: string;
    isExpired: boolean;
    badgeBg: string;
    badgeColor: string;
    rawCoupon?: CouponType;
}

const DEFAULT_OFFERS: OfferItem[] = [
    {
        id: "demo-summer20",
        code: "SUMMER20",
        description: "Get 20% off on all items above ₹500",
        scopeText: "Entire Store",
        scopeColor: "#F97316",
        discountText: "20% off",
        discountType: "Percentage",
        status: "Active",
        usageCount: 124,
        usageMax: 500,
        savings: "₹12,400",
        isExpired: false,
        badgeBg: "#FFF7ED",
        badgeColor: "#EA580C",
    },
    {
        id: "demo-flat100",
        code: "FLAT100",
        description: "Flat ₹100 off on first order",
        scopeText: "New Users Only",
        scopeColor: "#3B82F6",
        discountText: "₹100 off",
        discountType: "Flat Amount",
        status: "Active",
        usageCount: 450,
        usageMax: 1000,
        savings: "₹45,000",
        isExpired: false,
        badgeBg: "#FFF7ED",
        badgeColor: "#EA580C",
    },
    {
        id: "demo-weekend50",
        code: "WEEKEND50",
        description: "₹50 discount on specific desserts",
        scopeText: "Specific Items",
        scopeColor: "#8B5CF6",
        discountText: "₹50 off",
        discountType: "Flat Amount",
        status: "Pending",
        usageCount: 0,
        usageMax: 100,
        savings: "₹0",
        isExpired: false,
        badgeBg: "#FEFCE8",
        badgeColor: "#CA8A04",
    },
    {
        id: "demo-expired50",
        code: "EXPIRED50",
        description: "Half price celebration coupon",
        scopeText: "Entire Store",
        scopeColor: "#94A3B8",
        discountText: "50% off",
        discountType: "Percentage",
        status: "Expired",
        usageCount: 250,
        usageMax: 250,
        savings: "₹31,250",
        isExpired: true,
        badgeBg: "#F1F5F9",
        badgeColor: "#94A3B8",
    },
];

type ProductType = {
    id: string;
    name: string;
    type: string;
};

type CouponType = {
    id: string;
    code: string;
    description: string;
    discountPercentage: number | null;
    discountAmount: number | null;
    appliesToSellerId: string | null;
    appliesToProductId: string | null;
    validFrom: string;
    validUntil: string | null;
    isActive: boolean;
};

export default function SellerOffersClient({ sellerId, products }: { sellerId: string, products: ProductType[] }) {
    const router = useRouter();
    const [coupons, setCoupons] = useState<CouponType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponType | null>(null);
    const [filterTab, setFilterTab] = useState<"All" | "Active" | "Pending" | "Expired">("All");

    // Form state
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "AMOUNT">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [scopeType, setScopeType] = useState<"STORE" | "PRODUCT">("STORE");
    const [productId, setProductId] = useState("");
    const [hasEndDate, setHasEndDate] = useState(false);
    const [validUntil, setValidUntil] = useState("");
    const [isActive, setIsActive] = useState(true);

    const fetchCoupons = async () => {
        try {
            const res = await fetchApi("/api/coupons");
            if (res.ok) {
                const data = await res.json();
                setCoupons(data);
            }
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const resetForm = () => {
        setCode("");
        setDescription("");
        setDiscountValue("");
        setScopeType("STORE");
        setProductId("");
        setHasEndDate(false);
        setValidUntil("");
        setIsActive(true);
        setEditingCoupon(null);
        setIsCreating(false);
    };

    const handleEdit = (coupon: CouponType) => {
        setEditingCoupon(coupon);
        setCode(coupon.code);
        setDescription(coupon.description || "");

        if (coupon.discountPercentage) {
            setDiscountType("PERCENTAGE");
            setDiscountValue(coupon.discountPercentage.toString());
        } else {
            setDiscountType("AMOUNT");
            setDiscountValue(coupon.discountAmount?.toString() || "");
        }

        if (coupon.appliesToProductId) {
            setScopeType("PRODUCT");
            setProductId(coupon.appliesToProductId);
        } else {
            setScopeType("STORE");
            setProductId("");
        }

        if (coupon.validUntil) {
            setHasEndDate(true);
            // Format for datetime-local: YYYY-MM-DDThh:mm
            const date = new Date(coupon.validUntil);
            const formattedDate = date.toISOString().slice(0, 16);
            setValidUntil(formattedDate);
        } else {
            setHasEndDate(false);
            setValidUntil("");
        }

        setIsActive(coupon.isActive);
        setIsCreating(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload: any = {
                code,
                description,
                appliesToSellerId: sellerId,
                appliesToProductId: scopeType === "PRODUCT" ? productId : null,
                discountPercentage: discountType === "PERCENTAGE" ? parseFloat(discountValue) : null,
                discountAmount: discountType === "AMOUNT" ? parseFloat(discountValue) : null,
                validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null,
                isActive: isActive
            };

            const method = editingCoupon ? "PUT" : "POST";
            const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : "/api/coupons";

            const res = await fetchApi(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedCoupon = await res.json();
                if (editingCoupon) {
                    setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? updatedCoupon : c));
                } else {
                    setCoupons([updatedCoupon, ...coupons]);
                }
                resetForm();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to save coupon");
            }
        } catch (error) {
            console.error("Error saving coupon:", error);
            alert("An error occurred");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this offer?")) return;

        try {
            const res = await fetchApi(`/api/coupons/${id}`, { method: "DELETE" });
            if (res.ok) {
                setCoupons(prev => prev.filter(c => c.id !== id));
            } else {
                alert("Failed to delete coupon");
            }
        } catch (error) {
            console.error("Error deleting coupon:", error);
        }
    };

    const handleToggleActive = async (coupon: CouponType) => {
        try {
            const res = await fetchApi(`/api/coupons/${coupon.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive: !coupon.isActive
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setCoupons(prev => prev.map(c => c.id === coupon.id ? updated : c));
            } else {
                const data = await res.json();
                alert(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error toggling coupon status:", error);
            alert("An error occurred");
        }
    };

    const [demoOffers, setDemoOffers] = useState<OfferItem[]>(DEFAULT_OFFERS);
    const [copyToast, setCopyToast] = useState<string | null>(null);

    const handleCopy = (codeText: string) => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(codeText);
            setCopyToast(`Copied ${codeText} to clipboard!`);
            setTimeout(() => setCopyToast(null), 2000);
        }
    };

    const handleDeleteDemo = (id: string) => {
        if (confirm("Are you sure you want to delete this offer?")) {
            setDemoOffers((prev) => prev.filter((item) => item.id !== id));
        }
    };

    const displayOffers: OfferItem[] = coupons.length > 0
        ? coupons.map((c) => {
            const isExpired = !!(c.validUntil && new Date(c.validUntil) < new Date());
            const isPercentage = !!c.discountPercentage;
            const discountText = isPercentage ? `${c.discountPercentage}% off` : `₹${c.discountAmount || 0} off`;
            const discountType = isPercentage ? "Percentage" : "Flat Amount";
            const scopeText = c.appliesToProductId ? "Specific Items" : (c.appliesToSellerId === null ? "System Promotion" : "Entire Store");
            const status: "Active" | "Pending" | "Expired" = isExpired ? "Expired" : (c.isActive ? "Active" : "Pending");
            const usageCount = c.currentUsersCount || 0;
            const usageMax = c.maxUsers || 500;
            const savingsNum = (c.discountAmount || (c.discountPercentage ? c.discountPercentage * 10 : 50)) * usageCount;
            
            let badgeBg = "#FFF7ED";
            let badgeColor = "#EA580C";
            if (isExpired) {
                badgeBg = "#F1F5F9";
                badgeColor = "#94A3B8";
            } else if (!c.isActive) {
                badgeBg = "#FEFCE8";
                badgeColor = "#CA8A04";
            }

            return {
                id: c.id,
                code: c.code,
                description: c.description || (isPercentage ? `Get ${c.discountPercentage}% off` : `Flat ₹${c.discountAmount} off`),
                scopeText,
                scopeColor: c.appliesToProductId ? "#8B5CF6" : "#F97316",
                discountText,
                discountType,
                status,
                usageCount,
                usageMax,
                savings: `₹${savingsNum.toLocaleString("en-IN")}`,
                isExpired,
                badgeBg,
                badgeColor,
                rawCoupon: c,
            };
        })
        : demoOffers;

    const activeCount = displayOffers.filter((o) => o.status === "Active").length;
    const pendingCount = displayOffers.filter((o) => o.status === "Pending").length;
    const expiredCount = displayOffers.filter((o) => o.status === "Expired").length;

    const filteredOffers = displayOffers.filter((offer) => {
        if (filterTab === "Active") return offer.status === "Active";
        if (filterTab === "Pending") return offer.status === "Pending";
        if (filterTab === "Expired") return offer.status === "Expired";
        return true;
    });

    return (
        <div style={{ animation: "fadeIn 0.5s ease" }} className="offers-page-root">
            <div className="offers-header-container" style={{ marginBottom: "1.75rem" }}>
                <h1 className="offers-main-title" style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>Offers & Coupons</h1>
                <p className="offers-main-subtitle" style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>Create and manage promotional discounts for your customers</p>
            </div>

            {/* Stat Cards Row */}
            <div className="offers-stat-grid">
                {/* Active Offers */}
                <div
                    className="offers-stat-card"
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "14px",
                        padding: "20px 24px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500, marginBottom: "6px" }}>Active Offers</span>
                    <span style={{ fontSize: "30px", fontWeight: 800, color: "#0F172A", lineHeight: 1.1, marginBottom: "8px" }}>{activeCount}</span>
                    <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 500 }}>+1 this week</span>
                </div>

                {/* Pending Offers */}
                <div
                    className="offers-stat-card"
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "14px",
                        padding: "20px 24px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500, marginBottom: "6px" }}>Pending Offers</span>
                    <span style={{ fontSize: "30px", fontWeight: 800, color: "#0F172A", lineHeight: 1.1, marginBottom: "8px" }}>{pendingCount}</span>
                    <span style={{ fontSize: "13px", color: "#D97706", fontWeight: 500 }}>Needs review</span>
                </div>

                {/* Expired Offers */}
                <div
                    className="offers-stat-card"
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "14px",
                        padding: "20px 24px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500, marginBottom: "6px" }}>Expired Offers</span>
                    <span style={{ fontSize: "30px", fontWeight: 800, color: "#0F172A", lineHeight: 1.1, marginBottom: "8px" }}>{expiredCount}</span>
                    <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>Archived</span>
                </div>
            </div>

            {/* Filter and Action Toolbar Card */}
            <div className="offers-filter-bar-card">
                <div className="offers-filter-group">
                    <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500, marginRight: "4px", flexShrink: 0 }}>Filter:</span>
                    {(["All", "Active", "Pending", "Expired"] as const).map((tab) => {
                        const isSelected = filterTab === tab;
                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setFilterTab(tab)}
                                className="offers-filter-pill"
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: isSelected ? 600 : 500,
                                    border: "none",
                                    backgroundColor: isSelected ? "#EA580C" : "#F1F5F9",
                                    color: isSelected ? "#FFFFFF" : "#475569",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <Link
                    href="/seller/offers/create"
                    className="offers-create-btn"
                    style={{ textDecoration: "none" }}
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Create New Plan
                </Link>
            </div>


            {isCreating && (
                <div style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "2rem",
                    marginBottom: "2rem",
                    border: "1px solid #e2e8f0",
                    position: "relative"
                }}>
                    <button
                        onClick={resetForm}
                        style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                        <X size={24} />
                    </button>

                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>
                        {editingCoupon ? "Edit Offer" : "Offer Details"}
                    </h3>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            {/* Code & Description */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Coupon Code*</label>
                                    <input
                                        required
                                        disabled={!!editingCoupon}
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                        placeholder="e.g. SUMMER25"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", textTransform: "uppercase", backgroundColor: editingCoupon ? "#f8fafc" : "white" }}
                                    />
                                    {editingCoupon && <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>Code cannot be changed.</p>}
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Description</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="e.g. 25% off all summer specials"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>

                            {/* Discount Values */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Discount Type*</label>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setDiscountType("PERCENTAGE")}
                                            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${discountType === "PERCENTAGE" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: discountType === "PERCENTAGE" ? "#fff0f0" : "white", color: discountType === "PERCENTAGE" ? "var(--primary)" : "#64748b", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                                        >
                                            <Percent size={16} /> Percentage
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDiscountType("AMOUNT")}
                                            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${discountType === "AMOUNT" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: discountType === "AMOUNT" ? "#fff0f0" : "white", color: discountType === "AMOUNT" ? "var(--primary)" : "#64748b", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                                        >
                                            <DollarSign size={16} /> Flat Amount
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
                                        {discountType === "PERCENTAGE" ? "Percentage Off (%)" : "Amount Off (₹)"}*
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max={discountType === "PERCENTAGE" ? "100" : undefined}
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder={discountType === "PERCENTAGE" ? "25" : "150"}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            {/* Target Scope */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Valid On</label>
                                <div style={{ display: "flex", gap: "10px", marginBottom: scopeType === "PRODUCT" ? "1rem" : "0" }}>
                                    <button
                                        type="button"
                                        onClick={() => setScopeType("STORE")}
                                        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${scopeType === "STORE" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: scopeType === "STORE" ? "#fff0f0" : "white", color: scopeType === "STORE" ? "var(--primary)" : "#64748b", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                                    >
                                        <Store size={16} /> Entire Store
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScopeType("PRODUCT")}
                                        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${scopeType === "PRODUCT" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: scopeType === "PRODUCT" ? "#fff0f0" : "white", color: scopeType === "PRODUCT" ? "var(--primary)" : "#64748b", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                                    >
                                        <Box size={16} /> Specific Item
                                    </button>
                                </div>
                                {scopeType === "PRODUCT" && (
                                    <select
                                        required
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
                                    >
                                        <option value="">Select a product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>[{p.type}] {p.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Expiration & Status */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Expiration</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                                        <input
                                            type="checkbox"
                                            id="hasEndDate"
                                            checked={!hasEndDate}
                                            onChange={(e) => setHasEndDate(!e.target.checked)}
                                            style={{ width: "16px", height: "16px" }}
                                        />
                                        <label htmlFor="hasEndDate" style={{ color: "#334155" }}>No expiration date (Runs indefinitely)</label>
                                    </div>
                                    {hasEndDate && (
                                        <input
                                            required
                                            type="datetime-local"
                                            value={validUntil}
                                            onChange={(e) => setValidUntil(e.target.value)}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <input
                                        type="checkbox"
                                        id="isActiveForm"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                    />
                                    <label htmlFor="isActiveForm" style={{ color: "#334155", fontWeight: "600", cursor: "pointer" }}>
                                        Coupon is Active
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                            <button
                                type="submit"
                                style={{ flex: 1, padding: "14px", backgroundColor: "var(--primary)", color: "white", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer" }}
                            >
                                {editingCoupon ? "Update Offer" : "Launch Offer"}
                            </button>
                            {editingCoupon && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{ flex: 1, padding: "14px", backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer" }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Copy Feedback Toast */}
            {copyToast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "24px",
                        right: "24px",
                        backgroundColor: "#0F172A",
                        color: "#FFFFFF",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 9999,
                        animation: "fadeIn 0.2s ease",
                    }}
                >
                    {copyToast}
                </div>
            )}

            {/* Offers Table Section (Desktop Table + Mobile Cards) */}
            {isLoading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading offers...</div>
            ) : filteredOffers.length === 0 ? (
                <div style={{
                    backgroundColor: "white",
                    padding: "4rem 2rem",
                    borderRadius: "16px",
                    textAlign: "center",
                    border: "1px dashed #cbd5e1"
                }}>
                    <Tag size={48} color="#94a3b8" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                    <h3 style={{ fontSize: "1.25rem", color: "#334155", marginBottom: "0.5rem" }}>
                        {filterTab === "All" ? "No Offers Found" : `No ${filterTab} Offers`}
                    </h3>
                    <p style={{ color: "#64748b" }}>No offers match the selected {filterTab.toLowerCase()} filter criteria.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="offers-desktop-table-container">
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "900px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
                                    <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>COUPON CODE</th>
                                    <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>DESCRIPTION</th>
                                    <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>DISCOUNT</th>
                                    <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>STATUS</th>
                                    <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>USAGE</th>
                                    <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>SAVINGS</th>
                                    <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "right" }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOffers.map((item, idx) => {
                                    const isLast = idx === filteredOffers.length - 1;
                                    const isExpired = item.isExpired;
                                    return (
                                        <tr
                                            key={item.id}
                                            style={{
                                                borderBottom: isLast ? "none" : "1px solid #F1F5F9",
                                                backgroundColor: "#FFFFFF",
                                                transition: "background-color 0.15s ease",
                                            }}
                                        >
                                            {/* COUPON CODE */}
                                            <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "6px 12px",
                                                        backgroundColor: item.badgeBg,
                                                        color: item.badgeColor,
                                                        borderRadius: "6px",
                                                        fontWeight: 700,
                                                        fontSize: "13px",
                                                        letterSpacing: "0.02em",
                                                    }}
                                                >
                                                    {item.code}
                                                </span>
                                            </td>

                                            {/* DESCRIPTION */}
                                            <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                                                <div style={{ fontSize: "14px", fontWeight: 600, color: isExpired ? "#94A3B8" : "#0F172A", marginBottom: "4px" }}>
                                                    {item.description}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: isExpired ? "#94A3B8" : "#64748B", fontWeight: 500 }}>
                                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isExpired ? "#CBD5E1" : item.scopeColor, display: "inline-block" }} />
                                                    <span>{item.scopeText}</span>
                                                </div>
                                            </td>

                                            {/* DISCOUNT */}
                                            <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                                                <div style={{ fontSize: "14px", fontWeight: 700, color: isExpired ? "#94A3B8" : "#0F172A", marginBottom: "2px" }}>
                                                    {item.discountText}
                                                </div>
                                                <div style={{ fontSize: "12px", color: isExpired ? "#CBD5E1" : "#94A3B8", fontWeight: 500 }}>
                                                    {item.discountType}
                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                                                {/* Empty column matching screenshot layout */}
                                            </td>

                                            {/* USAGE */}
                                            <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: isExpired ? "#94A3B8" : "#0F172A", marginBottom: "6px" }}>
                                                    {item.usageCount} / {item.usageMax}
                                                </div>
                                                <div style={{ width: "64px", height: "4px", backgroundColor: "#E2E8F0", borderRadius: "2px", overflow: "hidden" }}>
                                                    <div
                                                        style={{
                                                            width: `${Math.min(100, Math.round((item.usageCount / item.usageMax) * 100))}%`,
                                                            height: "100%",
                                                            backgroundColor: isExpired ? "#94A3B8" : "#F97316",
                                                            borderRadius: "2px",
                                                        }}
                                                    />
                                                </div>
                                            </td>

                                            {/* SAVINGS */}
                                            <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                                                <div style={{ fontSize: "14px", fontWeight: 700, color: isExpired ? "#94A3B8" : "#0F172A" }}>
                                                    {item.savings}
                                                </div>
                                            </td>

                                            {/* ACTIONS */}
                                            <td style={{ padding: "20px 24px", verticalAlign: "middle", textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "14px" }}>
                                                    <button
                                                        type="button"
                                                        title="Edit Offer"
                                                        onClick={() => {
                                                            router.push(`/seller/offers/edit?id=${item.id}&code=${encodeURIComponent(item.code)}`);
                                                        }}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            padding: "2px",
                                                            color: isExpired ? "#CBD5E1" : "#64748B",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "color 0.15s ease",
                                                        }}
                                                    >
                                                        <Pencil size={18} strokeWidth={2} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Copy Code"
                                                        onClick={() => handleCopy(item.code)}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            padding: "2px",
                                                            color: isExpired ? "#CBD5E1" : "#64748B",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "color 0.15s ease",
                                                        }}
                                                    >
                                                        <Copy size={18} strokeWidth={2} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Delete Offer"
                                                        onClick={() => {
                                                            if (item.rawCoupon) {
                                                                handleDelete(item.rawCoupon.id);
                                                            } else {
                                                                handleDeleteDemo(item.id);
                                                            }
                                                        }}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            padding: "2px",
                                                            color: isExpired ? "#FCA5A5" : "#EF4444",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "color 0.15s ease",
                                                        }}
                                                    >
                                                        <Trash2 size={18} strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="offers-mobile-cards-container">
                        {filteredOffers.map((item) => {
                            const isExpired = item.isExpired;
                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "14px",
                                        padding: "16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                        opacity: isExpired ? 0.75 : 1,
                                    }}
                                >
                                    {/* Top Row: Coupon Badge + Actions */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "5px 12px",
                                                backgroundColor: item.badgeBg,
                                                color: item.badgeColor,
                                                borderRadius: "6px",
                                                fontWeight: 700,
                                                fontSize: "13px",
                                                letterSpacing: "0.02em",
                                            }}
                                        >
                                            {item.code}
                                        </span>

                                        {/* Actions */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                            <button
                                                type="button"
                                                title="Edit Offer"
                                                onClick={() => {
                                                    router.push(`/seller/offers/edit?id=${item.id}&code=${encodeURIComponent(item.code)}`);
                                                }}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    padding: "4px",
                                                    color: isExpired ? "#CBD5E1" : "#64748B",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Pencil size={18} strokeWidth={2} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Copy Code"
                                                onClick={() => handleCopy(item.code)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    padding: "4px",
                                                    color: isExpired ? "#CBD5E1" : "#64748B",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Copy size={18} strokeWidth={2} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Delete Offer"
                                                onClick={() => {
                                                    if (item.rawCoupon) {
                                                        handleDelete(item.rawCoupon.id);
                                                    } else {
                                                        handleDeleteDemo(item.id);
                                                    }
                                                }}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    padding: "4px",
                                                    color: isExpired ? "#FCA5A5" : "#EF4444",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Trash2 size={18} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Description & Scope */}
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: isExpired ? "#94A3B8" : "#0F172A", marginBottom: "4px" }}>
                                            {item.description}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: isExpired ? "#94A3B8" : "#64748B", fontWeight: 500 }}>
                                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isExpired ? "#CBD5E1" : item.scopeColor, display: "inline-block" }} />
                                            <span>{item.scopeText}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Details Grid: Discount, Usage, Savings */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr 1fr",
                                            gap: "10px",
                                            paddingTop: "10px",
                                            borderTop: "1px solid #F1F5F9",
                                        }}
                                    >
                                        {/* Discount */}
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Discount</div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: isExpired ? "#94A3B8" : "#0F172A" }}>{item.discountText}</div>
                                            <div style={{ fontSize: "11px", color: isExpired ? "#CBD5E1" : "#94A3B8" }}>{item.discountType}</div>
                                        </div>

                                        {/* Usage */}
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Usage</div>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: isExpired ? "#94A3B8" : "#0F172A", marginBottom: "4px" }}>
                                                {item.usageCount}/{item.usageMax}
                                            </div>
                                            <div style={{ width: "100%", height: "4px", backgroundColor: "#E2E8F0", borderRadius: "2px", overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        width: `${Math.min(100, Math.round((item.usageCount / item.usageMax) * 100))}%`,
                                                        height: "100%",
                                                        backgroundColor: isExpired ? "#94A3B8" : "#F97316",
                                                        borderRadius: "2px",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Savings */}
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Savings</div>
                                            <div style={{ fontSize: "13px", fontWeight: 700, color: isExpired ? "#94A3B8" : "#0F172A" }}>{item.savings}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .offers-stat-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .offers-filter-bar-card {
                    background-color: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 14px;
                    padding: 12px 20px;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .offers-filter-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .offers-create-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 9px 18px;
                    background-color: #EA580C;
                    color: #FFFFFF;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(234, 88, 12, 0.2);
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .offers-desktop-table-container {
                    display: block;
                    background-color: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    borderRadius: 16px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
                }

                .offers-mobile-cards-container {
                    display: none;
                    flex-direction: column;
                    gap: 12px;
                }

                @media (max-width: 768px) {
                    .offers-header-container {
                        margin-bottom: 1.25rem !important;
                    }
                    .offers-main-title {
                        font-size: 20px !important;
                    }
                    .offers-main-subtitle {
                        font-size: 13px !important;
                    }
                    .offers-stat-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                        margin-bottom: 16px;
                    }
                    .offers-stat-card {
                        padding: 16px 18px !important;
                    }
                    .offers-filter-bar-card {
                        flex-direction: column;
                        align-items: stretch;
                        padding: 14px;
                        gap: 12px;
                        margin-bottom: 16px;
                    }
                    .offers-filter-group {
                        overflow-x: auto;
                        width: 100%;
                        padding-bottom: 4px;
                        justify-content: flex-start;
                        scrollbar-width: none;
                    }
                    .offers-filter-group::-webkit-scrollbar {
                        display: none;
                    }
                    .offers-filter-pill {
                        flex-shrink: 0;
                    }
                    .offers-create-btn {
                        width: 100%;
                        padding: 12px 18px;
                    }
                    .offers-desktop-table-container {
                        display: none;
                    }
                    .offers-mobile-cards-container {
                        display: flex;
                    }
                }
            `}</style>
        </div>
    );
}
