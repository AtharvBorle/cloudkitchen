"use client";

import { fetchApi } from "./fetch-api";

export interface MealSubscriptionPlan {
  id: string;
  planId: string;
  name: string;
  tier: "Bronze" | "Silver" | "Gold" | string;
  tierColor: string;
  tierBg: string;
  weeklyPrice: string;
  rawWeeklyPrice?: number;
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
  name?: string;
  customerName?: string;
  roomNo?: string;
  planId?: string;
  planName: string;
  tier?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  startDate: string;
  renewalDate?: string;
  endDate?: string | null;
  amount?: string;
  pricePaid?: number;
  cycle?: string;
  status: "Active" | "Expiring Soon" | "Paused" | string;
  isPaused?: boolean;
}

export interface MealPlanMetrics {
  activeSubscribers: number;
  monthlyRecurringRevenue: string;
  rawMRR: number;
  activePlansCount: number;
  fulfillmentRate: string;
}

const STORAGE_KEY_PLANS = "neo_seller_meal_plans";
const STORAGE_KEY_SUBSCRIBERS = "neo_seller_meal_subscribers";
const STORAGE_KEY_METRICS = "neo_seller_meal_metrics";

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

export function formatMealPlan(rawPlan: any): MealSubscriptionPlan {
  const colors = getTierColors(rawPlan.tier || "Bronze");
  const weeklyNum = typeof rawPlan.weeklyPrice === "number"
    ? rawPlan.weeklyPrice
    : parseFloat(String(rawPlan.weeklyPrice || "0").replace(/[^\d.]/g, "")) || 0;

  const weeklyStr = typeof rawPlan.weeklyPrice === "string" && rawPlan.weeklyPrice.startsWith("₹")
    ? rawPlan.weeklyPrice
    : `₹${weeklyNum.toFixed(0)}`;

  const monthlyStr = rawPlan.monthlyPrice
    ? (String(rawPlan.monthlyPrice).startsWith("₹") ? rawPlan.monthlyPrice : `₹${rawPlan.monthlyPrice}`)
    : `₹${(weeklyNum * 4).toFixed(0)}`;

  const quarterlyStr = rawPlan.quarterlyPrice
    ? (String(rawPlan.quarterlyPrice).startsWith("₹") ? rawPlan.quarterlyPrice : `₹${rawPlan.quarterlyPrice}`)
    : `₹${(weeklyNum * 12 * 0.9).toFixed(0)}`;

  const yearlyStr = rawPlan.yearlyPrice
    ? (String(rawPlan.yearlyPrice).startsWith("₹") ? rawPlan.yearlyPrice : `₹${rawPlan.yearlyPrice}`)
    : `₹${(weeklyNum * 52 * 0.8).toFixed(0)}`;

  let features = rawPlan.features || [];
  if (typeof features === "string") {
    try {
      features = JSON.parse(features);
    } catch {
      features = [];
    }
  }

  let mealTimings = rawPlan.mealTimings || [];
  if (typeof mealTimings === "string") {
    try {
      mealTimings = JSON.parse(mealTimings);
    } catch {
      mealTimings = [];
    }
  }

  const deployedDate = rawPlan.createdAt
    ? new Date(rawPlan.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : rawPlan.deployedDate || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const subscribersCount = rawPlan.subscribersCount || 0;
  const monthlyRevenue = `₹${(weeklyNum * 4 * subscribersCount).toLocaleString("en-IN")}`;

  return {
    id: rawPlan.id || `plan-${Date.now()}`,
    planId: rawPlan.planId || `PLN-${(rawPlan.id || "").substring(0, 4).toUpperCase() || "NEW"}`,
    name: rawPlan.name || "Meal Plan",
    tier: rawPlan.tier || "Bronze",
    tierColor: colors.tierColor,
    tierBg: colors.tierBg,
    weeklyPrice: weeklyStr,
    rawWeeklyPrice: weeklyNum,
    monthlyPrice: monthlyStr,
    quarterlyPrice: quarterlyStr,
    yearlyPrice: yearlyStr,
    duration: rawPlan.duration || "1 Week",
    features: Array.isArray(features) ? features : [],
    mealTimings: Array.isArray(mealTimings) ? mealTimings : [],
    subscribersCount,
    monthlyRevenue,
    status: rawPlan.status || "Live",
    deployedDate,
    allowCancel: rawPlan.allowCancel ?? true,
    pauseBillingPeriod: rawPlan.pauseBillingPeriod || "Monthly",
  };
}

/**
 * Loads meal plans from the PostgreSQL Database backend via API, updates local cache.
 */
export async function fetchStoredMealPlans(): Promise<{
  plans: MealSubscriptionPlan[];
  subscribers: MealSubscriber[];
  metrics: MealPlanMetrics;
}> {
  try {
    const res = await fetchApi("/api/seller/meal-plans");
    if (res.ok) {
      const json = await res.json();
      const payload = json.data || json;
      const rawPlans = Array.isArray(payload.plans) ? payload.plans : Array.isArray(payload) ? payload : [];
      const mappedPlans: MealSubscriptionPlan[] = rawPlans.map(formatMealPlan);
      const rawSubscribers = Array.isArray(payload.subscribers) ? payload.subscribers : [];
      const mappedSubscribers: MealSubscriber[] = rawSubscribers.map((s: any) => ({
        id: s.id,
        name: s.customerName || s.name || "Customer",
        customerName: s.customerName || s.name || "Customer",
        roomNo: s.deliveryAddress || "Delivery",
        planId: s.planId,
        planName: s.planName || "Meal Plan",
        tier: s.tier || "Bronze",
        customerPhone: s.customerPhone || "",
        customerEmail: s.customerEmail || "",
        deliveryAddress: s.deliveryAddress || "",
        startDate: s.startDate ? new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Today",
        renewalDate: s.endDate ? new Date(s.endDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Auto-renew",
        endDate: s.endDate,
        amount: s.pricePaid ? `₹${s.pricePaid.toFixed(0)}` : "₹0",
        pricePaid: s.pricePaid || 0,
        cycle: s.cycle || "Weekly",
        status: s.isPaused ? "Paused" : s.status === "ACTIVE" ? "Active" : s.status || "Active",
        isPaused: s.isPaused,
      }));

      const metrics: MealPlanMetrics = payload.metrics || {
        activeSubscribers: mappedSubscribers.filter((s) => s.status === "Active").length,
        monthlyRecurringRevenue: "₹0",
        rawMRR: 0,
        activePlansCount: mappedPlans.filter((p) => p.status === "Live").length,
        fulfillmentRate: "99.2%",
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(mappedPlans));
          localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(mappedSubscribers));
          localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(metrics));
        } catch {}
      }

      return { plans: mappedPlans, subscribers: mappedSubscribers, metrics };
    }
  } catch (err) {
    console.error("Failed to fetch meal plans from backend API:", err);
  }

  // Fallback to local cache
  const cachedPlans = getStoredMealPlans();
  const cachedSubscribers = getStoredMealSubscribers();
  const metrics: MealPlanMetrics = {
    activeSubscribers: cachedSubscribers.filter((s) => s.status === "Active").length,
    monthlyRecurringRevenue: "₹0",
    rawMRR: 0,
    activePlansCount: cachedPlans.filter((p) => p.status === "Live").length,
    fulfillmentRate: "99.2%",
  };

  return { plans: cachedPlans, subscribers: cachedSubscribers, metrics };
}

