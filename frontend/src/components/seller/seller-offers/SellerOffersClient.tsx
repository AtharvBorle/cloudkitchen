"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Tag, Percent, ArrowUpRight, TrendingUp, AlertCircle, Edit2, Trash2, CheckCircle2, Search, X } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import PaginationControls from "../common/PaginationControls";

interface SellerOffersClientProps {
    sellerId: string;
    products: any[];
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export default function SellerOffersClient({
    sellerId,
    products,
    searchQuery: searchQueryProp = "",
    onSearchChange,
}: SellerOffersClientProps) {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "DRAFT">("ALL");
    const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state (default 5 records per page)
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number | "All">(5);

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQueryProp || "");
    const searchQuery = searchQueryProp !== undefined ? searchQueryProp : localSearchQuery;

    useEffect(() => {
        if (searchQueryProp !== undefined) {
            setLocalSearchQuery(searchQueryProp);
        }
    }, [searchQueryProp]);

    const handleSearchChange = (q: string) => {
        setLocalSearchQuery(q);
        if (onSearchChange) onSearchChange(q);
    };

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

    const handleConfirmDelete = async () => {
        if (!couponToDelete) return;
        try {
            setIsDeleting(true);
            const res = await fetchApi(`/api/seller/dashboard/offers?id=${couponToDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                setOffers(prev => prev.filter(o => o.id !== couponToDelete.id));
                setCouponToDelete(null);
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.message || "Failed to delete coupon");
            }
        } catch (e: any) {
            alert(e.message || "Error deleting coupon");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetchApi(`/api/seller/dashboard/offers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !currentStatus } : o));
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.message || "Failed to update status");
            }
        } catch (e: any) {
            alert(e.message || "Error updating status");
        }
    };

    const isOfferDraft = (o: any) => o.approvalStatus === "DRAFT" || o.status === "Draft" || o.status === "DRAFT";

    const filteredOffers = useMemo(() => {
        return offers.filter(o => {
            const isExpired = o.endDate && new Date(o.endDate) < new Date();
            const isDraft = isOfferDraft(o);
            if (filterStatus === "ACTIVE" && (!o.isActive || isDraft || isExpired)) return false;
            if (filterStatus === "EXPIRED" && !((!o.isActive && !isDraft) || isExpired)) return false;
            if (filterStatus === "DRAFT" && !isDraft) return false;

            if (!searchQuery.trim()) return true;

            const q = searchQuery.toLowerCase().trim();
            const tokens = q.split(/\s+/).filter(Boolean);

            const code = (o.code || "").toLowerCase();
            const name = (o.name || o.title || "").toLowerCase();
            const desc = (o.description || o.internalDescription || "").toLowerCase();
            const discountType = (o.discountType || "").toLowerCase();
            const discountVal = String(o.discountPercentage ?? o.discountAmount ?? o.discountValue ?? "").toLowerCase();
            const discountLabel = (o.discountType === "PERCENTAGE" || o.discountPercentage
                ? `${o.discountPercentage || o.discountValue}% off`
                : `₹${o.discountAmount || o.discountValue} off`).toLowerCase();
            const category = (o.category || "").toLowerCase();
            const appliesTo = (o.appliesTo || "").toLowerCase();
            const statusStr = isDraft ? "draft" : (o.isActive && !isExpired ? "live active" : "paused expired inactive");
            const minOrder = String(o.minOrderAmount ?? o.minimumCartValue ?? "").toLowerCase();

            // Direct check
            if (
                code.includes(q) ||
                name.includes(q) ||
                desc.includes(q) ||
                discountType.includes(q) ||
                discountVal.includes(q) ||
                discountLabel.includes(q) ||
                category.includes(q) ||
                appliesTo.includes(q) ||
                statusStr.includes(q) ||
                minOrder.includes(q)
            ) {
                return true;
            }

            // Multi-token match
            if (tokens.length > 1) {
                return tokens.every(token =>
                    code.includes(token) ||
                    name.includes(token) ||
                    desc.includes(token) ||
                    discountType.includes(token) ||
                    discountVal.includes(token) ||
                    discountLabel.includes(token) ||
                    category.includes(token) ||
                    appliesTo.includes(token) ||
                    statusStr.includes(token) ||
                    minOrder.includes(token)
                );
            }

            return false;
        });
    }, [offers, filterStatus, searchQuery]);

    // Reset to page 1 whenever filters or search query change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchQuery]);

    // Ensure currentPage does not exceed totalPages when list shrinks
    const totalPages = pageSize === "All" ? 1 : Math.max(1, Math.ceil(filteredOffers.length / (Number(pageSize) || 5)));
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Slice records for current page (default 5 records)
    const paginatedOffers = useMemo(() => {
        if (pageSize === "All") return filteredOffers;
        const numSize = Number(pageSize) || 5;
        const startIndex = (currentPage - 1) * numSize;
        return filteredOffers.slice(startIndex, startIndex + numSize);
    }, [filteredOffers, currentPage, pageSize]);

    const activeCount = offers.filter(o => o.isActive && !isOfferDraft(o) && (!o.endDate || new Date(o.endDate) >= new Date())).length;
    const draftCount = offers.filter(o => isOfferDraft(o)).length;
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
                    {draftCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setFilterStatus("DRAFT")}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                border: "none",
                                fontSize: "12.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                backgroundColor: filterStatus === "DRAFT" ? "#FF5500" : "#F1F5F9",
                                color: filterStatus === "DRAFT" ? "#FFFFFF" : "#64748B",
                            }}
                        >
                            Drafts ({draftCount})
                        </button>
                    )}
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
                        Expired / Paused ({offers.length - activeCount - draftCount})
                    </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {/* In-page Search Bar */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #CBD5E1",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            width: "280px",
                            maxWidth: "100%",
                            gap: "8px",
                        }}
                    >
                        <Search size={16} color="#64748B" />
                        <input
                            type="text"
                            placeholder="Search offer name, code, discount..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            style={{
                                border: "none",
                                backgroundColor: "transparent",
                                outline: "none",
                                fontSize: "13px",
                                color: "#1E293B",
                                width: "100%",
                            }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => handleSearchChange("")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    color: "#94A3B8",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
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
                    {searchQuery.trim() ? (
                        <>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <Search size={24} />
                            </div>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>No offers or coupons found</h3>
                            <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 16px" }}>
                                No results match &quot;{searchQuery}&quot;. Try searching with a different name, coupon code, or discount percentage.
                            </p>
                            <button
                                type="button"
                                onClick={() => handleSearchChange("")}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    backgroundColor: "#F1F5F9",
                                    color: "#334155",
                                    border: "1px solid #CBD5E1",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                <X size={14} />
                                <span>Clear Search</span>
                            </button>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
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
                                {paginatedOffers.map(offer => {
                                    const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
                                    const discountLabel = offer.discountType === "PERCENTAGE" || offer.discountPercentage
                                        ? `${offer.discountPercentage || offer.discountValue}% OFF`
                                        : `₹${offer.discountAmount || offer.discountValue} OFF`;

                                    const isDraft = isOfferDraft(offer);

                                    return (
                                        <tr key={offer.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0F172A" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span 
                                                        title={offer.code}
                                                        style={{ 
                                                            backgroundColor: "#FFF1E8", 
                                                            color: "#FF5500", 
                                                            padding: "3px 8px", 
                                                            borderRadius: "6px", 
                                                            fontSize: "12px", 
                                                            letterSpacing: "0.5px",
                                                            display: "inline-block",
                                                            maxWidth: "180px",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            verticalAlign: "middle"
                                                        }}
                                                    >
                                                        {offer.code}
                                                    </span>
                                                    {offer.isAutoApply && (
                                                        <span style={{ backgroundColor: "#DCFCE7", color: "#15803D", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.3px" }}>
                                                            ⚡ AUTO
                                                        </span>
                                                    )}
                                                </div>
                                                {(offer.name || offer.title || offer.description || offer.internalDescription) && (
                                                    <div 
                                                        style={{ 
                                                            fontSize: "11.5px", 
                                                            color: "#64748B", 
                                                            fontWeight: 400, 
                                                            marginTop: "4px", 
                                                            maxWidth: "240px", 
                                                            overflow: "hidden", 
                                                            textOverflow: "ellipsis", 
                                                            whiteSpace: "nowrap" 
                                                        }} 
                                                        title={offer.name || offer.title || offer.description || offer.internalDescription}
                                                    >
                                                        {offer.name || offer.title || offer.description || offer.internalDescription}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: "14px 16px", fontWeight: 600, color: "#16A34A" }}>
                                                {discountLabel}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748B" }}>
                                                ₹{offer.minOrderAmount ?? offer.minimumCartValue ?? 0}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#0F172A", fontWeight: 600 }}>
                                                {offer.currentUsage ?? offer.usedCount ?? offer.currentUsersCount ?? 0} / {offer.usageLimit || offer.maxUsage || offer.maxUsers || "∞"}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748B" }}>
                                                {offer.noExpiry ? "No Expiry" : offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : offer.endDate ? new Date(offer.endDate).toLocaleDateString() : (isDraft ? "Draft" : "Active")}
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => !isDraft && handleToggleStatus(offer.id, offer.isActive)}
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderRadius: "6px",
                                                        border: "none",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        cursor: isDraft ? "default" : "pointer",
                                                        backgroundColor: isDraft ? "#FEF3C7" : (offer.isActive && !isExpired ? "#DCFCE7" : "#F1F5F9"),
                                                        color: isDraft ? "#B45309" : (offer.isActive && !isExpired ? "#15803D" : "#64748B"),
                                                    }}
                                                >
                                                    {isDraft ? "DRAFT" : (offer.isActive && !isExpired ? "LIVE" : "PAUSED")}
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
                                                        onClick={() => setCouponToDelete({ id: offer.id, code: offer.code })}
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
                                                        title="Delete Coupon"
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

                    {/* Pagination Controls */}
                    {filteredOffers.length > 0 && (
                        <PaginationControls
                            currentPage={currentPage}
                            totalItems={filteredOffers.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(newSize) => {
                                setPageSize(newSize);
                                setCurrentPage(1);
                            }}
                            itemName="offers"
                            pageSizeOptions={[5, 10, 20, 50, "All"]}
                        />
                    )}
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {couponToDelete && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px",
                        animation: "fadeIn 0.2s ease-out",
                    }}
                    onClick={() => !isDeleting && setCouponToDelete(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "16px",
                            maxWidth: "440px",
                            width: "100%",
                            padding: "24px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
                            <div
                                style={{
                                    width: "42px",
                                    height: "42px",
                                    borderRadius: "10px",
                                    backgroundColor: "#FEE2E2",
                                    color: "#DC2626",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Trash2 size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>
                                    Delete Coupon
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "#64748B", margin: 0, lineHeight: "1.4" }}>
                                    Are you sure you want to delete coupon <strong style={{ color: "#0F172A" }}>{couponToDelete.code}</strong>? This action cannot be undone and customers will no longer be able to use it.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setCouponToDelete(null)}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#FFFFFF",
                                    color: "#475569",
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    cursor: isDeleting ? "not-allowed" : "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#DC2626",
                                    color: "#FFFFFF",
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    cursor: isDeleting ? "not-allowed" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                {isDeleting ? "Deleting..." : "Delete Coupon"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
