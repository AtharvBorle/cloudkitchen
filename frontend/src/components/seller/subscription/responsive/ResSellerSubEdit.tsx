"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  MoreHorizontal,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  Pencil,
  X,
  CheckCircle2,
  AlertTriangle,
  Bell,
} from "lucide-react";
import {
  fetchStoredMealPlans,
  getStoredMealPlans,
  updateMealPlan,
  deleteMealPlan,
  fetchMealSlots,
  MealSubscriptionPlan,
} from "@/lib/meal-subscriptions";
import { PREDEFINED_MEAL_SLOTS, MealSlotDefinition, normalizeMealSlotIds } from "@/lib/meal-slots";
import Link from "next/link";
import styles from "./ResSellerSubEdit.module.css";

export interface MealServingTiming {
  id: string;
  name: string;
  time: string;
}

export interface PlanMetricsData {
  subscribers: number | string;
  monthlyRevenue: string;
}

export interface PlanMetadataData {
  planId: string;
  deployedDate: string;
  taxCode: string;
}

export interface ResSellerSubEditProps {
  initialPlanName?: string;
  initialPlanTier?: string;
  initialPrice?: string;
  initialMetrics?: PlanMetricsData;
  initialFeatures?: string[];
  initialDuration?: string;
  initialMealTimings?: MealServingTiming[];
  initialAllowPauseBilling?: boolean;
  initialMetadata?: PlanMetadataData;
  onBack?: () => void;
  onSaveChanges?: (planData: any) => void;
  onDiscard?: () => void;
  onArchivePlan?: () => void;
}

const DEFAULT_METRICS: PlanMetricsData = {
  subscribers: 0,
  monthlyRevenue: "₹0",
};

const DEFAULT_FEATURES: string[] = [];

const DEFAULT_MEAL_TIMINGS: MealServingTiming[] = [
  { id: "1", name: "Breakfast", time: "7:30 AM - 9:30 AM" },
  { id: "2", name: "Lunch", time: "12:30 PM - 1:30 PM" },
  { id: "3", name: "Evening Snacks", time: "5:30 PM - 6:30 PM" },
  { id: "4", name: "Dinner", time: "8:30 PM - 9:30 PM" },
];

const DEFAULT_METADATA: PlanMetadataData = {
  planId: "PLN-7832",
  deployedDate: "Feb 10, 2024",
  taxCode: "GST 18% Extra",
};

const DURATION_OPTIONS = [
  "1 Week",
  "2 Weeks",
  "1 Month",
];

