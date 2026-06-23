"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import { Plus, Tag, Calendar, Check, X, Percent, DollarSign, Store, Box, Trash2, Edit2 } from "lucide-react";

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
    const [coupons, setCoupons] = useState<CouponType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponType | null>(null);

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

    return (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>Store Offers & Coupons</h2>
                    <p style={{ color: "#64748b", margin: 0 }}>Create and manage discounts for your customers.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "var(--primary)",
                            color: "white",
                            borderRadius: "8px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 4px 10px rgba(250, 109, 107, 0.2)",
                            transition: "all 0.2s"
                        }}
                    >
                        <Plus size={18} />
                        Create New Offer
                    </button>
                )}
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

            {/* Active Offers List */}
            {isLoading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading offers...</div>
            ) : coupons.length === 0 ? (
                <div style={{
                    backgroundColor: "white",
                    padding: "4rem 2rem",
                    borderRadius: "16px",
                    textAlign: "center",
                    border: "1px dashed #cbd5e1"
                }}>
                    <Tag size={48} color="#94a3b8" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                    <h3 style={{ fontSize: "1.25rem", color: "#334155", marginBottom: "0.5rem" }}>No Active Offers</h3>
                    <p style={{ color: "#64748b" }}>You haven't created any promotional offers yet. Click the button above to create one.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
                    {coupons.map((coupon) => {
                        const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                        const isGlobal = coupon.appliesToSellerId === null;

                        return (
                            <div key={coupon.id} style={{
                                backgroundColor: "white",
                                borderRadius: "16px",
                                padding: "1.5rem",
                                position: "relative",
                                overflow: "hidden",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                                border: "1px solid #f1f5f9",
                                display: "flex",
                                flexDirection: "column",
                                opacity: coupon.isActive ? 1 : 0.6
                            }}>
                                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", backgroundColor: !coupon.isActive ? "#94a3b8" : (isExpired ? "#cbd5e1" : (isGlobal ? "var(--secondary)" : "var(--primary)")) }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", letterSpacing: "1px", margin: 0 }}>{coupon.code}</h3>
                                            {!isGlobal && (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        onClick={() => handleEdit(coupon)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: "4px" }}
                                                        title="Edit Coupon"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(coupon.id)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: "4px" }}
                                                        title="Delete Coupon"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>{coupon.description || "No description provided."}</p>
                                    </div>
                                    <div style={{
                                        backgroundColor: !coupon.isActive ? "#f1f5f9" : (isExpired ? "#f1f5f9" : (coupon.discountPercentage ? "#e0f2fe" : "#f0fdf4")),
                                        color: !coupon.isActive ? "#94a3b8" : (isExpired ? "#64748b" : (coupon.discountPercentage ? "#0284c7" : "#16a34a")),
                                        padding: "8px 14px",
                                        borderRadius: "12px",
                                        fontWeight: "800",
                                        fontSize: "1.25rem",
                                        display: "flex",
                                        alignItems: "center"
                                    }}>
                                        {coupon.discountPercentage ? `${coupon.discountPercentage}% OFF` : `₹${coupon.discountAmount} OFF`}
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontSize: "0.9rem", color: "#475569" }}>
                                        <Tag size={16} color="#94a3b8" />
                                        <span style={{ fontWeight: "600" }}>Scope: </span>
                                        {isGlobal ? (
                                            <span style={{ color: "var(--secondary)", fontWeight: "600" }}>System-wide Promotion</span>
                                        ) : coupon.appliesToProductId ? (
                                            <span>Specific item</span>
                                        ) : (
                                            <span>Entire Store</span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#475569" }}>
                                        <Calendar size={16} color="#94a3b8" />
                                        <span style={{ fontWeight: "600" }}>Expires: </span>
                                        {coupon.validUntil ? (
                                            <span style={{ color: isExpired ? "#ef4444" : "inherit" }}>
                                                {new Date(coupon.validUntil).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                            </span>
                                        ) : (
                                            "Never (Indefinite)"
                                        )}
                                    </div>

                                    {isGlobal ? (
                                        <div style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: coupon.isActive ? "#16a34a" : "#ef4444", fontWeight: "bold" }}>
                                            • {coupon.isActive ? "ACTIVE" : "INACTIVE"}
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                                            <div 
                                                onClick={() => handleToggleActive(coupon)}
                                                style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}
                                            >
                                                <div style={{
                                                    position: "relative",
                                                    width: "36px",
                                                    height: "20px",
                                                    backgroundColor: coupon.isActive ? "var(--primary)" : "#cbd5e1",
                                                    borderRadius: "10px",
                                                    transition: "background-color 0.2s ease-in-out"
                                                }}>
                                                    <div style={{
                                                        position: "absolute",
                                                        top: "2px",
                                                        left: coupon.isActive ? "18px" : "2px",
                                                        width: "16px",
                                                        height: "16px",
                                                        borderRadius: "50%",
                                                        backgroundColor: "white",
                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                                        transition: "left 0.2s ease-in-out"
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: coupon.isActive ? "var(--primary)" : "#64748b" }}>
                                                    {coupon.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
