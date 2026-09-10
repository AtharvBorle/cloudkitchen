"use client";

import React, { useState, useEffect } from "react";
import ResponsiveSellerSubscription from "@/components/seller/subscription/responsive/ResponsiveSellerSubscription";
import { fetchApi } from "@/lib/fetch-api";

export default function ResponsiveSellerSubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [ownerName, setOwnerName] = useState("Rahul Sharma");

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, plansRes] = await Promise.all([
          fetchApi("/api/seller/profile"),
          fetchApi("/api/seller/subscription/plans"),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const sellerObj = profileData.data?.seller || profileData.seller;
          if (sellerObj?.user?.name) {
            setOwnerName(sellerObj.user.name);
          }
        }

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
      ownerName={ownerName}
      plans={plans.length > 0 ? plans : undefined}
    />
  );
}

