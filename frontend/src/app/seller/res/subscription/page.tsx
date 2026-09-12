"use client";

import React, { useState, useEffect } from "react";
import ResponsiveSellerSubscription, { ResponsiveSubscriptionPlan } from "@/components/seller/subscription/responsive/ResponsiveSellerSubscription";
import { getStoredMealPlans } from "@/lib/meal-subscriptions";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export default function ResponsiveSellerSubscriptionPage() {
  const seller = useSellerProfile();
  const [plans, setPlans] = useState<ResponsiveSubscriptionPlan[]>([]);

  const refreshPlans = () => {
    const stored = getStoredMealPlans();
    const mapped: ResponsiveSubscriptionPlan[] = stored.map((p) => {
      const tierLower = (p.tier || "").toLowerCase();
      const tierVariant = tierLower === "gold" ? "purple" : tierLower === "silver" ? "blue" : "orange";
      return {
        id: p.id,
        title: p.name,
        tier: p.tier,
        tierVariant,
        price: p.weeklyPrice || p.monthlyPrice,
        subscribersCount: p.subscribersCount || 0,
        status: p.status === "Live" ? "Active" : p.status === "Paused" ? "Paused" : "Draft",
        createdAt: p.deployedDate,
        billingCycle: p.duration?.toLowerCase().includes("month") ? "Monthly" : "Weekly",
        mealsPerDay: p.mealTimings && p.mealTimings.length > 0 ? p.mealTimings.length : 1,
        mealTypes: p.mealTimings && p.mealTimings.length > 0 ? p.mealTimings.map((m) => m.split(":")[0].trim()) : ["Lunch"],
        description: p.features && p.features.length > 0 ? p.features.join(". ") : "Fresh chef-prepared daily meal subscription.",
      };
    });
    setPlans(mapped);
  };

  useEffect(() => {
    refreshPlans();
    window.addEventListener("meal-plans-updated", refreshPlans);
    return () => {
      window.removeEventListener("meal-plans-updated", refreshPlans);
    };
  }, []);

  return (
    <ResponsiveSellerSubscription
      ownerName={seller.ownerName}
      plans={plans}
    />
  );
}


