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
    isAutoApply?: boolean;
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
    const [startDate, setStartDate] = useState("");
    const [hasEndDate, setHasEndDate] = useState(false);
    const [validUntil, setValidUntil] = useState("");
    const [isAutoApply, setIsAutoApply] = useState(false);

    // Advanced fields
    const [maxUsagesPerUser, setMaxUsagesPerUser] = useState("");
    const [maxUsers, setMaxUsers] = useState("");
    const [minimumCartValue, setMinimumCartValue] = useState("");
    const [couponCategory, setCouponCategory] = useState("BOTH");
    // Edit Coupon State
    const [editingCoupon, setEditingCoupon] = useState<CouponType | null>(null);
    const [editCode, setEditCode] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editDiscountType, setEditDiscountType] = useState<"PERCENTAGE" | "AMOUNT">("PERCENTAGE");
    const [editDiscountValue, setEditDiscountValue] = useState("");
    const [editScopeType, setEditScopeType] = useState<"GLOBAL" | "SELLER">("GLOBAL");
    const [editSellerId, setEditSellerId] = useState("");
    const [editStartDate, setEditStartDate] = useState("");
    const [editHasEndDate, setEditHasEndDate] = useState(false);
    const [editValidUntil, setEditValidUntil] = useState("");
    const [editMaxUsagesPerUser, setEditMaxUsagesPerUser] = useState("");
    const [editMaxUsers, setEditMaxUsers] = useState("");
    const [editMinimumCartValue, setEditMinimumCartValue] = useState("");
    const [editCouponCategory, setEditCouponCategory] = useState("BOTH");
    const [editIsAutoApply, setEditIsAutoApply] = useState(false);
    const [editIsActive, setEditIsActive] = useState(true);

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

        // Validation
        const cleanCode = code.toUpperCase().replace(/\s+/g, '');
        if (!cleanCode || cleanCode.length < 3) {
            alert("Coupon Code must be at least 3 characters long.");
            return;
        }
        const codeRegex = /^[A-Z0-9]{3,20}$/;
        if (!codeRegex.test(cleanCode)) {
            alert("Coupon Code must be alphanumeric only (3-20 characters).");
            return;
        }
        if (description.trim() && description.trim().length < 5) {
            alert("Description should be at least 5 characters long.");
            return;
        }
        if (!discountValue || discountValue.trim() === "") {
            alert("Please enter a discount value.");
            return;
        }
        const parsedVal = parseFloat(discountValue);
        if (isNaN(parsedVal) || parsedVal <= 0) {
            alert("Discount value must be a positive number greater than 0.");
            return;
        }
        if (discountType === "PERCENTAGE" && parsedVal > 100) {
            alert("Percentage discount cannot exceed 100%.");
            return;
        }
        if (scopeType === "SELLER" && !sellerId) {
            alert("Please select a seller for specific scope.");
            return;
        }
        if (startDate && hasEndDate && validUntil) {
            const start = new Date(startDate);
            const end = new Date(validUntil);
            if (end <= start) {
                alert("Expiration date must be after the start date.");
                return;
            }
        }
        if (hasEndDate && validUntil) {
            const expiryDate = new Date(validUntil);
            if (expiryDate <= new Date()) {
                alert("Expiration date must be in the future.");
                return;
            }
        }
        if (minimumCartValue && parseFloat(minimumCartValue) < 0) {
            alert("Minimum cart value cannot be negative.");
            return;
        }
        if (maxUsagesPerUser && parseInt(maxUsagesPerUser) < 1) {
            alert("Max usages per user must be at least 1.");
            return;
        }
        if (maxUsers && parseInt(maxUsers) < 1) {
            alert("Max users count must be at least 1.");
            return;
        }

        try {
            const payload = {
                code: cleanCode,
                description,
                appliesToSellerId: scopeType === "SELLER" ? sellerId : null,
                discountPercentage: discountType === "PERCENTAGE" ? parsedVal : null,
                discountAmount: discountType === "AMOUNT" ? parsedVal : null,
                validFrom: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null,
                maxUsagesPerUser: maxUsagesPerUser ? parseInt(maxUsagesPerUser) : null,
                maxUsers: maxUsers ? parseInt(maxUsers) : null,
                minimumCartValue: minimumCartValue ? parseFloat(minimumCartValue) : null,
                category: couponCategory,
                isAutoApply: isAutoApply
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
                setStartDate("");
                setHasEndDate(false);
                setValidUntil("");
                setCouponCategory("BOTH");
                setIsAutoApply(false);
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
                const data = await res.json();
                alert(data.message || "Failed to delete coupon");
            }
        } catch (error) {
            console.error("Error deleting coupon:", error);
        }
    };

    // Helper to find seller name 
    const handleOpenEdit = (coupon: CouponType) => {
        setEditingCoupon(coupon);
        setEditCode(coupon.code);
        setEditDescription(coupon.description || "");
        if (coupon.discountPercentage !== null) {
            setEditDiscountType("PERCENTAGE");
            setEditDiscountValue(String(coupon.discountPercentage));
        } else {
            setEditDiscountType("AMOUNT");
            setEditDiscountValue(String(coupon.discountAmount));
        }
        setEditScopeType(coupon.appliesToSellerId ? "SELLER" : "GLOBAL");
        setEditSellerId(coupon.appliesToSellerId || "");
        setEditStartDate(coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : "");
        setEditHasEndDate(!!coupon.validUntil);
        setEditValidUntil(coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : "");
        setEditMaxUsagesPerUser(coupon.maxUsagesPerUser ? String(coupon.maxUsagesPerUser) : "");
        setEditMaxUsers(coupon.maxUsers ? String(coupon.maxUsers) : "");
        setEditMinimumCartValue(coupon.minimumCartValue ? String(coupon.minimumCartValue) : "");
        setEditCouponCategory((coupon as any).category || "BOTH");
        setEditIsAutoApply(Boolean(coupon.isAutoApply));
        setEditIsActive(coupon.isActive);
    };

    const handleUpdateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCoupon) return;

        // Validation
        const cleanCode = editCode.toUpperCase().replace(/\s+/g, '');
        if (!cleanCode || cleanCode.length < 3) {
            alert("Coupon Code must be at least 3 characters long.");
            return;
        }
        const codeRegex = /^[A-Z0-9]{3,20}$/;
        if (!codeRegex.test(cleanCode)) {
            alert("Coupon Code must be alphanumeric only (3-20 characters).");
            return;
        }
        if (editDescription.trim() && editDescription.trim().length < 5) {
            alert("Description should be at least 5 characters long.");
            return;
        }
        if (!editDiscountValue || editDiscountValue.trim() === "") {
            alert("Please enter a discount value.");
            return;
        }
        const parsedVal = parseFloat(editDiscountValue);
        if (isNaN(parsedVal) || parsedVal <= 0) {
            alert("Discount value must be a positive number greater than 0.");
            return;
        }
        if (editDiscountType === "PERCENTAGE" && parsedVal > 100) {
            alert("Percentage discount cannot exceed 100%.");
            return;
        }
        if (editScopeType === "SELLER" && !editSellerId) {
            alert("Please select a seller for specific scope.");
            return;
        }
        if (editStartDate && editHasEndDate && editValidUntil) {
            const start = new Date(editStartDate);
            const end = new Date(editValidUntil);
            if (end <= start) {
                alert("Expiration date must be after the start date.");
                return;
            }
        }
        if (editHasEndDate && editValidUntil) {
            const expiryDate = new Date(editValidUntil);
            if (expiryDate <= new Date()) {
                alert("Expiration date must be in the future.");
                return;
            }
        }
        if (editMinimumCartValue && parseFloat(editMinimumCartValue) < 0) {
            alert("Minimum cart value cannot be negative.");
            return;
        }
        if (editMaxUsagesPerUser && parseInt(editMaxUsagesPerUser) < 1) {
            alert("Max usages per user must be at least 1.");
            return;
        }
        if (editMaxUsers && parseInt(editMaxUsers) < 1) {
            alert("Max users count must be at least 1.");
            return;
        }

        try {
            const payload = {
                code: cleanCode,
                description: editDescription,
                appliesToSellerId: editScopeType === "SELLER" ? editSellerId : null,
                discountPercentage: editDiscountType === "PERCENTAGE" ? parsedVal : null,
                discountAmount: editDiscountType === "AMOUNT" ? parsedVal : null,
                validFrom: editStartDate ? new Date(editStartDate).toISOString() : new Date().toISOString(),
                validUntil: editHasEndDate && editValidUntil ? new Date(editValidUntil).toISOString() : null,
                maxUsagesPerUser: editMaxUsagesPerUser ? parseInt(editMaxUsagesPerUser) : null,
                maxUsers: editMaxUsers ? parseInt(editMaxUsers) : null,
                minimumCartValue: editMinimumCartValue ? parseFloat(editMinimumCartValue) : null,
                category: editCouponCategory,
                isAutoApply: editIsAutoApply,
                isActive: editIsActive
            };

            const res = await fetchApi(`/api/coupons/${editingCoupon.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Coupon updated successfully!");
                setEditingCoupon(null);
                fetchCoupons();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to update coupon");
            }
        } catch (error) {
            console.error("Error updating coupon:", error);
            alert("An error occurred");
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
                fetchCoupons();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to toggle coupon status");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

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
                                            onClick={() => {
                                                setDiscountType("PERCENTAGE");
                                                if (parseFloat(discountValue) > 100) setDiscountValue("100");
                                            }}
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
                                        onKeyDown={(e) => {
                                            if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") {
                                                setDiscountValue("");
                                                return;
                                            }
                                            const num = parseFloat(val);
                                            if (num < 0) return;
                                            if (discountType === "PERCENTAGE" && num > 100) {
                                                setDiscountValue("100");
                                                return;
                                            }
                                            setDiscountValue(val);
                                        }}
                                        placeholder={discountType === "PERCENTAGE" ? "50" : "200"}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
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

                            {/* Expiration & Start Date */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Validity & Expiration</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Start Date (Optional - defaults to now)</label>
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                                        <input
                                            type="checkbox"
                                            id="hasEndDate"
                                            checked={!hasEndDate}
                                            onChange={(e) => setHasEndDate(!e.target.checked)}
                                            style={{ width: "16px", height: "16px" }}
                                        />
                                        <label htmlFor="hasEndDate" style={{ color: "#334155", fontSize: "0.85rem" }}>Run indefinitely (No expiration)</label>
                                    </div>
                                    {hasEndDate && (
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Expiration Date*</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                value={validUntil}
                                                onChange={(e) => setValidUntil(e.target.value)}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category Constraint */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Seller Business Category</label>
                                <select
                                    value={couponCategory}
                                    onChange={(e) => setCouponCategory(e.target.value)}
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
                                >
                                    <option value="BOTH">Both (FOOD & PROPERTY)</option>
                                    <option value="FOOD">Food Only (FOOD)</option>
                                    <option value="PROPERTY">Property Only (PROPERTY)</option>
                                </select>
                                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Which category of sellers can use this coupon.</p>
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
                                        onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
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
                                        onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
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
                                        onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                                        onChange={(e) => setMaxUsers(e.target.value)}
                                        placeholder="e.g. 50"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Total users who can use this. Leave empty for unlimited.</p>
                                </div>
                            </div>

                            {/* Auto Apply Checkbox */}
                            <div style={{ marginTop: "1rem", padding: "14px 16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span>Auto Apply on Checkout</span>
                                        {isAutoApply && <span style={{ fontSize: "0.7rem", backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>ENABLED</span>}
                                    </div>
                                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 0" }}>When enabled, this coupon will be automatically applied at checkout if user cart satisfies all conditions.</p>
                                </div>
                                <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={isAutoApply}
                                        onChange={(e) => setIsAutoApply(e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: isAutoApply ? "var(--primary)" : "#cbd5e1",
                                        transition: ".3s", borderRadius: "24px"
                                    }}>
                                        <span style={{
                                            position: "absolute", height: "18px", width: "18px", left: isAutoApply ? "22px" : "3px", bottom: "3px",
                                            backgroundColor: "white", transition: ".3s", borderRadius: "50%"
                                        }} />
                                    </span>
                                </label>
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
                                border: coupon.isActive ? "1px solid #f1f5f9" : "1px dashed #ef4444",
                                display: "flex",
                                flexDirection: "column",
                                opacity: coupon.isActive ? 1 : 0.75
                            }}>
                                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", backgroundColor: isExpired ? "#cbd5e1" : (isGlobal ? "var(--secondary)" : "var(--primary)") }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", gap: "12px" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                            <h3 style={{
                                                fontSize: "1.35rem",
                                                fontWeight: "800",
                                                color: coupon.isActive ? "#0f172a" : "#94a3b8",
                                                letterSpacing: "0.5px",
                                                margin: 0,
                                                wordBreak: "break-all",
                                                overflowWrap: "anywhere",
                                                lineHeight: "1.2"
                                            }}>
                                                {coupon.code}
                                            </h3>
                                            <span style={{ fontSize: "0.7rem", backgroundColor: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                                                {(coupon as any).category || "BOTH"}
                                            </span>
                                            {coupon.isAutoApply && (
                                                <span style={{ fontSize: "0.7rem", backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                                    ⚡ AUTO-APPLY
                                                </span>
                                            )}
                                            {!coupon.isActive && (
                                                <span style={{ fontSize: "0.7rem", backgroundColor: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                                                    INACTIVE
                                                </span>
                                            )}
                                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                                                <button onClick={() => handleOpenEdit(coupon)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--teal)", fontWeight: "bold", fontSize: "0.85rem", padding: 0 }} title="Edit Coupon">Edit</button>
                                                <button onClick={() => handleToggleActive(coupon)} style={{ background: "none", border: "none", cursor: "pointer", color: coupon.isActive ? "#e67e22" : "#27ae60", fontWeight: "bold", fontSize: "0.85rem", padding: 0 }}>
                                                    {coupon.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                                <button onClick={() => handleDelete(coupon.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", padding: 0 }} title="Delete Coupon">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem", wordBreak: "break-word" }}>{coupon.description || "No description provided."}</p>
                                    </div>
                                    <div style={{
                                        backgroundColor: isExpired ? "#f1f5f9" : (coupon.discountPercentage ? "#e0f2fe" : "#f0fdf4"),
                                        color: isExpired ? "#64748b" : (coupon.discountPercentage ? "#0284c7" : "#16a34a"),
                                        padding: "8px 14px",
                                        borderRadius: "12px",
                                        fontWeight: "800",
                                        fontSize: "1.15rem",
                                        display: "flex",
                                        alignItems: "center",
                                        flexShrink: 0,
                                        whiteSpace: "nowrap"
                                    }}>
                                        {coupon.discountPercentage ? `${coupon.discountPercentage}% OFF` : `₹${coupon.discountAmount} OFF`}
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "0.9rem", color: "#475569" }}>
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
                                        <span style={{ fontWeight: "600" }}>Valid: </span>
                                        <span>
                                            {coupon.validFrom ? new Date(coupon.validFrom).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Immediate"}
                                            {" — "}
                                            {coupon.validUntil ? (
                                                <span style={{ color: isExpired ? "#ef4444" : "inherit" }}>
                                                    {new Date(coupon.validUntil).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                                </span>
                                            ) : (
                                                "No Expiry"
                                            )}
                                        </span>
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

            {/* Edit Coupon Modal */}
            {editingCoupon && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '5px', color: '#0f172a' }}>Edit Coupon</h2>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>Modify settings for coupon {editCode}</p>

                        <form onSubmit={handleUpdateCoupon} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Coupon Code*</label>
                                        <input
                                            required
                                            type="text"
                                            value={editCode}
                                            onChange={(e) => setEditCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", textTransform: "uppercase" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Internal Description</label>
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Discount Type*</label>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                type="button"
                                                onClick={() => setEditDiscountType("PERCENTAGE")}
                                                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${editDiscountType === "PERCENTAGE" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: editDiscountType === "PERCENTAGE" ? "#fff0f0" : "white", color: editDiscountType === "PERCENTAGE" ? "var(--primary)" : "#64748b", fontWeight: "600", cursor: "pointer" }}
                                            >
                                                Percentage
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditDiscountType("AMOUNT")}
                                                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${editDiscountType === "AMOUNT" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: editDiscountType === "AMOUNT" ? "#fff0f0" : "white", color: editDiscountType === "AMOUNT" ? "var(--primary)" : "#64748b", fontWeight: "600", cursor: "pointer" }}
                                            >
                                                Flat Amount
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>
                                            {editDiscountType === "PERCENTAGE" ? "Percentage Off (%)" : "Amount Off (₹)"}*
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            max={editDiscountType === "PERCENTAGE" ? "100" : undefined}
                                            value={editDiscountValue}
                                            onKeyDown={(e) => {
                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (editDiscountType === "PERCENTAGE" && Number(val) > 100) {
                                                    setEditDiscountValue("100");
                                                } else {
                                                    setEditDiscountValue(val);
                                                }
                                            }}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Application Scope</label>
                                    <div style={{ display: "flex", gap: "10px", marginBottom: editScopeType === "SELLER" ? "1rem" : "0" }}>
                                        <button
                                            type="button"
                                            onClick={() => setEditScopeType("GLOBAL")}
                                            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${editScopeType === "GLOBAL" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: editScopeType === "GLOBAL" ? "#fff0f0" : "white", color: editScopeType === "GLOBAL" ? "var(--primary)" : "#64748b", fontWeight: "600", cursor: "pointer" }}
                                        >
                                            Global
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditScopeType("SELLER")}
                                            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${editScopeType === "SELLER" ? "var(--primary)" : "#cbd5e1"}`, backgroundColor: editScopeType === "SELLER" ? "#fff0f0" : "white", color: editScopeType === "SELLER" ? "var(--primary)" : "#64748b", fontWeight: "600", cursor: "pointer" }}
                                        >
                                            Specific Seller
                                        </button>
                                    </div>
                                    {editScopeType === "SELLER" && (
                                        <select
                                            required
                                            value={editSellerId}
                                            onChange={(e) => setEditSellerId(e.target.value)}
                                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
                                        >
                                            <option value="">Select a seller...</option>
                                            {availableSellers.map(s => (
                                                <option key={s.id} value={s.id}>[{s.type}] {s.businessName || 'Unnamed Store'}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Validity & Expiration</label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Start Date (Optional - defaults to now)</label>
                                            <input
                                                type="datetime-local"
                                                value={editStartDate}
                                                onChange={(e) => setEditStartDate(e.target.value)}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                                            <input
                                                type="checkbox"
                                                id="editHasEndDate"
                                                checked={!editHasEndDate}
                                                onChange={(e) => setEditHasEndDate(!e.target.checked)}
                                                style={{ width: "16px", height: "16px" }}
                                            />
                                            <label htmlFor="editHasEndDate" style={{ color: "#334155", fontSize: "0.85rem" }}>No expiration</label>
                                        </div>
                                        {editHasEndDate && (
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>Expiration Date*</label>
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={editValidUntil}
                                                    onChange={(e) => setEditValidUntil(e.target.value)}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Seller Business Category</label>
                                    <select
                                        value={editCouponCategory}
                                        onChange={(e) => setEditCouponCategory(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
                                    >
                                        <option value="BOTH">Both (FOOD & PROPERTY)</option>
                                        <option value="FOOD">Food Only (FOOD)</option>
                                        <option value="PROPERTY">Property Only (PROPERTY)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Coupon Status</label>
                                    <select
                                        value={editIsActive ? "true" : "false"}
                                        onChange={(e) => setEditIsActive(e.target.value === "true")}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white" }}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Min Cart Value (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editMinimumCartValue}
                                        onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                                        onChange={(e) => setEditMinimumCartValue(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Max Usage/User</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editMaxUsagesPerUser}
                                        onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                                        onChange={(e) => setEditMaxUsagesPerUser(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Max Users</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editMaxUsers}
                                        onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                                        onChange={(e) => setEditMaxUsers(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>

                            {/* Auto Apply Edit Checkbox */}
                            <div style={{ padding: "14px 16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span>Auto Apply on Checkout</span>
                                        {editIsAutoApply && <span style={{ fontSize: "0.7rem", backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>ENABLED</span>}
                                    </div>
                                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 0" }}>When enabled, this coupon will be automatically applied at checkout when conditions are met.</p>
                                </div>
                                <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={editIsAutoApply}
                                        onChange={(e) => setEditIsAutoApply(e.target.checked)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: editIsAutoApply ? "var(--primary)" : "#cbd5e1",
                                        transition: ".3s", borderRadius: "24px"
                                    }}>
                                        <span style={{
                                            position: "absolute", height: "18px", width: "18px", left: editIsAutoApply ? "22px" : "3px", bottom: "3px",
                                            backgroundColor: "white", transition: ".3s", borderRadius: "50%"
                                        }} />
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setEditingCoupon(null)} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
