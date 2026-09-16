"use client";

import React, { useState } from "react";
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
  const [couponCode, setCouponCode] = useState("SUMMER20");
  const [internalDescription, setInternalDescription] = useState(
    "Summer sale - 20% off orders above ₹500"
  );
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("20");
  const [minOrderValue, setMinOrderValue] = useState("500");
  const [maxDiscountCap, setMaxDiscountCap] = useState("");

  const [appliesTo, setAppliesTo] = useState<"ALL" | "CATEGORY" | "ITEMS">("ALL");
  const [customerEligibility, setCustomerEligibility] = useState<"ALL" | "NEW_ONLY">("ALL");
  const [usageLimit, setUsageLimit] = useState("500");

  const [startDate, setStartDate] = useState("Today (Immediately)");
  const [noExpiry, setNoExpiry] = useState(true);
  const [expiryDate, setExpiryDate] = useState("Runs indefinitely");
  const [perUserLimit, setPerUserLimit] = useState("1");

  const isFormValid = couponCode.trim().length > 0 && discountValue.trim().length > 0;

  const handlePublish = async (isDraft: boolean = false) => {
    if (!couponCode.trim()) {
      alert("Please enter a valid coupon code.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        description: internalDescription.trim(),
        discountType: discountType,
        discountValue: Number(discountValue) || 0,
        minOrderAmount: Number(minOrderValue) || 0,
        maxDiscountAmount: maxDiscountCap ? Number(maxDiscountCap) : null,
        appliesTo: appliesTo,
        customerEligibility: customerEligibility,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: Number(perUserLimit) || 1,
        noExpiry: noExpiry,
        status: isDraft ? "Pending" : "Active",
      };

      const res = await fetchApi("/api/seller/dashboard/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/seller/offers");
      } else {
        // Redirect back on client state
        router.push("/seller/offers");
      }
    } catch (err) {
      console.error("Publish offer error:", err);
      router.push("/seller/offers");
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
                      className={`${styles.inputField} ${styles.uppercaseInput}`}
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ""))
                      }
                      placeholder="SUMMER20"
                    />
                    <div className={styles.helpText}>
                      <Info size={12} color="#94A3B8" />
                      <span>Uppercase letters & numbers only. Customers enter this at checkout.</span>
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
                        className={styles.prefixInputField}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="20"
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
                        className={styles.prefixInputField}
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(e.target.value)}
                        placeholder="500"
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
                        className={styles.prefixInputField}
                        value={maxDiscountCap}
                        onChange={(e) => setMaxDiscountCap(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className={styles.helpText}>
                      <span>Leave blank for unlimited discount</span>
                    </div>
                  </div>
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
                      className={styles.inputField}
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      placeholder="500"
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
                    <div className={styles.suffixInputWrapper}>
                      <input
                        type="text"
                        className={styles.suffixInputField}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Today (Immediately)"
                      />
                      <span className={styles.suffixIconBox}>
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

                    <div className={styles.suffixInputWrapper}>
                      <input
                        type="text"
                        disabled={noExpiry}
                        className={styles.suffixInputField}
                        value={noExpiry ? "Runs indefinitely" : expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="DD/MM/YYYY"
                      />
                      <span className={styles.suffixIconBox}>
                        <Calendar size={16} />
                      </span>
                    </div>
                  </div>

                  {/* Per-User Limit */}
                  <div>
                    <label className={styles.fieldLabel}>Per-User Limit</label>
                    <input
                      type="number"
                      className={styles.inputField}
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(e.target.value)}
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
