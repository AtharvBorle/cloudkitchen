"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/fetch-api";
import { useRoomModule } from "@/context/RoomModuleContext";
import { PageSizeSelector } from "@/components/seller/common/PaginationControls";
import {
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Utensils,
  Home,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  Eye,
  Power,
  Users,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

export interface SellerItem {
  id: string;
  sellerProfileId: string | null;
  name: string;
  email: string;
  phone: string;
  city: string;
  pincode: string;
  addressLocality: string;
  addressFlat: string;
  isActive: boolean;
  isPlatformActive: boolean;
  businessName: string;
  type: string;
  verificationStatus: string;
  isOnline: boolean;
  trackingId: string | null;
  foodVerificationStatus: string;
  propertyVerificationStatus: string;
  businessCategory: string; // "FOOD" | "ROOM" | "BOTH"
  rawBusinessCategory: string;
  foodType: string; // "VEG" | "NON_VEG" | "BOTH"
  rawFoodType: string;
  hasActiveSubscription: boolean;
  subscriptionValidUntil: string | null;
  subscriptionId: string | null;
  createdAt: string;
}

export interface SuperadminStats {
  totalAgents: number;
  totalSellers: number;
  activeSellers: number;
  onlineSellers: number;
  pendingSellers: number;
  totalSubscriptions: number;
}

export default function SuperadminOverview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isRoomEnabled } = useRoomModule();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SuperadminStats | null>(null);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedSellerModal, setSelectedSellerModal] = useState<SellerItem | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ONLINE" | "OFFLINE">("ALL");
  const [filterApplication, setFilterApplication] = useState<"ALL" | "FOOD" | "ROOM" | "BOTH">("ALL");
  const [filterFoodType, setFilterFoodType] = useState<"ALL" | "VEG" | "NON_VEG" | "BOTH">("ALL");
  const [filterVerification, setFilterVerification] = useState<"ALL" | "APPROVED" | "PENDING" | "REVISION" | "REJECTED">("ALL");
  const [filterSubscription, setFilterSubscription] = useState<"ALL" | "SUBSCRIBED" | "UNSUBSCRIBED">("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [statsRes, sellersRes] = await Promise.all([
        fetchApi("/api/superadmin/stats"),
        fetchApi("/api/superadmin/sellers"),
      ]);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson.data || statsJson);
      }

      if (sellersRes.ok) {
        const sellersJson = await sellersRes.json();
        const sellerData = sellersJson.data?.sellers || sellersJson.sellers || [];
        setSellers(sellerData);
      }
    } catch (err) {
      console.error("Failed to fetch superadmin data:", err);
      showToast("error", "Failed to load live superadmin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || (session?.user as any)?.role !== "SUPERADMIN") {
      router.push("/dashboard/admin");
      return;
    }

    loadData();
  }, [status, session, router, loadData]);

  // Derived filter counts
  const totalCount = sellers.length;
  const activeSellersCount = useMemo(() => sellers.filter((s) => s.isPlatformActive).length, [sellers]);
  const onlineSellersCount = useMemo(() => sellers.filter((s) => s.isPlatformActive && s.isOnline).length, [sellers]);
  const foodCount = useMemo(() => sellers.filter((s) => s.businessCategory === "FOOD" || s.businessCategory === "BOTH").length, [sellers]);
  const roomCount = useMemo(() => sellers.filter((s) => s.businessCategory === "ROOM" || s.businessCategory === "BOTH").length, [sellers]);
  const vegCount = useMemo(() => sellers.filter((s) => s.foodType === "VEG").length, [sellers]);
  const pendingCount = useMemo(() => sellers.filter((s) => s.verificationStatus === "PENDING").length, [sellers]);

  // Active filters count
  const isAnyFilterActive =
    searchQuery.trim() !== "" ||
    filterStatus !== "ALL" ||
    filterApplication !== "ALL" ||
    filterFoodType !== "ALL" ||
    filterVerification !== "ALL" ||
    filterSubscription !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus("ALL");
    setFilterApplication("ALL");
    setFilterFoodType("ALL");
    setFilterVerification("ALL");
    setFilterSubscription("ALL");
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (seller.businessName && seller.businessName.toLowerCase().includes(q)) ||
          (seller.name && seller.name.toLowerCase().includes(q)) ||
          (seller.email && seller.email.toLowerCase().includes(q)) ||
          (seller.phone && seller.phone.toLowerCase().includes(q)) ||
          (seller.trackingId && seller.trackingId.toLowerCase().includes(q)) ||
          (seller.city && seller.city.toLowerCase().includes(q)) ||
          (seller.addressLocality && seller.addressLocality.toLowerCase().includes(q)) ||
          (seller.type && seller.type.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Status Filter
      if (filterStatus === "ACTIVE") {
        if (!seller.isPlatformActive) return false;
      } else if (filterStatus === "INACTIVE") {
        if (seller.isPlatformActive) return false;
      } else if (filterStatus === "ONLINE") {
        if (!seller.isOnline || !seller.isPlatformActive) return false;
      } else if (filterStatus === "OFFLINE") {
        if (seller.isOnline) return false;
      }

      // 3. Application Filter
      if (filterApplication !== "ALL") {
        if (seller.businessCategory !== filterApplication) return false;
      }

      // 4. Dietary Preference Filter
      if (filterFoodType !== "ALL") {
        if (seller.foodType !== filterFoodType) return false;
      }

      // 5. Verification Filter
      if (filterVerification !== "ALL") {
        if (seller.verificationStatus.toUpperCase() !== filterVerification) return false;
      }

      // 6. Subscription Filter
      if (filterSubscription === "SUBSCRIBED") {
        if (!seller.hasActiveSubscription) return false;
      } else if (filterSubscription === "UNSUBSCRIBED") {
        if (seller.hasActiveSubscription) return false;
      }

      return true;
    });
  }, [
    sellers,
    searchQuery,
    filterStatus,
    filterApplication,
    filterFoodType,
    filterVerification,
    filterSubscription,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSellers.length / pageSize) || 1;
  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSellers.slice(startIndex, startIndex + pageSize);
  }, [filteredSellers, currentPage, pageSize]);

  // Adjust page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterApplication, filterFoodType, filterVerification, filterSubscription, pageSize]);

  // Toggle seller enabled/disabled
  const handleToggleSellerActive = async (seller: SellerItem) => {
    const nextActive = !seller.isActive;
    setToggleLoadingId(seller.id);
    try {
      const res = await fetchApi(`/api/superadmin/sellers/${seller.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === seller.id
              ? {
                  ...s,
                  isActive: nextActive,
                  isPlatformActive: nextActive && s.verificationStatus === "APPROVED",
                }
              : s
          )
        );
        showToast(
          "success",
          `Seller "${seller.businessName}" account has been ${nextActive ? "enabled" : "disabled"}.`
        );
      } else {
        showToast("error", "Failed to update seller active state.");
      }
    } catch (err) {
      console.error("Error toggling seller status:", err);
      showToast("error", "Network error updating seller status.");
    } finally {
      setToggleLoadingId(null);
    }
  };

  const getVerificationBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED") {
      return (
        <span style={{ backgroundColor: "#DCFCE7", color: "#15803D", padding: "4px 10px", borderRadius: "12px", fontSize: "0.74rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <CheckCircle2 size={12} /> APPROVED
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span style={{ backgroundColor: "#FEF3C7", color: "#B45309", padding: "4px 10px", borderRadius: "12px", fontSize: "0.74rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <Clock size={12} /> PENDING
        </span>
      );
    }
    if (s === "REVISION") {
      return (
        <span style={{ backgroundColor: "#E0F2FE", color: "#0369A1", padding: "4px 10px", borderRadius: "12px", fontSize: "0.74rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <AlertCircle size={12} /> REVISION
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", padding: "4px 10px", borderRadius: "12px", fontSize: "0.74rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <XCircle size={12} /> {s || "REJECTED"}
      </span>
    );
  };

  const getDietaryPill = (foodType: string) => {
    const ft = (foodType || "BOTH").toUpperCase();
    if (ft === "VEG") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#F0FDF4", color: "#166534", padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", border: "1px solid #BBF7D0" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16A34A" }} />
          Pure Veg
        </span>
      );
    }
    if (ft === "NON_VEG") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#FEF2F2", color: "#991B1B", padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", border: "1px solid #FECACA" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#DC2626" }} />
          Non-Veg
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#FFF7ED", color: "#9A3412", padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", border: "1px solid #FED7AA" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EA580C" }} />
        Both (Veg & Non-Veg)
      </span>
    );
  };

  const getApplicationBadge = (cat: string) => {
    const c = (cat || "FOOD").toUpperCase();
    if (c === "FOOD") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#EFF6FF", color: "#1D4ED8", padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600" }}>
          <Utensils size={12} /> Food Kitchen
        </span>
      );
    }
    if (c === "ROOM") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#F5F3FF", color: "#6D28D9", padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600" }}>
          <Home size={12} /> Rooms / Stay
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#FAF5FF", color: "#7E22CE", padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "600" }}>
        <Layers size={12} /> Both (Food & Rooms)
      </span>
    );
  };

  if (loading || status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "var(--font-sans)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "3px solid #F16F68", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "1.05rem", color: "#475569", fontWeight: "600" }}>Loading Superadmin Panel...</span>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const effectiveActiveSellers = stats?.activeSellers ?? activeSellersCount;
  const effectiveOnlineSellers = stats?.onlineSellers ?? onlineSellersCount;
  const effectiveTotalSellers = stats?.totalSellers ?? totalCount;
  const effectiveSubscriptions = stats?.totalSubscriptions ?? 0;
  const effectiveAgents = stats?.totalAgents ?? 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", padding: "32px", fontFamily: "var(--font-sans)" }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            backgroundColor: toastMessage.type === "success" ? "#10B981" : "#EF4444",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: "600",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
            Super Admin Panel Overview
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.95rem" }}>
            Real-time platform metrics, active kitchen directory, and seller management.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              color: "#334155",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: refreshing ? "wait" : "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
            title="Refresh live data"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>

          <button
            type="button"
            onClick={() => performLogout({ role: "SUPERADMIN" })}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              color: "#EF4444",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px", marginBottom: "36px" }}>
        {/* Active Sellers Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "24px",
            borderRadius: "16px",
            border: "1.5px solid #F1F5F9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Sellers
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: "900", color: "#0F172A", marginTop: "6px" }}>
                {effectiveActiveSellers}
              </div>
            </div>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
              <Building2 size={24} />
            </div>
          </div>
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#16A34A", fontWeight: "700" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16A34A" }} />
              {effectiveOnlineSellers} Online Now
            </span>
            <span style={{ color: "#94A3B8" }}>•</span>
            <span style={{ color: "#64748B" }}>of {effectiveTotalSellers} registered</span>
          </div>
        </div>

        {/* Total Registered Sellers Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "24px",
            borderRadius: "16px",
            border: "1.5px solid #F1F5F9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Sellers
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: "900", color: "#0F172A", marginTop: "6px" }}>
                {effectiveTotalSellers}
              </div>
            </div>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16A34A" }}>
              <Users size={24} />
            </div>
          </div>
          <div style={{ marginTop: "12px", fontSize: "0.82rem", color: "#B45309", fontWeight: "600" }}>
            {pendingCount} Pending Verification
          </div>
        </div>

        {/* Subscriptions Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "24px",
            borderRadius: "16px",
            border: "1.5px solid #F1F5F9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Subscriptions
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: "900", color: "#0F172A", marginTop: "6px" }}>
                {effectiveSubscriptions}
              </div>
            </div>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#F0FDFA", display: "flex", alignItems: "center", justifyContent: "center", color: "#0D9488" }}>
              <CreditCard size={24} />
            </div>
          </div>
          <div style={{ marginTop: "12px", fontSize: "0.82rem", color: "#64748B" }}>
            Platform revenue packages
          </div>
        </div>

        {/* Total Admins Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "24px",
            borderRadius: "16px",
            border: "1.5px solid #F1F5F9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Platform Admins
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: "900", color: "#0F172A", marginTop: "6px" }}>
                {effectiveAgents}
              </div>
            </div>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
              <ShieldCheck size={24} />
            </div>
          </div>
          <div style={{ marginTop: "12px", fontSize: "0.82rem", color: "#64748B" }}>
            Agents, Support & Reel Managers
          </div>
        </div>
      </div>

      {/* ACTIVE SELLERS SECTION */}
      <section
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          border: "1.5px solid #E2E8F0",
          boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
          padding: "28px",
          marginBottom: "36px",
        }}
      >
        {/* Section Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                Active Sellers Directory
              </h2>
              <span style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "700" }}>
                {filteredSellers.length} {filteredSellers.length === 1 ? "Seller" : "Sellers"} Found
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "0.9rem" }}>
              Filter and verify actual active, online, food category, and dietary options across the platform.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/dashboard/superadmin/sellers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "10px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #CBD5E1",
                color: "#334155",
                fontSize: "0.85rem",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              <span>Manage Categories</span>
              <ExternalLink size={14} />
            </Link>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => {
              setFilterStatus("ALL");
              setFilterApplication("ALL");
              setFilterFoodType("ALL");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: filterStatus === "ALL" && filterApplication === "ALL" && filterFoodType === "ALL" ? "1.5px solid #0F172A" : "1px solid #E2E8F0",
              backgroundColor: filterStatus === "ALL" && filterApplication === "ALL" && filterFoodType === "ALL" ? "#0F172A" : "#FFFFFF",
              color: filterStatus === "ALL" && filterApplication === "ALL" && filterFoodType === "ALL" ? "#FFFFFF" : "#475569",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            All Sellers ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === "ACTIVE" ? "ALL" : "ACTIVE")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: filterStatus === "ACTIVE" ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
              backgroundColor: filterStatus === "ACTIVE" ? "#DCFCE7" : "#FFFFFF",
              color: filterStatus === "ACTIVE" ? "#166534" : "#475569",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Active & Verified ({activeSellersCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === "ONLINE" ? "ALL" : "ONLINE")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: filterStatus === "ONLINE" ? "1.5px solid #059669" : "1px solid #E2E8F0",
              backgroundColor: filterStatus === "ONLINE" ? "#D1FAE5" : "#FFFFFF",
              color: filterStatus === "ONLINE" ? "#065F46" : "#475569",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ● Online Now ({onlineSellersCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterApplication(filterApplication === "FOOD" ? "ALL" : "FOOD")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: filterApplication === "FOOD" ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
              backgroundColor: filterApplication === "FOOD" ? "#DBEAFE" : "#FFFFFF",
              color: filterApplication === "FOOD" ? "#1E40AF" : "#475569",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Food Kitchens ({foodCount})
          </button>

          {isRoomEnabled && (
            <button
              type="button"
              onClick={() => setFilterApplication(filterApplication === "ROOM" ? "ALL" : "ROOM")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: filterApplication === "ROOM" ? "1.5px solid #7C3AED" : "1px solid #E2E8F0",
                backgroundColor: filterApplication === "ROOM" ? "#EDE9FE" : "#FFFFFF",
                color: filterApplication === "ROOM" ? "#5B21B6" : "#475569",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Rooms & Stay ({roomCount})
            </button>
          )}

          <button
            type="button"
            onClick={() => setFilterFoodType(filterFoodType === "VEG" ? "ALL" : "VEG")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: filterFoodType === "VEG" ? "1.5px solid #16A34A" : "1px solid #E2E8F0",
              backgroundColor: filterFoodType === "VEG" ? "#DCFCE7" : "#FFFFFF",
              color: filterFoodType === "VEG" ? "#166534" : "#475569",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Pure Veg ({vegCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterVerification(filterVerification === "PENDING" ? "ALL" : "PENDING")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: filterVerification === "PENDING" ? "1.5px solid #D97706" : "1px solid #E2E8F0",
              backgroundColor: filterVerification === "PENDING" ? "#FEF3C7" : "#FFFFFF",
              color: filterVerification === "PENDING" ? "#92400E" : "#475569",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Pending Verification ({pendingCount})
          </button>
        </div>

        {/* Detailed Filter Toolbar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            padding: "18px",
            backgroundColor: "#F8FAFC",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            marginBottom: "20px",
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", gridColumn: "span 2" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "4px", textTransform: "uppercase" }}>
              Search Sellers
            </label>
            <div style={{ position: "relative" }}>
              <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business, owner, phone, email, tracking ID..."
                style={{
                  width: "100%",
                  padding: "9px 36px 9px 36px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.86rem",
                  color: "#0F172A",
                  backgroundColor: "#FFFFFF",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Application Category Filter */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "4px", textTransform: "uppercase" }}>
              Application
            </label>
            <select
              value={filterApplication}
              onChange={(e) => setFilterApplication(e.target.value as any)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "0.86rem",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Applications</option>
              <option value="FOOD">Food (Kitchens / Mess)</option>
              {isRoomEnabled && <option value="ROOM">Rooms & Accommodations</option>}
              <option value="BOTH">Both (Food & Rooms)</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "4px", textTransform: "uppercase" }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "0.86rem",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (Approved & Enabled)</option>
              <option value="INACTIVE">Inactive / Disabled</option>
              <option value="ONLINE">Online Now</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          {/* Dietary Preference Filter */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "4px", textTransform: "uppercase" }}>
              Dietary / Food Type
            </label>
            <select
              value={filterFoodType}
              onChange={(e) => setFilterFoodType(e.target.value as any)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "0.86rem",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Food Types</option>
              <option value="VEG">Pure Veg</option>
              <option value="NON_VEG">Non-Veg</option>
              <option value="BOTH">Both (Veg & Non-Veg)</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "4px", textTransform: "uppercase" }}>
              Verification
            </label>
            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value as any)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "0.86rem",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Verifications</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REVISION">Revision Needed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Subscription Status Filter */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "4px", textTransform: "uppercase" }}>
              Subscription
            </label>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value as any)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "0.86rem",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Subscriptions</option>
              <option value="SUBSCRIBED">Active Subscription</option>
              <option value="UNSUBSCRIBED">No Active Subscription / Expired</option>
            </select>
          </div>
        </div>

        {/* Sellers Data Table */}
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0", color: "#475569", fontWeight: "700", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "14px 18px" }}>Kitchen / Business Name</th>
                <th style={{ padding: "14px 18px" }}>Owner & Contact</th>
                <th style={{ padding: "14px 18px" }}>Application</th>
                <th style={{ padding: "14px 18px" }}>Dietary Type</th>
                <th style={{ padding: "14px 18px", textAlign: "center" }}>Status</th>
                <th style={{ padding: "14px 18px" }}>Verification</th>
                <th style={{ padding: "14px 18px" }}>Subscription</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSellers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={36} color="#94A3B8" />
                      <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#334155" }}>
                        No sellers match your filter criteria
                      </span>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#94A3B8" }}>
                        Try clearing or modifying the search keyword or status filters.
                      </p>
                      {isAnyFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          style={{
                            marginTop: "8px",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            backgroundColor: "#0F172A",
                            color: "#FFFFFF",
                            border: "none",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSellers.map((seller) => {
                  const isPendingToggle = toggleLoadingId === seller.id;
                  return (
                    <tr
                      key={seller.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Kitchen / Business Name */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: "700", color: "#0F172A", fontSize: "0.95rem" }}>
                          {seller.businessName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          {seller.trackingId && (
                            <span style={{ backgroundColor: "#F1F5F9", color: "#475569", padding: "1px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "600" }}>
                              {seller.trackingId}
                            </span>
                          )}
                          {(seller.city || seller.addressLocality) && (
                            <span style={{ color: "#64748B", fontSize: "0.78rem" }}>
                              {[seller.addressLocality, seller.city].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: "600", color: "#1E293B" }}>{seller.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "2px" }}>
                          {seller.phone || "No phone"}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                          {seller.email}
                        </div>
                      </td>

                      {/* Application Category */}
                      <td style={{ padding: "14px 18px" }}>
                        {getApplicationBadge(seller.businessCategory)}
                      </td>

                      {/* Dietary Type */}
                      <td style={{ padding: "14px 18px" }}>
                        {getDietaryPill(seller.foodType)}
                      </td>

                      {/* Account & Online Status */}
                      <td style={{ padding: "14px 18px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "10px",
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              backgroundColor: seller.isActive ? "#DCFCE7" : "#FEE2E2",
                              color: seller.isActive ? "#15803D" : "#B91C1C",
                            }}
                          >
                            {seller.isActive ? "Enabled" : "Disabled"}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              color: seller.isOnline ? "#16A34A" : "#94A3B8",
                              fontWeight: "600",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: seller.isOnline ? "#16A34A" : "#94A3B8",
                              }}
                            />
                            {seller.isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td style={{ padding: "14px 18px" }}>
                        {getVerificationBadge(seller.verificationStatus)}
                      </td>

                      {/* Subscription Status */}
                      <td style={{ padding: "14px 18px" }}>
                        {seller.hasActiveSubscription ? (
                          <div>
                            <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: "700" }}>
                              Subscribed
                            </span>
                            {seller.subscriptionValidUntil && (
                              <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: "3px" }}>
                                Till {new Date(seller.subscriptionValidUntil).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ backgroundColor: "#F1F5F9", color: "#64748B", padding: "3px 8px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: "600" }}>
                            Unsubscribed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSellerModal(seller)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              backgroundColor: "#F8FAFC",
                              border: "1px solid #CBD5E1",
                              color: "#334155",
                              fontSize: "0.78rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="View seller profile details"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSellerActive(seller)}
                            disabled={isPendingToggle}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              backgroundColor: seller.isActive ? "#FEF2F2" : "#F0FDF4",
                              border: seller.isActive ? "1px solid #FECACA" : "1px solid #BBF7D0",
                              color: seller.isActive ? "#DC2626" : "#16A34A",
                              fontSize: "0.78rem",
                              fontWeight: "600",
                              cursor: isPendingToggle ? "wait" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title={seller.isActive ? "Disable seller login & shop" : "Enable seller account"}
                          >
                            <Power size={13} />
                            <span>{seller.isActive ? "Disable" : "Enable"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredSellers.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginTop: "20px", gap: "12px", fontSize: "0.85rem", color: "#64748B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={(newSize) => {
                  setPageSize(Number(newSize) || 10);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
                label="Per page:"
              />
              <span>(Total {filteredSellers.length} sellers)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: "inline-flex", gap: "4px" }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: currentPage <= 1 ? "#F1F5F9" : "#FFFFFF",
                    color: currentPage <= 1 ? "#94A3B8" : "#0F172A",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: currentPage >= totalPages ? "#F1F5F9" : "#FFFFFF",
                    color: currentPage >= totalPages ? "#94A3B8" : "#0F172A",
                    cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick Navigation Cards */}
      <div style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: "20px", border: "1.5px solid #E2E8F0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0F172A", marginBottom: "16px" }}>
          Super Admin Management Shortcuts
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <Link
            href="/dashboard/superadmin/sellers"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              textDecoration: "none",
              backgroundColor: "#F8FAFC",
              display: "block",
            }}
          >
            <div style={{ fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>Sellers & Categories</div>
            <div style={{ fontSize: "0.82rem", color: "#64748B" }}>Configure global cuisine dictionaries & category assignments</div>
          </Link>

          <Link
            href="/dashboard/superadmin/subscriptions"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              textDecoration: "none",
              backgroundColor: "#F8FAFC",
              display: "block",
            }}
          >
            <div style={{ fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>Platform Subscriptions</div>
            <div style={{ fontSize: "0.82rem", color: "#64748B" }}>Manage seller subscription plans, fees, and feature quotas</div>
          </Link>

          <Link
            href="/dashboard/superadmin/coupons"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              textDecoration: "none",
              backgroundColor: "#F8FAFC",
              display: "block",
            }}
          >
            <div style={{ fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>Global Coupons</div>
            <div style={{ fontSize: "0.82rem", color: "#64748B" }}>Set up sitewide discount codes and auto-apply rules</div>
          </Link>

          <Link
            href="/dashboard/superadmin/admins"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              textDecoration: "none",
              backgroundColor: "#F8FAFC",
              display: "block",
            }}
          >
            <div style={{ fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>Admin Accounts</div>
            <div style={{ fontSize: "0.82rem", color: "#64748B" }}>Manage platform agents, roles, and administrative permissions</div>
          </Link>
        </div>
      </div>

      {/* Seller Details Modal */}
      {selectedSellerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setSelectedSellerModal(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "800", color: "#0F172A" }}>
                  {selectedSellerModal.businessName}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  {selectedSellerModal.trackingId && (
                    <span style={{ backgroundColor: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                      {selectedSellerModal.trackingId}
                    </span>
                  )}
                  {getVerificationBadge(selectedSellerModal.verificationStatus)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSellerModal(null)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.9rem" }}>
              {/* Contact Info */}
              <div style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: "700", color: "#334155", marginBottom: "8px" }}>Owner & Contact</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Owner Name</span>
                    <strong>{selectedSellerModal.name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Phone</span>
                    <strong>{selectedSellerModal.phone || "N/A"}</strong>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Email</span>
                    <strong>{selectedSellerModal.email}</strong>
                  </div>
                </div>
              </div>

              {/* Classification Info */}
              <div style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: "700", color: "#334155", marginBottom: "8px" }}>Platform Classification</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Application</span>
                    <div style={{ marginTop: "4px" }}>{getApplicationBadge(selectedSellerModal.businessCategory)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Dietary Type</span>
                    <div style={{ marginTop: "4px" }}>{getDietaryPill(selectedSellerModal.foodType)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Food Verification</span>
                    <strong>{selectedSellerModal.foodVerificationStatus}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Property Verification</span>
                    <strong>{selectedSellerModal.propertyVerificationStatus}</strong>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Assigned Categories / Types</span>
                    <strong style={{ fontSize: "0.82rem" }}>{selectedSellerModal.type || "None"}</strong>
                  </div>
                </div>
              </div>

              {/* Location & Status Info */}
              <div style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: "700", color: "#334155", marginBottom: "8px" }}>Address & Subscription</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Address</span>
                    <strong>
                      {[selectedSellerModal.addressFlat, selectedSellerModal.addressLocality, selectedSellerModal.city, selectedSellerModal.pincode].filter(Boolean).join(", ") || "No address recorded"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Live Status</span>
                    <strong>{selectedSellerModal.isOnline ? "Online (Accepting Orders)" : "Offline"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Account Status</span>
                    <strong style={{ color: selectedSellerModal.isActive ? "#16A34A" : "#DC2626" }}>
                      {selectedSellerModal.isActive ? "Enabled" : "Disabled"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Subscription</span>
                    <strong>{selectedSellerModal.hasActiveSubscription ? "Active" : "None / Expired"}</strong>
                  </div>
                  {selectedSellerModal.subscriptionValidUntil && (
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Subscription Valid Until</span>
                      <strong>{new Date(selectedSellerModal.subscriptionValidUntil).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <Link
                href="/dashboard/superadmin/sellers"
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Edit in Sellers Manager</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
