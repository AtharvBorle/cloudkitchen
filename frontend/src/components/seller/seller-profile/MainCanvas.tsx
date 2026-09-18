"use client";

import React, { useState, useEffect } from "react";
import { performLogout } from "@/lib/logout";
import Topbar, { TopbarProps } from "../nav/Topbar";
import { useSellerProfile, isGenericFallbackName, computeInitials } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  RefreshCw,
  CreditCard,
  QrCode,
  Share2,
  Download,
} from "lucide-react";

export interface SellerProfileData {
  ownerName: string;
  mobileNumber: string;
  email: string;
  outletName: string;
  registeredAddress: string;
  partnerRole?: string;
  avatarInitials?: string;
}

export interface MainCanvasProps {
  showTopbar?: boolean;
  topbarProps?: TopbarProps;
  headerTitle?: string;
  headerDescription?: string;
  formData?: SellerProfileData;
  initialData?: Partial<SellerProfileData>;
  onSave?: (data: SellerProfileData) => void;
  onLogout?: () => void;
  onDataChange?: (data: SellerProfileData) => void;
}

export default function MainCanvas({
  showTopbar = false,
  topbarProps,
  headerTitle = "Partner Profile Settings",
  headerDescription = "Manage operational credentials, personal contacts, and business workspace parameters.",
  formData: externalFormData,
  initialData,
  onSave,
  onLogout,
  onDataChange,
}: MainCanvasProps) {
  const seller = useSellerProfile();
  const [internalFormData, setInternalFormData] = useState<SellerProfileData>(() => {
    const owner = initialData?.ownerName || (!isGenericFallbackName(seller.userFullName) ? seller.userFullName : "") || seller.ownerName;
    const outlet = initialData?.outletName || seller.businessName || seller.ownerName;
    return {
      ownerName: owner,
      mobileNumber: initialData?.mobileNumber || seller.phone || "",
      email: initialData?.email || seller.email || "",
      outletName: outlet,
      registeredAddress: initialData?.registeredAddress || seller.address || "",
      partnerRole: initialData?.partnerRole || seller.partnerRole,
      avatarInitials: initialData?.avatarInitials || computeInitials(outlet || owner),
    };
  });

  // Subscription Status Data
  const [statusData, setStatusData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const loadStatus = React.useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshingStatus(true);
      else setLoadingStatus(true);

      const res = await fetchApi(`/api/seller/dashboard/status?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data.data || data);
      }
    } catch (err) {
      console.error("Failed to load subscription status:", err);
    } finally {
      setLoadingStatus(false);
      setIsRefreshingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();

    const handleSubUpdated = () => {
      loadStatus();
    };

    const handleFocus = () => {
      loadStatus();
    };

    window.addEventListener("subscription-updated", handleSubUpdated);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("subscription-updated", handleSubUpdated);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, [loadStatus]);

  useEffect(() => {
    if (seller.ownerName || seller.businessName) {
      setInternalFormData((prev) => {
        const outlet = prev.outletName && !isGenericFallbackName(prev.outletName)
          ? prev.outletName
          : (seller.businessName || seller.ownerName);
        const owner = prev.ownerName && !isGenericFallbackName(prev.ownerName)
          ? prev.ownerName
          : (seller.userFullName || seller.ownerName);
        return {
          ...prev,
          ownerName: owner,
          mobileNumber: seller.phone || prev.mobileNumber,
          email: seller.email || prev.email,
          outletName: outlet,
          registeredAddress: seller.address || prev.registeredAddress,
          avatarInitials: computeInitials(outlet || owner),
        };
      });
    }
  }, [seller.ownerName, seller.userFullName, seller.phone, seller.email, seller.businessName, seller.address]);

  const formData = externalFormData || internalFormData;

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [qrToastMessage, setQrToastMessage] = useState("");

  const showQrToast = (msg: string) => {
    setQrToastMessage(msg);
    setTimeout(() => setQrToastMessage(""), 2500);
  };

  const handleChange = (field: keyof SellerProfileData, value: string) => {
    const updated = { ...formData, [field]: value };
    setInternalFormData(updated);
    if (onDataChange) onDataChange(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    if (onSave) {
      onSave(formData);
    }

    setTimeout(() => {
      setSaving(false);
      setSuccessMessage("Changes saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 600);
  };

  // Stacked active subscriptions calculation
  const getStackedSubs = (subsList: any[]) => {
    const sorted = [...subsList].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const result = [];
    let currentEnd: Date | null = null;

    for (let i = 0; i < sorted.length; i++) {
      const sub = sorted[i];
      const duration = sub.plan?.durationMonths || 1;
      const created = new Date(sub.createdAt);

      let start: Date;
      if (currentEnd && currentEnd > created) {
        start = new Date(currentEnd);
      } else {
        start = created;
      }

      const end = sub.validUntil ? new Date(sub.validUntil) : new Date(start);
      if (!sub.validUntil) {
        end.setMonth(end.getMonth() + duration);
      }

      result.push({
        ...sub,
        startDate: start,
        endDate: end,
      });

      currentEnd = end;
    }
    return result;
  };

  const activeSubs = statusData?.activeSubs || [];
  const foodSubs = activeSubs.filter(
    (s: any) =>
      (s.plan?.category || "").toUpperCase() === "FOOD" ||
      (s.plan?.category || "").toUpperCase() === "BOTH" ||
      (!s.plan?.category &&
        (statusData?.sellerProfile?.businessCategory === "FOOD" ||
          statusData?.sellerProfile?.businessCategory === "BOTH"))
  );
  const propertySubs = activeSubs.filter(
    (s: any) =>
      (s.plan?.category || "").toUpperCase() === "PROPERTY" ||
      (s.plan?.category || "").toUpperCase() === "BOTH" ||
      (!s.plan?.category &&
        (statusData?.sellerProfile?.businessCategory === "PROPERTY" ||
          statusData?.sellerProfile?.businessCategory === "BOTH"))
  );

  const stackedFood = getStackedSubs(foodSubs);
  const foodExpiry =
    statusData?.foodExpiry ? new Date(statusData.foodExpiry) : stackedFood.length > 0 ? stackedFood[stackedFood.length - 1].endDate : null;

  const stackedProperty = getStackedSubs(propertySubs);
  const propertyExpiry =
    statusData?.propertyExpiry ? new Date(statusData.propertyExpiry) : stackedProperty.length > 0 ? stackedProperty[stackedProperty.length - 1].endDate : null;

  const hasAnyActiveSub = Boolean(statusData?.hasActiveSub || activeSubs.length > 0);
  const isFoodVerified =
    statusData?.sellerProfile?.foodVerificationStatus === "APPROVED" ||
    (statusData?.sellerProfile?.verificationStatus === "APPROVED" &&
      (statusData?.sellerProfile?.businessCategory === "FOOD" ||
        statusData?.sellerProfile?.businessCategory === "BOTH"));

  const isPropertyVerified =
    statusData?.sellerProfile?.propertyVerificationStatus === "APPROVED" ||
    (statusData?.sellerProfile?.verificationStatus === "APPROVED" &&
      (statusData?.sellerProfile?.businessCategory === "PROPERTY" ||
        statusData?.sellerProfile?.businessCategory === "BOTH"));

  const handleShareQR = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://neocloud.app/kitchen/bangalore-central");
      showQrToast("Kitchen QR link copied to clipboard!");
    } else {
      showQrToast("QR Link ready to share!");
    }
  };

  const handleDownloadQR = () => {
    showQrToast("Kitchen QR Code downloaded!");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        minHeight: "100%",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="main-canvas"
    >
      {/* Optional Topbar if MainCanvas is rendered standalone */}
      {showTopbar && <Topbar {...topbarProps} />}

      {/* Constrained Content (Width: 1120px, Gap: 24px, Padding: 32px 40px 48px) */}
      <main
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "32px 40px 48px 40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
        className="constrained-content"
      >
        {/* Header Title & Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.4px",
              margin: 0,
            }}
          >
            {headerTitle}
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748B",
              margin: 0,
              fontWeight: 400,
            }}
          >
            {headerDescription}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              color: "#059669",
              padding: "12px 18px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Toast Alert for QR Actions */}
        {qrToastMessage && (
          <div
            style={{
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              padding: "12px 20px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} color="#10B981" />
            <span>{qrToastMessage}</span>
          </div>
        )}

        {/* CARD 1: ACTIVE SUBSCRIPTIONS & CATEGORY STACKING */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #F1F5F9",
            borderLeft: hasAnyActiveSub ? "6px solid #10B981" : "6px solid #FF5500",
            padding: "32px 36px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxSizing: "border-box",
          }}
          className="subscription-card"
        >
          {/* Card Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: hasAnyActiveSub ? "#ECFDF5" : "#FFF1E8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={22} color={hasAnyActiveSub ? "#10B981" : "#FF5500"} />
              </div>
              <div>
                <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.2px" }}>
                  Active Subscriptions &amp; Plan Stacking
                </h2>
                <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0 0" }}>
                  Manage live merchant category validity, stacked renewal dates, and category upgrade permissions.
                </p>
              </div>
            </div>

            {/* Actions & Status Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => loadStatus(true)}
                disabled={isRefreshingStatus || loadingStatus}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#FFFFFF",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title="Refresh subscription status"
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation: isRefreshingStatus || loadingStatus ? "spin 1s linear infinite" : "none",
                  }}
                />
                <span>{isRefreshingStatus ? "Checking..." : "Refresh"}</span>
              </button>

              {hasAnyActiveSub ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#ECFDF5",
                    color: "#166534",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981", display: "inline-block" }} />
                  Active Subscriptions Live
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#FEF2F2",
                    color: "#991B1B",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    border: "1px solid #FECACA",
                  }}
                >
                  <AlertTriangle size={15} color="#DC2626" />
                  No Active Subscription
                </div>
              )}
            </div>
          </div>

          {/* 2-Column Grid: Food Services vs Property Bookings */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
            className="two-col-grid"
          >
            {/* FOOD SERVICES COLUMN */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF5500", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    CATEGORY 1
                  </span>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "2px 0 0 0" }}>
                    Food Services &amp; Kitchen
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "12px",
                    backgroundColor: stackedFood.length > 0 ? "#E6FFFA" : "#F1F5F9",
                    color: stackedFood.length > 0 ? "#00A389" : "#64748B",
                    border: stackedFood.length > 0 ? "1px solid #99F6E4" : "1px solid #E2E8F0",
                  }}
                >
                  {stackedFood.length > 0 ? "FOOD ACTIVE" : isFoodVerified ? "NOT SUBSCRIBED" : "UNVERIFIED"}
                </span>
              </div>

              {stackedFood.length > 0 ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                      Stacked Plan History ({stackedFood.length}):
                    </span>
                    {stackedFood.map((sub: any, idx: number) => (
                      <div
                        key={sub.id || idx}
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                            {idx + 1}. {sub.plan?.name || "Food Plan"}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#FF5500" }}>
                            ₹{sub.amount || sub.plan?.price}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
                          <span>Purchased: {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span>Duration: {sub.plan?.durationMonths || 1} mo</span>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={13} color="#94A3B8" />
                          <span>Validity: {new Date(sub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – {new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      backgroundColor: "#ECFDF5",
                      borderRadius: "8px",
                      border: "1px solid #A7F3D0",
                      marginTop: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#065F46" }}>
                      <Clock size={15} />
                      <span>Final Food Expiry:</span>
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#047857" }}>
                      {foodExpiry?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/seller/payment?category=FOOD";
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #FF5500",
                      backgroundColor: "#FFFFFF",
                      color: "#FF5500",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFF1E8";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                  >
                    <RefreshCw size={14} />
                    Renew / Stack Food Subscription
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "center" }}>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                    {isFoodVerified
                      ? "You do not have an active Food Subscription plan. Subscribe to unlock kitchen menus, live ordering, and food dispatch."
                      : "Food kitchen category is not approved or verified yet. Submit your FSSAI and kitchen details to get started."}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (isFoodVerified) {
                        window.location.href = "/seller/payment?category=FOOD";
                      } else {
                        window.dispatchEvent(new CustomEvent("open-category-upgrade", { detail: { category: "FOOD" } }));
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#FF5500",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {isFoodVerified ? "Get Food Subscription Plan" : "Upgrade / Apply for Food Category"}
                  </button>
                </div>
              )}
            </div>

            {/* PROPERTY BOOKINGS COLUMN */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    CATEGORY 2
                  </span>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "2px 0 0 0" }}>
                    Property &amp; Room Bookings
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "12px",
                    backgroundColor: stackedProperty.length > 0 ? "#EFF6FF" : "#F1F5F9",
                    color: stackedProperty.length > 0 ? "#2563EB" : "#64748B",
                    border: stackedProperty.length > 0 ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                  }}
                >
                  {stackedProperty.length > 0 ? "PROPERTY ACTIVE" : isPropertyVerified ? "NOT SUBSCRIBED" : "UNVERIFIED"}
                </span>
              </div>

              {stackedProperty.length > 0 ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                      Stacked Plan History ({stackedProperty.length}):
                    </span>
                    {stackedProperty.map((sub: any, idx: number) => (
                      <div
                        key={sub.id || idx}
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                            {idx + 1}. {sub.plan?.name || "Property Plan"}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#3B82F6" }}>
                            ₹{sub.amount || sub.plan?.price}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
                          <span>Purchased: {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span>Duration: {sub.plan?.durationMonths || 1} mo</span>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={13} color="#94A3B8" />
                          <span>Validity: {new Date(sub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – {new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      backgroundColor: "#EFF6FF",
                      borderRadius: "8px",
                      border: "1px solid #BFDBFE",
                      marginTop: "auto",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#1E40AF" }}>
                      <Clock size={15} />
                      <span>Final Property Expiry:</span>
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#1D4ED8" }}>
                      {propertyExpiry?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/seller/payment?category=PROPERTY";
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #3B82F6",
                      backgroundColor: "#FFFFFF",
                      color: "#3B82F6",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#EFF6FF";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                  >
                    <RefreshCw size={14} />
                    Renew / Stack Property Subscription
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "center" }}>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                    {isPropertyVerified
                      ? "You do not have an active Property / Rooms Subscription plan. Subscribe to unlock room listings, bookings, and inventory tools."
                      : "Room / Property booking category is not active or approved yet. Apply for property category verification to list rooms."}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (isPropertyVerified) {
                        window.location.href = "/seller/payment?category=PROPERTY";
                      } else {
                        window.dispatchEvent(new CustomEvent("open-category-upgrade", { detail: { category: "PROPERTY" } }));
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#3B82F6",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {isPropertyVerified ? "Get Property Subscription Plan" : "Upgrade / Apply for Rooms Category"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Master Upgrade Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/seller/payment";
              }}
              style={{
                padding: "11px 24px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                color: "#FFFFFF",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(255, 85, 0, 0.25)",
              }}
            >
              <Sparkles size={16} />
              <span>{hasAnyActiveSub ? "Upgrade / Change Plan Tiers" : "Browse All Subscription Plans"}</span>
            </button>
          </div>
        </div>

        {/* CARD 2: ACCOUNT CONSOLE PROFILE CARD */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #F1F5F9",
            padding: "36px 40px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            boxSizing: "border-box",
          }}
          className="profile-card"
        >
          {/* Card Title */}
          <h2
            style={{
              fontSize: "19px",
              fontWeight: 700,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.2px",
            }}
          >
            Account Console Profile
          </h2>

          <form
            onSubmit={handleSave}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              width: "100%",
            }}
          >
            {/* SECTION 1: PERSONAL CREDENTIALS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#FF5500",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                PERSONAL CREDENTIALS
              </span>

              {/* Owner Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Owner Full Name
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  className="canvas-input"
                />
              </div>

              {/* Mobile Number & Primary Email Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
                className="two-col-grid"
              >
                {/* Mobile Number */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.mobileNumber}
                    onChange={(e) => handleChange("mobileNumber", e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      fontSize: "14px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    className="canvas-input"
                  />
                </div>

                {/* Primary Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Primary Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      fontSize: "14px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    className="canvas-input"
                  />
                </div>
              </div>
            </div>

            {/* Subtle Horizontal Divider */}
            <div
              style={{
                width: "100%",
                height: "1px",
                backgroundColor: "#F1F5F9",
                margin: "8px 0",
              }}
            />

            {/* SECTION 2: BUSINESS WORKSPACE INFORMATION */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#FF5500",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                BUSINESS WORKSPACE INFORMATION
              </span>

              {/* Neo Cloud Outlet Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Neo Cloud Outlet Name
                </label>
                <input
                  type="text"
                  value={formData.outletName}
                  onChange={(e) => handleChange("outletName", e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  className="canvas-input"
                />
              </div>

              {/* Registered Address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Registered Address
                </label>
                <input
                  type="text"
                  value={formData.registeredAddress}
                  onChange={(e) => handleChange("registeredAddress", e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  className="canvas-input"
                />
              </div>
            </div>

            {/* Bottom Actions Row: Logout Account (Left) + Save Changes (Right) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "16px",
                paddingTop: "8px",
              }}
              className="actions-row"
            >
              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    performLogout({ role: "SELLER" });
                  }
                }}
                style={{
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 20px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
                className="logout-btn"
              >
                Logout Account
              </button>

              {/* Save Changes Button */}
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: "#FF5500",
                  backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(255, 85, 0, 0.28)",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
                className="save-btn"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 3: PROFILE & CHECK-IN QR CODES */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #F1F5F9",
            padding: "32px 36px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            boxSizing: "border-box",
          }}
          className="qr-card"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.2px" }}>
                Profile &amp; Store Check-in QR Codes
              </h2>
              <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0 0" }}>
                Provide customer check-ins and direct table or counter order routing.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "16px", backgroundColor: "#FFF1E8", color: "#EA580C" }}>
                Food Services
              </span>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "16px", backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                Room Bookings
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
            className="two-col-grid"
          >
            {/* Kitchen Check-in QR */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Store &amp; Kitchen QR Code
              </h3>
              <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                Scan to view public merchant profile &amp; live menu catalogue
              </p>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <svg width="130" height="130" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="140" height="140" rx="8" fill="white" />
                  <rect x="14" y="14" width="36" height="36" rx="6" fill="#0F172A" />
                  <rect x="22" y="22" width="20" height="20" rx="3" fill="white" />
                  <rect x="27" y="27" width="10" height="10" rx="2" fill="#0F172A" />
                  <rect x="90" y="14" width="36" height="36" rx="6" fill="#0F172A" />
                  <rect x="98" y="22" width="20" height="20" rx="3" fill="white" />
                  <rect x="103" y="27" width="10" height="10" rx="2" fill="#0F172A" />
                  <rect x="14" y="90" width="36" height="36" rx="6" fill="#0F172A" />
                  <rect x="22" y="98" width="20" height="20" rx="3" fill="white" />
                  <rect x="27" y="103" width="10" height="10" rx="2" fill="#0F172A" />
                  <rect x="58" y="18" width="6" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="68" y="18" width="14" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="58" y="28" width="14" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="76" y="28" width="6" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="18" y="58" width="6" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="28" y="58" width="6" height="14" rx="1.5" fill="#0F172A" />
                  <rect x="38" y="66" width="14" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="58" y="52" width="24" height="24" rx="4" fill="#F97316" />
                  <circle cx="70" cy="64" r="5" fill="white" />
                  <rect x="90" y="58" width="14" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="110" y="58" width="12" height="14" rx="1.5" fill="#0F172A" />
                  <rect x="58" y="84" width="8" height="14" rx="1.5" fill="#0F172A" />
                  <rect x="72" y="92" width="10" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="58" y="104" width="24" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="68" y="116" width="14" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="90" y="86" width="14" height="14" rx="3" fill="#0F172A" />
                  <rect x="110" y="86" width="12" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="98" y="106" width="24" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="90" y="118" width="14" height="6" rx="1.5" fill="#0F172A" />
                  <rect x="110" y="118" width="12" height="6" rx="1.5" fill="#0F172A" />
                </svg>
              </div>

              <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={handleShareQR}
                  style={{
                    flex: 1,
                    height: "38px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#FF5500",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Share2 size={15} />
                  <span>Share QR</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  style={{
                    flex: 1,
                    height: "38px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Download size={15} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Payment Sample QR */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                In-Store UPI &amp; Payment QR
              </h3>
              <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                Point-of-sale checkout and contactless in-store settlement
              </p>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "12px",
                  width: "130px",
                  height: "130px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QrCode size={70} color="#64748B" strokeWidth={1.5} />
              </div>

              <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => showQrToast("UPI QR Ready")}
                  style={{
                    width: "100%",
                    height: "38px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <QrCode size={15} />
                  <span>Configured in Order POS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .canvas-input:focus {
          border-color: #FF5500 !important;
          background-color: #FFFFFF !important;
          box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.1) !important;
        }
        .logout-btn:hover {
          background-color: #FECACA !important;
        }
        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(255, 85, 0, 0.38) !important;
        }
        @media (max-width: 900px) {
          .constrained-content {
            padding: 24px 20px !important;
          }
          .subscription-card,
          .profile-card,
          .qr-card {
            padding: 24px 20px !important;
          }
          .two-col-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 600px) {
          .actions-row {
            flex-direction: column-reverse !important;
            gap: 12px;
          }
          .logout-btn,
          .save-btn {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

