"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Bell,
} from "lucide-react";
import { saveMealPlan, fetchMealSlots } from "@/lib/meal-subscriptions";
import { PREDEFINED_MEAL_SLOTS, MealSlotDefinition } from "@/lib/meal-slots";
import styles from "./ResSellerSubPlan.module.css";

const DRAFT_STORAGE_KEY = "seller_meal_plan_draft_create";

export interface MealTimingSlot {
  id: string;
  name: string;
  time: string;
}

export interface ResSellerSubPlanProps {
  initialPlanName?: string;
  initialPlanTier?: string;
  initialPrice?: string;
  initialFeatures?: string[];
  initialDuration?: string;
  initialMealTimings?: MealTimingSlot[];
  initialAllowPauseBilling?: boolean;
  onBack?: () => void;
  onDeployPlan?: (planData: any) => void;
  onDiscard?: () => void;
}

const DEFAULT_FEATURES: string[] = [];

const DURATION_OPTIONS = [
  "1 Week",
  "2 Weeks",
  "1 Month",
];

export const ResSellerSubPlan: React.FC<ResSellerSubPlanProps> = ({
  initialPlanName = "",
  initialPlanTier = "Bronze",
  initialPrice = "",
  initialFeatures = DEFAULT_FEATURES,
  initialDuration = "1 Week",
  initialAllowPauseBilling = true,
  onBack,
  onDeployPlan,
  onDiscard,
}) => {
  const router = useRouter();

  // Form State
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

  const isHydratedRef = useRef(false);

  // Restore draft from sessionStorage if returning from Manage Meal Timings
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.planName === "string") setPlanName(parsed.planName);
          if (typeof parsed.planTier === "string") setPlanTier(parsed.planTier);
          if (typeof parsed.weeklyPrice === "string") setPrice(parsed.weeklyPrice);
          if (Array.isArray(parsed.features)) {
            setFeatures(
              parsed.features.map((f: any) => (typeof f === "string" ? f : f.label || ""))
            );
          }
          if (typeof parsed.planDuration === "string") setDuration(parsed.planDuration);
          if (Array.isArray(parsed.selectedSlotIds)) setSelectedSlotIds(parsed.selectedSlotIds);
          if (typeof parsed.allowPauseSubscription === "boolean") setAllowPauseBilling(parsed.allowPauseSubscription);
          if (typeof parsed.pauseBillingPeriod === "string") setPauseBillingPeriod(parsed.pauseBillingPeriod);
        }
      }
    } catch (e) {
      console.error("Failed to restore mobile meal plan draft:", e);
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  // Synchronize form draft to sessionStorage on change
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === "undefined") return;
    try {
      const draft = {
        planName,
        planTier,
        weeklyPrice: price,
        features,
        planDuration: duration,
        selectedSlotIds,
        allowPauseSubscription: allowPauseBilling,
        pauseBillingPeriod,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
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
  ]);

  useEffect(() => {
    const loadSlots = () => {
      fetchMealSlots()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSlotsWithTimings(data);
          }
        })
        .catch((err) => console.error("Error fetching meal slots on mobile:", err));
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

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    } else {
      router.push("/seller/subscription");
    }
  };

  const handleDeploy = async () => {
    const parsedPrice = parseFloat(price);
    if (!price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      alert(`Please enter a valid positive Price (₹) greater than 0 for ${duration}.`);
      return;
    }
    if (selectedSlotIds.length === 0) {
      alert("Please select at least one Meal Slot for this subscription plan.");
      return;
    }

    // Check if any selected slot is missing delivery timings
    const missingTimingSlots = selectedSlotIds
      .map((id) => slotsWithTimings.find((s) => s.id === id) || PREDEFINED_MEAL_SLOTS.find((s) => s.id === id))
      .filter((s) => !s || !s.defaultTimeRange || s.defaultTimeRange.trim() === "");

    if (missingTimingSlots.length > 0) {
      const names = missingTimingSlots.map((s) => s?.name || "Slot").join(", ");
      alert(`Delivery timing is not added for: ${names}. You need to add timings first in Manage Meal Subscription Timings before creating a meal subscription.`);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            planName,
            planTier,
            weeklyPrice: price,
            features,
            planDuration: duration,
            selectedSlotIds,
            allowPauseSubscription: allowPauseBilling,
            pauseBillingPeriod,
          })
        );
      }
      router.push("/seller/subscription/timings?returnTo=/seller/subscription/newPlan");
      return;
    }

    const validFeatures = features.map((f) => f.trim()).filter((f) => f.length > 0);
    const isWeekly = duration.toLowerCase().includes("week");
    const selectedSlots = slotsWithTimings.filter((s) => selectedSlotIds.includes(s.id));
    const payload = {
      name: planName.trim() || "Bronze Plan",
      tier: planTier.trim() || "Bronze",
      weeklyPrice: isWeekly ? price.trim() || "0" : "",
      monthlyPrice: isWeekly ? "" : `₹${parsedPrice.toFixed(0)}`,
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
      status: "Live" as const,
    };

    try {
      await saveMealPlan(payload);

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      if (onDeployPlan) {
        onDeployPlan(payload);
      } else {
        setToastMessage("Plan Created & Deployed Successfully!");
        setTimeout(() => {
          router.push("/seller/subscription");
        }, 900);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create subscription plan.");
    }
  };

  // Compute unit suffix for price preview (e.g., /wk, /mo, /yr)
  const getDurationSuffix = (dur: string) => {
    const d = dur.toLowerCase();
    if (d.includes("2 week")) return " / 2 wks";
    if (d.includes("1 week") || d.includes("week")) return " / wk";
    if (d.includes("6 month")) return " / 6 mos";
    if (d.includes("1 month") || d.includes("month")) return " / mo";
    if (d.includes("year")) return " / yr";
    return ` / ${dur.toLowerCase()}`;
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
              <h1 className={styles.headerTitle}>Create New Plan</h1>
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
            Define tier packages, custom features &amp; timings.
          </p>
        </header>

        {/* Form Content Area */}
        <main className={styles.contentArea}>
          {/* Section 1: Plan Basics & Duration */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Basics &amp; Duration</h2>

            <div className={styles.formGroup}>
              <label htmlFor="planName" className={styles.label}>
                Plan Name
              </label>
              <input
                id="planName"
                type="text"
                className={styles.input}
                placeholder="e.g. Bronze Plan, Silver Plan, Gold Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="planTier" className={styles.label}>
                Plan Tier
              </label>
              <select
                id="planTier"
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

          {/* Section 2: Plan Pricing (₹ INR) */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Plan Pricing (₹ INR)</h2>

            <div className={styles.formGroup}>
              <label htmlFor="weeklyPrice" className={styles.label}>
                Price for {duration} (₹)
              </label>
              <div className={styles.priceInputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  id="weeklyPrice"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  className={`${styles.input} ${styles.priceInput}`}
                  placeholder={`Price for ${duration}`}
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (!isNaN(Number(val)) && Number(val) >= 0)) {
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

          {/* Section 3: Included Features */}
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

          {/* Section 4: Predefined Meal Slots */}
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
              Select all standardized slots included in this plan (minimum 1 required).
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
                        href="/seller/subscription/timings?returnTo=/seller/subscription/newPlan"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof window !== "undefined") {
                            sessionStorage.setItem(
                              DRAFT_STORAGE_KEY,
                              JSON.stringify({
                                planName,
                                planTier,
                                weeklyPrice: price,
                                features,
                                planDuration: duration,
                                selectedSlotIds,
                                allowPauseSubscription: allowPauseBilling,
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

          {/* Section 5: Subscription Policies */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Subscription Policies</h2>

            <div className={styles.policyList}>
              {/* Allow User to Pause Subscription */}
              <div className={styles.policyRow}>
                <div className={styles.policyInfo}>
                  <h3 className={styles.policyTitle}>Allow User to Pause Subscription</h3>
                  <p className={styles.policyDesc}>When enabled, users can pause their meal subscription for up to the max configured days.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowPauseBilling}
                    onClick={() => setAllowPauseBilling(!allowPauseBilling)}
                    style={{
                      width: "44px",
                      height: "24px",
                      backgroundColor: allowPauseBilling ? "#FF5500" : "#CBD5E1",
                      borderRadius: "9999px",
                      position: "relative",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "background-color 0.25s ease",
                    }}
                    title={allowPauseBilling ? "Disable pause subscription" : "Enable pause subscription"}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: "2px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "50%",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transform: allowPauseBilling ? "translateX(20px)" : "translateX(0)",
                        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </button>

                  <div style={{ position: "relative", minWidth: "110px", opacity: allowPauseBilling ? 1 : 0.4, pointerEvents: allowPauseBilling ? "auto" : "none" }}>
                    <select
                      value={pauseBillingPeriod}
                      disabled={!allowPauseBilling}
                      onChange={(e) => setPauseBillingPeriod(e.target.value)}
                      style={{
                        width: "100%",
                        height: "36px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        padding: "0 24px 0 10px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#0F172A",
                        outline: "none",
                        cursor: "pointer",
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

          {/* Sticky / Bottom Footer Actions */}
          <footer className={styles.footerArea}>
            <div className={styles.draftPreviewRow}>
              <div className={styles.draftLeft}>
                <span className={styles.draftLabel}>PLAN PREVIEW</span>
                <h4 className={styles.draftPlanName}>
                  {planName.trim() || "New Plan"}
                </h4>
              </div>
              <span className={styles.draftPrice}>
                ₹{price || "0"}
                {getDurationSuffix(duration)}
              </span>
            </div>

            <button
              type="button"
              className={styles.deployButton}
              onClick={handleDeploy}
            >
              Create &amp; Deploy Plan
            </button>

            <div className={styles.homeIndicator} aria-hidden="true" />
          </footer>
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

export default ResSellerSubPlan;