export function getStoredMealPlans(): MealSubscriptionPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(formatMealPlan) : [];
  } catch (e) {
    console.error("Error reading meal plans from storage:", e);
    return [];
  }
}

export async function saveMealPlan(
  planData: Omit<MealSubscriptionPlan, "id" | "planId" | "deployedDate" | "tierColor" | "tierBg" | "monthlyRevenue" | "subscribersCount"> & {
    id?: string;
    planId?: string;
    deployedDate?: string;
  }
): Promise<MealSubscriptionPlan> {
  const existing = getStoredMealPlans();
  const priceNum = parseFloat(String(planData.weeklyPrice).replace(/[^\d.]/g, "")) || 0;

  let createdPlan: MealSubscriptionPlan;

  try {
    const res = await fetchApi("/api/seller/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: planData.name,
        tier: planData.tier || "Bronze",
        description: "",
        weeklyPrice: priceNum,
        monthlyPrice: planData.monthlyPrice ? parseFloat(String(planData.monthlyPrice).replace(/[^\d.]/g, "")) : priceNum * 4,
        quarterlyPrice: planData.quarterlyPrice ? parseFloat(String(planData.quarterlyPrice).replace(/[^\d.]/g, "")) : priceNum * 12 * 0.9,
        yearlyPrice: planData.yearlyPrice ? parseFloat(String(planData.yearlyPrice).replace(/[^\d.]/g, "")) : priceNum * 52 * 0.8,
        duration: planData.duration || "1 Week",
        features: planData.features || [],
        mealTimings: planData.mealTimings || [],
        status: planData.status || "Live",
        allowCancel: planData.allowCancel ?? true,
        pauseBillingPeriod: planData.pauseBillingPeriod || "Monthly",
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const serverPlan = json.data || json;
      createdPlan = formatMealPlan(serverPlan);
    } else {
      createdPlan = formatMealPlan({ ...planData, id: `plan-${Date.now()}` });
    }
  } catch (err) {
    console.error("Error saving meal plan to backend DB:", err);
    createdPlan = formatMealPlan({ ...planData, id: `plan-${Date.now()}` });
  }

  const updated = [createdPlan, ...existing.filter((p) => p.id !== createdPlan.id)];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(updated));
      window.dispatchEvent(new Event("meal-plans-updated"));
    } catch (e) {
      console.error("Failed to save meal plan to storage:", e);
    }
  }

  return createdPlan;
}

