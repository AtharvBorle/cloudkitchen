"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Tag, Percent, ArrowUpRight, TrendingUp, AlertCircle, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

interface SellerOffersClientProps {
    sellerId: string;
    products: any[];
}

export default function SellerOffersClient({ sellerId, products }: SellerOffersClientProps) {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");

    const loadOffers = async () => {
        try {
            setLoading(true);
            const res = await fetchApi("/api/seller/dashboard/offers");
            if (res.ok) {
                const data = await res.json();
                const list = data.data?.coupons || data.coupons || data.data || [];
                setOffers(Array.isArray(list) ? list : []);
            }
        } catch (err) {
            console.error("Failed to load seller offers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this offer/coupon?")) return;
        try {
            const res = await fetchApi(`/api/seller/coupons?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setOffers(prev => prev.filter(o => o.id !== id));
            } else {
                const err = await res.json();
                alert(err.message || "Failed to delete coupon");
            }
        } catch (e) {
            alert("Error deleting coupon");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetchApi(`/api/seller/coupons?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !currentStatus } : o));
            } else {
                alert("Failed to update status");
            }
        } catch (e) {
            alert("Error updating status");
        }
    };

    const filteredOffers = offers.filter(o => {
        const isExpired = o.endDate && new Date(o.endDate) < new Date();
        if (filterStatus === "ACTIVE") return o.isActive && !isExpired;
        if (filterStatus === "EXPIRED") return !o.isActive || isExpired;
        return true;
    });

    const activeCount = offers.filter(o => o.isActive && (!o.endDate || new Date(o.endDate) >= new Date())).length;
    const totalUsage = offers.reduce((sum, o) => sum + (o.currentUsage || o.usedCount || 0), 0);

    return (
        <div style={{ width: "100%", fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
            {/* Top Metrics Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                <div style={{ backgroundColor: "#FFFFFF", padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Active Offers</span>
                        <div style={{ width: "34px", height: "34px", borderRadius: "8px", backgroundColor: "#FFF1E8", color: "#FF5500", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Tag size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>{activeCount} Live</div>
                    <div style={{ fontSize: "12px", color: "#16A34A", fontWeight: 600, marginTop: "4px" }}>Available to customers</div>
                </div>

                <div style={{ backgroundColor: "#FFFFFF", padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Total Redemptions</span>
                        <div style={{ width: "34px", height: "34px", borderRadius: "8px", backgroundColor: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Percent size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>{totalUsage} Orders</div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>Claimed across store</div>
                </div>

                <div style={{ backgroundColor: "#FFFFFF", padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Total Created</span>
                        <div style={{ width: "34px", height: "34px", borderRadius: "8px", backgroundColor: "#EFF6FF", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>{offers.length} Campaigns</div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>All-time promotional rules</div>
                </div>
            </div>

            {/* Filter Bar & Create Button */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "20px",
                    backgroundColor: "#FFFFFF",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                }}
            >
                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        type="button"
                        onClick={() => setFilterStatus("ALL")}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            backgroundColor: filterStatus === "ALL" ? "#FF5500" : "#F1F5F9",
                            color: filterStatus === "ALL" ? "#FFFFFF" : "#64748B",
                        }}
                    >
                        All ({offers.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus("ACTIVE")}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            backgroundColor: filterStatus === "ACTIVE" ? "#FF5500" : "#F1F5F9",
                            color: filterStatus === "ACTIVE" ? "#FFFFFF" : "#64748B",
                        }}
                    >
                        Active ({activeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus("EXPIRED")}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            backgroundColor: filterStatus === "EXPIRED" ? "#FF5500" : "#F1F5F9",
                            color: filterStatus === "EXPIRED" ? "#FFFFFF" : "#64748B",
                        }}
                    >
                        Expired / Paused ({offers.length - activeCount})
                    </button>
                </div>

                <Link
                    href="/seller/offers/create"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: "#FF5500",
                        color: "#FFFFFF",
                        padding: "9px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
                    }}
                >
                    <Plus size={16} />
                    <span>Create New Offer</span>
                </Link>
            </div>

            {/* Offers Table / Cards */}
            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading coupons...</div>
            ) : filteredOffers.length === 0 ? (
                <div
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1.5px dashed #CBD5E1",
                        borderRadius: "14px",
                        padding: "48px 24px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#FFF1E8", color: "#FF5500", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                        <Tag size={24} />
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>No offers found</h3>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 16px" }}>Create dynamic promo codes and item discounts to attract more orders.</p>
                    <Link
                        href="/seller/offers/create"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: "#FF5500",
                            color: "#FFFFFF",
                            padding: "9px 16px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 700,
                            textDecoration: "none",
                        }}
                    >
                        <Plus size={16} />
                        <span>Create Offer</span>
                    </Link>
                </div>
            ) : (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 600 }}>
                                    <th style={{ padding: "12px 16px" }}>COUPON CODE</th>
                                    <th style={{ padding: "12px 16px" }}>DISCOUNT</th>
                                    <th style={{ padding: "12px 16px" }}>MIN ORDER</th>
                                    <th style={{ padding: "12px 16px" }}>USAGE</th>
                                    <th style={{ padding: "12px 16px" }}>VALIDITY</th>
                                    <th style={{ padding: "12px 16px" }}>STATUS</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right" }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOffers.map(offer => {
                                    const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
                                    const discountLabel = offer.discountType === "PERCENTAGE" || offer.discountPercentage
                                        ? `${offer.discountPercentage || offer.discountValue}% OFF`
                                        : `₹${offer.discountAmount || offer.discountValue} OFF`;

                                    return (
                                        <tr key={offer.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0F172A" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{ backgroundColor: "#FFF1E8", color: "#FF5500", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", letterSpacing: "0.5px" }}>
                                                        {offer.code}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px", fontWeight: 600, color: "#16A34A" }}>
                                                {discountLabel}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748B" }}>
                                                ₹{offer.minOrderAmount || 0}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#0F172A", fontWeight: 600 }}>
                                                {offer.currentUsage || offer.usedCount || 0} / {offer.usageLimit || offer.maxUsage || "∞"}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748B" }}>
                                                {offer.noExpiry ? "No Expiry" : offer.endDate ? new Date(offer.endDate).toLocaleDateString() : "Active"}
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(offer.id, offer.isActive)}
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderRadius: "6px",
                                                        border: "none",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        backgroundColor: offer.isActive && !isExpired ? "#DCFCE7" : "#F1F5F9",
                                                        color: offer.isActive && !isExpired ? "#15803D" : "#64748B",
                                                    }}
                                                >
                                                    {offer.isActive && !isExpired ? "LIVE" : "PAUSED"}
                                                </button>
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", gap: "8px" }}>
                                                    <Link
                                                        href={`/seller/offers/edit?id=${offer.id}`}
                                                        style={{
                                                            padding: "6px",
                                                            borderRadius: "6px",
                                                            backgroundColor: "#F8FAFC",
                                                            color: "#64748B",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            border: "1px solid #E2E8F0",
                                                        }}
                                                        title="Edit Offer"
                                                    >
                                                        <Edit2 size={13} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(offer.id)}
                                                        style={{
                                                            padding: "6px",
                                                            borderRadius: "6px",
                                                            backgroundColor: "#FEF2F2",
                                                            color: "#DC2626",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            border: "1px solid #FEE2E2",
                                                            cursor: "pointer",
                                                        }}
                                                        title="Delete Offer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
