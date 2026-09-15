"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/fetch-api";
import {
  Plus,
  Tag,
  Calendar,
  Check,
  X,
  Percent,
  DollarSign,
  Store,
  Box,
  Trash2,
  Copy,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Power,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

export type ProductType = {
  id: string;
  name: string;
  type: string;
};

export type CouponType = {
  id: string;
  code: string;
  description?: string;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  creatorId?: string;
  appliesToSellerId?: string | null;
  appliesToProductId?: string | null;
  validFrom?: string;
  validUntil?: string | null;
  maxUsagesPerUser?: number | null;
  maxUsers?: number | null;
  currentUsersCount?: number;
  minimumCartValue?: number | null;
  isActive: boolean;
  approvalStatus?: string;
  createdAt?: string;
  category?: string;
};

export interface OfferDisplayItem {
  id: string;
  code: string;
  description: string;
  scopeText: string;
  scopeColor: string;
  discountText: string;
  discountType: "Percentage" | "Flat Amount";
  status: "Active" | "Pending" | "Expired";
  usageCount: number;
  usageMax: number;
  savings: string;
  isExpired: boolean;
  badgeBg: string;
  badgeColor: string;
  rawCoupon: CouponType;
}

interface SellerOffersClientProps {
  sellerId: string;
  products?: ProductType[];
}

export default function SellerOffersClient({
  sellerId,
  products = [],
}: SellerOffersClientProps) {
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponType | null>(null);
  const [filterTab, setFilterTab] = useState<"All" | "Active" | "Pending" | "Expired">("All");

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [scopeType, setScopeType] = useState<"STORE" | "PRODUCT">("STORE");
  const [productId, setProductId] = useState("");
  const [minimumCartValue, setMinimumCartValue] = useState("");
  const [maxUsagesPerUser, setMaxUsagesPerUser] = useState("");
  const [maxUsers, setMaxUsers] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi("/api/coupons");
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json;
        setCoupons(Array.isArray(list) ? list : []);
      } else {
        showToast("Failed to fetch offers from server", "error");
        setCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setCoupons([]);
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
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setScopeType("STORE");
    setProductId("");
    setMinimumCartValue("");
    setMaxUsagesPerUser("");
    setMaxUsers("");
    setHasEndDate(false);
    setValidUntil("");
    setIsActive(true);
    setEditingCoupon(null);
    setFormErrors({});
    setIsCreating(false);
    setIsSubmitting(false);
  };

  const handleEdit = (coupon: CouponType) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || "");

    if (coupon.discountPercentage) {
      setDiscountType("PERCENTAGE");
      setDiscountValue(coupon.discountPercentage.toString());
    } else if (coupon.discountAmount) {
      setDiscountType("AMOUNT");
      setDiscountValue(coupon.discountAmount.toString());
    } else {
      setDiscountType("PERCENTAGE");
      setDiscountValue("");
    }

    if (coupon.appliesToProductId) {
      setScopeType("PRODUCT");
      setProductId(coupon.appliesToProductId);
    } else {
      setScopeType("STORE");
      setProductId("");
    }

    setMinimumCartValue(coupon.minimumCartValue ? coupon.minimumCartValue.toString() : "");
    setMaxUsagesPerUser(coupon.maxUsagesPerUser ? coupon.maxUsagesPerUser.toString() : "");
    setMaxUsers(coupon.maxUsers ? coupon.maxUsers.toString() : "");

    if (coupon.validUntil) {
      setHasEndDate(true);
      const date = new Date(coupon.validUntil);
      const formattedDate = date.toISOString().slice(0, 16);
      setValidUntil(formattedDate);
    } else {
      setHasEndDate(false);
      setValidUntil("");
    }

    setIsActive(coupon.isActive);
    setFormErrors({});
    setIsCreating(true);

    const formEl = document.getElementById("offer-form-anchor");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      errors.code = "Coupon code is required.";
    } else if (!/^[A-Z0-9_-]{3,20}$/.test(cleanCode)) {
      errors.code = "Code must be 3-20 characters (letters, numbers, hyphens only).";
    }

    const dVal = parseFloat(discountValue);
    if (!discountValue || isNaN(dVal) || dVal <= 0) {
      errors.discountValue = "Please enter a valid discount value greater than 0.";
    } else if (discountType === "PERCENTAGE" && dVal > 99) {
      errors.discountValue = "Percentage discount cannot exceed 99%.";
    }

    if (scopeType === "PRODUCT" && !productId) {
      errors.productId = "Please select a specific food item or room for this offer.";
    }

    if (minimumCartValue) {
      const minVal = parseFloat(minimumCartValue);
      if (isNaN(minVal) || minVal < 0) {
        errors.minimumCartValue = "Minimum order value must be a valid positive number.";
      }
    }

    if (maxUsagesPerUser) {
      const maxPerUser = parseInt(maxUsagesPerUser, 10);
      if (isNaN(maxPerUser) || maxPerUser <= 0) {
        errors.maxUsagesPerUser = "Must be at least 1 usage per customer.";
      }
    }

    if (maxUsers) {
      const totalLimit = parseInt(maxUsers, 10);
      if (isNaN(totalLimit) || totalLimit <= 0) {
        errors.maxUsers = "Total usage limit must be at least 1.";
      }
    }

    if (hasEndDate) {
      if (!validUntil) {
        errors.validUntil = "Please specify an expiration date & time.";
      } else if (new Date(validUntil) <= new Date()) {
        errors.validUntil = "Expiration date must be in the future.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        appliesToSellerId: sellerId === "seller" ? null : sellerId,
        appliesToProductId: scopeType === "PRODUCT" && productId ? productId : null,
        discountPercentage: discountType === "PERCENTAGE" ? parseFloat(discountValue) : null,
        discountAmount: discountType === "AMOUNT" ? parseFloat(discountValue) : null,
        minimumCartValue: minimumCartValue ? parseFloat(minimumCartValue) : null,
        maxUsagesPerUser: maxUsagesPerUser ? parseInt(maxUsagesPerUser, 10) : null,
        maxUsers: maxUsers ? parseInt(maxUsers, 10) : null,
        validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null,
        isActive: isActive,
        category: "BOTH",
      };

      const method = editingCoupon ? "PUT" : "POST";
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : "/api/coupons";

      const res = await fetchApi(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        const savedCoupon = json.data || json;
        if (editingCoupon) {
          setCoupons((prev) =>
            prev.map((c) => (c.id === editingCoupon.id ? savedCoupon : c))
          );
          showToast(`Offer "${savedCoupon.code}" updated successfully!`);
        } else {
          setCoupons((prev) => [savedCoupon, ...prev]);
          showToast(`Offer "${savedCoupon.code}" launched successfully!`);
        }
        resetForm();
      } else {
        const msg = json.message || json.error || "Failed to save coupon";
        showToast(msg, "error");
      }
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      showToast(error?.message || "An unexpected error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the offer "${codeName}"?`)) return;

    try {
      const res = await fetchApi(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        showToast(`Offer "${codeName}" deleted successfully!`);
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.message || "Failed to delete coupon", "error");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      showToast("Error deleting coupon", "error");
    }
  };

  const handleToggleActive = async (coupon: CouponType) => {
    try {
      const newStatus = !coupon.isActive;
      const res = await fetchApi(`/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: newStatus,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const updated = json.data || json;
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? updated : c)));
        showToast(`Offer ${coupon.code} is now ${newStatus ? "ACTIVE" : "PAUSED"}.`);
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      showToast("Error updating coupon status", "error");
    }
  };

  const handleCopy = (codeText: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(codeText);
      showToast(`Copied "${codeText}" to clipboard!`);
    }
  };

  // Convert raw coupons into rich display items
  const displayOffers: OfferDisplayItem[] = useMemo(() => {
    return coupons.map((c) => {
      const isExpired = Boolean(c.validUntil && new Date(c.validUntil) < new Date());
      const isPercentage = Boolean(c.discountPercentage);
      const discountText = isPercentage
        ? `${c.discountPercentage}% OFF`
        : `₹${c.discountAmount || 0} OFF`;
      const discountType: "Percentage" | "Flat Amount" = isPercentage
        ? "Percentage"
        : "Flat Amount";

      let matchedProductName = "";
      if (c.appliesToProductId) {
        const found = products.find((p) => p.id === c.appliesToProductId);
        matchedProductName = found ? `Item: ${found.name}` : "Specific Item";
      }

      const scopeText = c.appliesToProductId
        ? matchedProductName
        : c.appliesToSellerId === null
        ? "Global Store Promotion"
        : "Entire Store";

      const status: "Active" | "Pending" | "Expired" = isExpired
        ? "Expired"
        : c.isActive
        ? "Active"
        : "Pending";

      const usageCount = c.currentUsersCount || 0;
      const usageMax = c.maxUsers || 500;

      // Estimate total savings delivered
      const perUnitSavings = c.discountAmount
        ? c.discountAmount
        : c.discountPercentage
        ? (c.discountPercentage * 15) // average basket ₹1500 estimate
        : 50;
      const totalSavingsNum = Math.round(perUnitSavings * usageCount);

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
        description:
          c.description ||
          (isPercentage
            ? `Get ${c.discountPercentage}% off your order`
            : `Flat ₹${c.discountAmount} discount`),
        scopeText,
        scopeColor: c.appliesToProductId ? "#8B5CF6" : "#F97316",
        discountText,
        discountType,
        status,
        usageCount,
        usageMax,
        savings: `₹${totalSavingsNum.toLocaleString("en-IN")}`,
        isExpired,
        badgeBg,
        badgeColor,
        rawCoupon: c,
      };
    });
  }, [coupons, products]);

  // Aggregate Stats
  const activeCount = useMemo(
    () => displayOffers.filter((o) => o.status === "Active").length,
    [displayOffers]
  );
  const pendingCount = useMemo(
    () => displayOffers.filter((o) => o.status === "Pending").length,
    [displayOffers]
  );
  const expiredCount = useMemo(
    () => displayOffers.filter((o) => o.status === "Expired").length,
    [displayOffers]
  );
  const totalRedemptions = useMemo(
    () => displayOffers.reduce((acc, o) => acc + o.usageCount, 0),
    [displayOffers]
  );

  // Filtered List
  const filteredOffers = useMemo(() => {
    return displayOffers.filter((offer) => {
      if (filterTab === "Active") return offer.status === "Active";
      if (filterTab === "Pending") return offer.status === "Pending";
      if (filterTab === "Expired") return offer.status === "Expired";
      return true;
    });
  }, [displayOffers, filterTab]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }} className="offers-page-root">
      <div id="offer-form-anchor" />

      {/* Header Banner */}
      <div
        className="offers-header-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            className="offers-main-title"
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0F172A",
              margin: "0 0 6px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Offers &amp; Coupons
          </h1>
          <p
            className="offers-main-subtitle"
            style={{ fontSize: "14px", color: "#64748B", margin: 0, fontWeight: 500 }}
          >
            Create, launch, and track custom discount promo codes for your kitchen &amp; stays
          </p>
        </div>

        {!isCreating && (
          <button
            type="button"
            className="offers-create-btn"
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create New Offer</span>
          </button>
        )}
      </div>

      {/* Dynamic Stat Cards Grid */}
      <div className="offers-stat-grid">
        {/* 1. Active Offers */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>Active Offers</span>
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <CheckCircle2 size={16} />
            </span>
          </div>
          <span
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1.1,
              marginTop: "4px",
              marginBottom: "6px",
            }}
          >
            {activeCount}
          </span>
          <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 500 }}>
            Live &amp; redeemable by customers
          </span>
        </div>

        {/* 2. Paused / Pending Offers */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>Paused / Pending</span>
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#FEFCE8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#CA8A04",
              }}
            >
              <Clock size={16} />
            </span>
          </div>
          <span
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1.1,
              marginTop: "4px",
              marginBottom: "6px",
            }}
          >
            {pendingCount}
          </span>
          <span style={{ fontSize: "13px", color: "#D97706", fontWeight: 500 }}>
            Currently inactive / in review
          </span>
        </div>

        {/* 3. Expired / Archived */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>Expired Offers</span>
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748B",
              }}
            >
              <Tag size={16} />
            </span>
          </div>
          <span
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1.1,
              marginTop: "4px",
              marginBottom: "6px",
            }}
          >
            {expiredCount}
          </span>
          <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>
            {totalRedemptions} total redemptions
          </span>
        </div>
      </div>

      {/* Create / Edit Interactive Form Drawer */}
      {isCreating && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            border: "1.5px solid #FED7AA",
            boxShadow: "0 10px 30px rgba(234, 88, 12, 0.06)",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={resetForm}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748B",
            }}
          >
            <X size={20} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#FFF7ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EA580C",
              }}
            >
              {editingCoupon ? <Pencil size={20} /> : <Sparkles size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                {editingCoupon ? `Edit Offer: ${editingCoupon.code}` : "Create New Promotional Offer"}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "2px 0 0 0" }}>
                Set up discount codes, order rules, and item limits.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Row 1: Code & Description */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="form-grid-two-col">
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Coupon Code <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  required
                  disabled={Boolean(editingCoupon)}
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
                    if (formErrors.code) {
                      setFormErrors((prev) => ({ ...prev, code: "" }));
                    }
                  }}
                  placeholder="e.g. MONSOON30, FEAST100"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${formErrors.code ? "#EF4444" : "#CBD5E1"}`,
                    textTransform: "uppercase",
                    backgroundColor: editingCoupon ? "#F8FAFC" : "#FFFFFF",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#0F172A",
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.code ? (
                  <p style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "4px" }}>{formErrors.code}</p>
                ) : editingCoupon ? (
                  <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
                    Coupon code cannot be changed once created.
                  </p>
                ) : (
                  <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>
                    Customers type this code during checkout.
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Short Offer Headline / Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 20% off on all curries above ₹299"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.95rem",
                    color: "#0F172A",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Row 2: Discount Type & Discount Value */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="form-grid-two-col">
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Discount Type <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENTAGE")}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1.5px solid ${discountType === "PERCENTAGE" ? "#EA580C" : "#CBD5E1"}`,
                      backgroundColor: discountType === "PERCENTAGE" ? "#FFF7ED" : "#FFFFFF",
                      color: discountType === "PERCENTAGE" ? "#EA580C" : "#64748B",
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Percent size={16} /> Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("AMOUNT")}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1.5px solid ${discountType === "AMOUNT" ? "#EA580C" : "#CBD5E1"}`,
                      backgroundColor: discountType === "AMOUNT" ? "#FFF7ED" : "#FFFFFF",
                      color: discountType === "AMOUNT" ? "#EA580C" : "#64748B",
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <DollarSign size={16} /> Flat Amount (₹)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  {discountType === "PERCENTAGE" ? "Percentage Off (%)" : "Flat Amount Off (₹)"}{" "}
                  <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max={discountType === "PERCENTAGE" ? 99 : 10000}
                  step="1"
                  value={discountValue}
                  onChange={(e) => {
                    setDiscountValue(e.target.value);
                    if (formErrors.discountValue) {
                      setFormErrors((prev) => ({ ...prev, discountValue: "" }));
                    }
                  }}
                  placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 100"}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${formErrors.discountValue ? "#EF4444" : "#CBD5E1"}`,
                    fontSize: "0.95rem",
                    color: "#0F172A",
                    boxSizing: "border-box",
                  }}
                />
                {formErrors.discountValue && (
                  <p style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "4px" }}>
                    {formErrors.discountValue}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Scope Selection (Entire Store vs Specific Item) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="form-grid-two-col">
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Applicable Products / Scope
                </label>
                <div style={{ display: "flex", gap: "10px", marginBottom: scopeType === "PRODUCT" ? "10px" : "0" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setScopeType("STORE");
                      setProductId("");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1.5px solid ${scopeType === "STORE" ? "#EA580C" : "#CBD5E1"}`,
                      backgroundColor: scopeType === "STORE" ? "#FFF7ED" : "#FFFFFF",
                      color: scopeType === "STORE" ? "#EA580C" : "#64748B",
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Store size={16} /> Entire Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeType("PRODUCT")}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1.5px solid ${scopeType === "PRODUCT" ? "#EA580C" : "#CBD5E1"}`,
                      backgroundColor: scopeType === "PRODUCT" ? "#FFF7ED" : "#FFFFFF",
                      color: scopeType === "PRODUCT" ? "#EA580C" : "#64748B",
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Box size={16} /> Specific Item
                  </button>
                </div>

                {scopeType === "PRODUCT" && (
                  <div>
                    <select
                      required
                      value={productId}
                      onChange={(e) => {
                        setProductId(e.target.value);
                        if (formErrors.productId) {
                          setFormErrors((prev) => ({ ...prev, productId: "" }));
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${formErrors.productId ? "#EF4444" : "#CBD5E1"}`,
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.9rem",
                        color: "#0F172A",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="">Select menu item or room listing...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.type}] {p.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.productId && (
                      <p style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "4px" }}>
                        {formErrors.productId}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Min Cart Value */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Minimum Order Value (₹) (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={minimumCartValue}
                  onChange={(e) => setMinimumCartValue(e.target.value)}
                  placeholder="e.g. 299 (leave blank for no minimum)"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.95rem",
                    color: "#0F172A",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Row 4: Usage Limits & Expiration */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="form-grid-two-col">
              {/* Usage Limits */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Max Use / User
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsagesPerUser}
                    onChange={(e) => setMaxUsagesPerUser(e.target.value)}
                    placeholder="e.g. 1"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Total Redemptions Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    placeholder="e.g. 200"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Expiration Settings */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Expiration Date
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="checkbox"
                    id="hasEndDateBox"
                    checked={!hasEndDate}
                    onChange={(e) => setHasEndDate(!e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#EA580C", cursor: "pointer" }}
                  />
                  <label htmlFor="hasEndDateBox" style={{ fontSize: "0.88rem", color: "#334155", cursor: "pointer" }}>
                    Runs Indefinitely (No expiry date)
                  </label>
                </div>

                {hasEndDate && (
                  <div>
                    <input
                      required
                      type="datetime-local"
                      value={validUntil}
                      onChange={(e) => {
                        setValidUntil(e.target.value);
                        if (formErrors.validUntil) {
                          setFormErrors((prev) => ({ ...prev, validUntil: "" }));
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${formErrors.validUntil ? "#EF4444" : "#CBD5E1"}`,
                        fontSize: "0.9rem",
                        color: "#0F172A",
                        boxSizing: "border-box",
                      }}
                    />
                    {formErrors.validUntil && (
                      <p style={{ fontSize: "0.75rem", color: "#EF4444", marginTop: "4px" }}>
                        {formErrors.validUntil}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 5: Active Status Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="isActiveToggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "#10B981", cursor: "pointer" }}
              />
              <label htmlFor="isActiveToggle" style={{ fontSize: "0.9rem", color: "#1E293B", fontWeight: "600", cursor: "pointer" }}>
                Make this offer live &amp; active immediately
              </label>
            </div>

            {/* Submit & Cancel Actions */}
            <div style={{ display: "flex", gap: "14px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "#EA580C",
                  color: "#FFFFFF",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isSubmitting ? "Saving..." : editingCoupon ? "Save Changes" : "Launch Promotional Offer"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "14px 24px",
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Action Toolbar */}
      <div className="offers-filter-bar-card">
        <div className="offers-filter-group">
          <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 600, marginRight: "4px", flexShrink: 0 }}>
            Filter:
          </span>
          {(["All", "Active", "Pending", "Expired"] as const).map((tab) => {
            const isSelected = filterTab === tab;
            let count = displayOffers.length;
            if (tab === "Active") count = activeCount;
            if (tab === "Pending") count = pendingCount;
            if (tab === "Expired") count = expiredCount;

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
                  fontWeight: isSelected ? 700 : 500,
                  border: "none",
                  backgroundColor: isSelected ? "#EA580C" : "#F1F5F9",
                  color: isSelected ? "#FFFFFF" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{tab}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "10px",
                    backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "#E2E8F0",
                    color: isSelected ? "#FFFFFF" : "#64748B",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!isCreating && (
          <button
            type="button"
            className="offers-create-btn"
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {/* Dynamic Offers Content: Loading / Empty / Data Table */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "4rem 2rem",
            textAlign: "center",
            color: "#64748B",
            border: "1px solid #E2E8F0",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>
            Loading offers &amp; coupons...
          </div>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
            Syncing live promotions from the cloud kitchen database.
          </p>
        </div>
      ) : filteredOffers.length === 0 ? (
        /* Empty State */
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "4rem 2rem",
            borderRadius: "16px",
            textAlign: "center",
            border: "1.5px dashed #CBD5E1",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#FFF7ED",
              color: "#EA580C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <Tag size={32} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.5rem" }}>
            {filterTab === "All" ? "No Offers Created Yet" : `No ${filterTab} Offers`}
          </h3>
          <p style={{ color: "#64748B", fontSize: "0.95rem", maxWidth: "460px", margin: "0 auto 1.5rem" }}>
            {filterTab === "All"
              ? "Boost customer engagement and bookings by launching your first store coupon or dish promotion."
              : `There are currently no offers matching the "${filterTab}" filter.`}
          </p>
          <button
            type="button"
            className="offers-create-btn"
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Your First Offer</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="offers-desktop-table-container">
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
                  <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    COUPON CODE
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    DESCRIPTION
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    DISCOUNT
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    STATUS
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    USAGE
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    SAVINGS
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "right" }}>
                    ACTIONS
                  </th>
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
                            fontWeight: 800,
                            fontSize: "13px",
                            letterSpacing: "0.03em",
                            border: `1px dashed ${item.badgeColor}`,
                          }}
                        >
                          {item.code}
                        </span>
                      </td>

                      {/* DESCRIPTION & SCOPE */}
                      <td style={{ padding: "20px 24px", verticalAlign: "middle", maxWidth: "260px" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: isExpired ? "#94A3B8" : "#0F172A",
                            marginBottom: "4px",
                          }}
                        >
                          {item.description}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            color: isExpired ? "#94A3B8" : "#64748B",
                            fontWeight: 500,
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: isExpired ? "#CBD5E1" : item.scopeColor,
                              display: "inline-block",
                            }}
                          />
                          <span>{item.scopeText}</span>
                          {item.rawCoupon.minimumCartValue && (
                            <span
                              style={{
                                marginLeft: "4px",
                                backgroundColor: "#F1F5F9",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                color: "#475569",
                              }}
                            >
                              Min ₹{item.rawCoupon.minimumCartValue}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* DISCOUNT */}
                      <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: isExpired ? "#94A3B8" : "#0F172A",
                            marginBottom: "2px",
                          }}
                        >
                          {item.discountText}
                        </div>
                        <div style={{ fontSize: "12px", color: isExpired ? "#CBD5E1" : "#94A3B8", fontWeight: 500 }}>
                          {item.discountType}
                        </div>
                      </td>

                      {/* STATUS TOGGLE */}
                      <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.rawCoupon)}
                          disabled={isExpired}
                          title={
                            isExpired
                              ? "Offer has expired"
                              : item.rawCoupon.isActive
                              ? "Click to pause offer"
                              : "Click to activate offer"
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "12px",
                            fontWeight: "700",
                            border: "none",
                            cursor: isExpired ? "not-allowed" : "pointer",
                            backgroundColor: isExpired
                              ? "#F1F5F9"
                              : item.rawCoupon.isActive
                              ? "#ECFDF5"
                              : "#FEFCE8",
                            color: isExpired
                              ? "#94A3B8"
                              : item.rawCoupon.isActive
                              ? "#059669"
                              : "#D97706",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: isExpired
                                ? "#94A3B8"
                                : item.rawCoupon.isActive
                                ? "#10B981"
                                : "#D97706",
                            }}
                          />
                          <span>{item.status}</span>
                        </button>
                      </td>

                      {/* USAGE */}
                      <td style={{ padding: "20px 24px", verticalAlign: "middle" }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: isExpired ? "#94A3B8" : "#0F172A",
                            marginBottom: "6px",
                          }}
                        >
                          {item.usageCount} / {item.usageMax}
                        </div>
                        <div
                          style={{
                            width: "64px",
                            height: "4px",
                            backgroundColor: "#E2E8F0",
                            borderRadius: "2px",
                            overflow: "hidden",
                          }}
                        >
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
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "12px",
                          }}
                        >
                          <button
                            type="button"
                            title="Edit Offer"
                            onClick={() => handleEdit(item.rawCoupon)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: "4px",
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
                              padding: "4px",
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
                            onClick={() => handleDelete(item.rawCoupon.id, item.code)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: "4px",
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

          {/* Mobile Card View (<=768px) */}
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
                        fontWeight: 800,
                        fontSize: "13px",
                        letterSpacing: "0.03em",
                        border: `1px dashed ${item.badgeColor}`,
                      }}
                    >
                      {item.code}
                    </span>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        type="button"
                        title="Toggle Active"
                        onClick={() => handleToggleActive(item.rawCoupon)}
                        disabled={isExpired}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "4px",
                          color: item.rawCoupon.isActive ? "#10B981" : "#D97706",
                          cursor: isExpired ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Power size={18} />
                      </button>

                      <button
                        type="button"
                        title="Edit Offer"
                        onClick={() => handleEdit(item.rawCoupon)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "4px",
                          color: "#64748B",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        title="Copy Code"
                        onClick={() => handleCopy(item.code)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "4px",
                          color: "#64748B",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Copy size={18} />
                      </button>

                      <button
                        type="button"
                        title="Delete Offer"
                        onClick={() => handleDelete(item.rawCoupon.id, item.code)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "4px",
                          color: "#EF4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Description & Scope */}
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: isExpired ? "#94A3B8" : "#0F172A",
                        marginBottom: "4px",
                      }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: isExpired ? "#94A3B8" : "#64748B",
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: isExpired ? "#CBD5E1" : item.scopeColor,
                          display: "inline-block",
                        }}
                      />
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
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94A3B8",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          marginBottom: "2px",
                        }}
                      >
                        Discount
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: isExpired ? "#94A3B8" : "#0F172A" }}>
                        {item.discountText}
                      </div>
                      <div style={{ fontSize: "11px", color: isExpired ? "#CBD5E1" : "#94A3B8" }}>
                        {item.discountType}
                      </div>
                    </div>

                    {/* Usage */}
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94A3B8",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          marginBottom: "2px",
                        }}
                      >
                        Usage
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: isExpired ? "#94A3B8" : "#0F172A",
                          marginBottom: "4px",
                        }}
                      >
                        {item.usageCount}/{item.usageMax}
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "4px",
                          backgroundColor: "#E2E8F0",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
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
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94A3B8",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          marginBottom: "2px",
                        }}
                      >
                        Savings
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: isExpired ? "#94A3B8" : "#0F172A" }}>
                        {item.savings}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Toast Feedback Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: toast.type === "error" ? "#EF4444" : "#0F172A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} color="#10B981" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
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
          justify-content: space-between;
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
          padding: 10px 20px;
          background-color: #EA580C;
          color: #FFFFFF;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .offers-create-btn:hover {
          background-color: #C2410C;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35);
        }

        .offers-desktop-table-container {
          display: block;
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
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
          .form-grid-two-col {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
