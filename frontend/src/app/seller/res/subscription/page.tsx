"use client";

import React, { useState, useEffect } from "react";
import ResponsiveSellerSubscription from "@/components/seller/subscription/responsive/ResponsiveSellerSubscription";
import { fetchApi } from "@/lib/fetch-api";

import { useSellerProfile } from "@/hooks/useSellerProfile";

export default function ResponsiveSellerSubscriptionPage() {
  const seller = useSellerProfile();
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const plansRes = await fetchApi("/api/seller/subscription/plans");

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const plansList = plansData.data || plansData;
          if (Array.isArray(plansList) && plansList.length > 0) {
            const mapped = plansList.map((p: any, idx: number) => {
              const tiers = ["Starter", "Professional", "Enterprise"] as const;
              const variants = ["orange", "purple", "indigo", "blue"] as const;
              return {
                id: p.id,
                title: p.name || "Subscription Plan",
                tier: tiers[idx % 3],
                tierVariant: variants[idx % 4],
                price: `₹${p.price || 998}`,
                subscribersCount: (idx + 1) * 28 + 12,
                status: "Active" as const,
                createdAt: "Active 2024",
                billingCycle: p.durationMonths === 1 ? ("Monthly" as const) : ("Quarterly" as const),
                mealsPerDay: 2,
                mealTypes: ["Lunch", "Dinner"],
                description: Array.isArray(p.features) ? p.features.join(". ") : "Full access to platform perks.",
              };
            });
            setPlans(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load subscription plans:", err);
      }
    }
    loadData();
  }, []);

  return (
    <ResponsiveSellerSubscription
      ownerName={seller.ownerName}
      plans={plans.length > 0 ? plans : undefined}
    />
  );
}

