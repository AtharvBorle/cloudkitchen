"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Users,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  fetchStoredMealPlans,
  getStoredMealPlans,
  getStoredMealSubscribers,
  updateMealPlan,
  MealSubscriptionPlan,
  MealSubscriber,
} from "@/lib/meal-subscriptions";

export type PlanItem = MealSubscriptionPlan;
export type RecentSubscriber = MealSubscriber;

export default function ManageSubscriptionCanvas() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [subscribers, setSubscribers] = useState<RecentSubscriber[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft">("all");
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    const cachedPlans = getStoredMealPlans();
    const cachedSubscribers = getStoredMealSubscribers();
    if (cachedPlans.length > 0 || cachedSubscribers.length > 0) {
      setPlans(cachedPlans);
      setSubscribers(cachedSubscribers);
    }

    try {
      const data = await fetchStoredMealPlans();
      if (data) {
        setPlans(data.plans);
        setSubscribers(data.subscribers);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("meal-plans-updated", refreshData);
    return () => {
      window.removeEventListener("meal-plans-updated", refreshData);
    };
  }, []);

  const togglePlanStatus = async (id: string) => {
    const target = plans.find((p) => p.id === id || p.planId === id);
    if (target) {
      const nextStatus = target.status === "Live" ? "Paused" : "Live";
      await updateMealPlan(target.id, { status: nextStatus });
      refreshData();
    }
  };

  const filteredPlans = plans.filter((plan) => {
    if (activeTab === "active") return plan.status === "Live";
    if (activeTab === "draft") return plan.status === "Draft" || plan.status === "Paused";
    return true;
  });

  const activePlansCount = plans.filter((p) => p.status === "Live").length;
  const totalSubscribers = subscribers.filter((s) => s.status === "Active").length + plans.reduce((sum, p) => sum + (p.subscribersCount || 0), 0);
  const totalMonthlyRevNum = subscribers.reduce((sum, s) => sum + (parseFloat((s.amount || "").replace(/[^\d.]/g, "")) || 0), 0) +
    plans.reduce((sum, p) => sum + (parseFloat((p.monthlyPrice || "").replace(/[^\d.]/g, "")) || 0) * (p.subscribersCount || 0), 0);
  const totalMonthlyRev = totalMonthlyRevNum > 0 ? `₹${totalMonthlyRevNum.toLocaleString("en-IN")}` : "₹0";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1320px",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        padding: "32px 24px",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        margin: "0 auto",
      }}
      className="manage-subscription-canvas"
    >
      {/* 1. Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.4px",
              }}
            >
              Manage Subscriptions
            </h1>
            <span
              style={{
                backgroundColor: "#DCFCE7",
                color: "#15803D",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "6px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              LIVE REVENUE
            </span>
          </div>
          <p
            style={{
              fontSize: "13.5px",
              color: "#64748B",
              margin: 0,
              fontWeight: 400,
            }}
          >
            Manage meal subscription tiers, active subscriber accounts, and pricing plans.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/seller/subscription/add"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FF5500",
              color: "#FFFFFF",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(255, 85, 0, 0.25)",
              transition: "all 0.18s ease",
            }}
            className="add-plan-btn"
          >
            <Plus size={16} strokeWidth={2.8} />
            <span>Add New Plan</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "18px",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="kpi-grid"
      >
        {/* Metric 1 */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#64748B" }}>
              Total Active Subscribers
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#FFF1E8",
                color: "#FF5500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>{totalSubscribers}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#16A34A", fontWeight: 700 }}>Active</span>
            <span style={{ color: "#94A3B8" }}>resident meal packages</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#64748B" }}>
              Monthly Recurring Revenue
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>{totalMonthlyRev}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#16A34A", fontWeight: 700 }}>Live</span>
            <span style={{ color: "#94A3B8" }}>recurring billing</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#64748B" }}>
              Active Plan Tiers
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#F3E8FF",
                color: "#8B5CF6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>{activePlansCount} Live</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#8B5CF6", fontWeight: 700 }}>Available</span>
            <span style={{ color: "#94A3B8" }}>for kitchen subscriptions</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#64748B" }}>
              Avg. Meal Fulfilment
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#E0F2FE",
                color: "#0284C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={18} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>100%</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <span style={{ color: "#0284C7", fontWeight: 700 }}>On-Time</span>
            <span style={{ color: "#94A3B8" }}>daily meal delivery</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Segmented Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#FFFFFF",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "all" ? 700 : 500,
              backgroundColor: activeTab === "all" ? "#FF5500" : "transparent",
              color: activeTab === "all" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All Plans ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "active" ? 700 : 500,
              backgroundColor: activeTab === "active" ? "#FF5500" : "transparent",
              color: activeTab === "active" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Active ({plans.filter((p) => p.status === "Live").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "draft" ? 700 : 500,
              backgroundColor: activeTab === "draft" ? "#FF5500" : "transparent",
              color: activeTab === "draft" ? "#FFFFFF" : "#64748B",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Drafts ({plans.filter((p) => p.status === "Draft").length})
          </button>
        </div>

        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
          Showing {filteredPlans.length} subscription packages
        </span>
      </div>

      {/* 4. Active Subscription Plan Cards */}
      {filteredPlans.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            border: "1.5px dashed #CBD5E1",
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "#FFF1E8",
              color: "#FF5500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CreditCard size={28} />
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
            No subscription plans found
          </h3>
          <p style={{ fontSize: "13.5px", color: "#64748B", margin: 0, maxWidth: "440px" }}>
            Create custom Bronze, Silver, or Gold meal packages (breakfast, lunch, or dinner) to start offering subscription dining.
          </p>
          <Link
            href="/seller/subscription/add"
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FF5500",
              color: "#FFFFFF",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <Plus size={16} strokeWidth={2.8} />
            <span>Create First Plan</span>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "24px",
            width: "100%",
            boxSizing: "border-box",
          }}
          className="plans-grid"
        >
          {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "20px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
              transition: "all 0.2s ease",
              position: "relative",
            }}
            className="plan-card"
          >
            {/* Top Row: Tier badge + Status */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    backgroundColor: plan.tierBg,
                    color: plan.tierColor,
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 9px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {plan.tier}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: plan.status === "Live" ? "#22C55E" : "#94A3B8",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: plan.status === "Live" ? "#16A34A" : "#64748B",
                    }}
                  >
                    {plan.status}
                  </span>
                </div>
              </div>

              {/* Plan Name & ID */}
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: "0 0 4px 0",
                }}
              >
                {plan.name}
              </h3>
              <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500 }}>
                ID: #{plan.planId} • Active since {plan.deployedDate}
              </span>

              {/* Price Row */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  backgroundColor: "#F8FAFC",
                  borderRadius: "10px",
                  border: "1px solid #F1F5F9",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>
                    {plan.monthlyPrice}
                  </span>
                  <span style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>
                    / month
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                    fontSize: "11.5px",
                    color: "#64748B",
                  }}
                >
                  <span>Quarterly: {plan.quarterlyPrice}</span>
                  <span>Yearly: {plan.yearlyPrice}</span>
                </div>
              </div>

              {/* Inclusions List */}
              <div style={{ marginTop: "18px" }}>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Plan Inclusions:
                </span>
                <ul
                  style={{
                    margin: "8px 0 0 0",
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {plan.features.map((feat, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        fontSize: "12.5px",
                        color: "#334155",
                        lineHeight: 1.4,
                      }}
                    >
                      <Check
                        size={14}
                        color="#16A34A"
                        style={{ marginTop: "2px", flexShrink: 0 }}
                        strokeWidth={2.6}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Meal Timings */}
              <div style={{ marginTop: "14px" }}>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Scheduled Timings:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {plan.mealTimings.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "11.5px",
                        backgroundColor: "#F1F5F9",
                        color: "#475569",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Clock size={11} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Card Footer: Subscribers, Revenue & Action Button */}
            <div
              style={{
                borderTop: "1px solid #F1F5F9",
                paddingTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                    {plan.subscribersCount} Users
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>Active Subscribers</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#16A34A" }}>
                    {plan.monthlyRevenue}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>Monthly Rev.</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href={`/seller/subscription/edit?id=${plan.planId}`}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    backgroundColor: "#FFF1E8",
                    color: "#FF5500",
                    border: "1px solid #FFD9C6",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                  className="edit-plan-btn"
                >
                  <Edit2 size={13} strokeWidth={2.4} />
                  <span>Edit Plan</span>
                </Link>

                <button
                  type="button"
                  onClick={() => togglePlanStatus(plan.id)}
                  style={{
                    backgroundColor: "#F8FAFC",
                    color: plan.status === "Live" ? "#64748B" : "#16A34A",
                    border: "1px solid #E2E8F0",
                    padding: "9px 14px",
                    borderRadius: "7px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {plan.status === "Live" ? "Pause" : "Resume"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 5. Recent Active Subscribers Ledger Card */}
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
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              Recent Active Subscribers
            </h3>
            <p style={{ fontSize: "12.5px", color: "#64748B", margin: "2px 0 0 0" }}>
              Live resident assignments and auto-renewals.
            </p>
          </div>

          <Link
            href="/seller/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#FF5500",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span>View Orders</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Subscribers Table */}
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>RESIDENT</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>ROOM ASSIGNED</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>PLAN PACKAGE</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>START DATE</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>NEXT RENEWAL</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>AMOUNT</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      color: "#64748B",
                      fontSize: "13.5px",
                    }}
                  >
                    No active subscribers yet. Once residents subscribe to your meal plans, their assignments will appear here.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      transition: "background-color 0.15s ease",
                    }}
                    className="sub-row"
                  >
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0F172A" }}>
                      {sub.name}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#475569" }}>{sub.roomNo}</td>
                    <td style={{ padding: "14px 16px", color: "#334155", fontWeight: 500 }}>
                      {sub.planName}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748B" }}>{sub.startDate}</td>
                    <td style={{ padding: "14px 16px", color: "#64748B" }}>{sub.renewalDate}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0F172A" }}>
                      {sub.amount}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "5px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          backgroundColor:
                            sub.status === "Active"
                              ? "#DCFCE7"
                              : sub.status === "Expiring Soon"
                              ? "#FEF3C7"
                              : "#F1F5F9",
                          color:
                            sub.status === "Active"
                              ? "#15803D"
                              : sub.status === "Expiring Soon"
                              ? "#B45309"
                              : "#64748B",
                        }}
                      >
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .add-plan-btn:hover {
          background-color: #e64d00 !important;
          transform: translateY(-1px);
        }
        .edit-plan-btn:hover {
          background-color: #ffebd8 !important;
        }
        .plan-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06) !important;
        }
        .sub-row:hover {
          background-color: #f8fafc !important;
        }
        @media (max-width: 1100px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: 1fr !important;
          }
          .plans-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
