"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Search, X, Users } from "lucide-react";
import {
  fetchStoredMealPlans,
  getStoredMealSubscribers,
  MealSubscriber,
} from "@/lib/meal-subscriptions";
import { formatDeliveryAddressDisplay } from "./ManageSubscriptionCanvas";
import PaginationControls from "../common/PaginationControls";
import { useLiveShopStream } from "@/hooks/useLiveShopStream";

export type SubscriberFilterTab = "all" | "active" | "expired";

export interface SubscribersCanvasProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function SubscribersCanvas({
  searchQuery: externalSearchQuery,
  onSearchChange,
}: SubscribersCanvasProps = {}) {
  const [subscribers, setSubscribers] = useState<MealSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<SubscriberFilterTab>("all");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;

  const [subPage, setSubPage] = useState<number>(1);
  const [subPageSize, setSubPageSize] = useState<number | "All">(10);

  const handleClearSearch = () => {
    if (onSearchChange) onSearchChange("");
    setLocalSearchQuery("");
  };

  const refreshSubscribers = async () => {
    const cachedSubscribers = getStoredMealSubscribers();
    if (cachedSubscribers.length > 0) {
      setSubscribers(cachedSubscribers);
    }
    try {
      const data = await fetchStoredMealPlans();
      if (data && Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      }
    } finally {
      setLoading(false);
    }
  };

  useLiveShopStream({
    onMealPlanUpdated: () => {
      refreshSubscribers();
    },
    onMealSubscriptionUpdated: () => {
      refreshSubscribers();
    },
  });

  useEffect(() => {
    refreshSubscribers();
    window.addEventListener("meal-plans-updated", refreshSubscribers);
    window.addEventListener("meal-subscriptions-updated", refreshSubscribers);
    return () => {
      window.removeEventListener("meal-plans-updated", refreshSubscribers);
      window.removeEventListener("meal-subscriptions-updated", refreshSubscribers);
    };
  }, []);

  useEffect(() => {
    setSubPage(1);
  }, [searchQuery, activeFilter]);

  const isSubscriberActive = (s: MealSubscriber) => {
    const now = new Date();
    const statusStr = String(s.status || "").toUpperCase().trim();
    if (statusStr === "EXPIRED") return false;
    const isStatusActive = statusStr === "ACTIVE" || statusStr === "LIVE" || statusStr === "EXPIRING SOON";
    const notPaused = !s.isPaused && statusStr !== "PAUSED";
    const notExpired = !s.endDate || new Date(s.endDate) >= now;
    return isStatusActive && notPaused && notExpired;
  };

  const matchesSearch = (sub: MealSubscriber, rawQuery: string) => {
    const q = (rawQuery || "").toLowerCase().trim();
    if (!q) return true;
    const isActive = isSubscriberActive(sub);
    const displayStatus = isActive ? "Active" : sub.status === "Paused" ? "Paused" : "Expired";
    const formattedAddr = formatDeliveryAddressDisplay(sub.deliveryAddress, sub.roomNo);
    const rawAmountDigits = String(sub.amount || sub.pricePaid || "").replace(/[^\d.]/g, "");

    const rowText = [
      sub.customerName,
      sub.name,
      sub.customerPhone,
      sub.customerEmail,
      formattedAddr,
      sub.deliveryAddress,
      sub.roomNo,
      sub.planName,
      sub.tier,
      sub.cycle,
      sub.startDate,
      sub.renewalDate,
      sub.amount,
      rawAmountDigits,
      displayStatus,
      sub.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (rowText.includes(q)) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    return tokens.length > 1 && tokens.every((t) => rowText.includes(t));
  };

  const searchMatchedSubscribers = useMemo(() => {
    return subscribers.filter((sub) => matchesSearch(sub, searchQuery));
  }, [subscribers, searchQuery]);

  const counts = useMemo(() => {
    const allCount = searchMatchedSubscribers.length;
    const activeCount = searchMatchedSubscribers.filter((s) => isSubscriberActive(s)).length;
    const expiredCount = searchMatchedSubscribers.filter((s) => !isSubscriberActive(s)).length;
    return {
      all: allCount,
      active: activeCount,
      expired: expiredCount,
    };
  }, [searchMatchedSubscribers]);

  const filteredSubscribers = useMemo(() => {
    return searchMatchedSubscribers.filter((sub) => {
      const active = isSubscriberActive(sub);
      if (activeFilter === "active") return active;
      if (activeFilter === "expired") return !active;
      return true;
    });
  }, [searchMatchedSubscribers, activeFilter]);

  const paginatedSubscribers = useMemo(() => {
    if (subPageSize === "All") return filteredSubscribers;
    const numSize = Number(subPageSize) || 10;
    const startIdx = (subPage - 1) * numSize;
    return filteredSubscribers.slice(startIdx, startIdx + numSize);
  }, [filteredSubscribers, subPage, subPageSize]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1320px",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        padding: "28px 24px 40px 24px",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        margin: "0 auto",
      }}
    >
      {/* 1. Breadcrumb & Page Header below Navigation Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#64748B",
          }}
        >
          <Link
            href="/seller/subscription"
            style={{
              color: "#334155",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.15s ease",
            }}
          >
            <ChevronLeft size={15} />
            <span>Subscription</span>
          </Link>
          <span style={{ color: "#94A3B8" }}>/</span>
          <span style={{ color: "#FF5500", fontWeight: 700 }}>Subscribers</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.4px",
              }}
            >
              All Subscribers
            </h1>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0 0" }}>
              View and manage all active and expired meal plan subscribers.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filter Pills Row (All / Active / Expired) in Website Theme */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
        role="tablist"
      >
        {(
          [
            { id: "all", label: "All", count: counts.all },
            { id: "active", label: "Active", count: counts.active },
            { id: "expired", label: "Expired", count: counts.expired },
          ] as { id: SubscriberFilterTab; label: string; count: number }[]
        ).map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 22px",
                borderRadius: "9999px",
                border: isSelected ? "1px solid #FF5500" : "1px solid #E2E8F0",
                backgroundColor: isSelected ? "#FF5500" : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "#334155",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                boxShadow: isSelected
                  ? "0 4px 12px rgba(255, 85, 0, 0.25)"
                  : "0 1px 2px rgba(15, 23, 42, 0.03)",
              }}
            >
              <span>{tab.label}</span>
              {tab.id !== "all" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "22px",
                    height: "22px",
                    padding: "0 7px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: isSelected
                      ? "rgba(255, 255, 255, 0.24)"
                      : tab.id === "active"
                      ? "#FFF1E8"
                      : "#F1F5F9",
                    color: isSelected
                      ? "#FFFFFF"
                      : tab.id === "active"
                      ? "#FF5500"
                      : "#475569",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Search Indicator Banner */}
      {searchQuery.trim() && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFF7ED",
            border: "1px solid #FED7AA",
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "13px",
            color: "#9A3412",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={15} color="#EA580C" />
            <span>
              Showing <strong>{filteredSubscribers.length}</strong> subscriber(s) matching{" "}
              <strong>&ldquo;{searchQuery}&rdquo;</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSearch}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#EA580C",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <X size={14} />
            <span>Clear Search</span>
          </button>
        </div>
      )}

      {/* 3. Subscribers Table Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9px",
                backgroundColor: "#FFF1E8",
                color: "#FF5500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: 0,
                }}
              >
                {activeFilter === "active"
                  ? "Active Subscribers"
                  : activeFilter === "expired"
                  ? "Expired Subscribers"
                  : "All Subscribers Directory"}
              </h3>
              <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0 0" }}>
                {activeFilter === "active"
                  ? "Currently active subscriber accounts receiving scheduled deliveries."
                  : activeFilter === "expired"
                  ? "Past subscriber accounts whose billing cycle has ended."
                  : "Complete list of both active and expired meal plan subscribers."}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "12.5px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  fontSize: "11.5px",
                  letterSpacing: "0.02em",
                }}
              >
                <th style={{ padding: "11px 12px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  SUBSCRIBER
                </th>
                <th style={{ padding: "11px 12px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  MOBILE NUMBER
                </th>
                <th style={{ padding: "11px 12px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  DELIVERY ADDRESS
                </th>
                <th style={{ padding: "11px 12px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  PLAN PACKAGE
                </th>
                <th style={{ padding: "11px 10px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  START DATE
                </th>
                <th style={{ padding: "11px 10px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  NEXT RENEWAL
                </th>
                <th style={{ padding: "11px 10px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  AMOUNT
                </th>
                <th style={{ padding: "11px 12px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && subscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      color: "#64748B",
                      fontSize: "13.5px",
                    }}
                  >
                    Loading subscribers...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      color: "#64748B",
                      fontSize: "13.5px",
                    }}
                  >
                    {searchQuery.trim()
                      ? `No subscribers found matching "${searchQuery}".`
                      : activeFilter === "active"
                      ? "No active subscribers found."
                      : activeFilter === "expired"
                      ? "No expired subscribers found."
                      : "No subscribers yet."}
                  </td>
                </tr>
              ) : (
                paginatedSubscribers.map((sub) => {
                  const formattedAddress = formatDeliveryAddressDisplay(
                    sub.deliveryAddress,
                    sub.roomNo
                  );
                  const active = isSubscriberActive(sub);
                  const statusLabel = active
                    ? "Active"
                    : sub.status === "Paused"
                    ? "Paused"
                    : "Expired";

                  return (
                    <tr
                      key={sub.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 12px",
                          fontWeight: 600,
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.customerName || sub.name || "Subscriber"}
                      </td>
                      <td
                        style={{
                          padding: "12px 12px",
                          fontWeight: 600,
                          color: "#334155",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.customerPhone && sub.customerPhone.trim()
                          ? sub.customerPhone.trim()
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 12px",
                          color: "#475569",
                          maxWidth: "240px",
                          minWidth: "160px",
                        }}
                        title={formattedAddress}
                      >
                        <div
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.35,
                            wordBreak: "break-word",
                          }}
                        >
                          {formattedAddress}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 12px",
                          color: "#334155",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.planName}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          color: "#64748B",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.startDate}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          color: "#64748B",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.renewalDate}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          fontWeight: 700,
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sub.amount}
                      </td>
                      <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "5px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            backgroundColor:
                              statusLabel === "Active"
                                ? "#DCFCE7"
                                : statusLabel === "Paused"
                                ? "#FEF3C7"
                                : "#F1F5F9",
                            color:
                              statusLabel === "Active"
                                ? "#15803D"
                                : statusLabel === "Paused"
                                ? "#B45309"
                                : "#64748B",
                          }}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={subPage}
          totalItems={filteredSubscribers.length}
          pageSize={subPageSize}
          onPageChange={setSubPage}
          onPageSizeChange={setSubPageSize}
          itemLabel="subscribers"
          pageSizeOptions={[5, 10, 20, "All"]}
        />
      </div>
    </div>
  );
}
