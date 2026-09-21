"use client";

import React, { useState, useEffect } from "react";
import ResponsiveSellerSubscription, { ResponsiveSubscriptionPlan } from "@/components/seller/subscription/responsive/ResponsiveSellerSubscription";
import { fetchStoredMealPlans, getStoredMealPlans } from "@/lib/meal-subscriptions";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export default function ResponsiveSellerSubscriptionPage() {
  const seller = useSellerProfile();
  const [plans, setPlans] = useState<ResponsiveSubscriptionPlan[]>([]);

  const mapPlans = (stored: any[]): ResponsiveSubscriptionPlan[] => {
    return stored.map((p) => {
      const tierLower = (p.tier || "").toLowerCase();
      const tierVariant: "blue" | "indigo" | "orange" | "purple" = tierLower === "gold" ? "purple" : tierLower === "silver" ? "blue" : "orange";
      const status: "Draft" | "Paused" | "Active" = p.status === "Live" ? "Active" : p.status === "Paused" ? "Paused" : "Draft";
      return {
        id: p.id,
        title: p.name,
        tier: p.tier,
        tierVariant,
        price: p.weeklyPrice || p.monthlyPrice,
        subscribersCount: p.subscribersCount || 0,
        status,
        createdAt: p.deployedDate,
        billingCycle: p.duration?.toLowerCase().includes("month") ? "Monthly" : "Weekly",
        mealsPerDay: p.mealTimings && p.mealTimings.length > 0 ? p.mealTimings.length : 1,
        mealTypes: p.mealTimings && p.mealTimings.length > 0 ? p.mealTimings.map((m: string) => m.split(":")[0].trim()) : ["Lunch"],
        description: p.features && p.features.length > 0 ? p.features.join(". ") : "Fresh chef-prepared daily meal subscription.",
      };
    });
  };

  const refreshPlans = async () => {
    const cached = getStoredMealPlans();
    if (cached.length > 0) {
      setPlans(mapPlans(cached));
    }

    try {
      const data = await fetchStoredMealPlans();
      if (data?.plans) {
        setPlans(mapPlans(data.plans));
      }
    } catch (e) {
      console.error("Failed to load meal plans on mobile:", e);
    }
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


