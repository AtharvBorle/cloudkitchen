"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import {
  fetchUserMealSubscriptions,
  togglePauseUserSubscription,
  UserActiveMealSubscription,
} from "@/lib/meal-subscriptions";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import styles from "./MySubscriptionPage.module.css";

const DEFAULT_DEMO_SUBSCRIPTION: UserActiveMealSubscription = {
  id: "sub-demo-01",
  userId: "user-demo",
  sellerId: "seller-gourmet-01",
  planId: "plan-bronze-01",
  status: "ACTIVE",
  tier: "Bronze",
  cycle: "WEEKLY",
  pricePaid: 499,
  isPaused: false,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  deliveryAddress: "Tower A, Flat 402, Green Glen Layout",
  contactPhone: "+91 98765 43210",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  plan: {
    id: "plan-bronze-01",
    name: "Standard Meal Plan",
    tier: "Bronze",
    description: "Daily fresh home-cooked essential meals.",
    weeklyPrice: 499,
    monthlyPrice: 1899,
    quarterlyPrice: 5299,
    yearlyPrice: 19999,
    duration: "1 Week",
    features: [
      "3-5 home-cooked meals per week",
      "Curated Lunch delivery",
      "Pause or switch plans anytime",
      "Eco-friendly sanitized packaging",
    ],
    mealTimings: ["Lunch Delivery (1:00 PM – 2:30 PM)"],
    status: "Live",
    allowCancel: true, // Dynamic toggle controlled by seller
    pauseBillingPeriod: "30 Days",
  },
  seller: {
    id: "seller-gourmet-01",
    businessName: "Gourmet Spice Cloud Kitchen",
    trackingId: "CK-GOURMET-101",
    addressLocality: "Indiranagar, Bangalore",
    foodType: "BOTH",
  },
};

export default function MySubscriptionPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<UserActiveMealSubscription>(DEFAULT_DEMO_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChangingPlan, setIsChangingPlan] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUserSubs() {
      try {
        setIsLoading(true);
        const subs = await fetchUserMealSubscriptions();
        if (isMounted && subs.length > 0) {
          // Prefer active or most recent subscription
          const active = subs.find((s) => s.status === "ACTIVE") || subs[0];
          setSubscription(active);
        }
      } catch (err) {
        console.error("Error loading user subscriptions:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUserSubs();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleTogglePause = async (nextPaused: boolean) => {
    try {
      if (subscription.id && !subscription.id.startsWith("sub-demo")) {
        await togglePauseUserSubscription(subscription.id, nextPaused);
      }
      setSubscription((prev) => ({
        ...prev,
        isPaused: nextPaused,
        status: nextPaused ? "PAUSED" : "ACTIVE",
      }));
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
    if (updatedData.plan) {
      setSubscription((prev) => ({
        ...prev,
        planId: updatedData.planId || updatedData.plan.id,
        tier: updatedData.tier || updatedData.plan.tier,
        status: updatedData.status || "ACTIVE",
        pricePaid: updatedData.pricePaid || updatedData.plan.weeklyPrice,
        plan: {
          ...prev.plan,
          ...updatedData.plan,
        },
      }));
    } else {
      // Direct plan payload fallback
      setSubscription((prev) => ({
        ...prev,
        planId: updatedData.id,
        tier: updatedData.tier || "Bronze",
        status: "ACTIVE",
        plan: {
          ...prev.plan,
          id: updatedData.id,
          name: updatedData.name,
          tier: updatedData.tier,
          weeklyPrice: typeof updatedData.weeklyPrice === "number" ? updatedData.weeklyPrice : parseFloat(String(updatedData.weeklyPrice).replace(/[^\d.]/g, "")) || 499,
          features: updatedData.features || prev.plan.features,
          mealTimings: updatedData.mealTimings || prev.plan.mealTimings,
          allowCancel: updatedData.allowCancel ?? true,
        },
      }));
    }

    showToast(
      "success",
      `Meal plan successfully changed to ${updatedData.name || updatedData.tier || "new tier"}!`
    );
  };

  const handleSubscriptionCancelled = () => {
    setSubscription((prev) => ({
      ...prev,
      status: "CANCELLED",
      isPaused: false,
    }));
    showToast("info", "Your meal subscription has been cancelled.");
  };

  // Build custom delivery slots if defined in meal plan
  const customSlots: DeliverySlot[] =
    subscription.plan?.mealTimings && subscription.plan.mealTimings.length > 0
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
    subscription.plan?.features && subscription.plan.features.length > 0
      ? subscription.plan.features
      : undefined;

  const formattedStartedOn = subscription.startDate
    ? new Date(subscription.startDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "05 Jan, 2026";

  const formattedRenewalDate = subscription.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Auto-renew (Weekly)";

  const formattedPrice = `₹${(subscription.pricePaid || subscription.plan.weeklyPrice || 499).toLocaleString("en-IN")}/${
    subscription.cycle === "MONTHLY" ? "month" : "week"
  }`;

  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Shared Profile Sidebar (hidden on mobile <=992px) */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="my-subscriptions" />
          </div>

          {/* Right Column: My Subscriptions Content Sections */}
          <div className={styles.contentWrapper}>
            {/* 1. Page Header with mobile hamburger */}
            <SubscriptionHeader />

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

            {/* 2. Daily Meal Plan Card */}
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

            {/* 3. Pause Subscription Section */}
            <PauseSubscription
              isPaused={subscription.isPaused}
              disabled={subscription.status?.toUpperCase() === "CANCELLED"}
              onTogglePause={handleTogglePause}
            />

            {/* 4. Two-column grid: Daily Delivery Times & Subscription Benefits */}
            <div className={styles.detailsGrid}>
              <DeliveryTimes slots={customSlots} />
              <SubscriptionBenefits benefits={customBenefits} />
            </div>

            {/* 5. Action Buttons: Cancel Subscription & Change Plan */}
            {/* Dynamic cancellation button: Only rendered when seller enabled allowCancel on this plan */}
            <SubscriptionActions
              allowCancel={subscription.plan?.allowCancel ?? true}
              status={subscription.status}
              onCancelSubscription={() => setIsCancelling(true)}
              onChangePlan={() => setIsChangingPlan(true)}
            />
          </div>
        </div>
      </main>

      {/* 6. Change Plan Modal (Shows all other plans of this specific seller) */}
      <ChangePlanModal
        isOpen={isChangingPlan}
        onClose={() => setIsChangingPlan(false)}
        subscriptionId={subscription.id}
        sellerId={subscription.sellerId || subscription.seller?.id}
        sellerName={subscription.seller?.businessName}
        currentPlanId={subscription.planId || subscription.plan?.id}
        onPlanChanged={handlePlanChanged}
      />

      {/* 7. Cancel Subscription Confirmation Modal */}
      <CancelSubscriptionModal
        isOpen={isCancelling}
        onClose={() => setIsCancelling(false)}
        subscriptionId={subscription.id}
        planName={subscription.plan?.name}
        sellerName={subscription.seller?.businessName}
        onCancelled={handleSubscriptionCancelled}
      />

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}
