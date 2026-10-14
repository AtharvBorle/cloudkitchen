"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Save,
  X,
  Sparkles,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import {
  MealSlotDefinition,
  PREDEFINED_MEAL_SLOTS,
} from "@/lib/meal-slots";
import {
  fetchMealSlots,
  updateMealSlotConfig,
} from "@/lib/meal-subscriptions";

export default function ManageMealTimingsCanvas() {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [slots, setSlots] = useState<MealSlotDefinition[]>(PREDEFINED_MEAL_SLOTS);
  const [loading, setLoading] = useState(true);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editTimeRange, setEditTimeRange] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadSlots = async () => {
    try {
      setLoading(true);
      const data = await fetchMealSlots();
      if (Array.isArray(data) && data.length > 0) {
        setSlots(data);
      }
    } catch (err: any) {
      console.error("Failed to load meal slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleStartEdit = (slot: MealSlotDefinition) => {
    setEditingSlotId(slot.id);
    setEditTimeRange(slot.defaultTimeRange);
  };

  const handleCancelEdit = () => {
    setEditingSlotId(null);
    setEditTimeRange("");
  };

  const handleSaveSlotTiming = async (slotId: string) => {
    if (!editTimeRange.trim()) {
      showToast("Delivery window cannot be empty.", "error");
      return;
    }

    setSavingSlotId(slotId);
    try {
      await updateMealSlotConfig(slotId, {
        defaultTimeRange: editTimeRange.trim(),
      });
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, defaultTimeRange: editTimeRange.trim() } : s))
      );
      setEditingSlotId(null);
      showToast("Meal slot delivery timing updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update slot timing.", "error");
    } finally {
      setSavingSlotId(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        fontFamily: "var(--font-poppins), 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Sidebar */}
      <SellerSidebar
        activeItemId="subscription"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* Main Container */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar
          title="Owner Operations Console"
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        <main style={{ padding: "32px 40px", maxWidth: "1280px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {/* Breadcrumbs & Header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748B", marginBottom: "8px" }}>
              <Link href="/seller/subscription" style={{ color: "#64748B", textDecoration: "none" }}>
                Subscriptions
              </Link>
              <span>/</span>
              <span style={{ color: "#0F172A", fontWeight: 600 }}>Manage Meal Timings</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                  Centralized Meal Timings Management
                </h1>
                <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
                  Standardized 7 platform meal slots used across all plans, deliveries, and pause cycles.
                </p>
              </div>

              <Link
                href="/seller/subscription"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  color: "#334155",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <ChevronLeft size={16} />
                <span>Back to Plans</span>
              </Link>
            </div>
          </div>

          {/* Centralized Policy Notice Banner */}
          <div
            style={{
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "12px",
              padding: "18px 22px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <ShieldCheck size={22} color="#2563EB" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E40AF", marginBottom: "3px" }}>
                Platform-Wide Standardization Active
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#1E3A8A", lineHeight: 1.5 }}>
                To maintain operational reliability and coordinate delivery drivers efficiently, these <strong>7 distinct meal occasions</strong> are centrally defined and consistent across all kitchens and subscribers. Sellers cannot create custom timing categories, ensuring customer subscriptions, delivery windows, and pause cycles align accurately.
              </p>
            </div>
          </div>

          {/* 7 Predefined Slots Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
            {slots.map((slot, index) => {
              const isEditing = editingSlotId === slot.id;
              const isSaving = savingSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "14px",
                    border: "1px solid #E2E8F0",
                    padding: "22px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  {/* Top Slot Header */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          backgroundColor: "#FFF7ED",
                          color: "#EA580C",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Slot #{index + 1} • {slot.id}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor: "#DCFCE7",
                          color: "#15803D",
                        }}
                      >
                        Active
                      </span>
                    </div>

                    <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0" }}>
                      {slot.name}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                      {slot.subtitle}
                    </p>
                  </div>

                  {/* Delivery Time Configuration Box */}
                  <div
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                      Configured Delivery Window
                    </div>

                    {isEditing ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="text"
                          value={editTimeRange}
                          onChange={(e) => setEditTimeRange(e.target.value)}
                          placeholder="e.g. 7:30 AM – 9:30 AM"
                          style={{
                            flex: 1,
                            fontSize: "13px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1.5px solid #EA580C",
                            outline: "none",
                            backgroundColor: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSlotTiming(slot.id)}
                          disabled={isSaving}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "6px",
                            backgroundColor: "#EA580C",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Save size={14} />
                          <span>{isSaving ? "Saving..." : "Save"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#F1F5F9",
                            color: "#64748B",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                          <Clock size={16} color="#EA580C" />
                          <span>{slot.defaultTimeRange}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(slot)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#EA580C",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            backgroundColor: toastType === "success" ? "#0F172A" : "#DC2626",
            color: "#FFFFFF",
            padding: "14px 22px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {toastType === "success" ? <CheckCircle2 size={18} color="#22C55E" /> : <AlertCircle size={18} color="#FFFFFF" />}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