export const ResSellerSubEdit: React.FC<ResSellerSubEditProps> = ({
  initialPlanName = "Bronze Plan",
  initialPlanTier = "Bronze",
  initialPrice = "499.00",
  initialMetrics = DEFAULT_METRICS,
  initialFeatures = DEFAULT_FEATURES,
  initialDuration = "1 Week",
  initialMealTimings = DEFAULT_MEAL_TIMINGS,
  initialAllowPauseBilling = false,
  initialMetadata = DEFAULT_METADATA,
  onBack,
  onSaveChanges,
  onDiscard,
  onArchivePlan,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get("id");

  // Form State
  const [targetPlanId, setTargetPlanId] = useState<string | null>(planIdParam);
  const [metrics, setMetrics] = useState<PlanMetricsData>(initialMetrics);
  const [planName, setPlanName] = useState(initialPlanName);
  const [planTier, setPlanTier] = useState(initialPlanTier);
  const [price, setPrice] = useState(initialPrice);
  const [features, setFeatures] = useState<string[]>(initialFeatures);
  const [duration, setDuration] = useState(initialDuration);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [slotsWithTimings, setSlotsWithTimings] = useState<MealSlotDefinition[]>(PREDEFINED_MEAL_SLOTS);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [allowPauseBilling, setAllowPauseBilling] = useState(initialAllowPauseBilling);
  const [pauseBillingPeriod, setPauseBillingPeriod] = useState("30 Days");
  const [metadata, setMetadata] = useState<PlanMetadataData>(initialMetadata);

  useEffect(() => {
    const loadSlots = () => {
      fetchMealSlots()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSlotsWithTimings(data);
          }
        })
        .catch((err) => console.error("Error fetching meal slots in mobile edit:", err));
    };

    loadSlots();
    window.addEventListener("focus", loadSlots);
    window.addEventListener("meal-timings-updated", loadSlots);
    return () => {
      window.removeEventListener("focus", loadSlots);
      window.removeEventListener("meal-timings-updated", loadSlots);
    };
  }, []);

  const handleToggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      const cleanPrefix = (planIdParam || "").toUpperCase().startsWith("PLN-")
        ? (planIdParam || "").slice(4).trim().toLowerCase()
        : "";
      const matchPlan = (list: MealSubscriptionPlan[]) =>
        list.find(
          (p) =>
            p.id === planIdParam ||
            p.planId === planIdParam ||
            (cleanPrefix && p.id.toLowerCase().startsWith(cleanPrefix))
        );

      let plans = getStoredMealPlans();
      const fetched = await fetchStoredMealPlans();
      if (fetched?.plans && fetched.plans.length > 0) {
        plans = fetched.plans;
      }

      const found = matchPlan(plans) || plans[0];

      if (found) {
        setTargetPlanId(found.id);

        const activeDraftKey = `seller_meal_plan_draft_edit_${found.id}`;
        let draftData: any = null;
        if (typeof window !== "undefined") {
          try {
            const rawDraft = sessionStorage.getItem(activeDraftKey);
            if (rawDraft) draftData = JSON.parse(rawDraft);
          } catch (e) {}
        }

        if (draftData) {
          if (draftData.planName !== undefined) setPlanName(draftData.planName);
          if (draftData.planTier !== undefined) setPlanTier(draftData.planTier);
          if (draftData.price !== undefined) setPrice(draftData.price);
          if (Array.isArray(draftData.features)) setFeatures(draftData.features);
          if (draftData.duration !== undefined) setDuration(draftData.duration);
          if (Array.isArray(draftData.selectedSlotIds)) setSelectedSlotIds(draftData.selectedSlotIds);
          if (draftData.allowPauseBilling !== undefined) setAllowPauseBilling(draftData.allowPauseBilling);
          if (draftData.pauseBillingPeriod !== undefined) setPauseBillingPeriod(draftData.pauseBillingPeriod);
          isHydratedRef.current = true;
          return;
        }

        setPlanName(found.name);
        setPlanTier(found.tier);
        setPrice(found.weeklyPrice ? found.weeklyPrice.replace(/[^\d.]/g, "") : "499.00");
        setFeatures(found.features || []);
        setDuration(found.duration || "1 Week");
        const normalizedSlots = found.slotIds && found.slotIds.length > 0
          ? found.slotIds
          : normalizeMealSlotIds(found.mealTimings || []);
        setSelectedSlotIds(normalizedSlots.length > 0 ? normalizedSlots : ["breakfast", "lunch", "dinner"]);
        setMealTimings(
          (found.mealTimings || []).map((t, idx) => {
            const [mealName, time] = t.includes(":") ? t.split(/:\s*(.+)/) : [`Meal ${idx + 1}`, t];
            return {
              id: `time-${idx}`,
              name: mealName || "Meal",
              time: time || t,
            };
          })
        );
        const pausePeriodRaw = (found.pauseBillingPeriod || "").trim().toLowerCase();
        const isPauseDisabled = !found.pauseBillingPeriod ||
          pausePeriodRaw === "none" ||
          pausePeriodRaw === "disabled" ||
          pausePeriodRaw === "false" ||
          (found as any).allowPause === false ||
          (found as any).allowPauseBilling === false;
        setAllowPauseBilling(!isPauseDisabled);
        setPauseBillingPeriod(
          isPauseDisabled || pausePeriodRaw === "monthly"
            ? "30 Days"
            : (found.pauseBillingPeriod || "30 Days")
        );
        setMetrics({
          subscribers: found.subscribersCount || 0,
          monthlyRevenue: found.monthlyRevenue || "₹0",
        });
        setMetadata({
          planId: found.planId,
          deployedDate: found.deployedDate,
          taxCode: "GST 18% Extra",
        });
        isHydratedRef.current = true;
      }
    };

    loadPlan();
  }, [planIdParam]);

  const isHydratedRef = useRef(false);

  // Synchronize form draft to sessionStorage on change
  useEffect(() => {
    if (!isHydratedRef.current || !targetPlanId || typeof window === "undefined") return;
    try {
      const draftKey = `seller_meal_plan_draft_edit_${targetPlanId}`;
      const draft = {
        planName,
        planTier,
        price,
        features,
        duration,
        selectedSlotIds,
        allowPauseBilling,
        pauseBillingPeriod,
      };
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (e) {}
  }, [
    planName,
    planTier,
    price,
    features,
    duration,
    selectedSlotIds,
    allowPauseBilling,
    pauseBillingPeriod,
    targetPlanId,
  ]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/subscription");
    }
  };

  const handleAddFeature = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const handleUpdateFeature = (index: number, value: string) => {
    setFeatures((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleDeleteFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const numPrice = parseFloat(price.replace(/[^\d.]/g, ""));
    if (isNaN(numPrice) || numPrice <= 0) {
      setToastMessage("Please enter a valid positive price greater than 0");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (selectedSlotIds.length === 0) {
      setToastMessage("Please select at least one Meal Slot for this plan.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Check if any selected slot is missing delivery timings
    const missingTimingSlots = selectedSlotIds
      .map((id) => slotsWithTimings.find((s) => s.id === id) || PREDEFINED_MEAL_SLOTS.find((s) => s.id === id))
      .filter((s) => !s || !s.defaultTimeRange || s.defaultTimeRange.trim() === "");

    if (missingTimingSlots.length > 0) {
      const names = missingTimingSlots.map((s) => s?.name || "Slot").join(", ");
      alert(`Delivery timing is not added for: ${names}. You need to add timings first in Manage Meal Subscription Timings before saving this plan.`);
      if (typeof window !== "undefined" && targetPlanId) {
        sessionStorage.setItem(
          `seller_meal_plan_draft_edit_${targetPlanId}`,
          JSON.stringify({
            planName,
            planTier,
            price,
            features,
            duration,
            selectedSlotIds,
            allowPauseBilling,
            pauseBillingPeriod,
          })
        );
      }
      router.push(`/seller/subscription/timings?returnTo=${encodeURIComponent(`/seller/subscription/editPlan?id=${targetPlanId || planIdParam || ""}`)}`);
      return;
    }

    const validFeatures = features.map((f) => f.trim()).filter((f) => f.length > 0);
    const isWeekly = duration.toLowerCase().includes("week");
    const selectedSlots = slotsWithTimings.filter((s) => selectedSlotIds.includes(s.id));
    if (targetPlanId) {
      try {
        await updateMealPlan(targetPlanId, {
          name: planName.trim() || "Bronze Plan",
          tier: planTier.trim() || "Bronze",
          weeklyPrice: isWeekly ? `₹${numPrice.toFixed(0)}` : "",
          monthlyPrice: isWeekly ? "" : `₹${numPrice.toFixed(0)}`,
          quarterlyPrice: "",
          yearlyPrice: "",
          duration,
          features: validFeatures,
          mealTimings: selectedSlots.map((m) => `${m.name}: ${m.defaultTimeRange}`),
          slotIds: selectedSlotIds,
          allowCancel: false,
          allowPause: allowPauseBilling,
          allowPauseBilling: allowPauseBilling,
          pauseBillingPeriod: allowPauseBilling ? (pauseBillingPeriod || "30 Days") : "None",
        });
      } catch (err: any) {
        setToastMessage(err.message || "Failed to update plan");
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }
    }

    const payload = {
      planName: planName.trim() || "Bronze Plan",
      planTier: planTier.trim() || "Bronze",
      price: price.trim() || "499.00",
      duration,
      features: validFeatures,
      mealTimings,
      allowCancellation: false,
      allowPauseBilling,
      metadata,
    };

    if (typeof window !== "undefined" && targetPlanId) {
      sessionStorage.removeItem(`seller_meal_plan_draft_edit_${targetPlanId}`);
    }
    if (onSaveChanges) {
      onSaveChanges(payload);
    } else {
      setToastMessage("Changes Saved Successfully!");
      setTimeout(() => {
        router.push("/seller/subscription");
      }, 900);
    }
  };

  const handleDiscard = () => {
    if (typeof window !== "undefined" && targetPlanId) {
      sessionStorage.removeItem(`seller_meal_plan_draft_edit_${targetPlanId}`);
    }
    if (onDiscard) {
      onDiscard();
    } else {
      router.push("/seller/subscription");
    }
  };

  const handleArchive = async () => {
    if (targetPlanId) {
      await deleteMealPlan(targetPlanId);
    }
    if (onArchivePlan) {
      onArchivePlan();
    } else {
      setToastMessage("Plan Archived Successfully");
      setTimeout(() => {
        router.push("/seller/subscription");
      }, 900);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarRow}>
            <div className={styles.headerLeft}>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBack}
                aria-label="Back to Subscriptions"
                title="Back"
              >
                <ChevronLeft size={20} strokeWidth={2.4} />
              </button>
              <h1 className={styles.headerTitle}>Edit Plan</h1>
            </div>

            <button
              type="button"
              className={styles.moreButton}
              onClick={() => router.push("/seller/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          </div>


          <p className={styles.headerSubtitle}>
            Update plan details, pricing, features, and policies.
          </p>
        </header>

        {/* Form Content Area */}
        <main className={styles.contentArea}>
          {/* Section 1: PLAN METRICS */}
          <section className={styles.card}>
            <h2 className={styles.cardTitleUpper}>PLAN METRICS</h2>

            <div className={styles.metricsGrid}>
              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>SUBSCRIBERS</span>
                <span className={styles.metricValue}>{metrics.subscribers}</span>
              </div>

              <div className={styles.metricBox}>
                <span className={styles.metricLabel}>MONTHLY REVENUE</span>
                <span className={`${styles.metricValue} ${styles.metricValueGreen}`}>
                  {metrics.monthlyRevenue}
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Plan Basics & Duration */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Basics &amp; Duration</h2>

            <div className={styles.formGroup}>
              <label htmlFor="editPlanName" className={styles.label}>
                Plan Name
              </label>
              <input
                id="editPlanName"
                type="text"
                className={styles.input}
                placeholder="Plan Name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="editPlanTier" className={styles.label}>
                Plan Tier
              </label>
              <select
                id="editPlanTier"
                className={styles.input}
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="Bronze">Bronze Tier</option>
                <option value="Silver">Silver Tier</option>
                <option value="Gold">Gold Tier</option>
              </select>
            </div>

            {/* Plan Duration Dropdown */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Plan Duration (Billing Cycle)</label>
              <div className={styles.selectWrapper}>
                <div
                  className={styles.selectTrigger}
                  onClick={() => setIsDurationMenuOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <span style={{ fontWeight: 600 }}>{duration}</span>
                  <ChevronDown size={18} color="#64748B" />
                </div>

                {isDurationMenuOpen && (
                  <div className={styles.selectMenu}>
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.selectOption} ${
                          duration === opt ? styles.selectOptionActive : ""
                        }`}
                        onClick={() => {
                          setDuration(opt);
                          setIsDurationMenuOpen(false);
                        }}
                      >
                        <span>{opt}</span>
                        {duration === opt && <Check size={14} color="#F97316" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p style={{ fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" }}>
                Selected cycle: <strong>{duration}</strong>. Customers will be billed for this exact period.
              </p>
            </div>
          </section>

          {/* Section 3: Plan Pricing (₹ INR) */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Pricing (₹ INR)</h2>

            <div className={styles.formGroup}>
              <label htmlFor="editWeeklyPrice" className={styles.label}>
                Price for {duration} (₹)
              </label>
              <div className={styles.priceInputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="editWeeklyPrice"
                  type="text"
                  inputMode="decimal"
                  className={`${styles.input} ${styles.priceInput}`}
                  placeholder={`Price for ${duration}`}
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val.includes("-")) {
                      setPrice(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <p style={{ fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" }}>
                Total amount for the <strong>{duration}</strong> subscription cycle.
              </p>
            </div>
          </section>

          {/* Section 4: Included Features */}
          <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>Included Features</h2>
              <button
                type="button"
                className={styles.addFeatureBtn}
                onClick={handleAddFeature}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>

            {/* List of features */}
            <div className={styles.featuresList}>
              {features.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>No items added yet.</span>
                  <button
                    type="button"
                    className={styles.addFeatureBtn}
                    onClick={handleAddFeature}
                    style={{ marginTop: "4px" }}
                  >
                    + Add Meal Item
                  </button>
                </div>
              ) : (
                features.map((feature, idx) => (
                  <div key={idx} className={styles.featureItem}>
                    <Check size={16} strokeWidth={2.5} className={styles.checkIcon} />
                    <input
                      type="text"
                      className={styles.featureInput}
                      placeholder="e.g. 7 Meals per week, 1 Dal + 1 Sabzi..."
                      value={feature}
                      onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      autoFocus={!feature}
                    />
                    <button
                      type="button"
                      className={styles.deleteFeatureBtn}
                      onClick={() => handleDeleteFeature(idx)}
                      aria-label={`Delete feature`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 5: Predefined Meal Slots */}
          <section className={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>Included Meal Slots</h2>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: selectedSlotIds.length > 0 ? "#EA580C" : "#EF4444",
                  backgroundColor: selectedSlotIds.length > 0 ? "#FFF7ED" : "#FEF2F2",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                {selectedSlotIds.length} of {slotsWithTimings.length} Selected
              </span>
            </div>
            <p style={{ fontSize: "11.5px", color: "#64748B", margin: "0 0 10px 0" }}>
              Select all standardized slots included in this plan (minimum 1 required). Delivery timings must be configured before saving.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {slotsWithTimings.map((slot) => {
                const isSelected = selectedSlotIds.includes(slot.id);
                const hasTiming = Boolean(slot.defaultTimeRange && slot.defaultTimeRange.trim().length > 0);
                return (
                  <div
                    key={slot.id}
                    onClick={() => handleToggleSlot(slot.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: isSelected
                        ? (hasTiming ? "1.5px solid #EA580C" : "1.5px solid #F59E0B")
                        : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#FFFDFB" : "#FFFFFF",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ width: "16px", height: "16px", accentColor: "#EA580C" }}
                      />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: isSelected ? "#0F172A" : "#334155" }}>
                          {slot.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>
                          {slot.subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {hasTiming ? (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: isSelected ? "#C2410C" : "#64748B",
                            backgroundColor: isSelected ? "#FFEDD5" : "#F1F5F9",
                            padding: "2px 8px",
                            borderRadius: "5px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {slot.defaultTimeRange}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            color: "#D97706",
                            backgroundColor: "#FEF3C7",
                            padding: "2px 6px",
                            borderRadius: "5px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ⚠️ No Timing
                        </span>
                      )}
                      <Link
                        href={`/seller/subscription/timings?returnTo=${encodeURIComponent(`/seller/subscription/editPlan?id=${targetPlanId || planIdParam || ""}`)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof window !== "undefined" && targetPlanId) {
                            sessionStorage.setItem(
                              `seller_meal_plan_draft_edit_${targetPlanId}`,
                              JSON.stringify({
                                planName,
                                planTier,
                                price,
                                features,
                                duration,
                                selectedSlotIds,
                                allowPauseBilling,
                                pauseBillingPeriod,
                              })
                            );
                          }
                        }}
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 600,
                          color: "#2563EB",
                          textDecoration: "underline",
                        }}
                      >
                        {hasTiming ? "Edit" : "Add"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 6: Subscription Policies */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Subscription Policies</h2>

            <div className={styles.policyList}>
              {/* Allow User to Pause Subscription */}
              <div className={styles.policyRow}>
                <div className={styles.policyInfo}>
                  <h3 className={styles.policyTitle}>Allow User to Pause Subscription</h3>
                  <p className={styles.policyDesc}>When enabled, users can pause their meal subscription for up to the max configured days.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowPauseBilling}
                    onClick={() => setAllowPauseBilling((prev) => !prev)}
                    style={{
                      width: "44px",
                      height: "24px",
                      borderRadius: "9999px",
                      backgroundColor: allowPauseBilling ? "#FF5500" : "#CBD5E1",
                      position: "relative",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "background-color 0.2s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      flexShrink: 0,
                      outline: "none",
                    }}
                    aria-label="Allow User to Pause Subscription Toggle"
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "#FFFFFF",
                        position: "absolute",
                        left: "3px",
                        transform: allowPauseBilling ? "translateX(20px)" : "translateX(0)",
                        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                  <div style={{ position: "relative", minWidth: "115px", flexShrink: 0 }}>
                    <select
                      value={pauseBillingPeriod}
                      disabled={!allowPauseBilling}
                      onChange={(e) => setPauseBillingPeriod(e.target.value)}
                      style={{
                        width: "100%",
                        height: "36px",
                        backgroundColor: allowPauseBilling ? "#FFFFFF" : "#F8FAFC",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        padding: "0 24px 0 10px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: allowPauseBilling ? "#0F172A" : "#94A3B8",
                        outline: "none",
                        cursor: allowPauseBilling ? "pointer" : "not-allowed",
                        appearance: "none",
                      }}
                    >
                      {Array.from({ length: 30 }, (_, i) => {
                        const day = i + 1;
                        const val = `${day} ${day === 1 ? "Day" : "Days"}`;
                        return (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        );
                      })}
                    </select>
                    <span
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "9px",
                        color: "#64748B",
                        pointerEvents: "none",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Plan Metadata Summary */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Metadata Summary</h2>

            <div className={styles.metadataList}>
              <div className={styles.metadataRow}>
                <span className={styles.metadataKey}>Plan ID</span>
                <span className={styles.metadataVal}>{metadata.planId}</span>
              </div>
              <div className={styles.metadataRow}>
                <span className={styles.metadataKey}>Deployed Date</span>
                <span className={styles.metadataVal}>{metadata.deployedDate}</span>
              </div>
              <div className={styles.metadataRow}>
                <span className={styles.metadataKey}>Tax Code</span>
                <span className={styles.metadataVal}>{metadata.taxCode}</span>
              </div>
            </div>
          </section>

          {/* Buttons: Save Changes & Discard Modifications */}
          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSave}
            >
              Save Changes
            </button>

            <button
              type="button"
              className={styles.discardButton}
              onClick={handleDiscard}
            >
              Discard Modifications
            </button>
          </div>

          {/* Section 8: Danger Zone */}
          <section className={styles.dangerCard}>
            <h3 className={styles.dangerTitle}>Danger Zone</h3>
            <p className={styles.dangerDesc}>
              Archiving this plan will prevent new subscribers from purchasing it. Existing active
              subscriptions will continue until their billing cycle finishes.
            </p>
            <button
              type="button"
              className={styles.archiveButton}
              onClick={handleArchive}
            >
              Archive Plan
            </button>
          </section>

          <div className={styles.homeIndicator} aria-hidden="true" />
        </main>

        {/* Toast Alert */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResSellerSubEdit;
