"use client";

export interface MealSubscriptionPlan {
  id: string;
  planId: string;
  name: string;
  tier: "Bronze" | "Silver" | "Gold" | string;
  tierColor: string;
  tierBg: string;
  weeklyPrice: string;
  monthlyPrice: string;
  quarterlyPrice: string;
  yearlyPrice: string;
  duration: string;
  features: string[];
  mealTimings: string[];
  subscribersCount: number;
  monthlyRevenue: string;
  status: "Live" | "Draft" | "Paused";
  deployedDate: string;
  allowCancel?: boolean;
  pauseBillingPeriod?: string;
}

export interface MealSubscriber {
  id: string;
  name: string;
  roomNo: string;
  planName: string;
  startDate: string;
  renewalDate: string;
  amount: string;
  status: "Active" | "Expiring Soon" | "Paused";
}

const STORAGE_KEY_PLANS = "neo_seller_meal_plans";
const STORAGE_KEY_SUBSCRIBERS = "neo_seller_meal_subscribers";

export function getTierColors(tier: string) {
  const t = (tier || "").toLowerCase();
  if (t === "bronze") {
    return { tierColor: "#B45309", tierBg: "#FEF3C7" };
  }
  if (t === "silver") {
    return { tierColor: "#475569", tierBg: "#F1F5F9" };
  }
  if (t === "gold") {
    return { tierColor: "#A16207", tierBg: "#FEF9C3" };
  }
  return { tierColor: "#B45309", tierBg: "#FEF3C7" };
}

export function getStoredMealPlans(): MealSubscriptionPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error reading meal plans from storage:", e);
    return [];
  }
}

export function saveMealPlan(
  planData: Omit<MealSubscriptionPlan, "id" | "planId" | "deployedDate" | "tierColor" | "tierBg" | "monthlyRevenue" | "subscribersCount"> & {
    id?: string;
    planId?: string;
    deployedDate?: string;
  }
): MealSubscriptionPlan {
  const existing = getStoredMealPlans();
  const id = planData.id || `plan-${Date.now()}`;
  const planId = planData.planId || `PLN-${Math.floor(1000 + Math.random() * 9000)}`;
  const deployedDate =
    planData.deployedDate ||
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

  const colors = getTierColors(planData.tier);

  const priceNum = parseFloat(planData.weeklyPrice.replace(/[^\d.]/g, "")) || 0;
  const monthlyPrice = planData.monthlyPrice || `₹${(priceNum * 4).toFixed(0)}`;
  const quarterlyPrice = planData.quarterlyPrice || `₹${(priceNum * 12 * 0.9).toFixed(0)}`;
  const yearlyPrice = planData.yearlyPrice || `₹${(priceNum * 52 * 0.8).toFixed(0)}`;

  const newPlan: MealSubscriptionPlan = {
    id,
    planId,
    name: planData.name,
    tier: planData.tier,
    tierColor: colors.tierColor,
    tierBg: colors.tierBg,
    weeklyPrice: planData.weeklyPrice.startsWith("₹") ? planData.weeklyPrice : `₹${planData.weeklyPrice}`,
    monthlyPrice: monthlyPrice.startsWith("₹") ? monthlyPrice : `₹${monthlyPrice}`,
    quarterlyPrice: quarterlyPrice.startsWith("₹") ? quarterlyPrice : `₹${quarterlyPrice}`,
    yearlyPrice: yearlyPrice.startsWith("₹") ? yearlyPrice : `₹${yearlyPrice}`,
    duration: planData.duration || "1 Week",
    features: planData.features || [],
    mealTimings: planData.mealTimings || [],
    subscribersCount: 0,
    monthlyRevenue: "₹0",
    status: planData.status || "Live",
    deployedDate,
    allowCancel: planData.allowCancel ?? true,
    pauseBillingPeriod: planData.pauseBillingPeriod || "Monthly",
  };

  const updated = [newPlan, ...existing.filter((p) => p.id !== id)];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(updated));
      window.dispatchEvent(new Event("meal-plans-updated"));
    } catch (e) {
      console.error("Failed to save meal plan to storage:", e);
    }
  }

  return newPlan;
}

export function updateMealPlan(id: string, updates: Partial<MealSubscriptionPlan>): MealSubscriptionPlan | null {
  const existing = getStoredMealPlans();
  const targetIndex = existing.findIndex((p) => p.id === id || p.planId === id);
  if (targetIndex === -1) return null;

  const current = existing[targetIndex];
  const colors = updates.tier ? getTierColors(updates.tier) : { tierColor: current.tierColor, tierBg: current.tierBg };

  const updated: MealSubscriptionPlan = {
    ...current,
    ...updates,
    tierColor: colors.tierColor,
    tierBg: colors.tierBg,
  };

  existing[targetIndex] = updated;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(existing));
      window.dispatchEvent(new Event("meal-plans-updated"));
    } catch (e) {
      console.error("Failed to update meal plan:", e);
    }
  }

  return updated;
}

export function deleteMealPlan(id: string): boolean {
  const existing = getStoredMealPlans();
  const filtered = existing.filter((p) => p.id !== id && p.planId !== id);
  if (filtered.length === existing.length) return false;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(filtered));
      window.dispatchEvent(new Event("meal-plans-updated"));
    } catch (e) {
      console.error("Failed to delete meal plan:", e);
    }
  }

  return true;
}

export function getStoredMealSubscribers(): MealSubscriber[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error reading subscribers from storage:", e);
    return [];
  }
}
