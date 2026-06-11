"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import { Plus, Tag, Calendar, X, Percent, DollarSign, Store, Globe, Trash2 } from "lucide-react";

type SellerType = {
    id: string;
    businessName: string;
    type: string;
};

type CouponType = {
    id: string;
    code: string;
    description: string;
    discountPercentage: number | null;
    discountAmount: number | null;
    appliesToSellerId: string | null;
    validFrom: string;
    validUntil: string | null;
    maxUsagesPerUser?: number | null;
    maxUsers?: number | null;
    currentUsersCount?: number;
    minimumCartValue?: number | null;
    isActive: boolean;
};

export default function AdminCouponsClient({ availableSellers, userRole }: { availableSellers: SellerType[], userRole: string }) {
    const [coupons, setCoupons] = useState<CouponType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "AMOUNT">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [scopeType, setScopeType] = useState<"GLOBAL" | "SELLER">("GLOBAL");
    const [sellerId, setSellerId] = useState("");
    const [hasEndDate, setHasEndDate] = useState(false);
    const [validUntil, setValidUntil] = useState("");

    // Advanced fields
    const [maxUsagesPerUser, setMaxUsagesPerUser] = useState("");
    const [maxUsers, setMaxUsers] = useState("");
    const [minimumCartValue, setMinimumCartValue] = useState("");

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

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                code,
                description,
                appliesToSellerId: scopeType === "SELLER" ? sellerId : null,
                discountPercentage: discountType === "PERCENTAGE" ? discountValue : null,
                discountAmount: discountType === "AMOUNT" ? discountValue : null,
                validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null,
                maxUsagesPerUser: maxUsagesPerUser ? parseInt(maxUsagesPerUser) : null,
                maxUsers: maxUsers ? parseInt(maxUsers) : null,
                minimumCartValue: minimumCartValue ? parseFloat(minimumCartValue) : null
            };

            const res = await fetchApi("/api/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const newCoupon = await res.json();
                // Ensure the appliesToSellerId format matches frontend expectation
                newCoupon.appliesToSellerId = payload.appliesToSellerId;
                setCoupons([newCoupon, ...coupons]);
                setIsCreating(false);
                // Reset form
                setCode("");
                setDescription("");
                setDiscountValue("");
                setHasEndDate(false);
                setValidUntil("");
            } else {
                const data = await res.json();
                alert(data.message || "Failed to create coupon");
            }
        } catch (error) {
            console.error("Error creating coupon:", error);
            alert("An error occurred");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon? It will be immediately invalid for everyone.")) return;

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

    // Helper to find seller name 
    const getTargetName = (id: string | null) => {
        if (!id) return "System Wide";
        const target = availableSellers.find(s => s.id === id);
        return target ? target.businessName : "Specific Store";
    };

    return (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>Platform Offers & Coupons</h2>
                    <p style={{ color: "#64748b", margin: 0 }}>Create {(userRole === "AGENT" || userRole === "ADMIN") ? "offers for sellers assigned to you." : "global discounts or assign offers to specific sellers."}</p>
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
                        New Coupon Code
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
                        onClick={() => setIsCreating(false)}
                        style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                        <X size={24} />
                    </button>

                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Configure Coupon</h3>

                    <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            {/* Code & Description */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Coupon Code*</label>
                                    <input
                                        required
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                        placeholder="e.g. WELCOME50"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", textTransform: "uppercase" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Internal Description</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="e.g. Platform wide welcome offer"
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
                                        placeholder={discountType === "PERCENTAGE" ? "50" : "200"}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            {/* Target Scope */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Application Scope</label>
                                <div style={{ display: "flex", gap: "10px", marginBottom: scopeType === "SELLER" ? "1rem" : "0" }}>
                                    <button
                                        type="button"
                                        onClick={() => setScopeType("GLOBAL")}
                                        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${scopeType === "GLOBAL" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: scopeType === "GLOBAL" ? "#fff0f0" : "white", color: scopeType === "GLOBAL" ? "var(--primary)" : "#64748b", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                                    >
                                        <Globe size={16} /> Global (All Stores)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScopeType("SELLER")}
                                        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${scopeType === "SELLER" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: scopeType === "SELLER" ? "#fff0f0" : "white", color: scopeType === "SELLER" ? "var(--primary)" : "#64748b", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                                    >
                                        <Store size={16} /> Specific Seller
                                    </button>
                                </div>
                                {scopeType === "SELLER" && (
                                    <select
                                        required
                                        value={sellerId}
                                        onChange={(e) => setSellerId(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
                                    >
                                        <option value="">Select a seller...</option>
                                        {availableSellers.map(s => (
                                            <option key={s.id} value={s.id}>[{s.type}] {s.businessName || 'Unnamed Store'}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Expiration */}
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
                                    <label htmlFor="hasEndDate" style={{ color: "#334155" }}>Run indefinitely (No expiration)</label>
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
                        </div>


                        <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

                        {/* Advanced Rules */}
                        <div>
                            <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#334155", marginBottom: "1rem" }}>Advanced Rules (Optional)</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Minimum Cart Value (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={minimumCartValue}
                                        onChange={(e) => setMinimumCartValue(e.target.value)}
                                        placeholder="e.g. 500"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Leave empty for no minimum.</p>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Max Usages Per User</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={maxUsagesPerUser}
                                        onChange={(e) => setMaxUsagesPerUser(e.target.value)}
                                        placeholder="e.g. 1"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Leave empty for unlimited.</p>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Max Users</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={maxUsers}
                                        onChange={(e) => setMaxUsers(e.target.value)}
                                        placeholder="e.g. 50"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Total users who can use this. Leave empty for unlimited.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{ padding: "14px", backgroundColor: "var(--primary)", color: "white", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer", marginTop: "1rem" }}
                        >
                            Create Platform Coupon
                        </button>
                    </form>
                </div>
            )}

            {/* Active Offers List */}
            {isLoading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading coupons...</div>
            ) : coupons.length === 0 ? (
                <div style={{
                    backgroundColor: "white",
                    padding: "4rem 2rem",
                    borderRadius: "16px",
                    textAlign: "center",
                    border: "1px dashed #cbd5e1"
                }}>
                    <Tag size={48} color="#94a3b8" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                    <h3 style={{ fontSize: "1.25rem", color: "#334155", marginBottom: "0.5rem" }}>No Platform Coupons</h3>
                    <p style={{ color: "#64748b" }}>There are no active global or admin-assigned coupons right now.</p>
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
                                flexDirection: "column"
                            }}>
                                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", backgroundColor: isExpired ? "#cbd5e1" : (isGlobal ? "var(--secondary)" : "var(--primary)") }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                            <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a", letterSpacing: "1px", margin: 0 }}>{coupon.code}</h3>
                                            {!isExpired && (
                                                <button onClick={() => handleDelete(coupon.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }} title="Delete Coupon">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>{coupon.description || "No description provided."}</p>
                                    </div>
                                    <div style={{
                                        backgroundColor: isExpired ? "#f1f5f9" : (coupon.discountPercentage ? "#e0f2fe" : "#f0fdf4"),
                                        color: isExpired ? "#64748b" : (coupon.discountPercentage ? "#0284c7" : "#16a34a"),
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
                                        <Globe size={16} color="#94a3b8" />
                                        <span style={{ fontWeight: "600" }}>Available to: </span>
                                        {isGlobal ? (
                                            <span style={{ color: "var(--secondary)", fontWeight: "600" }}>Every Store on Platform</span>
                                        ) : (
                                            <span style={{ color: "var(--primary)", fontWeight: "600" }}>{getTargetName(coupon.appliesToSellerId)}</span>
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

                                    {/* Advanced Rules Indicators */}
                                    {(coupon.minimumCartValue || coupon.maxUsagesPerUser || coupon.maxUsers) && (
                                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed #cbd5e1", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            {coupon.minimumCartValue && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: "600", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569" }}>Min order: ₹{coupon.minimumCartValue}</span>
                                            )}
                                            {coupon.maxUsagesPerUser && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: "600", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569" }}>Max {coupon.maxUsagesPerUser} use/user</span>
                                            )}
                                            {coupon.maxUsers && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: "600", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569" }}>Max {coupon.maxUsers} Users</span>
                                            )}
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
