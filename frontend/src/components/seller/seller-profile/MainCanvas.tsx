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
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  MapPin,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import SellerMapPicker from "@/components/seller/seller-registration/business-information/SellerMapPicker";

export interface SellerProfileData {
  ownerName: string;
  mobileNumber: string;
  email: string;
  outletName: string;
  registeredAddress: string;
  pincode?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  isLocationPinned?: boolean;
  upiId?: string;
  trackingId?: string;
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
    const addr = initialData?.registeredAddress || seller.address || "";
    const extractedPin = initialData?.pincode || seller.pincode || addr.match(/\b\d{6}\b/)?.[0] || "";
    const extractedCity = initialData?.city || seller.city || "Pune";
    return {
      ownerName: owner,
      mobileNumber: initialData?.mobileNumber || seller.phone || "",
      email: initialData?.email || seller.email || "",
      outletName: outlet,
      registeredAddress: addr,
      pincode: extractedPin,
      city: extractedCity,
      latitude: initialData?.latitude !== undefined ? initialData.latitude : (seller.latitude ?? null),
      longitude: initialData?.longitude !== undefined ? initialData.longitude : (seller.longitude ?? null),
      isLocationPinned: initialData?.isLocationPinned !== undefined ? initialData.isLocationPinned : (seller.isLocationPinned ?? false),
      upiId: initialData?.upiId || seller.upiId || (seller.profile as any)?.upiId || "",
      trackingId: initialData?.trackingId || seller.trackingId || (seller.profile as any)?.trackingId || "",
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
        const addr = seller.address || prev.registeredAddress;
        const extractedPin = prev.pincode || seller.pincode || addr.match(/\b\d{6}\b/)?.[0] || "";
        const extractedCity = prev.city || seller.city || "Pune";
        return {
          ...prev,
          ownerName: owner,
          mobileNumber: seller.phone || prev.mobileNumber,
          email: seller.email || prev.email,
          outletName: outlet,
          registeredAddress: addr,
          pincode: extractedPin,
          city: extractedCity,
          latitude: seller.latitude !== undefined && seller.latitude !== null ? seller.latitude : prev.latitude,
          longitude: seller.longitude !== undefined && seller.longitude !== null ? seller.longitude : prev.longitude,
          isLocationPinned: seller.isLocationPinned ?? prev.isLocationPinned,
          upiId: seller.upiId || (seller.profile as any)?.upiId || prev.upiId || "",
          trackingId: seller.trackingId || (seller.profile as any)?.trackingId || prev.trackingId || "",
          avatarInitials: computeInitials(outlet || owner),
        };
      });
    }
  }, [seller.ownerName, seller.userFullName, seller.phone, seller.email, seller.businessName, seller.address, seller.pincode, seller.city, seller.latitude, seller.longitude, seller.isLocationPinned, seller.upiId, seller.trackingId]);

  const formData = externalFormData || internalFormData;

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [qrToastMessage, setQrToastMessage] = useState("");

  const showQrToast = (msg: string) => {
    setQrToastMessage(msg);
    setTimeout(() => setQrToastMessage(""), 2800);
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

    const addr = formData.registeredAddress || "";
    const extractedPin = formData.pincode || addr.match(/\b\d{6}\b/)?.[0] || "";
    const payload = {
      ...formData,
      pincode: extractedPin || formData.pincode,
    };

    if (onSave) {
      onSave(payload);
    }

    setTimeout(() => {
      setSaving(false);
      setSuccessMessage("Changes saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 600);
  };

  // Dynamic public shop URL
  const [currentOrigin, setCurrentOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const sellerTrackingId = formData.trackingId || seller.trackingId || (seller.profile as any)?.trackingId || seller.id || "store";
  const shopUrl = `${currentOrigin || "https://neocloud.app"}/shop/${sellerTrackingId}`;

  // Dynamic UPI Payment URI
  const activeUpiId = (formData.upiId || seller.upiId || (seller.profile as any)?.upiId || "").trim();
  const businessTitle = formData.outletName || seller.businessName || "Neo Cloud Kitchen";
  const upiPaymentUri = activeUpiId
    ? `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(businessTitle)}&cu=INR&tn=${encodeURIComponent("Counter Payment - " + businessTitle)}`
    : "";

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUpiTestModalOpen, setIsUpiTestModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUpiUri, setCopiedUpiUri] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);

  const handleShareProfileQR = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: businessTitle,
          text: `Order food online from ${businessTitle} on Neo Cloud Kitchen!`,
          url: shopUrl,
        });
        showQrToast("Store link shared!");
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shopUrl);
      showQrToast("Store link copied to clipboard!");
    } else {
      showQrToast("Store Link: " + shopUrl);
    }
    setIsShareModalOpen(true);
  };

  const handleDownloadProfileQR = () => {
    const canvas = document.getElementById("canvas-profile-qr") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${(formData.outletName || "kitchen").toLowerCase().replace(/[^a-z0-9]/g, "-")}-store-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showQrToast("Store QR Code downloaded!");
    } else {
      showQrToast("Store QR Code ready!");
    }
  };

  const handleCopyUPI = () => {
    if (!activeUpiId) {
      showQrToast("Please enter and save a UPI ID first");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeUpiId);
      showQrToast(`UPI ID "${activeUpiId}" copied!`);
    }
  };

  const handleTestUPIQR = () => {
    if (!activeUpiId) {
      showQrToast("Please enter and save a UPI ID first");
      const input = document.querySelector('input[placeholder*="merchant@okhdfcbank"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(upiPaymentUri);
    }
    if (typeof window !== "undefined") {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = upiPaymentUri;
      }
    }
    setIsUpiTestModalOpen(true);
    showQrToast("UPI Intent URI copied! Verify destination below.");
  };

  const handleDownloadPaymentQR = () => {
    if (!activeUpiId) {
      showQrToast("Please enter a UPI ID first to generate your Payment QR");
      return;
    }
    const canvas = document.getElementById("canvas-payment-qr") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${(formData.outletName || "kitchen").toLowerCase().replace(/[^a-z0-9]/g, "-")}-upi-payment-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showQrToast("Payment UPI QR downloaded!");
    } else {
      showQrToast("Payment QR ready!");
    }
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

              {/* Delivery Coverage & Nearby Customers Notice Banner */}
              <div
                style={{
                  backgroundColor: "#FFF7ED",
                  border: "1.5px solid #FED7AA",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: "#FFEDD5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  <MapPin size={18} color="#EA580C" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#9A3412" }}>
                      Delivery Coverage &amp; Nearby Customer Reach
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "10px",
                        backgroundColor: "#EA580C",
                        color: "#FFFFFF",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Important Notice
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#C2410C", margin: 0, lineHeight: 1.5 }}>
                    📍 <strong>Note:</strong> This exact GPS map pin will be used to calculate delivery distance, dispatch coverage radius, and display your kitchen to nearby customers. Please ensure the pin marker is placed precisely at your kitchen entrance or pickup counter.
                  </p>
                </div>
              </div>

              {/* Interactive Kitchen Map Pin Picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    Kitchen Map Pin Location <span style={{ color: "#EA580C" }}>*</span>
                  </label>
                  {formData.latitude && formData.longitude ? (
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#16A34A",
                        backgroundColor: "#F0FDF4",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        border: "1px solid #BBF7D0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 size={12} /> Pin Set: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#EA580C",
                        backgroundColor: "#FFF7ED",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        border: "1px solid #FED7AA",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertTriangle size={12} /> Map Pin Required
                    </span>
                  )}
                </div>

                <SellerMapPicker
                  latitude={formData.latitude ?? null}
                  longitude={formData.longitude ?? null}
                  isPinned={formData.isLocationPinned}
                  onChange={(lat, lng, formattedAddress) => {
                    const detectedPin = formattedAddress?.match(/\b\d{6}\b/)?.[0] || formData.pincode;
                    const updated = {
                      ...formData,
                      latitude: lat,
                      longitude: lng,
                      isLocationPinned: true,
                      registeredAddress: formattedAddress || formData.registeredAddress,
                      pincode: detectedPin || formData.pincode,
                    };
                    setInternalFormData(updated);
                    if (onDataChange) onDataChange(updated);
                  }}
                />
              </div>

              {/* Registered Address Text Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Registered Address &amp; Outlet Building Details <span style={{ color: "#EA580C" }}>*</span>
                </label>
                <textarea
                  value={formData.registeredAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    const extracted = val.match(/\b\d{6}\b/)?.[0];
                    const updated = {
                      ...formData,
                      registeredAddress: val,
                      ...(extracted ? { pincode: extracted } : {}),
                    };
                    setInternalFormData(updated);
                    if (onDataChange) onDataChange(updated);
                  }}
                  placeholder="Flat / Shop No., Building Name, Street / Road, Area, City, Pincode"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    fontSize: "14px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                    resize: "vertical",
                  }}
                  className="canvas-input"
                />
                <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                  This formatted address is shown to customers on invoices and to delivery riders for pickup navigation.
                </p>
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

            {/* SECTION 3: BANKING & UPI PAYMENT SETTINGS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#FF5500",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                  }}
                >
                  PAYMENT &amp; SETTLEMENT (UPI)
                </span>
                {formData.upiId && formData.upiId.trim().includes("@") ? (
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#16A34A", backgroundColor: "#F0FDF4", padding: "2px 8px", borderRadius: "12px", border: "1px solid #BBF7D0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} /> Active for Payments &amp; Payouts
                  </span>
                ) : (
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#D97706", backgroundColor: "#FFFBEB", padding: "2px 8px", borderRadius: "12px", border: "1px solid #FDE68A", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <AlertTriangle size={12} /> UPI ID Required
                  </span>
                )}
              </div>

              {/* UPI ID Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Payment UPI ID (VPA) <span style={{ color: "#EA580C" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.upiId || ""}
                  onChange={(e) => handleChange("upiId", e.target.value)}
                  placeholder="e.g. merchant@okhdfcbank, 9876543210@paytm, store@ybl"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: formData.upiId && !formData.upiId.includes("@") ? "1.5px solid #FCA5A5" : "1px solid #E2E8F0",
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
                <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                  Customer QR transfers and seller settlement payouts will be credited directly to this bank-linked UPI handle.
                </p>
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
            gap: "24px",
            boxSizing: "border-box",
          }}
          className="qr-card"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: "-0.2px" }}>
                Store Profile &amp; Payment QR Codes
              </h2>
              <p style={{ fontSize: "13px", color: "#64748B", margin: "2px 0 0 0" }}>
                Live customer scan QR codes for direct menu browsing and instant counter UPI settlement.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "16px", backgroundColor: "#FFF1E8", color: "#EA580C" }}>
                Store Front
              </span>
              <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "16px", backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                UPI Payments
              </span>
            </div>
          </div>

          {/* Important Banking & Active UPI Notice Alert */}
          <div
            style={{
              backgroundColor: "#FFFBEB",
              border: "1.5px solid #FCD34D",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <AlertTriangle size={22} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: "#92400E" }}>
                Important Merchant UPI &amp; Banking Notice
              </h4>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#B45309", lineHeight: 1.5 }}>
                Please ensure that your configured UPI ID is active, valid, and registered with your merchant bank. All customer direct payments, counter table scans, and daily automated settlement payouts are routed directly to this UPI account.
              </p>
              <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: 600, color: "#78350F" }}>
                💡 <strong>Verification Step:</strong> Test your QR code by scanning it with any UPI app (Google Pay, PhonePe, Paytm) before displaying it at your store.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
            className="two-col-grid"
          >
            {/* 1. Kitchen & Store Profile QR */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  Store &amp; Kitchen Profile QR
                </h3>
                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                  Scan to open public merchant menu &amp; order food online
                </p>
              </div>

              {/* Dynamic QR Code Canvas */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "14px",
                  padding: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QRCodeCanvas
                  id="canvas-profile-qr"
                  value={shopUrl}
                  size={240}
                  style={{ width: "140px", height: "140px" }}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* URL preview & copy pill */}
              <div
                onClick={handleShareProfileQR}
                title="Click to copy store URL"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "#475569",
                  maxWidth: "100%",
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <Copy size={12} color="#EA580C" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{shopUrl}</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "2px" }}>
                <button
                  type="button"
                  onClick={handleShareProfileQR}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#FF5500",
                    backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
                  }}
                >
                  <Share2 size={15} />
                  <span>Share Link</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadProfileQR}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Download size={15} />
                  <span>Download QR</span>
                </button>
              </div>
            </div>

            {/* 2. In-Store UPI & Payment QR */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  In-Store UPI &amp; Payment QR
                </h3>
                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                  Scan with GPay, PhonePe, Paytm for direct counter settlement
                </p>
              </div>

              {activeUpiId ? (
                <>
                  {/* Dynamic UPI QR Code Canvas */}
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1.5px solid #CBD5E1",
                      borderRadius: "14px",
                      padding: "12px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <QRCodeCanvas
                      id="canvas-payment-qr"
                      value={upiPaymentUri}
                      size={240}
                      style={{ width: "140px", height: "140px" }}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Active UPI ID pill */}
                  <div
                    onClick={handleCopyUPI}
                    title="Click to copy UPI ID"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#166534",
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={13} color="#16A34A" />
                    <span>UPI ID: {activeUpiId}</span>
                    <Copy size={11} color="#16A34A" style={{ marginLeft: "2px" }} />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "2px" }}>
                    <button
                      type="button"
                      onClick={handleTestUPIQR}
                      style={{
                        flex: 1,
                        height: "40px",
                        borderRadius: "8px",
                        border: "1px solid #16A34A",
                        backgroundColor: "#F0FDF4",
                        color: "#15803D",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <ExternalLink size={15} />
                      <span>Test QR Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPaymentQR}
                      style={{
                        flex: 1,
                        height: "40px",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        backgroundColor: "#FFFFFF",
                        color: "#0F172A",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <Download size={15} />
                      <span>Download QR</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Empty state when UPI ID is missing */
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1.5px dashed #CBD5E1",
                    borderRadius: "14px",
                    padding: "24px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <QrCode size={48} color="#94A3B8" strokeWidth={1.5} />
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                    UPI Payment QR Not Configured
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748B", margin: 0, maxWidth: "260px" }}>
                    Enter your active UPI ID in the form above and save changes to generate your direct payment QR code.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="merchant@okhdfcbank"]') as HTMLInputElement;
                      if (input) {
                        input.focus();
                        input.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    style={{
                      marginTop: "4px",
                      height: "36px",
                      padding: "0 16px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#FF5500",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Configure UPI ID ↑
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1. Share Store Profile Link Modal */}
        {isShareModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setIsShareModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "480px",
                padding: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                position: "relative",
                boxSizing: "border-box",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      backgroundColor: "#FFF7ED",
                      border: "1px solid #FFEDD5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#EA580C",
                    }}
                  >
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                      Share Store Profile
                    </h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                      Public customer ordering link for {businessTitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "#64748B",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* QR & URL Content */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                  padding: "8px 0 16px 0",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <QRCodeCanvas value={shopUrl} size={150} level="H" includeMargin={false} />
                </div>

                {/* URL Box */}
                <div style={{ width: "100%" }}>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Public Store Link
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #CBD5E1",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      readOnly
                      value={shopUrl}
                      style={{
                        border: "none",
                        background: "transparent",
                        flex: 1,
                        fontSize: "13px",
                        color: "#1E293B",
                        fontWeight: 600,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(shopUrl);
                          setCopiedLink(true);
                          showQrToast("Store link copied!");
                          setTimeout(() => setCopiedLink(false), 2500);
                        }
                      }}
                      style={{
                        backgroundColor: copiedLink ? "#16A34A" : "#0F172A",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        transition: "background-color 0.2s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <a
                    href={shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: "#FF5500",
                      backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                      color: "#FFFFFF",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
                    }}
                  >
                    <ExternalLink size={16} />
                    <span>Open Store Page</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out our menu and order online from ${businessTitle}: ${shopUrl}`)}`;
                      window.open(whatsappUrl, "_blank");
                    }}
                    style={{
                      flex: 1,
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: "#25D366",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 2px 8px rgba(37, 211, 102, 0.25)",
                    }}
                  >
                    <span>Share WhatsApp</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  style={{
                    height: "38px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    color: "#64748B",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Test In-Store UPI Payment Modal */}
        {isUpiTestModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setIsUpiTestModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "500px",
                padding: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                position: "relative",
                boxSizing: "border-box",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#16A34A",
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                      Test In-Store UPI Payment
                    </h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                      Verify receiver parameters and settlement endpoint
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpiTestModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "#64748B",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #86EFAC",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                }}
              >
                <CheckCircle2 size={18} color="#16A34A" />
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#166534" }}>
                  UPI Destination Configured &amp; Active
                </span>
              </div>

              {/* QR & Parameters */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1.5px solid #CBD5E1",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <QRCodeCanvas id="canvas-modal-payment-qr" value={upiPaymentUri} size={150} level="H" includeMargin={false} />
                </div>

                {/* Parameter Details Table */}
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Payee UPI ID (pa):</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#0F172A", fontWeight: 700, fontFamily: "monospace" }}>{activeUpiId}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(activeUpiId);
                            setCopiedUpiId(true);
                            showQrToast("UPI ID copied!");
                            setTimeout(() => setCopiedUpiId(false), 2000);
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: copiedUpiId ? "#16A34A" : "#64748B",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {copiedUpiId ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Merchant / Payee (pn):</span>
                    <span style={{ color: "#0F172A", fontWeight: 700 }}>{businessTitle}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Transaction Note (tn):</span>
                    <span style={{ color: "#0F172A", fontWeight: 600 }}>Counter Payment - {businessTitle}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Currency (cu):</span>
                    <span style={{ color: "#0F172A", fontWeight: 700 }}>INR (₹)</span>
                  </div>
                </div>

                {/* UPI Intent URI Box */}
                <div style={{ width: "100%" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    UPI Intent Link
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#F1F5F9",
                      border: "1px solid #CBD5E1",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="text"
                      readOnly
                      value={upiPaymentUri}
                      style={{
                        border: "none",
                        background: "transparent",
                        flex: 1,
                        fontSize: "11.5px",
                        color: "#334155",
                        fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(upiPaymentUri);
                          setCopiedUpiUri(true);
                          showQrToast("UPI Intent URI copied!");
                          setTimeout(() => setCopiedUpiUri(false), 2000);
                        }
                      }}
                      style={{
                        backgroundColor: copiedUpiUri ? "#16A34A" : "#334155",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "5px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {copiedUpiUri ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedUpiUri ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Verification Tip */}
                <div
                  style={{
                    backgroundColor: "#FEF3C7",
                    border: "1px solid #FDE68A",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "12px",
                    color: "#92400E",
                    textAlign: "left",
                    lineHeight: 1.4,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  💡 <strong>How to test:</strong> Scan the QR above with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong> on your mobile device. Confirm that the payee name appears as <strong>{businessTitle}</strong> and receiver UPI is <strong>{activeUpiId}</strong> before making a ₹1 verification payment.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <a
                    href={upiPaymentUri}
                    style={{
                      flex: 1,
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: "#16A34A",
                      color: "#FFFFFF",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                    }}
                  >
                    <ExternalLink size={16} />
                    <span>Open in UPI App</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadPaymentQR}
                    style={{
                      flex: 1,
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: "#FFFFFF",
                      color: "#0F172A",
                      border: "1px solid #CBD5E1",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Download size={16} />
                    <span>Download QR</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUpiTestModalOpen(false)}
                  style={{
                    height: "38px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    color: "#64748B",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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

