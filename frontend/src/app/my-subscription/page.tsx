"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SubscriptionHeader } from "@/components/my-subscription/subscription-header";
import { SubscriptionPlanCard } from "@/components/my-subscription/subscription-plan-card";
import { PauseSubscription } from "@/components/my-subscription/pause-subscription";
import { DeliveryTimes, DeliverySlot } from "@/components/my-subscription/delivery-times";
import { SubscriptionBenefits } from "@/components/my-subscription/subscription-benefits";
import { SubscriptionActions } from "@/components/my-subscription/subscription-actions";
import { ChangePlanModal } from "@/components/my-subscription/change-plan-modal";
import { CancelSubscriptionModal } from "@/components/my-subscription/cancel-subscription-modal";
import { Footer } from "@/components/explore-desktop/footer";
import { useLocation } from "@/components/location-provider";
import {
  fetchUserMealSubscriptions,
  togglePauseUserSubscription,
  subscribeToMealPlan,
  getTierColors,
  UserActiveMealSubscription,
} from "@/lib/meal-subscriptions";
import {
  Utensils,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Calendar,
  Sparkles,
  ShieldCheck,
  PauseCircle,
  Search,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Phone,
  Loader2,
  Award,
  Layers,
} from "lucide-react";
import styles from "./MySubscriptionPage.module.css";

interface PublicMealPlan {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerLocality?: string;
  foodType?: string;
  name: string;
  tier: string;
  description?: string;
  weeklyPrice: number;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  duration?: string;
  features?: string[];
  mealTimings?: string[];
  allowCancel?: boolean;
  pauseBillingPeriod?: string;
}

interface SellerInfo {
  id: string;
  name: string;
  trackingId?: string;
  locality?: string;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string | null;
  foodType?: string;
  plansCount: number;
}

type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";

function MySubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { defaultAddress } = useLocation();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"active" | "plans">(
    tabParam === "plans" || tabParam === "all" ? "plans" : "active"
  );

  // Active Subscription State
  const [subscription, setSubscription] = useState<UserActiveMealSubscription | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(true);
  const [isChangingPlan, setIsChangingPlan] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // All Subscription Plans Explorer State
  const [allPlans, setAllPlans] = useState<PublicMealPlan[]>([]);
  const [allKitchens, setAllKitchens] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | "all">("all");
  const [selectedDiet, setSelectedDiet] = useState<string>("all");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Subscribe Modal State
  const [selectedPlanForSub, setSelectedPlanForSub] = useState<PublicMealPlan | null>(null);
  const [deliveryAddressInput, setDeliveryAddressInput] = useState<string>("");
  const [contactPhoneInput, setContactPhoneInput] = useState<string>("");
  const [startDatePreference, setStartDatePreference] = useState<string>("Tomorrow");
  const [isSubmittingSub, setIsSubmittingSub] = useState<boolean>(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState<string | null>(null);
  const [subErrorMsg, setSubErrorMsg] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === "plans" || tabParam === "all") {
      setActiveTab("plans");
    } else if (tabParam === "active") {
      setActiveTab("active");
    }
  }, [tabParam]);

  // Load User Active Subscription
  useEffect(() => {
    let isMounted = true;

    async function loadUserSubs() {
      try {
        setIsLoadingActive(true);
        const subs = await fetchUserMealSubscriptions();
        if (isMounted && subs.length > 0) {
          const active = subs.find((s) => s.status === "ACTIVE") || subs[0];
          setSubscription(active);
        } else if (isMounted) {
          setSubscription(null);
        }
      } catch (err) {
        console.error("Error loading user subscriptions:", err);
      } finally {
        if (isMounted) setIsLoadingActive(false);
      }
    }

    loadUserSubs();

    return () => {
      isMounted = false;
    };
  }, [session]);

  // Load All Public Meal Plans & Kitchens from API
  useEffect(() => {
    let isMounted = true;

    async function loadPlansData() {
      try {
        setIsLoadingPlans(true);
        const [plansRes, exploreRes] = await Promise.all([
          fetch("http://localhost:5000/api/public/meal-plans").catch(() => fetch("/api/public/meal-plans")),
          fetch("http://localhost:5000/api/public/explore").catch(() => fetch("/api/public/explore")),
        ]);

        let plansData: PublicMealPlan[] = [];
        let kitchensData: any[] = [];

        if (plansRes.ok) {
          const plansJson = await plansRes.json();
          plansData = plansJson.data || plansJson || [];
        }

        if (exploreRes.ok) {
          const exploreJson = await exploreRes.json();
          kitchensData = exploreJson.data?.kitchens || exploreJson.kitchens || [];
        }

        if (isMounted) {
          setAllPlans(plansData);
          setAllKitchens(kitchensData);

          if (plansData.length > 0 && selectedSellerId === "all") {
            // Default to first seller with plans
            setSelectedSellerId(plansData[0].sellerId);
          }
        }
      } catch (err) {
        console.error("Failed to load public meal plans:", err);
      } finally {
        if (isMounted) setIsLoadingPlans(false);
      }
    }

    loadPlansData();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Derive unique sellers who have meal plans
  const sellersList = useMemo<SellerInfo[]>(() => {
    const sellerMap = new Map<string, SellerInfo>();

    allPlans.forEach((plan) => {
      if (!sellerMap.has(plan.sellerId)) {
        const kitchenMeta = allKitchens.find((k) => k.id === plan.sellerId);
        sellerMap.set(plan.sellerId, {
          id: plan.sellerId,
          name: plan.sellerName || kitchenMeta?.name || "Kitchen Partner",
          trackingId: kitchenMeta?.trackingId,
          locality: plan.sellerLocality || kitchenMeta?.locality || kitchenMeta?.city || "Pune",
          rating: kitchenMeta?.rating || 4.8,
          reviewsCount: kitchenMeta?.reviewsCount || 0,
          imageUrl: kitchenMeta?.imageUrl || null,
          foodType: plan.foodType || kitchenMeta?.foodType || "BOTH",
          plansCount: 1,
        });
      } else {
        const existing = sellerMap.get(plan.sellerId)!;
        existing.plansCount += 1;
      }
    });

    return Array.from(sellerMap.values());
  }, [allPlans, allKitchens]);

  // Selected Seller Object
  const currentSeller = useMemo(() => {
    if (selectedSellerId === "all") return null;
    return sellersList.find((s) => s.id === selectedSellerId) || null;
  }, [selectedSellerId, sellersList]);

  // Filter plans based on selected seller, dietary preference, and search query
  const filteredPlans = useMemo(() => {
    let list = allPlans;

    if (selectedSellerId !== "all") {
      list = list.filter((p) => p.sellerId === selectedSellerId);
    }

    if (selectedDiet && selectedDiet !== "all") {
      const d = selectedDiet.toLowerCase();
      if (d === "veg") {
        list = list.filter((p) => (p.foodType || "").toUpperCase() !== "NON_VEG");
      } else if (d === "non-veg") {
        list = list.filter((p) => (p.foodType || "").toUpperCase() !== "PURE_VEG" && (p.foodType || "").toUpperCase() !== "VEG");
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const sellerMatch = (p.sellerName || "").toLowerCase().includes(q);
        const featuresMatch = (p.features || []).some((f) => f.toLowerCase().includes(q));
        const tierMatch = (p.tier || "").toLowerCase().includes(q);
        return nameMatch || sellerMatch || featuresMatch || tierMatch;
      });
    }

    return list;
  }, [allPlans, selectedSellerId, selectedDiet, searchQuery]);

  const getCyclePrice = (plan: PublicMealPlan, cycle: BillingCycle) => {
    switch (cycle) {
      case "weekly":
        return plan.weeklyPrice;
      case "monthly":
        return plan.monthlyPrice || plan.weeklyPrice * 4;
      case "quarterly":
        return plan.quarterlyPrice || Math.round(plan.weeklyPrice * 12 * 0.9);
      case "yearly":
        return plan.yearlyPrice || Math.round(plan.weeklyPrice * 52 * 0.8);
      default:
        return plan.weeklyPrice;
    }
  };

  const getCycleLabel = (cycle: BillingCycle) => {
    switch (cycle) {
      case "weekly":
        return "/ week";
      case "monthly":
        return "/ month";
      case "quarterly":
        return "/ 3 months";
      case "yearly":
        return "/ year";
      default:
        return "/ month";
    }
  };

  const getPerMealEstimate = (plan: PublicMealPlan, cycle: BillingCycle) => {
    const price = getCyclePrice(plan, cycle);
    let totalMeals = 7;
    if (cycle === "weekly") totalMeals = 7;
    else if (cycle === "monthly") totalMeals = 30;
    else if (cycle === "quarterly") totalMeals = 90;
    else if (cycle === "yearly") totalMeals = 365;

    const timingsCount = plan.mealTimings && plan.mealTimings.length > 0 ? plan.mealTimings.length : 1;
    const estMeals = totalMeals * Math.max(1, timingsCount <= 2 ? timingsCount : 2);
    const perMeal = Math.round(price / estMeals);
    return perMeal > 0 ? perMeal : 65;
  };

  const handleTogglePause = async (nextPaused: boolean) => {
    if (!subscription) return;
    try {
      if (subscription.id && !subscription.id.startsWith("sub-demo")) {
        await togglePauseUserSubscription(subscription.id, nextPaused);
      }
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              isPaused: nextPaused,
              status: nextPaused ? "PAUSED" : "ACTIVE",
            }
          : null
      );
      showToast(
        "success",
        nextPaused
          ? "Meal subscription paused. Billing and scheduled meals frozen."
          : "Meal subscription resumed! Scheduled meals will resume tomorrow."
      );
    } catch (err: any) {
      showToast("error", err.message || "Failed to update pause status.");
    }
  };

  const handlePlanChanged = (updatedData: any) => {
    if (!subscription) return;
    if (updatedData.plan) {
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              planId: updatedData.planId || updatedData.plan.id,
              tier: updatedData.tier || updatedData.plan.tier,
              status: updatedData.status || "ACTIVE",
              pricePaid: updatedData.pricePaid || updatedData.plan.weeklyPrice,
              plan: {
                ...prev.plan,
                ...updatedData.plan,
              },
            }
          : null
      );
    }
    showToast(
      "success",
      `Meal plan successfully changed to ${updatedData.name || updatedData.tier || "new tier"}!`
    );
  };

  const handleSubscriptionCancelled = () => {
    setSubscription((prev) =>
      prev
        ? {
            ...prev,
            status: "CANCELLED",
            isPaused: false,
          }
        : null
    );
    showToast("info", "Your meal subscription has been cancelled.");
  };

  // Open Subscribe Modal
  const handleOpenSubscribeModal = (plan: PublicMealPlan) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/my-subscriptions-desktop?tab=plans")}`);
      return;
    }
    setSelectedPlanForSub(plan);
    setDeliveryAddressInput(defaultAddress?.address || defaultAddress?.label || "");
    setContactPhoneInput((session.user as any)?.phone || "");
    setSubErrorMsg(null);
    setSubSuccessMsg(null);
  };

  // Submit Subscription
  const handleConfirmSubscription = async () => {
    if (!selectedPlanForSub) return;
    if (!deliveryAddressInput.trim()) {
      setSubErrorMsg("Please provide your delivery address or room number.");
      return;
    }

    setIsSubmittingSub(true);
    setSubErrorMsg(null);

    try {
      const res = await subscribeToMealPlan(selectedPlanForSub.id, {
        deliveryAddress: deliveryAddressInput.trim(),
        contactPhone: contactPhoneInput.trim(),
        cycle: billingCycle.toUpperCase(),
      });

      setSubSuccessMsg(res.message || "Meal plan subscribed successfully!");
      
      // Reload active subscriptions and switch tab
      const subs = await fetchUserMealSubscriptions();
      if (subs && subs.length > 0) {
        const active = subs.find((s) => s.status === "ACTIVE") || subs[0];
        setSubscription(active);
      }

      setTimeout(() => {
        setSelectedPlanForSub(null);
        setActiveTab("active");
        showToast("success", "Welcome to your new meal subscription!");
      }, 1200);
    } catch (err: any) {
      setSubErrorMsg(err.message || "Failed to create subscription. Please try again.");
    } finally {
      setIsSubmittingSub(false);
    }
  };

  // Custom Slots for active plan
  const customSlots: DeliverySlot[] =
    subscription?.plan?.mealTimings && subscription.plan.mealTimings.length > 0
      ? subscription.plan.mealTimings.map((t, idx) => {
          let name = "Meal Delivery";
          let timeRange = t;
          let icon = "🍱";

          if (t.toLowerCase().includes("breakfast")) {
            name = "Breakfast Delivery";
            icon = "🍳";
          } else if (t.toLowerCase().includes("lunch")) {
            name = "Lunch Delivery";
            icon = "🍲";
          } else if (t.toLowerCase().includes("dinner")) {
            name = "Dinner Delivery";
            icon = "🍱";
          }

          if (t.includes("(") && t.includes(")")) {
            timeRange = t.substring(t.indexOf("(") + 1, t.indexOf(")"));
          }

          return {
            id: `slot-${idx}`,
            name,
            timeRange,
            icon,
          };
        })
      : [
          { id: "breakfast", name: "Breakfast Delivery", timeRange: "8:00 AM – 9:30 AM", icon: "🍳" },
          { id: "lunch", name: "Lunch Delivery", timeRange: "1:00 PM – 2:30 PM", icon: "🍲" },
          { id: "dinner", name: "Dinner Delivery", timeRange: "8:00 PM – 9:30 PM", icon: "🍱" },
        ];

  const customBenefits =
    subscription?.plan?.features && subscription.plan.features.length > 0
      ? subscription.plan.features
      : undefined;

  const formattedStartedOn = subscription?.startDate
    ? new Date(subscription.startDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const formattedRenewalDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Auto-renew";

  const getCycleSuffix = (cycle?: string, duration?: string) => {
    const c = (cycle || duration || "1 Week").toLowerCase();
    if (c.includes("2 week")) return "2 weeks";
    if (c.includes("week")) return "week";
    if (c.includes("6 month")) return "6 months";
    if (c.includes("month")) return "month";
    if (c.includes("year")) return "year";
    return cycle || "period";
  };

  const formattedPrice = subscription
    ? `₹${(subscription.pricePaid || subscription.plan?.weeklyPrice || 0).toLocaleString("en-IN")}/${getCycleSuffix(subscription.cycle, subscription.plan?.duration)}`
    : "";

  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Shared Settings Sidebar */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="my-subscriptions" />
          </div>

          {/* Right Column: Subscriptions Hub */}
          <div className={styles.contentWrapper}>
            {/* Page Header */}
            <SubscriptionHeader
              title="Meal Subscriptions Hub"
              subtitle="Manage your active daily meals or explore live subscription plans from verified cloud kitchens."
            />

            {/* Notification Toast */}
            {toast && (
              <div
                className={`${styles.toast} ${
                  toast.type === "success"
                    ? styles.toastSuccess
                    : toast.type === "error"
                    ? styles.toastError
                    : styles.toastInfo
                }`}
              >
                <div className={styles.toastContent}>
                  {toast.type === "success" && <CheckCircle2 size={18} className={styles.toastIcon} />}
                  {toast.type === "error" && <AlertCircle size={18} className={styles.toastIcon} />}
                  {toast.type === "info" && <Info size={18} className={styles.toastIcon} />}
                  <span>{toast.text}</span>
                </div>
                <button
                  type="button"
                  className={styles.toastClose}
                  onClick={() => setToast(null)}
                  aria-label="Dismiss message"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Top Tabs Switcher */}
            <div className={styles.mainTabsRow} role="tablist" aria-label="Subscriptions Navigation">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "active"}
                className={`${styles.mainTabBtn} ${
                  activeTab === "active" ? styles.mainTabBtnActive : ""
                }`}
                onClick={() => {
                  setActiveTab("active");
                  router.replace("/my-subscriptions-desktop?tab=active", { scroll: false });
                }}
              >
                <Calendar size={17} />
                <span>My Active Subscription</span>
                {subscription && (
                  <span
                    className={
                      activeTab === "active"
                        ? styles.tabCountBadge
                        : `${styles.tabCountBadge} ${styles.tabCountBadgeInactive}`
                    }
                  >
                    {subscription.status}
                  </span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "plans"}
                className={`${styles.mainTabBtn} ${
                  activeTab === "plans" ? styles.mainTabBtnActive : ""
                }`}
                onClick={() => {
                  setActiveTab("plans");
                  router.replace("/my-subscriptions-desktop?tab=plans", { scroll: false });
                }}
              >
                <Utensils size={17} />
                <span>All Subscription Plans</span>
                <span
                  className={
                    activeTab === "plans"
                      ? styles.tabCountBadge
                      : `${styles.tabCountBadge} ${styles.tabCountBadgeInactive}`
                  }
                >
                  {allPlans.length} Plans
                </span>
              </button>
            </div>

            {/* TAB 1: MY ACTIVE SUBSCRIPTION */}
            {activeTab === "active" && (
              <div>
                {isLoadingActive ? (
                  <div style={{ textAlign: "center", padding: "64px 20px", color: "#64748B" }}>
                    <Loader2 size={32} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Loading active subscription details...</p>
                  </div>
                ) : !subscription ? (
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      padding: "60px 24px",
                      textAlign: "center",
                      border: "1px dashed #CBD5E1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "14px",
                      marginTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#FFF4E6",
                        color: "#FF6B00",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                      }}
                    >
                      🍱
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#1E293B" }}>
                      No Active Meal Subscriptions
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748B", maxWidth: "440px", lineHeight: "1.5" }}>
                      You do not currently have an active daily meal plan. Browse verified kitchens like Radha&apos;s Kitchen &amp; Yewale&apos;s Kitchens to subscribe.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("plans");
                        router.replace("/my-subscriptions-desktop?tab=plans", { scroll: false });
                      }}
                      style={{
                        marginTop: "8px",
                        padding: "11px 26px",
                        borderRadius: "12px",
                        backgroundColor: "#FF5500",
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(255, 85, 0, 0.28)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>Explore All Subscription Plans</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Active Plan Card */}
                    <SubscriptionPlanCard
                      title={subscription.plan?.name || "Daily Meal Plan"}
                      subtitle={
                        subscription.seller?.businessName
                          ? `Kitchen: ${subscription.seller.businessName}`
                          : "Standard Gourmet Kitchen"
                      }
                      tier={subscription.tier || subscription.plan?.tier || "Bronze"}
                      statusText={subscription.status}
                      isPaused={subscription.isPaused}
                      startedOn={formattedStartedOn}
                      renewalDate={formattedRenewalDate}
                      planPrice={formattedPrice}
                    />

                    {/* Pause Subscription Section */}
                    <PauseSubscription
                      isPaused={subscription.isPaused}
                      disabled={subscription.status?.toUpperCase() === "CANCELLED"}
                      onTogglePause={handleTogglePause}
                    />

                    {/* Delivery Times & Benefits Grid */}
                    <div className={styles.detailsGrid}>
                      <DeliveryTimes slots={customSlots} />
                      <SubscriptionBenefits benefits={customBenefits} />
                    </div>

                    {/* Subscription Actions */}
                    <SubscriptionActions
                      onChangePlan={() => setIsChangingPlan(true)}
                      onCancelSubscription={() => setIsCancelling(true)}
                      status={subscription.status}
                      allowCancel={subscription.plan?.allowCancel ?? true}
                    />
                  </>
                )}
              </div>
            )}

            {/* TAB 2: ALL SUBSCRIPTION PLANS (BROWSE KITCHENS & PLANS) */}
            {activeTab === "plans" && (
              <div className={styles.plansExplorerWrapper}>
                {/* Kitchen / Seller Switcher & Filters */}
                <section className={styles.controlsSection} aria-label="Kitchen & Plan Filters">
                  {/* Seller Switcher */}
                  <div>
                    <div className={styles.sellerTabsHeader}>
                      <h3 className={styles.sellerTabsTitle}>
                        <Utensils size={17} color="#FF5500" />
                        <span>Select Kitchen Partner</span>
                        <span className={styles.sellerTabsCount}>{sellersList.length} Kitchens</span>
                      </h3>

                      {selectedSellerId !== "all" && (
                        <button
                          type="button"
                          onClick={() => setSelectedSellerId("all")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            color: "#475569",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View All Kitchen Plans
                        </button>
                      )}
                    </div>

                    <div className={styles.sellerScrollContainer}>
                      {/* All Kitchens Pill */}
                      <div
                        className={`${styles.sellerTabItem} ${
                          selectedSellerId === "all" ? styles.sellerTabActive : ""
                        }`}
                        onClick={() => setSelectedSellerId("all")}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={styles.sellerAvatar}>
                          <Layers size={17} />
                        </div>
                        <div className={styles.sellerTabMeta}>
                          <span className={styles.sellerTabName}>All Cloud Kitchens</span>
                          <span className={styles.sellerTabSub}>{allPlans.length} Total Plans</span>
                        </div>
                      </div>

                      {/* Individual Seller Tabs */}
                      {sellersList.map((seller) => (
                        <div
                          key={seller.id}
                          className={`${styles.sellerTabItem} ${
                            selectedSellerId === seller.id ? styles.sellerTabActive : ""
                          }`}
                          onClick={() => setSelectedSellerId(seller.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={styles.sellerAvatar}>
                            {seller.imageUrl ? (
                              <Image
                                src={seller.imageUrl}
                                alt={seller.name}
                                fill
                                sizes="36px"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              seller.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className={styles.sellerTabMeta}>
                            <span className={styles.sellerTabName}>{seller.name}</span>
                            <span className={styles.sellerTabSub}>
                              <span className={styles.sellerTabRating}>
                                <Star size={11} fill="#D97706" color="#D97706" />
                                {seller.rating?.toFixed(1) || "4.8"}
                              </span>
                              <span>•</span>
                              <span>{seller.plansCount} {seller.plansCount === 1 ? "Plan" : "Plans"}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Filters: Dietary, Search & Billing Cycle */}
                  <div className={styles.filterRow}>
                    {/* Dietary Pills */}
                    <div className={styles.dietaryPills}>
                      {[
                        { id: "all", label: "All Diets" },
                        { id: "veg", label: "Pure Veg 🥦" },
                        { id: "non-veg", label: "Non-Veg 🍗" },
                      ].map((diet) => (
                        <button
                          key={diet.id}
                          type="button"
                          className={`${styles.dietPill} ${
                            selectedDiet === diet.id ? styles.dietPillActive : ""
                          }`}
                          onClick={() => setSelectedDiet(diet.id)}
                        >
                          {diet.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className={styles.searchBox}>
                      <Search size={15} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Search plan, dish, dal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>

                    {/* Billing Cycle Switcher */}
                    <div className={styles.cycleSwitcher}>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "weekly" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("weekly")}
                      >
                        <span>Weekly</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "monthly" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("monthly")}
                      >
                        <span>Monthly</span>
                        <span className={styles.cycleDiscountBadge}>Popular</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "quarterly" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("quarterly")}
                      >
                        <span>Quarterly</span>
                        <span className={styles.cycleDiscountBadge}>-10%</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "yearly" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("yearly")}
                      >
                        <span>Yearly</span>
                        <span className={styles.cycleDiscountBadge}>-20%</span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* Selected Kitchen Highlight Card */}
                {currentSeller && (
                  <section className={styles.sellerHighlightCard}>
                    <div className={styles.sellerHighlightLeft}>
                      <div className={styles.sellerHighlightAvatar}>
                        {currentSeller.imageUrl ? (
                          <Image
                            src={currentSeller.imageUrl}
                            alt={currentSeller.name}
                            fill
                            sizes="52px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          currentSeller.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h2 className={styles.sellerHighlightName}>
                          <span>{currentSeller.name}</span>
                          <span className={styles.sellerVerifiedBadge}>
                            <ShieldCheck size={11} />
                            Verified Kitchen
                          </span>
                        </h2>
                        <div className={styles.sellerHighlightMeta}>
                          <span className={styles.sellerRatingBadge}>
                            <Star size={11} fill="#B45309" color="#B45309" />
                            {currentSeller.rating?.toFixed(1) || "4.8"} ({currentSeller.reviewsCount || 10}+ reviews)
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={13} color="#64748B" />
                            {currentSeller.locality}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Plans Grid */}
                {isLoadingPlans ? (
                  <div className={styles.emptyState}>
                    <Loader2 size={32} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
                    <h3 className={styles.emptyTitle}>Loading Available Plans...</h3>
                    <p className={styles.emptyText}>Fetching verified kitchen meal subscriptions from database.</p>
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <Utensils size={24} />
                    </div>
                    <h3 className={styles.emptyTitle}>No Matching Meal Plans Found</h3>
                    <p className={styles.emptyText}>
                      Try resetting your search or selecting all kitchens to view all options.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSellerId("all");
                        setSelectedDiet("all");
                        setSearchQuery("");
                      }}
                      className={styles.resetBtn}
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className={styles.plansGrid}>
                    {filteredPlans.map((plan, idx) => {
                      const tierColors = getTierColors(plan.tier);
                      const price = getCyclePrice(plan, billingCycle);
                      const perMeal = getPerMealEstimate(plan, billingCycle);
                      const isPopular = idx === 0 || plan.tier?.toLowerCase() === "gold";

                      return (
                        <article
                          key={plan.id}
                          className={`${styles.planCard} ${isPopular ? styles.popularCard : ""}`}
                        >
                          {isPopular && (
                            <div className={styles.popularRibbon}>Popular</div>
                          )}

                          {/* Card Header: Tier Badge + Kitchen Name */}
                          <div className={styles.cardHeader}>
                            <span
                              className={styles.tierPill}
                              style={{
                                color: tierColors.tierColor,
                                backgroundColor: tierColors.tierBg,
                              }}
                            >
                              <Award size={12} />
                              {plan.tier || "Bronze"} Tier
                            </span>

                            <span className={styles.planSellerTag}>
                              <MapPin size={11} />
                              {plan.sellerName || "Local Kitchen"}
                            </span>
                          </div>

                          {/* Plan Title & Description */}
                          <h3 className={styles.planTitle}>{plan.name}</h3>
                          <p className={styles.planDescription}>
                            {plan.description ||
                              "Wholesome home-style nutritious cooking with fresh seasonal ingredients and daily variety."}
                          </p>

                          {/* Pricing Block */}
                          <div className={styles.pricingBlock}>
                            <div>
                              <div className={styles.priceMain}>
                                <span className={styles.currencySymbol}>₹</span>
                                <span className={styles.priceAmount}>{price.toLocaleString("en-IN")}</span>
                                <span className={styles.priceCycle}>{getCycleLabel(billingCycle)}</span>
                              </div>
                            </div>
                            <div className={styles.pricePerMeal}>
                              <span className={styles.perMealTag}>≈ ₹{perMeal} / meal</span>
                              <div className={styles.perMealSub}>Zero Delivery Fee</div>
                            </div>
                          </div>

                          {/* Meal Timings Section */}
                          {plan.mealTimings && plan.mealTimings.length > 0 && (
                            <div className={styles.timingsSection}>
                              <div className={styles.timingsTitle}>
                                <Clock size={11} />
                                <span>Daily Serving Schedule</span>
                              </div>
                              <div className={styles.timingsGrid}>
                                {plan.mealTimings.map((timing, tIdx) => (
                                  <span key={tIdx} className={styles.timingPill}>
                                    {timing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Features List */}
                          <div className={styles.featuresSection}>
                            <div className={styles.featuresTitle}>Included In This Plan:</div>
                            <ul className={styles.featuresList}>
                              {plan.features && plan.features.length > 0 ? (
                                plan.features.map((feature, fIdx) => (
                                  <li key={fIdx} className={styles.featureItem}>
                                    <CheckCircle2 size={14} className={styles.featureIcon} />
                                    <span>{feature}</span>
                                  </li>
                                ))
                              ) : (
                                <>
                                  <li className={styles.featureItem}>
                                    <CheckCircle2 size={14} className={styles.featureIcon} />
                                    <span>Daily Freshly Cooked Home Meals</span>
                                  </li>
                                  <li className={styles.featureItem}>
                                    <CheckCircle2 size={14} className={styles.featureIcon} />
                                    <span>1 Dal + 1 Seasonal Sabzi + Chapatis + Rice</span>
                                  </li>
                                </>
                              )}
                              <li className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.featureIcon} />
                                <span>100% Free Doorstep Delivery</span>
                              </li>
                            </ul>
                          </div>

                          {/* Policy Row */}
                          <div className={styles.policyRow}>
                            <span className={styles.policyItem}>
                              <PauseCircle size={12} color="#FF5500" />
                              <span>Pause: {plan.pauseBillingPeriod || "30 Days"}</span>
                            </span>
                            <span className={styles.policyItem}>
                              <ShieldCheck size={12} color="#059669" />
                              <span>Cancel Anytime</span>
                            </span>
                          </div>

                          {/* Subscribe CTA Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSubscribeModal(plan)}
                            className={styles.subscribeBtn}
                          >
                            <span>Subscribe to {plan.name}</span>
                            <ArrowRight size={15} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Change Plan Modal */}
      {subscription && isChangingPlan && (
        <ChangePlanModal
          isOpen={isChangingPlan}
          onClose={() => setIsChangingPlan(false)}
          subscriptionId={subscription.id}
          sellerId={subscription.sellerId}
          sellerName={subscription.seller?.businessName}
          currentPlanId={subscription.planId}
          onPlanChanged={handlePlanChanged}
        />
      )}

      {/* Cancel Subscription Modal */}
      {subscription && isCancelling && (
        <CancelSubscriptionModal
          isOpen={isCancelling}
          onClose={() => setIsCancelling(false)}
          subscriptionId={subscription.id}
          planName={subscription.plan?.name || "Daily Meal Plan"}
          onCancelled={handleSubscriptionCancelled}
        />
      )}

      {/* Subscribe Confirmation Modal */}
      {selectedPlanForSub && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedPlanForSub(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>
                  Confirm Meal Subscription
                </h2>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B" }}>
                  Subscribing to <strong>{selectedPlanForSub.sellerName || "Kitchen Partner"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForSub(null)}
                className={styles.modalCloseBtn}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Summary */}
              <div className={styles.modalPlanSummary}>
                <div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#FF5500",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedPlanForSub.tier} Tier Plan
                  </span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                    {selectedPlanForSub.name}
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FF5500" }}>
                    ₹{getCyclePrice(selectedPlanForSub, billingCycle).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                    {billingCycle.toUpperCase()} CYCLE
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <MapPin size={13} color="#FF5500" />
                  <span>Delivery Address / Room Number *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204, Dattawadi near PMC School, Pune"
                  value={deliveryAddressInput}
                  onChange={(e) => setDeliveryAddressInput(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              {/* Contact Phone */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Phone size={13} color="#FF5500" />
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={contactPhoneInput}
                  onChange={(e) => setContactPhoneInput(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              {/* Start Date Preference */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Calendar size={13} color="#FF5500" />
                  <span>Subscription Start Date</span>
                </label>
                <select
                  value={startDatePreference}
                  onChange={(e) => setStartDatePreference(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="Tomorrow">Starts Tomorrow (Next Delivery Slot)</option>
                  <option value="Monday">Starts Coming Monday</option>
                  <option value="1st">Starts 1st of Next Month</option>
                </select>
              </div>

              {/* Breakdown */}
              <div className={styles.priceBreakdown}>
                <div className={styles.breakdownRow}>
                  <span>Base Plan ({billingCycle})</span>
                  <span>₹{getCyclePrice(selectedPlanForSub, billingCycle).toLocaleString("en-IN")}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Doorstep Delivery (All Meals)</span>
                  <span style={{ color: "#059669", fontWeight: 700 }}>FREE</span>
                </div>
                <div className={styles.breakdownTotal}>
                  <span>Total Amount Due</span>
                  <span>₹{getCyclePrice(selectedPlanForSub, billingCycle).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {subErrorMsg && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {subErrorMsg}
                </div>
              )}

              {subSuccessMsg && (
                <div
                  style={{
                    backgroundColor: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    color: "#065F46",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{subSuccessMsg} Activating subscription...</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setSelectedPlanForSub(null)}
                className={styles.modalCancelBtn}
                disabled={isSubmittingSub}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscription}
                className={styles.modalConfirmBtn}
                disabled={isSubmittingSub}
              >
                {isSubmittingSub ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Subscribe</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function MySubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFF4E6",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2 size={36} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>
              Loading Meal Subscriptions...
            </div>
          </div>
        </div>
      }
    >
      <MySubscriptionContent />
    </Suspense>
  );
}
