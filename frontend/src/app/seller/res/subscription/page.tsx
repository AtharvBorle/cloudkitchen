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
          fetchApi<{ seller: any }>("/api/seller/profile"),
          fetchApi<any[]>("/api/seller/subscription/plans"),
        ]);

        if (profileRes.data?.seller?.user?.name) {
          setOwnerName(profileRes.data.seller.user.name);
        }

        if (plansRes.data && plansRes.data.length > 0) {
          const mapped = plansRes.data.map((p: any, idx: number) => {
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

