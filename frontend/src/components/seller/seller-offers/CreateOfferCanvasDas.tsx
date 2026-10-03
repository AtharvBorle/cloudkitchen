"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { ResponsiveNavMenu } from "../nav/ResponsiveNavMenu";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import {
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Info,
  Search,
  Check,
  Layers,
  Utensils,
} from "lucide-react";
import styles from "./CreateOffer.module.css";

export interface CreateOfferCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  activeSidebarId?: string;
}

export default function CreateOfferCanvasDas({
  topbarTitle = "Owner Operations Console",
  searchPlaceholder = "Search coupons, offers, discounts...",
  activeSidebarId = "offers",
}: CreateOfferCanvasDasProps) {
  const seller = useSellerProfile();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [couponCode, setCouponCode] = useState("");
  const [internalDescription, setInternalDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscountCap, setMaxDiscountCap] = useState("");
  const [isAutoApply, setIsAutoApply] = useState(false);

  const [appliesTo, setAppliesTo] = useState<"ALL" | "CATEGORY" | "ITEMS">("ALL");
  const [customerEligibility, setCustomerEligibility] = useState<"ALL" | "NEW_ONLY">("ALL");
  const [usageLimit, setUsageLimit] = useState("");

  const [startDate, setStartDate] = useState("Today (Immediately)");
  const [noExpiry, setNoExpiry] = useState(true);
  const [expiryDate, setExpiryDate] = useState("Runs indefinitely");
  const [perUserLimit, setPerUserLimit] = useState("1");

  const startDateRef = useRef<HTMLInputElement>(null);
  const expiryDateRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().split("T")[0];

const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(false);

  React.useEffect(() => {
    async function loadSellerMenu() {
      try {
        setLoadingMenu(true);
        const res = await fetchApi("/api/seller/menu");
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.data?.items) ? data.data.items : (Array.isArray(data) ? data : []));
          const cats = Array.isArray(data.foodCategories) ? data.foodCategories : (Array.isArray(data.data?.foodCategories) ? data.data.foodCategories : []);
          setMenuItems(items);
          setCategories(cats);
        }
      } catch (err) {
        console.error("Failed to load seller menu items:", err);
      } finally {
        setLoadingMenu(false);
      }
    }
    loadSellerMenu();
  }, []);

  const derivedCategories = React.useMemo(() => {
    if (categories.length > 0) return categories;
    const catMap = new Map<string, any>();
    menuItems.forEach((it) => {
      const catId = it.foodCategoryId || it.categoryId || it.foodCategory?.id || it.category?.id;
      const catName = it.foodCategory?.name || it.category?.name || it.categoryName;
      if (catId && !catMap.has(catId)) {
        catMap.set(catId, { id: catId, name: catName || "General" });
      } else if (catName && !catMap.has(catName)) {
        catMap.set(catName, { id: catName, name: catName });
      }
    });
    return Array.from(catMap.values());
  }, [categories, menuItems]);

  const isFormValid = couponCode.trim().length > 0 && couponCode.trim().length <= 20 && discountValue.trim().length > 0;

  const handlePublish = async (isDraft: boolean = false) => {
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      alert("Please enter a valid coupon code.");
      return;
    }
    if (cleanCode.length > 20) {
      alert("Coupon code cannot exceed 20 characters.");
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      alert("Coupon code can only contain uppercase letters, numbers, hyphens, and underscores.");
      return;
    }

    const dVal = parseFloat(discountValue);
    if (isNaN(dVal) || dVal <= 0) {
      alert("Discount value must be greater than 0.");
      return;
    }
    if (discountType === "PERCENTAGE" && dVal > 100) {
      alert("Percentage discount cannot exceed 100%.");
      return;
    }

    if (minOrderValue.trim() !== "") {
      const minVal = parseFloat(minOrderValue);
      if (isNaN(minVal) || minVal < 0) {
        alert("Minimum order value cannot be negative.");
        return;
      }
    }

    if (maxDiscountCap.trim() !== "") {
      const capVal = parseFloat(maxDiscountCap);
      if (isNaN(capVal) || capVal <= 0) {
        alert("Max discount cap must be greater than 0.");
        return;
      }
    }

    if (usageLimit.trim() !== "") {
      const limitVal = parseInt(usageLimit);
      if (isNaN(limitVal) || limitVal <= 0) {
        alert("Usage limit must be a positive number greater than 0.");
        return;
      }
    }

    if (perUserLimit.trim() !== "") {
      const perUser = parseInt(perUserLimit);
      if (isNaN(perUser) || perUser <= 0) {
        alert("Per-user limit must be a positive number greater than 0.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        description: internalDescription.trim(),
        discountType: discountType,
        discountValue: dVal,
        minOrderAmount: minOrderValue.trim() !== "" ? parseFloat(minOrderValue) : 0,
        maxDiscountAmount: maxDiscountCap.trim() !== "" ? parseFloat(maxDiscountCap) : null,
        appliesTo: appliesTo,
        appliesToProductId: appliesTo === "CATEGORY" ? (selectedCategoryIds.join(",") || null) : appliesTo === "ITEMS" ? (selectedItemIds.join(",") || null) : null,
        customerEligibility: customerEligibility,
        usageLimit: usageLimit.trim() !== "" ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit.trim() !== "" ? parseInt(perUserLimit) : 1,
        noExpiry: noExpiry,
        status: isDraft ? "Draft" : "Active",
        isActive: !isDraft,
        isAutoApply: isAutoApply,
      };

      const res = await fetchApi("/api/seller/dashboard/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/seller/offers");
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || "Failed to create offer. Please check your inputs.");
      }
    } catch (err: any) {
      console.error("Publish offer error:", err);
      alert(err.message || "An error occurred while creating offer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="create-offer-canvas-das-layout"
    >
      {/* 1. Left Side Menu Component */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* 2. Responsive Mobile Drawer */}
      <ResponsiveNavMenu
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        activeItemId={activeSidebarId}
        ownerName={seller.ownerName}
        roleTagText={seller.partnerRole}
      />

      {/* 3. Main Workspace Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
      >
        {/* Top Header Navigation */}
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          onMenuToggle={() => setIsMobileOpen(true)}
          onMenuClick={() => setIsMobileOpen(true)}
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
        />

        {/* Content Body */}
        <main
          style={{
            flex: 1,
            padding: "24px 32px",
            boxSizing: "border-box",
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <div className={styles.container}>
            {/* Back to Offers & Coupons Link */}
            <Link href="/seller/offers" className={styles.backLink}>
              <ArrowLeft size={16} strokeWidth={2.2} />
              <span>Back to Offers & Coupons</span>
            </Link>

            {/* Header: Title, Subtitle, and Action Buttons */}
            <div className={styles.headerRow}>
              <div className={styles.titleGroup}>
                <h1 className={styles.mainTitle}>Create New Offer</h1>
                <p className={styles.subTitle}>
                  Setup a new discount, coupon, or promotional rule for your store
                </p>
              </div>

              <div className={styles.actionsGroup}>
                <div className={styles.draftBadge}>
                  <span className={styles.draftDot} />
                  <span>Draft</span>
                </div>
                <div className={styles.desktopActions}>
                  <button
                    type="button"
                    className={styles.saveDraftBtn}
                    disabled={submitting}
                    onClick={() => handlePublish(true)}
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    className={styles.publishBtn}
                    disabled={submitting}
                    onClick={() => handlePublish(false)}
                  >
                    {submitting ? "Publishing..." : "Publish Offer"}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Form White Card Container */}
            <div className={styles.formCard}>
              {/* Section 1: Coupon Basics */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionBadge}>1</div>
                  <h2 className={styles.sectionTitle}>Coupon Basics</h2>
                </div>

                <div className={styles.formGrid2}>
                  {/* Coupon Code */}
                  <div>
                    <label className={styles.fieldLabel}>
                      Coupon Code <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      className={`${styles.inputField} ${styles.uppercaseInput}`}
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                      }
                      placeholder="e.g. SUMMER20"
                    />
                    <div className={styles.helpText}>
                      <Info size={12} color="#94A3B8" />
                      <span>Max 20 characters. Uppercase letters, numbers, hyphens & underscores.</span>
                    </div>
                  </div>

                  {/* Internal Description */}
                  <div>
                    <label className={styles.fieldLabel}>
                      Internal Description <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={internalDescription}
                      onChange={(e) => setInternalDescription(e.target.value)}
                      placeholder="e.g. Summer sale - 20% off orders above ₹500"
                    />
                    <div className={styles.helpText}>
                      <span>Visible only in the admin panel. Not shown to customers.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Discount Configuration */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionBadge}>2</div>
                  <h2 className={styles.sectionTitle}>Discount Configuration</h2>
                </div>

                {/* Discount Type */}
                <div>
                  <label className={styles.fieldLabel}>
                    Discount Type <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.selectableRow}>
                    <div
                      className={`${styles.selectCard} ${
                        discountType === "PERCENTAGE" ? styles.selectCardActive : ""
                      }`}
                      onClick={() => setDiscountType("PERCENTAGE")}
                    >
                      <div
                        className={`${styles.radioCircle} ${
                          discountType === "PERCENTAGE" ? styles.radioCircleActive : ""
                        }`}
                      >
                        {discountType === "PERCENTAGE" && <div className={styles.radioDot} />}
                      </div>
                      <span
                        className={`${styles.selectCardTitle} ${
                          discountType === "PERCENTAGE" ? styles.selectCardTitleActive : ""
                        }`}
                      >
                        % Percentage
                      </span>
                    </div>

                    <div
                      className={`${styles.selectCard} ${
                        discountType === "FLAT" ? styles.selectCardActive : ""
                      }`}
                      onClick={() => setDiscountType("FLAT")}
                    >
                      <div
                        className={`${styles.radioCircle} ${
                          discountType === "FLAT" ? styles.radioCircleActive : ""
                        }`}
                      >
                        {discountType === "FLAT" && <div className={styles.radioDot} />}
                      </div>
                      <span
                        className={`${styles.selectCardTitle} ${
                          discountType === "FLAT" ? styles.selectCardTitleActive : ""
                        }`}
                      >
                        ₹ Flat Amount
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discount Value, Min Order, Max Cap */}
                <div className={styles.formGrid3}>
                  {/* Discount Value */}
                  <div>
                    <label className={styles.fieldLabel}>
                      Discount Value <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.prefixInputWrapper}>
                      <span className={styles.prefixIconBox}>
                        {discountType === "PERCENTAGE" ? "%" : "₹"}
                      </span>
                      <input
                        type="number"
                        min="1"
                        max={discountType === "PERCENTAGE" ? "100" : undefined}
                        className={styles.prefixInputField}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                        }}
                        placeholder="e.g. 20"
                      />
                    </div>
                    <div className={styles.helpText}>
                      <span>
                        {discountType === "PERCENTAGE"
                          ? "Max: 100% for percentage type"
                          : "Flat amount in ₹ deducted from total"}
                      </span>
                    </div>
                  </div>

                  {/* Minimum Order Value */}
                  <div>
                    <label className={styles.fieldLabel}>Minimum Order Value</label>
                    <div className={styles.prefixInputWrapper}>
                      <span className={styles.prefixIconBox}>₹</span>
                      <input
                        type="number"
                        min="0"
                        className={styles.prefixInputField}
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                        }}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div className={styles.helpText}>
                      <span>Set 0 for no minimum requirement</span>
                    </div>
                  </div>

                  {/* Max Discount Cap */}
                  <div>
                    <label className={styles.fieldLabel}>Max Discount Cap</label>
                    <div className={styles.prefixInputWrapper}>
                      <span className={styles.prefixIconBox}>₹</span>
                      <input
                        type="number"
                        min="1"
                        className={styles.prefixInputField}
                        value={maxDiscountCap}
                        onChange={(e) => setMaxDiscountCap(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                        }}
                        placeholder="Optional (e.g. 200)"
                      />
                    </div>
                    <div className={styles.helpText}>
                      <span>Leave blank for unlimited discount</span>
                    </div>
                  </div>
                </div>

                {/* Auto Apply on Checkout Toggle */}
                <div style={{ marginTop: "1.25rem", padding: "14px 16px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Auto Apply on Checkout</span>
                      {isAutoApply && <span style={{ fontSize: "0.7rem", backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>ENABLED</span>}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                      Automatically apply this coupon in customer's cart when their order satisfies minimum conditions.
                    </div>
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
                      backgroundColor: isAutoApply ? "#ff5500" : "#cbd5e1",
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

              {/* Section 3: Eligibility & Schedule */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionBadge}>3</div>
                  <h2 className={styles.sectionTitle}>Eligibility & Schedule</h2>
                </div>

                {/* Applies To */}
                <div>
                  <label className={styles.fieldLabel}>Applies To</label>
                  <div className={styles.selectableRow3}>
                    {/* Entire Store */}
                    <div
                      className={`${styles.selectCard} ${
                        appliesTo === "ALL" ? styles.selectCardActive : ""
                      }`}
                      onClick={() => setAppliesTo("ALL")}
                    >
                      <div
                        className={`${styles.radioCircle} ${
                          appliesTo === "ALL" ? styles.radioCircleActive : ""
                        }`}
                      >
                        {appliesTo === "ALL" && <div className={styles.radioDot} />}
                      </div>
                      <div className={styles.selectCardContent}>
                        <span
                          className={`${styles.selectCardTitle} ${
                            appliesTo === "ALL" ? styles.selectCardTitleActive : ""
                          }`}
                        >
                          Entire Store
                        </span>
                        <span
                          className={`${styles.selectCardSub} ${
                            appliesTo === "ALL" ? styles.selectCardSubActive : ""
                          }`}
                        >
                          All menu items eligible
                        </span>
                      </div>
                    </div>

                    {/* Specific Category */}
                    <div
                      className={`${styles.selectCard} ${
                        appliesTo === "CATEGORY" ? styles.selectCardActive : ""
                      }`}
                      onClick={() => setAppliesTo("CATEGORY")}
                    >
                      <div
                        className={`${styles.radioCircle} ${
                          appliesTo === "CATEGORY" ? styles.radioCircleActive : ""
                        }`}
                      >
                        {appliesTo === "CATEGORY" && <div className={styles.radioDot} />}
                      </div>
                      <div className={styles.selectCardContent}>
                        <span
                          className={`${styles.selectCardTitle} ${
                            appliesTo === "CATEGORY" ? styles.selectCardTitleActive : ""
                          }`}
                        >
                          Specific Category
                        </span>
                        <span
                          className={`${styles.selectCardSub} ${
                            appliesTo === "CATEGORY" ? styles.selectCardSubActive : ""
                          }`}
                        >
                          Select menu categories
                        </span>
                      </div>
                    </div>

                    {/* Specific Items */}
                    <div
                      className={`${styles.selectCard} ${
                        appliesTo === "ITEMS" ? styles.selectCardActive : ""
                      }`}
                      onClick={() => setAppliesTo("ITEMS")}
                    >
                      <div
                        className={`${styles.radioCircle} ${
                          appliesTo === "ITEMS" ? styles.radioCircleActive : ""
                        }`}
                      >
                        {appliesTo === "ITEMS" && <div className={styles.radioDot} />}
                      </div>
                      <div className={styles.selectCardContent}>
                        <span
                          className={`${styles.selectCardTitle} ${
                            appliesTo === "ITEMS" ? styles.selectCardTitleActive : ""
                          }`}
                        >
                          Specific Items
                        </span>
                        <span
                          className={`${styles.selectCardSub} ${
                            appliesTo === "ITEMS" ? styles.selectCardSubActive : ""
                          }`}
                        >
                          Choose individual menu items
                        </span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Specific Category Selection List */}
                {appliesTo === "CATEGORY" && (
                  <div style={{ marginTop: "16px", padding: "18px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Layers size={16} color="#EA580C" />
                          <span>Select Eligible Categories</span>
                          {selectedCategoryIds.length > 0 && (
                            <span style={{ fontSize: "0.72rem", backgroundColor: "#EA580C", color: "white", padding: "1px 8px", borderRadius: "10px", fontWeight: 700 }}>
                              {selectedCategoryIds.length} Selected
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "3px 0 0 0" }}>
                          Discounts will apply only to menu items under the selected categories.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryIds(derivedCategories.map((c: any) => c.id || c.name))}
                          style={{ fontSize: "0.78rem", color: "#EA580C", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
                        >
                          Select All
                        </button>
                        <span style={{ color: "#CBD5E1" }}>|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryIds([])}
                          style={{ fontSize: "0.78rem", color: "#64748B", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <Search size={15} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="text"
                        placeholder="Search category name..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px 8px 36px", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "white", boxSizing: "border-box" }}
                      />
                    </div>

                    {derivedCategories.length === 0 ? (
                      <p style={{ fontSize: "0.82rem", color: "#94A3B8", textAlign: "center", padding: "14px 0", margin: 0 }}>
                        {loadingMenu ? "Loading categories..." : "No menu categories found. Please add dishes with categories to your menu."}
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                        {derivedCategories
                          .filter((c: any) => (c.name || "").toLowerCase().includes(categorySearchQuery.toLowerCase().trim()))
                          .map((cat: any) => {
                            const catKey = String(cat.id || cat.name);
                            const isSelected = selectedCategoryIds.includes(catKey);
                            return (
                              <div
                                key={catKey}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCategoryIds(prev => prev.filter(id => id !== catKey));
                                  } else {
                                    setSelectedCategoryIds(prev => [...prev, catKey]);
                                  }
                                }}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  fontWeight: isSelected ? 700 : 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  transition: "all 0.15s ease",
                                  backgroundColor: isSelected ? "#FFF7ED" : "white",
                                  color: isSelected ? "#EA580C" : "#334155",
                                  border: isSelected ? "1.5px solid #EA580C" : "1px solid #CBD5E1",
                                  boxShadow: isSelected ? "0 1px 3px rgba(234, 88, 12, 0.15)" : "none",
                                  userSelect: "none",
                                }}
                              >
                                <div style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "4px",
                                  border: isSelected ? "1.5px solid #EA580C" : "1.5px solid #94A3B8",
                                  backgroundColor: isSelected ? "#EA580C" : "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                                </div>
                                <span>{cat.name}</span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Specific Items Selection List */}
                {appliesTo === "ITEMS" && (
                  <div style={{ marginTop: "16px", padding: "18px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Utensils size={16} color="#EA580C" />
                          <span>Select Eligible Menu Items</span>
                          {selectedItemIds.length > 0 && (
                            <span style={{ fontSize: "0.72rem", backgroundColor: "#EA580C", color: "white", padding: "1px 8px", borderRadius: "10px", fontWeight: 700 }}>
                              {selectedItemIds.length} Selected
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "3px 0 0 0" }}>
                          Discounts will apply only to the specific food items selected below.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedItemIds(menuItems.map((i: any) => i.id))}
                          style={{ fontSize: "0.78rem", color: "#EA580C", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
                        >
                          Select All
                        </button>
                        <span style={{ color: "#CBD5E1" }}>|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedItemIds([])}
                          style={{ fontSize: "0.78rem", color: "#64748B", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <Search size={15} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="text"
                        placeholder="Search item name or category..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px 8px 36px", fontSize: "0.85rem", borderRadius: "8px", border: "1px solid #CBD5E1", backgroundColor: "white", boxSizing: "border-box" }}
                      />
                    </div>

                    {menuItems.length === 0 ? (
                      <p style={{ fontSize: "0.82rem", color: "#94A3B8", textAlign: "center", padding: "14px 0", margin: 0 }}>
                        {loadingMenu ? "Loading menu items..." : "No menu items found. Please add dishes to your kitchen menu first."}
                      </p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "10px", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
                        {menuItems
                          .filter((it: any) => 
                            (it.name || "").toLowerCase().includes(itemSearchQuery.toLowerCase().trim()) ||
                            (it.foodCategory?.name || it.category?.name || "").toLowerCase().includes(itemSearchQuery.toLowerCase().trim())
                          )
                          .map((item: any) => {
                            const isSelected = selectedItemIds.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                                  } else {
                                    setSelectedItemIds(prev => [...prev, item.id]);
                                  }
                                }}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "10px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "10px",
                                  transition: "all 0.15s ease",
                                  backgroundColor: isSelected ? "#FFF7ED" : "white",
                                  border: isSelected ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                                  boxShadow: isSelected ? "0 1px 3px rgba(234, 88, 12, 0.15)" : "none",
                                  userSelect: "none",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                  <div style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                    border: isSelected ? "1.5px solid #EA580C" : "1.5px solid #94A3B8",
                                    backgroundColor: isSelected ? "#EA580C" : "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                  }}>
                                    {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                                  </div>
                                  {(item.imageUrl || item.image) && (
                                    <img
                                      src={item.imageUrl || item.image}
                                      alt={item.name}
                                      style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                                    />
                                  )}
                                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                                      ₹{item.price || 0} {item.foodCategory?.name ? `• ${item.foodCategory.name}` : ""}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Eligibility & Usage Limit */}
                <div className={styles.formGrid2}>
                  {/* Customer Eligibility */}
                  <div>
                    <label className={styles.fieldLabel}>Customer Eligibility</label>
                    <div className={styles.selectableRow}>
                      <div
                        className={`${styles.selectCard} ${
                          customerEligibility === "ALL" ? styles.selectCardActive : ""
                        }`}
                        onClick={() => setCustomerEligibility("ALL")}
                      >
                        <div
                          className={`${styles.radioCircle} ${
                            customerEligibility === "ALL" ? styles.radioCircleActive : ""
                          }`}
                        >
                          {customerEligibility === "ALL" && <div className={styles.radioDot} />}
                        </div>
                        <span
                          className={`${styles.selectCardTitle} ${
                            customerEligibility === "ALL" ? styles.selectCardTitleActive : ""
                          }`}
                        >
                          All Customers
                        </span>
                      </div>

                      <div
                        className={`${styles.selectCard} ${
                          customerEligibility === "NEW_ONLY" ? styles.selectCardActive : ""
                        }`}
                        onClick={() => setCustomerEligibility("NEW_ONLY")}
                      >
                        <div
                          className={`${styles.radioCircle} ${
                            customerEligibility === "NEW_ONLY" ? styles.radioCircleActive : ""
                          }`}
                        >
                          {customerEligibility === "NEW_ONLY" && <div className={styles.radioDot} />}
                        </div>
                        <span
                          className={`${styles.selectCardTitle} ${
                            customerEligibility === "NEW_ONLY" ? styles.selectCardTitleActive : ""
                          }`}
                        >
                          New Customers Only
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Usage Limit */}
                  <div>
                    <label className={styles.fieldLabel}>Usage Limit</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.inputField}
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                      }}
                      placeholder="Optional (e.g. 500)"
                    />
                    <div className={styles.helpText}>
                      <span>Total redemptions allowed. Leave blank for unlimited.</span>
                    </div>
                  </div>
                </div>

                {/* Schedule & Limits */}
                <div className={styles.formGrid3}>
                  {/* Start Date */}
                  <div>
                    <label className={styles.fieldLabel}>Start Date</label>
                    <div
                      className={styles.suffixInputWrapper}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        try {
                          startDateRef.current?.showPicker?.();
                        } catch {}
                      }}
                    >
                      <input
                        ref={startDateRef}
                        type="date"
                        min={todayStr}
                        className={styles.suffixInputField}
                        value={startDate === "Today (Immediately)" ? "" : startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Select start date"
                        style={{ cursor: "pointer" }}
                      />
                      <span
                        className={styles.suffixIconBox}
                        style={{ cursor: "pointer", pointerEvents: "auto" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            startDateRef.current?.showPicker?.();
                          } catch {}
                        }}
                      >
                        <Calendar size={16} />
                      </span>
                    </div>
                  </div>

                  {/* Expiry Date with Toggle */}
                  <div>
                    <div className={styles.labelWithToggle}>
                      <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
                        Expiry Date
                      </label>
                      <div
                        className={styles.toggleWrapper}
                        onClick={() => {
                          const next = !noExpiry;
                          setNoExpiry(next);
                          if (next) setExpiryDate("Runs indefinitely");
                          else setExpiryDate("");
                        }}
                      >
                        <div
                          className={`${styles.switchTrack} ${
                            noExpiry ? styles.switchTrackActive : ""
                          }`}
                        >
                          <div
                            className={`${styles.switchThumb} ${
                              noExpiry ? styles.switchThumbActive : ""
                            }`}
                          />
                        </div>
                        <span className={styles.toggleLabel}>No expiry</span>
                      </div>
                    </div>

                    <div
                      className={styles.suffixInputWrapper}
                      style={{ cursor: noExpiry ? "not-allowed" : "pointer" }}
                      onClick={() => {
                        if (!noExpiry) {
                          try {
                            expiryDateRef.current?.showPicker?.();
                          } catch {}
                        }
                      }}
                    >
                      <input
                        ref={expiryDateRef}
                        type={noExpiry ? "text" : "date"}
                        disabled={noExpiry}
                        min={startDate && startDate !== "Today (Immediately)" ? startDate : todayStr}
                        className={styles.suffixInputField}
                        value={noExpiry ? "Runs indefinitely" : expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="Select expiry date"
                        style={{ cursor: noExpiry ? "not-allowed" : "pointer" }}
                      />
                      <span
                        className={styles.suffixIconBox}
                        style={{
                          cursor: noExpiry ? "not-allowed" : "pointer",
                          pointerEvents: noExpiry ? "none" : "auto",
                        }}
                        onClick={(e) => {
                          if (!noExpiry) {
                            e.stopPropagation();
                            try {
                              expiryDateRef.current?.showPicker?.();
                            } catch {}
                          }
                        }}
                      >
                        <Calendar size={16} />
                      </span>
                    </div>
                  </div>

                  {/* Per-User Limit */}
                  <div>
                    <label className={styles.fieldLabel}>Per-User Limit</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.inputField}
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                      }}
                      placeholder="1"
                    />
                    <div className={styles.helpText}>
                      <span>How many times one user can apply</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer Ready State & Mobile Actions */}
              <div className={styles.formFooterContainer}>
                <div className={styles.formFooter}>
                  <ShieldCheck size={18} className={styles.successIcon} />
                  <span>
                    {isFormValid
                      ? "All required fields are filled. Ready to publish."
                      : "Please fill in all required fields marked with *."}
                  </span>
                </div>

                <div className={styles.mobileFormActions}>
                  <button
                    type="button"
                    className={styles.mobileSaveDraftBtn}
                    disabled={submitting}
                    onClick={() => handlePublish(true)}
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    className={styles.mobilePublishBtn}
                    disabled={submitting}
                    onClick={() => handlePublish(false)}
                  >
                    {submitting ? "Publishing..." : "Publish Offer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