export async function updateMealPlan(id: string, updates: Partial<MealSubscriptionPlan>): Promise<MealSubscriptionPlan | null> {
  const existing = getStoredMealPlans();
  const targetIndex = existing.findIndex((p) => p.id === id || p.planId === id);
  if (targetIndex === -1 && existing.length === 0) return null;

  const current = targetIndex !== -1 ? existing[targetIndex] : null;

  try {
    const payload: any = { id };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.tier !== undefined) payload.tier = updates.tier;
    if (updates.weeklyPrice !== undefined) {
      payload.weeklyPrice = parseFloat(String(updates.weeklyPrice).replace(/[^\d.]/g, ""));
    }
    if (updates.monthlyPrice !== undefined) {
      payload.monthlyPrice = parseFloat(String(updates.monthlyPrice).replace(/[^\d.]/g, ""));
    }
    if (updates.duration !== undefined) payload.duration = updates.duration;
    if (updates.features !== undefined) payload.features = updates.features;
    if (updates.mealTimings !== undefined) payload.mealTimings = updates.mealTimings;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.allowCancel !== undefined) payload.allowCancel = updates.allowCancel;
    if (updates.pauseBillingPeriod !== undefined) payload.pauseBillingPeriod = updates.pauseBillingPeriod;

    await fetchApi("/api/seller/meal-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Error updating meal plan in backend DB:", err);
  }

  if (current) {
    const updated: MealSubscriptionPlan = formatMealPlan({
      ...current,
      ...updates,
    });

    existing[targetIndex] = updated;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(existing));
        window.dispatchEvent(new Event("meal-plans-updated"));
      } catch (e) {
        console.error("Failed to update meal plan cache:", e);
      }
    }

    return updated;
  }

  return null;
}

export async function deleteMealPlan(id: string): Promise<boolean> {
  const existing = getStoredMealPlans();
  const filtered = existing.filter((p) => p.id !== id && p.planId !== id);

  try {
    await fetchApi(`/api/seller/meal-plans?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Error deleting meal plan from backend DB:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(filtered));
      window.dispatchEvent(new Event("meal-plans-updated"));
    } catch (e) {
      console.error("Failed to delete meal plan cache:", e);
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
