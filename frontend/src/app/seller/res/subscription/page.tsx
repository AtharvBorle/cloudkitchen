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
      const tierLower = (p.tier || "").trim().toLowerCase();
      const tierVariant: "blue" | "indigo" | "orange" | "purple" =
        tierLower === "gold" || tierLower === "enterprise"
          ? "purple"
          : tierLower === "silver" || tierLower === "professional"
          ? "blue"
          : "orange";

      const statusLower = (p.status || "").trim().toLowerCase();
      const status: "Draft" | "Paused" | "Active" =
        statusLower === "live" || statusLower === "active"
          ? "Active"
          : statusLower === "paused"
          ? "Paused"
          : "Draft";

      const tierFormatted =
        tierLower === "gold" || tierLower === "enterprise"
          ? "Gold"
          : tierLower === "silver" || tierLower === "professional"
          ? "Silver"
          : "Bronze";

      const rawPrice = p.weeklyPrice || p.monthlyPrice || "₹0";
      const formattedPrice = String(rawPrice).startsWith("₹") ? rawPrice : `₹${rawPrice}`;

      const formattedDate = p.deployedDate
        ? p.deployedDate
        : p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        : "Recently";

      return {
        id: p.id,
        title: p.name || p.title || "Meal Plan",
        tier: tierFormatted,
        tierVariant,
        price: formattedPrice,
        subscribersCount: p.subscribersCount || 0,
        status,
        createdAt: formattedDate,
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


