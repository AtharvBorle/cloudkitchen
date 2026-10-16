"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  ChevronLeft,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Utensils,
  RefreshCw,
  Loader2,
  Sparkles,
  ShieldCheck,
  Key,
} from "lucide-react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import {
  PREDEFINED_MEAL_SLOTS,
  MealSlotDefinition,
  getMealSlotDetails,
} from "@/lib/meal-slots";
import {
  fetchMealSubscriptionDeliveries,
  markSubscriberMealDeliveryStatus,
  MealSlotDeliveryRecord,
  MealDeliveriesResponse,
  getTierColors,
} from "@/lib/meal-subscriptions";
import PaginationControls from "../common/PaginationControls";
import DeliveryOtpModal from "./DeliveryOtpModal";

export default function DeliveriesCanvas() {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter States
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [activeSlotId, setActiveSlotId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<MealSlotDeliveryRecord[]>([]);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [totalDeliveries, setTotalDeliveries] = useState<number>(0);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [otpModalDelivery, setOtpModalDelivery] = useState<MealSlotDeliveryRecord | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | "All">(10);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDeliveries = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setLoadError(null);
    try {
      const response: MealDeliveriesResponse = await fetchMealSubscriptionDeliveries({
        date: selectedDate,
        slotId: activeSlotId !== "all" ? activeSlotId : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });

      setDeliveries(response.deliveries || []);
      setSlotCounts(response.slotCounts || {});
      setTotalDeliveries(response.totalDeliveries || 0);
      setLoadError(null);
    } catch (err: any) {
      console.error("Error loading meal deliveries:", err);
      const rawMsg = String(err?.message || "");
      const isTechnical = /not defined|is not a function|ReferenceError|TypeError|SyntaxError/i.test(rawMsg);
      const friendlyMsg = isTechnical || !rawMsg
        ? "Delivery data could not be loaded. Please check your connection or try again."
        : rawMsg;
      setLoadError(friendlyMsg);
      showToast(friendlyMsg, "error");
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, [selectedDate, activeSlotId, statusFilter, searchQuery]);

  useEffect(() => {
    loadDeliveries(true);
  }, [loadDeliveries]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, activeSlotId, statusFilter, searchQuery]);

  // Handle Delivery Toggle per specific meal slot occurrence
  const handleToggleDeliveryStatus = async (item: MealSlotDeliveryRecord) => {
    // If not delivered yet, open OTP verification modal
    if (item.status !== "DELIVERED") {
      setOtpModalDelivery(item);
      return;
    }

    // If already delivered, toggle back to pending
    const nextStatus = "NOT_DELIVERED";
    setActionInProgressId(item.id);

    try {
      await markSubscriberMealDeliveryStatus(
        item.subscriptionId,
        item.scheduledDate,
        nextStatus,
        undefined,
        item.slotId
      );
      const recipientName =
        item.subscription?.user?.name ||
        (item as any).customerName ||
        "Subscriber";
      showToast(
        `Marked ${item.slotName} as Pending for ${recipientName}`
      );
      loadDeliveries(false);
    } catch (err: any) {
      showToast(err.message || "Failed to update delivery status", "error");
      loadDeliveries(true);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleConfirmDeliveryWithOtp = async (otp: string, note?: string) => {
    if (!otpModalDelivery) return;
    const item = otpModalDelivery;
    setActionInProgressId(item.id);

    try {
      await markSubscriberMealDeliveryStatus(
        item.subscriptionId,
        item.scheduledDate,
        "DELIVERED",
        note,
        item.slotId,
        otp
      );
      const recipientName =
        item.subscription?.user?.name ||
        (item as any).customerName ||
        "Subscriber";
      showToast(
        `Marked ${item.slotName} as Delivered for ${recipientName} (Verified via OTP)`
      );
      setOtpModalDelivery(null);
      loadDeliveries(false);
    } catch (err: any) {
      throw err; // let modal display the validation error to seller
    } finally {
      setActionInProgressId(null);
    }
  };

  // Paginated Deliveries
  const paginatedDeliveries = useMemo(() => {
    if (pageSize === "All") return deliveries;
    const num = Number(pageSize) || 10;
    const start = (currentPage - 1) * num;
    return deliveries.slice(start, start + num);
  }, [deliveries, currentPage, pageSize]);

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

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar
          title="Owner Operations Console"
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        <main style={{ padding: "30px 40px", maxWidth: "1380px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {/* Header Row */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748B", marginBottom: "8px" }}>
              <Link href="/seller/subscription" style={{ color: "#64748B", textDecoration: "none" }}>
                Subscriptions
              </Link>
              <span>/</span>
              <span style={{ color: "#0F172A", fontWeight: 600 }}>Deliveries Roster</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                  Meal Subscription Deliveries
                </h1>
                <p style={{ fontSize: "14px", color: "#64748B", margin: 0 }}>
                  Deliveries organized and filtered across the 7 standardized meal slots.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => loadDeliveries(true)}
                  disabled={loading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>

                <Link
                  href="/seller/subscription/timings"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#FFF7ED",
                    border: "1px solid #FED7AA",
                    color: "#EA580C",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <Clock size={15} />
                  <span>Manage Timings</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Overdue Alert Banner */}
          {(slotCounts.overdue || 0) > 0 && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1.5px solid #FCA5A5",
                borderRadius: "14px",
                padding: "16px 20px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(220, 38, 38, 0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertCircle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#991B1B" }}>
                    {slotCounts.overdue} Delivery {slotCounts.overdue === 1 ? "Window Has" : "Windows Have"} Passed (Pending Delivery)
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#7F1D1D", marginTop: "2px" }}>
                    The scheduled window has ended. You can still mark them delivered with the customer&apos;s OTP upon arrival.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStatusFilter("OVERDUE")}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  backgroundColor: statusFilter === "OVERDUE" ? "#991B1B" : "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                }}
              >
                {statusFilter === "OVERDUE" ? "Viewing Overdue Deliveries" : `View Overdue (${slotCounts.overdue})`}
              </button>
            </div>
          )}

          {/* 7 Meal Slots Tabs Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "10px",
              marginBottom: "20px",
              scrollbarWidth: "none",
            }}
          >
            {/* All Slots Tab */}
            <button
              type="button"
              onClick={() => setActiveSlotId("all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: activeSlotId === "all" ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                backgroundColor: activeSlotId === "all" ? "#EA580C" : "#FFFFFF",
                color: activeSlotId === "all" ? "#FFFFFF" : "#334155",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>All Meal Slots</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 7px",
                  borderRadius: "12px",
                  backgroundColor: activeSlotId === "all" ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                  color: activeSlotId === "all" ? "#FFFFFF" : "#475569",
                  fontWeight: 800,
                }}
              >
                {slotCounts.all ?? totalDeliveries}
              </span>
            </button>

            {/* 7 Individual Slot Tabs */}
            {PREDEFINED_MEAL_SLOTS.map((slot) => {
              const isActive = activeSlotId === slot.id;
              const count = slotCounts[slot.id] || 0;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setActiveSlotId(slot.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: isActive ? "1.5px solid #EA580C" : "1px solid #E2E8F0",
                    backgroundColor: isActive ? "#EA580C" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "#334155",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{slot.name}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 7px",
                      borderRadius: "12px",
                      backgroundColor: isActive ? "rgba(255,255,255,0.25)" : count > 0 ? "#FFEDD5" : "#F1F5F9",
                      color: isActive ? "#FFFFFF" : count > 0 ? "#C2410C" : "#64748B",
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters Bar: Date, Search, Delivery Status */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* Date Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={16} color="#EA580C" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0F172A",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#F8FAFC",
                    outline: "none",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                />
                {selectedDate === todayDateStr && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: "#DCFCE7",
                      color: "#15803D",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#F8FAFC",
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="OVERDUE">⚠️ Overdue / Time Passed ({slotCounts.overdue || 0})</option>
                <option value="PENDING">Pending Delivery ({slotCounts.pending || 0})</option>
                <option value="DELIVERED">Delivered ({slotCounts.delivered || 0})</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px", maxWidth: "420px" }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search subscriber, phone, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "#F8FAFC",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Informative Slot Banner */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748B" }}>
            <Sparkles size={16} color="#EA580C" />
            <span>
              {activeSlotId === "all" ? (
                <>
                  Showing all scheduled deliveries for <strong>{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</strong> across all 6 predefined meal slots.
                </>
              ) : (
                <>
                  Filtered to <strong>{getMealSlotDetails(activeSlotId).name}</strong> ({getMealSlotDetails(activeSlotId).subtitle}) deliveries scheduled for <strong>{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</strong>.
                </>
              )}
            </span>
          </div>

          {/* Deliveries Cards List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748B" }}>
              <Loader2 size={36} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 14px" }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>Loading meal slot deliveries roster...</p>
            </div>
          ) : loadError ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "60px 24px",
                textAlign: "center",
                border: "1.5px solid #FECACA",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#991B1B" }}>
                Delivery Data Could Not Be Loaded
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#64748B", maxWidth: "480px", lineHeight: 1.5 }}>
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => loadDeliveries(true)}
                style={{
                  marginTop: "6px",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  backgroundColor: "#EA580C",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                <RefreshCw size={15} />
                <span>Retry Loading Deliveries</span>
              </button>
            </div>
          ) : deliveries.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "70px 24px",
                textAlign: "center",
                border: "1.5px dashed #CBD5E1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#FFF7ED",
                  color: "#EA580C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Utensils size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>
                No Deliveries Found
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#64748B", maxWidth: "460px" }}>
                {activeSlotId !== "all"
                  ? `No subscriptions are scheduled for ${getMealSlotDetails(activeSlotId).name} on ${selectedDate}.`
                  : `There are no scheduled deliveries matching your filters on ${selectedDate}.`}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {paginatedDeliveries.map((item) => {
                const isDelivered = item.status === "DELIVERED";
                const isPaused = item.status === "SKIPPED_PAUSED";
                const subTier = item.subscription?.tier || (item as any).tier || "Bronze";
                const tierColors = getTierColors(subTier);
                const customerName = item.subscription?.user?.name || (item as any).customerName || "Subscriber";
                const initial = customerName.charAt(0).toUpperCase();
                const planName = item.subscription?.plan?.name || (item as any).planName || "Meal Plan";
                const customerPhone = item.subscription?.user?.phone || item.subscription?.contactPhone || (item as any).customerPhone || "";
                const customerEmail = item.subscription?.user?.email || (item as any).customerEmail || "";
                const deliveryAddress = item.subscription?.deliveryAddress || (item as any).deliveryAddress || "Address on record";

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      padding: "20px 24px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Card Top Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
                      {/* Customer Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            backgroundColor: "#FFF7ED",
                            color: "#EA580C",
                            fontSize: "17px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {initial}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                              {customerName}
                            </h3>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                backgroundColor: tierColors.tierBg,
                                color: tierColors.tierColor,
                              }}
                            >
                              {planName} ({subTier})
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "4px", fontSize: "12.5px", color: "#64748B" }}>
                            {customerPhone && (
                              <a
                                href={`tel:${customerPhone}`}
                                style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#EA580C", textDecoration: "none", fontWeight: 600 }}
                              >
                                <Phone size={13} />
                                <span>{customerPhone}</span>
                              </a>
                            )}
                            {customerEmail && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Mail size={13} />
                                <span>{customerEmail}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meal Slot Badge & Timing */}
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "8px",
                            backgroundColor: item.isOverdue && !isDelivered ? "#FEF2F2" : "#FFF7ED",
                            color: item.isOverdue && !isDelivered ? "#DC2626" : "#C2410C",
                            border: item.isOverdue && !isDelivered ? "1px solid #FECACA" : "1px solid #FED7AA",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Utensils size={13} />
                          <span>{item.slotName}</span>
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: item.isOverdue && !isDelivered ? "#DC2626" : "#64748B" }}>
                          🕒 {item.scheduledTime || "Standard Window"}
                          {item.isOverdue && !isDelivered ? " (Window Ended)" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Details Row: Address & Scheduled occurrence */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "14px",
                        backgroundColor: "#F8FAFC",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid #F1F5F9",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <MapPin size={16} color="#EA580C" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.4 }}>
                          <strong>Delivery Address:</strong> {deliveryAddress}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#475569" }}>
                        <Calendar size={16} color="#EA580C" style={{ flexShrink: 0 }} />
                        <span>
                          <strong>Date:</strong> {item.scheduledDate}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Status & Toggle Action */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingTop: "4px" }}>
                      <div>
                        {isDelivered ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: "#DCFCE7",
                              color: "#15803D",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={16} />
                            <span>
                              Delivered{" "}
                              {item.deliveredAt
                                ? `(${new Date(item.deliveredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})`
                                : ""}
                            </span>
                          </span>
                        ) : isPaused ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: "#FEE2E2",
                              color: "#DC2626",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                            }}
                          >
                            <span>⏸️ Skipped (Subscription on Pause)</span>
                          </span>
                        ) : item.isOverdue ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: "#FEF2F2",
                              color: "#DC2626",
                              border: "1px solid #FECACA",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: 800,
                            }}
                          >
                            <AlertCircle size={16} />
                            <span>
                              Window Passed ({item.slotEndTime || ""})
                              {item.overdueMinutes && item.overdueMinutes > 0
                                ? ` • ${Math.floor(item.overdueMinutes / 60) > 0 ? `${Math.floor(item.overdueMinutes / 60)}h ` : ""}${item.overdueMinutes % 60}m late`
                                : ""}
                            </span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: "#FEF3C7",
                              color: "#B45309",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: 700,
                            }}
                          >
                            <Clock size={16} />
                            <span>Pending Delivery</span>
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      {!isPaused && (
                        <button
                          type="button"
                          onClick={() => handleToggleDeliveryStatus(item)}
                          disabled={actionInProgressId === item.id}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            backgroundColor: isDelivered
                              ? "#F1F5F9"
                              : item.isOverdue
                              ? "#DC2626"
                              : "#EA580C",
                            color: isDelivered ? "#475569" : "#FFFFFF",
                            border: isDelivered ? "1px solid #CBD5E1" : "none",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.15s ease",
                            boxShadow: isDelivered
                              ? "none"
                              : item.isOverdue
                              ? "0 2px 6px rgba(220, 38, 38, 0.25)"
                              : "none",
                          }}
                        >
                          {actionInProgressId === item.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isDelivered ? (
                            <Clock size={14} />
                          ) : (
                            <Key size={14} />
                          )}
                          <span>
                            {isDelivered
                              ? "Mark Pending"
                              : item.isOverdue
                              ? `Enter OTP & Deliver Late`
                              : `Enter OTP & Deliver`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && deliveries.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <PaginationControls
                currentPage={currentPage}
                totalItems={deliveries.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="deliveries"
                pageSizeOptions={[5, 10, 20, "All"]}
              />
            </div>
          )}
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

      {/* Customer Delivery OTP Verification Modal */}
      <DeliveryOtpModal
        isOpen={Boolean(otpModalDelivery)}
        onClose={() => setOtpModalDelivery(null)}
        onConfirm={handleConfirmDeliveryWithOtp}
        delivery={otpModalDelivery}
      />
    </div>
  );
}
