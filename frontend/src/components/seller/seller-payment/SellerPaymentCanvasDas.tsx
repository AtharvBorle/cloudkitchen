"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Tag,
  CreditCard,
  Utensils,
  BedDouble,
  Sparkles,
  ArrowRight,
  Lock,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import styles from "./SellerPayment.module.css";

interface SubscriptionPlanItem {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  features: string[];
  category: "FOOD" | "PROPERTY" | "BOTH" | string;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.id = "razorpay-checkout-script";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SellerPaymentCanvasDas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams?.get("token") || "";
  const queryPlanId = searchParams?.get("planId") || "";
  const queryCategory = searchParams?.get("category") || "";

  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [statusData, setStatusData] = useState<any>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(
    queryCategory || "ALL"
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(queryPlanId);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Sync mobile token and initialize web session
  useEffect(() => {
    if (queryToken && queryToken.trim()) {
      try {
        localStorage.setItem("token", queryToken.trim());
        fetchApi("/api/auth/token-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: queryToken.trim() }),
        }).catch((err) => console.warn("Session token sync failed:", err));
      } catch (e) {
        console.error("Token storage error:", e);
      }
    }
  }, [queryToken]);

  // Load Status and Plans
  const loadData = async () => {
    try {
      setLoading(true);
      const planUrl = queryCategory
        ? `/api/seller/subscription/plans?category=${encodeURIComponent(queryCategory)}`
        : "/api/seller/subscription/plans";

      const [statusRes, plansRes] = await Promise.allSettled([
        fetchApi("/api/seller/dashboard/status"),
        fetchApi(planUrl),
      ]);

      let sCat: string | null = null;
      if (statusRes.status === "fulfilled" && statusRes.value.ok) {
        const sData = await statusRes.value.json();
        const parsed = sData.data || sData;
        setStatusData(parsed);

        sCat = parsed.sellerProfile?.businessCategory;
        const foodApp = sCat === "FOOD" || sCat === "BOTH" || parsed.sellerProfile?.foodVerificationStatus === "APPROVED";
        const propApp = sCat === "PROPERTY" || sCat === "BOTH" || parsed.sellerProfile?.propertyVerificationStatus === "APPROVED";
        const dual = sCat === "BOTH" || (foodApp && propApp);

        if (!queryCategory && sCat) {
          if (dual) {
            setActiveCategoryFilter("ALL");
          } else if (sCat === "FOOD" || sCat === "PROPERTY") {
            setActiveCategoryFilter(sCat);
          }
        }
      }

      if (plansRes.status === "fulfilled" && plansRes.value.ok) {
        const pData = await plansRes.value.json();
        const planList: SubscriptionPlanItem[] = pData.data || pData || [];
        setPlans(planList);

        const targetPlan = queryPlanId
          ? planList.find((p) => p.id === queryPlanId || p.name.toLowerCase() === queryPlanId.toLowerCase())
          : null;

        if (targetPlan) {
          setSelectedPlanId(targetPlan.id);
          if (targetPlan.category && targetPlan.category !== "BOTH") {
            setActiveCategoryFilter((prev) => (prev === "ALL" ? prev : targetPlan.category));
          }
        } else if (planList.length > 0 && !selectedPlanId) {
          setSelectedPlanId(planList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryPlanId, queryCategory, queryToken]);

  // Keep selected plan valid when plans change
  useEffect(() => {
    if (plans.length > 0) {
      const exists = plans.some((p) => p.id === selectedPlanId);
      if (!exists) {
        // Pick first plan matching current filter or simply first plan
        const matching = plans.filter((p) => {
          if (activeCategoryFilter === "ALL") return true;
          if (activeCategoryFilter === "FOOD") return p.category === "FOOD";
          if (activeCategoryFilter === "PROPERTY") return p.category === "PROPERTY";
          if (activeCategoryFilter === "BOTH") return p.category === "BOTH";
          return p.category === activeCategoryFilter;
        });
        if (matching.length > 0) {
          setSelectedPlanId(matching[0].id);
        } else {
          setSelectedPlanId(plans[0].id);
        }
      }
    }
  }, [activeCategoryFilter, plans, selectedPlanId]);

  // Filtered plans list - strictly isolate FOOD, PROPERTY, and BOTH
  const filteredPlans = plans.filter((p) => {
    if (activeCategoryFilter === "ALL") return true;
    if (activeCategoryFilter === "FOOD") return p.category === "FOOD";
    if (activeCategoryFilter === "PROPERTY") return p.category === "PROPERTY";
    if (activeCategoryFilter === "BOTH") return p.category === "BOTH";
    return true;
  });

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || filteredPlans[0];

  // Coupon handling
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlanId) return;
    setCouponError("");
    setIsApplyingCoupon(true);

    try {
      const res = await fetchApi("/api/seller/subscriptions/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          planId: selectedPlanId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || "Invalid coupon code");
      }
    } catch (error) {
      setCouponError("Unable to validate coupon at this time.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Payment execution
  const handlePayment = async () => {
    if (!selectedPlan) {
      alert("Please select a subscription plan.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      // 1. Create order
      const orderRes = await fetchApi("/api/seller/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          couponCode: appliedCoupon ? couponCode.trim().toUpperCase() : undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.message || "Failed to create subscription order. Please try again.");
        setIsProcessingPayment(false);
        return;
      }

      const finalAmount = orderData.amount;

      // 2. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to initialize Razorpay checkout. Please check your internet connection.");
        setIsProcessingPayment(false);
        return;
      }

      // 3. Open Razorpay modal
      const options = {
        key: orderData.key,
        amount: finalAmount * 100,
        currency: "INR",
        name: "Neo Cloud Kitchen",
        description: `${selectedPlan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetchApi("/api/seller/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amountPaid: orderData.amount,
              }),
            });

            if (verifyRes.ok) {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("subscription-updated"));
              }
              setShowSuccessModal(true);
              await loadData();
            } else {
              const vData = await verifyRes.json();
              alert(vData.message || "Payment verification failed. Please contact support.");
            }
          } catch (vErr) {
            console.error("Verification error:", vErr);
            alert("An error occurred during payment verification.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
        theme: {
          color: "#FF5500",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function () {
        alert("Payment was cancelled or unsuccessful. You have not been charged.");
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("Payment gateway error. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  // Stacked active subscriptions calculation
  const getStackedSubs = (subsList: any[]) => {
    const sorted = [...subsList].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const result = [];
    let currentEnd: Date | null = null;

    for (let i = 0; i < sorted.length; i++) {
      const sub = sorted[i];
      const duration = sub.plan?.durationMonths || 1;
      const created = new Date(sub.createdAt);

      let start: Date;
      if (currentEnd && currentEnd > created) {
        start = new Date(currentEnd);
      } else {
        start = created;
      }

      const end = new Date(start);
      end.setMonth(end.getMonth() + duration);

      result.push({
        ...sub,
        startDate: start,
        endDate: end,
      });

      currentEnd = end;
    }
    return result;
  };

  const activeSubs = statusData?.activeSubs || [];
  const foodSubs = activeSubs.filter(
    (s: any) => s.plan?.category === "FOOD" || s.plan?.category === "BOTH"
  );
  const propertySubs = activeSubs.filter(
    (s: any) => s.plan?.category === "PROPERTY" || s.plan?.category === "BOTH"
  );

  const stackedFood = getStackedSubs(foodSubs);
  const foodExpiry = stackedFood.length > 0 ? stackedFood[stackedFood.length - 1].endDate : null;

  const stackedProperty = getStackedSubs(propertySubs);
  const propertyExpiry =
    stackedProperty.length > 0 ? stackedProperty[stackedProperty.length - 1].endDate : null;

  const hasAnyActiveSub = Boolean(statusData?.hasActiveSub);

  const hasFoodVerification =
    statusData?.sellerProfile?.businessCategory === "FOOD" ||
    statusData?.sellerProfile?.businessCategory === "BOTH" ||
    statusData?.sellerProfile?.foodVerificationStatus === "APPROVED";

  const hasPropertyVerification =
    statusData?.sellerProfile?.businessCategory === "PROPERTY" ||
    statusData?.sellerProfile?.businessCategory === "BOTH" ||
    statusData?.sellerProfile?.propertyVerificationStatus === "APPROVED";

  const isDualVerified =
    statusData?.sellerProfile?.businessCategory === "BOTH" ||
    (hasFoodVerification && hasPropertyVerification) ||
    !statusData?.sellerProfile;

  // Price calculations
  const basePrice = selectedPlan ? selectedPlan.price : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalPayable = appliedCoupon ? appliedCoupon.finalPrice : basePrice;

  return (
    <div className={styles.pageLayout}>
      {/* 1. Left Sidebar Component */}
      <ConsoleSidebar
        activeItemId="subscription"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={seller.businessName || seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* 2. Main Content Layout */}
      <div className={styles.rightSection}>
        <Topbar
          title="Owner Operations Console"
          ownerName={seller.businessName || seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        <main className={styles.mainContent}>
          {/* Header Row */}
          <div className={styles.headerRow}>
            <div className={styles.titleGroup}>
              <h1 className={styles.mainTitle}>
                <CreditCard size={26} color="#FF5500" />
                Partner Subscription & Plans
              </h1>
              <p className={styles.subTitle}>
                Select an active tier to unlock kitchen orders, delivery dispatch, menu management, and room bookings.
              </p>
            </div>

            {statusData?.sellerProfile?.verificationStatus === "APPROVED" && (
              <div className={styles.categoryTagApproved}>
                <CheckCircle2 size={14} />
                <span>Account Verified</span>
              </div>
            )}
          </div>

          {/* Active Subscriptions Banner if any */}
          {hasAnyActiveSub && (
            <div className={styles.activeSubsCard}>
              <div className={styles.activeSubsHeader}>
                <h3 className={styles.activeSubsTitle}>
                  <ShieldCheck size={20} />
                  Active Subscriptions & Stacked Validity
                </h3>
                <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                  Live on Platform
                </span>
              </div>

              <div className={styles.activeSubsGrid}>
                {foodExpiry && (
                  <div className={styles.activeSubItem}>
                    <div className={styles.activeSubItemTop}>
                      <span className={styles.activeSubName}>Food & Kitchen Operations</span>
                      <span className={styles.activeSubPrice}>FOOD ACTIVE</span>
                    </div>
                    <div className={styles.activeSubDates}>
                      <Clock size={13} />
                      <span>
                        Valid until: <strong>{foodExpiry.toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong>
                      </span>
                    </div>
                    <span className={styles.expiryBadge}>
                      {stackedFood.length} plan{stackedFood.length > 1 ? "s" : ""} active
                    </span>
                  </div>
                )}

                {propertyExpiry && (
                  <div className={styles.activeSubItem}>
                    <div className={styles.activeSubItemTop}>
                      <span className={styles.activeSubName}>Room & Property Bookings</span>
                      <span className={styles.activeSubPrice}>PROPERTY ACTIVE</span>
                    </div>
                    <div className={styles.activeSubDates}>
                      <Clock size={13} />
                      <span>
                        Valid until: <strong>{propertyExpiry.toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong>
                      </span>
                    </div>
                    <span className={styles.expiryBadge}>
                      {stackedProperty.length} plan{stackedProperty.length > 1 ? "s" : ""} active
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className={styles.filterTabsWrapper}>
            <div className={styles.filterTabs}>
              {isDualVerified ? (
                <>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${activeCategoryFilter === "ALL" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setActiveCategoryFilter("ALL")}
                  >
                    All Plans ({plans.length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${activeCategoryFilter === "FOOD" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setActiveCategoryFilter("FOOD")}
                  >
                    Food Kitchen
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${activeCategoryFilter === "PROPERTY" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setActiveCategoryFilter("PROPERTY")}
                  >
                    Rooms & Stay
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterTabBtn} ${activeCategoryFilter === "BOTH" ? styles.filterTabBtnActive : ""}`}
                    onClick={() => setActiveCategoryFilter("BOTH")}
                  >
                    Hybrid (Both)
                  </button>
                </>
              ) : (
                <div
                  className={`${styles.filterTabBtn} ${styles.filterTabBtnActive}`}
                  style={{ cursor: "default" }}
                >
                  {activeCategoryFilter === "FOOD"
                    ? "Food Kitchen Plans"
                    : activeCategoryFilter === "PROPERTY"
                    ? "Rooms & Stay Plans"
                    : activeCategoryFilter === "BOTH"
                    ? "Hybrid (Both) Plans"
                    : "Available Plans"} ({filteredPlans.length})
                </div>
              )}
            </div>

            <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
              Showing {filteredPlans.length} subscription packages
            </span>
          </div>

          {/* Two-Column Checkout Layout */}
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748B" }}>
              <Loader2 size={32} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Loading available subscription plans...</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <CreditCard size={28} />
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                No subscription plans available for this category
              </h3>
              <p style={{ fontSize: "13.5px", color: "#64748B", margin: 0, maxWidth: "420px" }}>
                Please check back later or contact partner support to configure custom enterprise onboarding.
              </p>
              <Link
                href="/seller/support"
                style={{
                  marginTop: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#FF5500",
                  color: "#FFFFFF",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Contact Support
              </Link>
            </div>
          ) : (
            <div className={styles.checkoutLayout}>
              {/* Left Side: Plans Grid */}
              <div className={styles.plansGrid}>
                {filteredPlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isFood = plan.category === "FOOD";
                  const isProperty = plan.category === "PROPERTY";
                  const isBoth = plan.category === "BOTH";

                  return (
                    <div
                      key={plan.id}
                      className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ""}`}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setAppliedCoupon(null);
                        setCouponError("");
                      }}
                    >
                      <div>
                        {/* Top: Icon + Radio */}
                        <div className={styles.planTop}>
                          <div
                            className={`${styles.planIconCircle} ${
                              isFood ? styles.planIconFood : isProperty ? styles.planIconProperty : styles.planIconBoth
                            }`}
                          >
                            {isFood ? <Utensils size={20} /> : isProperty ? <BedDouble size={20} /> : <Sparkles size={20} />}
                          </div>

                          <div
                            className={`${styles.radioIndicator} ${
                              isSelected ? styles.radioIndicatorSelected : ""
                            }`}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>

                        {/* Title & Duration */}
                        <h3 className={styles.planTitle}>{plan.name}</h3>
                        <div className={styles.planDuration}>
                          <Clock size={13} />
                          <span>
                            {plan.durationMonths} Month{plan.durationMonths > 1 ? "s" : ""} Validity ({plan.category})
                          </span>
                        </div>

                        {/* Price */}
                        <div className={styles.planPriceRow}>
                          <span className={styles.planPriceAmount}>₹{plan.price.toLocaleString("en-IN")}</span>
                          <span className={styles.planPriceDuration}>/ {plan.durationMonths}mo</span>
                        </div>

                        {/* Features */}
                        <ul className={styles.planFeaturesList}>
                          {Array.isArray(plan.features) && plan.features.length > 0 ? (
                            plan.features.map((feature, idx) => (
                              <li key={idx} className={styles.planFeatureItem}>
                                <CheckCircle2 size={14} color="#16A34A" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <span>{feature}</span>
                              </li>
                            ))
                          ) : (
                            <>
                              <li className={styles.planFeatureItem}>
                                <CheckCircle2 size={14} color="#16A34A" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <span>Full operations console access</span>
                              </li>
                              <li className={styles.planFeatureItem}>
                                <CheckCircle2 size={14} color="#16A34A" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <span>Zero commission order processing</span>
                              </li>
                              <li className={styles.planFeatureItem}>
                                <CheckCircle2 size={14} color="#16A34A" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <span>Instant payout settlements & analytics</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Side: Order Summary & Razorpay Checkout */}
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>
                  <Zap size={18} color="#FF5500" />
                  Order Summary
                </h3>

                {selectedPlan && (
                  <div className={styles.selectedPlanBox}>
                    <div className={styles.selectedPlanRow}>
                      <span className={styles.selectedPlanName}>{selectedPlan.name}</span>
                      <span className={styles.selectedPlanPrice}>₹{selectedPlan.price.toLocaleString("en-IN")}</span>
                    </div>
                    <div className={styles.selectedPlanMeta}>
                      Category: <strong>{selectedPlan.category}</strong> • Duration: <strong>{selectedPlan.durationMonths}mo</strong>
                    </div>
                  </div>
                )}

                {/* Promo Coupon Box */}
                <div className={styles.couponBox}>
                  <div className={styles.couponLabel}>
                    <Tag size={13} color="#FF5500" />
                    <span>Have a Partner Coupon?</span>
                  </div>

                  <div className={styles.couponInputRow}>
                    <input
                      type="text"
                      className={styles.couponInput}
                      placeholder="ENTER CODE (e.g. SAVE20)"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      disabled={appliedCoupon !== null || isApplyingCoupon}
                    />

                    {appliedCoupon ? (
                      <button type="button" onClick={handleRemoveCoupon} className={styles.couponBtnRemove}>
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className={styles.couponBtnApply}
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    )}
                  </div>

                  {couponError && <div className={styles.couponError}>{couponError}</div>}

                  {appliedCoupon && (
                    <div className={styles.couponAppliedCard}>
                      <div className={styles.couponAppliedRow}>
                        <span>Coupon ({couponCode})</span>
                        <span>-₹{appliedCoupon.discount}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#15803D" }}>
                        Promo discount applied successfully!
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className={styles.priceBreakdown}>
                  <div className={styles.breakdownRow}>
                    <span>Base Plan Price:</span>
                    <span>₹{basePrice.toLocaleString("en-IN")}</span>
                  </div>

                  {appliedCoupon && (
                    <div className={`${styles.breakdownRow} ${styles.breakdownDiscount}`}>
                      <span>Coupon Discount:</span>
                      <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}>
                    <span>Total Payable:</span>
                    <span style={{ color: "#FF5500" }}>₹{finalPayable.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Proceed to Payment Button */}
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={isProcessingPayment || !selectedPlan}
                  className={styles.checkoutBtn}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Connecting to Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Payment</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className={styles.secureNote}>
                  <ShieldCheck size={14} color="#16A34A" />
                  <span>256-Bit SSL Encrypted Razorpay Gateway</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <div className={styles.successModalOverlay}>
          <div className={styles.successModalCard}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={36} />
            </div>
            <h2 className={styles.successTitle}>Subscription Activated!</h2>
            <p className={styles.successSubtitle}>
              Your partner subscription is now active. Your dashboard operations, order processing, and listings are fully unlocked.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/seller/dashboard");
              }}
              className={styles.successActionBtn}
            >
              Go to Seller Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
