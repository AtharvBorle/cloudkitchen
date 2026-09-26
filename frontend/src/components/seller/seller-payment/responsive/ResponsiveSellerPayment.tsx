"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  CreditCard,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ShieldCheck,
  Tag,
  Loader2,
  Check,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./ResSellerPayment.module.css";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  features: string[];
  category: string;
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

export default function ResponsiveSellerPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams?.get("token") || "";
  const queryPlanId = searchParams?.get("planId") || "";
  const queryCategory = searchParams?.get("category") || "";

  const seller = useSellerProfile();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanItem[]>([]);
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

      if (statusRes.status === "fulfilled" && statusRes.value.ok) {
        const sData = await statusRes.value.json();
        const parsed = sData.data || sData;
        setStatusData(parsed);

        const bCat = parsed.sellerProfile?.businessCategory;
        const foodApp = bCat === "FOOD" || bCat === "BOTH" || parsed.sellerProfile?.foodVerificationStatus === "APPROVED";
        const propApp = bCat === "PROPERTY" || bCat === "BOTH" || parsed.sellerProfile?.propertyVerificationStatus === "APPROVED";
        const dual = bCat === "BOTH" || (foodApp && propApp);

        if (!queryCategory && bCat) {
          if (dual) {
            setActiveCategoryFilter("ALL");
          } else if (bCat === "FOOD" || bCat === "PROPERTY") {
            setActiveCategoryFilter(bCat);
          }
        }
      }

      if (plansRes.status === "fulfilled" && plansRes.value.ok) {
        const pData = await plansRes.value.json();
        const planList: PlanItem[] = pData.data || pData || [];
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
      console.error("Mobile subscription load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryPlanId, queryCategory, queryToken]);

  const filteredPlans = plans.filter((p) => {
    if (activeCategoryFilter === "ALL") return true;
    if (activeCategoryFilter === "FOOD") return p.category === "FOOD";
    if (activeCategoryFilter === "PROPERTY") return p.category === "PROPERTY";
    if (activeCategoryFilter === "BOTH") return p.category === "BOTH";
    return true;
  });

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || filteredPlans[0];

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
      setCouponError("Failed to validate coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      alert("Please select a plan");
      return;
    }

    setIsProcessingPayment(true);
    try {
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
        alert(orderData.message || "Failed to create order");
        setIsProcessingPayment(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to initialize Razorpay");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: "INR",
        name: "Neo Cloud Kitchen",
        description: `${selectedPlan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
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
            alert("Subscription activated successfully!");
            router.push("/seller/dashboard");
          } else {
            alert("Payment verification failed");
          }
          setIsProcessingPayment(false);
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
        alert("Payment was cancelled or failed");
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment gateway error");
      setIsProcessingPayment(false);
    }
  };

  const finalAmount = appliedCoupon ? appliedCoupon.finalPrice : selectedPlan?.price || 0;

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

  return (
    <div className={styles.mobileContainer}>
      {/* Top Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setIsNavOpen(true)}
            aria-label="Open navigation drawer"
          >
            <Menu size={22} />
          </button>
          <h1 className={styles.mobileTitle}>Subscription & Plans</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mobileContent}>
        {/* Banner */}
        <div className={styles.bannerCard}>
          <h2 className={styles.bannerTitle}>
            <Zap size={16} color="#FF5500" />
            Partner Subscription
          </h2>
          <p className={styles.bannerText}>
            Choose a plan tier to unlock order management, delivery dispatch, and menu tools.
          </p>
        </div>

        {/* Category Pills */}
        <div className={styles.categoryPills}>
          {isDualVerified ? (
            <>
              <button
                type="button"
                className={`${styles.pillBtn} ${activeCategoryFilter === "ALL" ? styles.pillBtnActive : ""}`}
                onClick={() => setActiveCategoryFilter("ALL")}
              >
                All Plans
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${activeCategoryFilter === "FOOD" ? styles.pillBtnActive : ""}`}
                onClick={() => setActiveCategoryFilter("FOOD")}
              >
                Food
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${activeCategoryFilter === "PROPERTY" ? styles.pillBtnActive : ""}`}
                onClick={() => setActiveCategoryFilter("PROPERTY")}
              >
                Rooms
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${activeCategoryFilter === "BOTH" ? styles.pillBtnActive : ""}`}
                onClick={() => setActiveCategoryFilter("BOTH")}
              >
                Hybrid
              </button>
            </>
          ) : (
            <div
              className={`${styles.pillBtn} ${styles.pillBtnActive}`}
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

        {/* Plans List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
            <Loader2 size={24} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 8px" }} />
            <span style={{ fontSize: "13px" }}>Loading plans...</span>
          </div>
        ) : (
          <div className={styles.plansList}>
            {filteredPlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ""}`}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setAppliedCoupon(null);
                  }}
                >
                  <div className={styles.planHeader}>
                    <div>
                      <div className={styles.planName}>{plan.name}</div>
                      <div className={styles.planMeta}>
                        {plan.durationMonths} Month{plan.durationMonths > 1 ? "s" : ""} • {plan.category}
                      </div>
                    </div>
                    <div className={styles.planPrice}>₹{plan.price}</div>
                  </div>

                  {Array.isArray(plan.features) &&
                    plan.features.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className={styles.featureItem}>
                        <CheckCircle2 size={12} color="#16A34A" />
                        <span>{feat}</span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Promo Coupon Box */}
        <div className={styles.couponBox}>
          <div className={styles.couponTitle}>Apply Partner Coupon</div>
          <div className={styles.couponInputRow}>
            <input
              type="text"
              className={styles.couponInput}
              placeholder="COUPON CODE"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError("");
              }}
              disabled={appliedCoupon !== null}
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                }}
                className={styles.couponBtn}
                style={{ backgroundColor: "#EF4444" }}
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
                className={styles.couponBtn}
              >
                {isApplyingCoupon ? "..." : "Apply"}
              </button>
            )}
          </div>
          {couponError && <p style={{ color: "#DC2626", fontSize: "11.5px", margin: "6px 0 0" }}>{couponError}</p>}
          {appliedCoupon && (
            <p style={{ color: "#16A34A", fontSize: "11.5px", margin: "6px 0 0", fontWeight: 600 }}>
              Discount applied: -₹{appliedCoupon.discount}
            </p>
          )}
        </div>
      </main>

      {/* Sticky Bottom Summary & Pay Button */}
      {selectedPlan && (
        <div className={styles.bottomBar}>
          <div className={styles.totalGroup}>
            <span className={styles.totalLabel}>Total Payable</span>
            <span className={styles.totalAmount}>₹{finalAmount}</span>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className={styles.payBtn}
          >
            {isProcessingPayment ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>Pay Subscription</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      <ResponsiveNavMenu
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        activeItemId="subscription"
      />
    </div>
  );
}
