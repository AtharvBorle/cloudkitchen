"use client";

import React, { useState, useEffect } from "react";
import ResponsiveSellerSubscription, { ResponsiveSubscriptionPlan } from "@/components/seller/subscription/responsive/ResponsiveSellerSubscription";
import { fetchStoredMealPlans, getStoredMealPlans, getStoredMealSubscribers } from "@/lib/meal-subscriptions";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export default function ResponsiveSellerSubscriptionPage() {
  const seller = useSellerProfile();
  const [plans, setPlans] = useState<ResponsiveSubscriptionPlan[]>([]);

  const mapPlans = (stored: any[], subs: any[] = []): ResponsiveSubscriptionPlan[] => {
    const now = new Date();
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

      const activeUserKeys = new Set<string>();
      subs.forEach((s) => {
        const statusUpper = String(s.status || "").toUpperCase();
        const isActive = (statusUpper === "ACTIVE" || statusUpper === "LIVE") && !s.isPaused && (!s.endDate || new Date(s.endDate) >= now);
        if (!isActive) return;
        const matchId = (s.planId && (s.planId === p.id || s.planId === p.planId));
        const matchName = (s.planName && p.name && s.planName.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
                          (s.planName && p.title && s.planName.trim().toLowerCase() === p.title.trim().toLowerCase());
        if (matchId || matchName) {
          const key = s.userId || s.customerEmail || s.customerPhone || s.customerName || s.name || s.id;
          if (key) activeUserKeys.add(String(key).toLowerCase().trim());
        }
      });
      const effectiveSubscribersCount = activeUserKeys.size > 0 ? Math.max(activeUserKeys.size, p.subscribersCount || 0) : (p.subscribersCount || 0);

      return {
        id: p.id,
        title: p.name || p.title || "Meal Plan",
        tier: tierFormatted,
        tierVariant,
        price: formattedPrice,
        subscribersCount: effectiveSubscribersCount,
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
    const cachedSubs = getStoredMealSubscribers();
    if (cached.length > 0) {
      setPlans(mapPlans(cached, cachedSubs));
    }

    try {
      const data = await fetchStoredMealPlans();
      if (data?.plans) {
        setPlans(mapPlans(data.plans, data.subscribers || []));
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


