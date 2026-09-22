"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/logout";
import { fetchApi } from "@/lib/fetch-api";
import {
  ChevronLeft,
  Menu as MenuIcon,
  Share2,
  Download,
  CreditCard,
  CheckCircle2,
  QrCode,
  Sparkles,
  Bell,
  AlertTriangle,
  Calendar,
  Clock,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import styles from "./ResSellerProfile.module.css";

import { useSellerProfile, isGenericFallbackName, updateCachedProfile, computeInitials } from "@/hooks/useSellerProfile";

export interface PlanServiceItem {
  id: string;
  name: string;
  currentPlan: string;
  validity: string;
}

export interface ResSellerProfileProps {
  initialOwnerName?: string;
  initialMobileNumber?: string;
  initialPrimaryEmail?: string;
  initialOutletName?: string;
  initialRegisteredAddress?: string;
  initialUpiId?: string;
  initialTrackingId?: string;
  onBack?: () => void;
  onSaveProfile?: (profileData: any) => void;
  onLogout?: () => void;
  onSyncDevices?: () => void;
}

export const ResSellerProfile: React.FC<ResSellerProfileProps> = ({
  initialOwnerName,
  initialMobileNumber,
  initialPrimaryEmail,
  initialOutletName,
  initialRegisteredAddress,
  initialUpiId,
  initialTrackingId,
  onBack,
  onSaveProfile,
  onLogout,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // Form State
  const [ownerName, setOwnerName] = useState<string>(
    initialOwnerName && !isGenericFallbackName(initialOwnerName)
      ? initialOwnerName
      : (seller.userFullName || seller.ownerName || "")
  );
  const [mobileNumber, setMobileNumber] = useState<string>(
    initialMobileNumber && initialMobileNumber !== "+91 98887 76655" ? initialMobileNumber : (seller.phone || "")
  );
  const [primaryEmail, setPrimaryEmail] = useState<string>(
    initialPrimaryEmail && initialPrimaryEmail !== "john.doe@neocloudroom.com"
      ? initialPrimaryEmail
      : (seller.email || "")
  );
  const [outletName, setOutletName] = useState<string>(
    initialOutletName && !isGenericFallbackName(initialOutletName)
      ? initialOutletName
      : (seller.businessName || seller.ownerName || "")
  );
  const [registeredAddress, setRegisteredAddress] = useState<string>(
    initialRegisteredAddress && !initialRegisteredAddress.includes("Koramangala")
      ? initialRegisteredAddress
      : (seller.address || "")
  );
  const [upiId, setUpiId] = useState<string>(
    initialUpiId || seller.upiId || (seller.profile as any)?.upiId || ""
  );
  const [trackingId, setTrackingId] = useState<string>(
    initialTrackingId || seller.trackingId || (seller.profile as any)?.trackingId || ""
  );

  // Origin & Dynamic URIs
  const [currentOrigin, setCurrentOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const sellerTrackingId = trackingId || seller.trackingId || (seller.profile as any)?.trackingId || seller.id || "store";
  const shopUrl = `${currentOrigin || "https://neocloud.app"}/shop/${sellerTrackingId}`;

  const activeUpiId = (upiId || seller.upiId || (seller.profile as any)?.upiId || "").trim();
  const businessTitle = outletName || seller.businessName || "Neo Cloud Kitchen";
  const upiPaymentUri = activeUpiId
    ? `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(businessTitle)}&cu=INR&tn=${encodeURIComponent("Counter Payment - " + businessTitle)}`
    : "";

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
      setOwnerName((prev) => (!prev || isGenericFallbackName(prev) ? (seller.userFullName || seller.ownerName) : prev));
    }
    if (seller.phone) {
      setMobileNumber((prev) => (!prev || prev === "+91 98887 76655" ? seller.phone : prev));
    }
    if (seller.email) {
      setPrimaryEmail((prev) => (!prev || prev === "john.doe@neocloudroom.com" ? seller.email : prev));
    }
    if (seller.businessName || seller.ownerName) {
      setOutletName((prev) => (!prev || isGenericFallbackName(prev) ? (seller.businessName || seller.ownerName) : prev));
    }
    if (seller.address) {
      setRegisteredAddress((prev) => (!prev || prev.includes("Koramangala") ? seller.address : prev));
    }
    if (seller.upiId) {
      setUpiId((prev) => (!prev ? seller.upiId || "" : prev));
    }
    if (seller.trackingId) {
      setTrackingId((prev) => (!prev ? seller.trackingId || "" : prev));
    }
  }, [seller.ownerName, seller.userFullName, seller.phone, seller.email, seller.businessName, seller.address, seller.upiId, seller.trackingId]);

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

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/dashboard");
    }
  };

  const handleSaveChanges = async () => {
    const payload = {
      ownerName,
      mobileNumber,
      primaryEmail,
      outletName,
      registeredAddress,
      upiId,
    };

    updateCachedProfile({
      ownerName: outletName || ownerName,
      businessName: outletName,
      userFullName: ownerName,
      email: primaryEmail,
      phone: mobileNumber,
      address: registeredAddress,
      upiId,
      avatarInitials: computeInitials(outletName || ownerName),
    });

    if (onSaveProfile) {
      onSaveProfile(payload);
      showToast("Profile Changes Saved Successfully!");
    } else {
      try {
        await fetchApi("/api/seller/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerName,
            mobileNumber,
            email: primaryEmail,
            outletName,
            registeredAddress,
            upiId,
          }),
        });
        showToast("Profile Changes Saved Successfully!");
      } catch (err) {
        console.error("Failed to save profile:", err);
        showToast("Failed to save profile changes");
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to log out?")) {
        performLogout({ role: "SELLER" });
      }
    }
  };

  const handleShareProfileQR = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shopUrl);
      showToast("Store link copied to clipboard!");
    } else {
      showToast("Store Link: " + shopUrl);
    }
  };

  const handleDownloadProfileQR = () => {
    const canvas = document.getElementById("canvas-mobile-profile-qr") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${(outletName || "kitchen").toLowerCase().replace(/[^a-z0-9]/g, "-")}-store-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast("Store QR Code downloaded!");
    } else {
      showToast("Store QR Code ready!");
    }
  };

  const handleCopyUPI = () => {
    if (!activeUpiId) {
      showToast("Please enter and save a UPI ID first");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeUpiId);
      showToast(`UPI ID "${activeUpiId}" copied!`);
    }
  };

  const handleTestUPIQR = () => {
    if (!activeUpiId) {
      showToast("Please enter and save a UPI ID first");
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
    showToast("UPI URI copied! Scan with GPay/PhonePe to test.");
  };

  const handleDownloadPaymentQR = () => {
    if (!activeUpiId) {
      showToast("Please enter a UPI ID first to generate Payment QR");
      return;
    }
    const canvas = document.getElementById("canvas-mobile-payment-qr") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${(outletName || "kitchen").toLowerCase().replace(/[^a-z0-9]/g, "-")}-upi-payment-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast("Payment UPI QR downloaded!");
    } else {
      showToast("Payment QR ready!");
    }
  };

  const currentDisplayOutlet = outletName || seller.businessName || seller.ownerName;

  return (
    <div className={styles.screenWrapper}>
      {/* Slide-out Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="profile"
        ownerName={currentDisplayOutlet}
        onSyncDevices={onSyncDevices}
      />

      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          {/* Top-Left Hamburger Menu Button + Logo */}
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavMenuOpen(true);
              }}
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <MenuIcon size={24} />
            </button>
            <Link href="/seller/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Centered Title & Subtitle */}
          <div className={styles.headerCenter}>
            <h1 className={styles.headerTitle}>Profile Settings</h1>
            <p className={styles.headerSubtitle}>Manage Operations credential</p>
          </div>

          {/* Top-Right Notification Bell */}
          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.push("/seller/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={22} />
              <span className={styles.notificationDot} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className={styles.contentArea}>
          {/* Card 1: Account Console Profile */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Account Console Profile</h2>

            {/* Personal Credentials */}
            <span className={styles.sectionTag}>PERSONAL CREDENTIALS</span>

            <div className={styles.formGroup}>
              <label htmlFor="ownerFullName" className={styles.label}>
                Owner Full Name
              </label>
              <input
                id="ownerFullName"
                type="text"
                className={styles.input}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <PhoneInput
                id="ownerMobile"
                label="Mobile Number"
                value={mobileNumber}
                onChange={(val) => setMobileNumber(val)}
                placeholder="98765 43210"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="ownerEmail" className={styles.label}>
                Primary Email
              </label>
              <input
                id="ownerEmail"
                type="email"
                className={styles.input}
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
              />
            </div>

            {/* Business Workspace Information */}
            <span className={styles.sectionTag}>BUSINESS WORKSPACE INFORMATION</span>

            <div className={styles.formGroup}>
              <label htmlFor="outletNameInput" className={styles.label}>
                Neo Cloud Outlet Name
              </label>
              <input
                id="outletNameInput"
                type="text"
                className={styles.input}
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="registeredAddressInput" className={styles.label}>
                Registered Address
              </label>
              <textarea
                id="registeredAddressInput"
                className={styles.textarea}
                value={registeredAddress}
                onChange={(e) => setRegisteredAddress(e.target.value)}
                rows={3}
              />
            </div>

            {/* Banking & UPI Payment Settings */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <span className={styles.sectionTag} style={{ margin: 0 }}>PAYMENT &amp; SETTLEMENT (UPI)</span>
              {upiId && upiId.trim().includes("@") ? (
                <span className={styles.statusActive}>
                  <CheckCircle2 size={11} /> Active
                </span>
              ) : (
                <span className={styles.statusRequired}>
                  <AlertTriangle size={11} /> Required
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="upiIdInput" className={styles.label}>
                Payment UPI ID (VPA) <span style={{ color: "#EA580C" }}>*</span>
              </label>
              <input
                id="upiIdInput"
                type="text"
                className={styles.input}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. merchant@okhdfcbank, 9876543210@paytm"
                style={{
                  borderColor: upiId && !upiId.includes("@") ? "#FCA5A5" : undefined,
                }}
              />
              <p className={styles.helperText}>
                Customer QR payments and automated daily payout settlements will be credited directly to this UPI address.
              </p>
            </div>

            {/* Save & Logout Buttons */}
            <div className={styles.accountActionGroup}>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout Account
              </button>
            </div>
          </section>

          {/* Card 2: Profile & Check-in QR */}
          <section className={styles.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 className={styles.cardTitle}>Store Profile &amp; Payment QR</h2>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "12px", backgroundColor: "#FFF1E8", color: "#EA580C" }}>
                  Store Front
                </span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "12px", backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                  UPI
                </span>
              </div>
            </div>

            {/* Important Banking & Active UPI Notice Alert */}
            <div className={styles.noticeAlert}>
              <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div className={styles.noticeContent}>
                <h4 className={styles.noticeTitle}>
                  Important Merchant UPI Notice
                </h4>
                <p className={styles.noticeText}>
                  Please ensure your UPI ID is active and linked to your bank account. All customer payments and payouts are routed directly to this UPI ID.
                </p>
                <div className={styles.noticeTip}>
                  💡 <strong>Test QR:</strong> Scan your QR with Google Pay, PhonePe, or Paytm before displaying at your counter.
                </div>
              </div>
            </div>

            {/* 1. Kitchen & Store Profile QR */}
            <div className={styles.qrSubSection}>
              <h3 className={styles.qrSectionTitle}>Store &amp; Kitchen Profile QR</h3>
              <p className={styles.qrSubtext}>
                Scan to open public storefront menu &amp; order food online
              </p>

              <div className={styles.qrBox}>
                <QRCodeCanvas
                  id="canvas-mobile-profile-qr"
                  value={shopUrl}
                  size={220}
                  style={{ width: "140px", height: "140px" }}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* URL preview pill */}
              <div
                className={styles.urlPill}
                onClick={handleShareProfileQR}
                title="Click to copy store URL"
              >
                <Copy size={12} color="#EA580C" />
                <span>{shopUrl}</span>
              </div>

              <div className={styles.qrBtnRow}>
                <button
                  type="button"
                  className={styles.shareBtn}
                  onClick={handleShareProfileQR}
                >
                  <Share2 size={15} />
                  <span>Share Link</span>
                </button>

                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={handleDownloadProfileQR}
                >
                  <Download size={15} />
                  <span>Download QR</span>
                </button>
              </div>
            </div>

            {/* 2. In-Store UPI & Payment QR */}
            <div className={styles.qrSubSection} style={{ marginTop: "12px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
              <h3 className={styles.qrSectionTitle}>In-Store UPI &amp; Payment QR</h3>
              <p className={styles.qrSubtext}>
                Scan with GPay, PhonePe, Paytm for direct counter payment
              </p>

              {activeUpiId ? (
                <>
                  <div className={styles.qrBox}>
                    <QRCodeCanvas
                      id="canvas-mobile-payment-qr"
                      value={upiPaymentUri}
                      size={220}
                      style={{ width: "140px", height: "140px" }}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Active UPI ID pill */}
                  <div
                    className={styles.upiPill}
                    onClick={handleCopyUPI}
                    title="Click to copy UPI ID"
                  >
                    <CheckCircle2 size={13} color="#16A34A" />
                    <span>UPI ID: {activeUpiId}</span>
                    <Copy size={11} color="#16A34A" style={{ marginLeft: "2px" }} />
                  </div>

                  <div className={styles.qrBtnRow}>
                    <button
                      type="button"
                      className={styles.testBtn}
                      onClick={handleTestUPIQR}
                    >
                      <ExternalLink size={15} />
                      <span>Test QR Link</span>
                    </button>

                    <button
                      type="button"
                      className={styles.downloadBtn}
                      onClick={handleDownloadPaymentQR}
                    >
                      <Download size={15} />
                      <span>Download QR</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.emptyQrState}>
                  <QrCode size={40} color="#94A3B8" strokeWidth={1.5} />
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                    Enter and save your <strong>Payment UPI ID</strong> above to generate your counter payment QR code.
                  </p>
                </div>
              )}
            </div>

            {/* Experiences Section */}
            <div className={styles.experiencesRow}>
              <span className={styles.experiencesLabel}>Experiences</span>
              <div className={styles.experiencesPills}>
                <span className={styles.pillFood}>Food Services</span>
                <span className={styles.pillBookings}>Bookings</span>
              </div>
            </div>
          </section>

          {/* Card 3: Subscription & Plan */}
          <section className={styles.card}>
            <div className={styles.subHeaderRow} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CreditCard size={20} color="#0F172A" />
                <h2 className={styles.subTitle}>Subscription &amp; Plan</h2>
              </div>
              <button
                type="button"
                onClick={() => loadStatus(true)}
                disabled={isRefreshingStatus || loadingStatus}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "#FFFFFF",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: "14px",
                  padding: "4px 10px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw
                  size={12}
                  style={{
                    animation: isRefreshingStatus || loadingStatus ? "spin 1s linear infinite" : "none",
                  }}
                />
                <span>{isRefreshingStatus ? "Checking..." : "Refresh"}</span>
              </button>
            </div>

            {hasAnyActiveSub ? (
              <div className={styles.activeSubBadge}>
                <span className={styles.subDot} />
                <span>Active Subscription</span>
              </div>
            ) : (
              <div className={styles.inactiveSubBadge}>
                <span className={styles.subDotRed} />
                <span>No Active Subscription</span>
              </div>
            )}

            {/* Food Services Group */}
            <div className={styles.planGroup}>
              <div className={styles.planGroupHeader}>
                <span className={styles.planGroupTitle}>FOOD SERVICES</span>
                <span className={`${styles.categoryTag} ${stackedFood.length > 0 ? styles.categoryTagActiveFood : styles.categoryTagInactive}`}>
                  {stackedFood.length > 0 ? "FOOD ACTIVE" : isFoodVerified ? "NOT SUBSCRIBED" : "UNVERIFIED"}
                </span>
              </div>
              <p className={styles.planGroupSubtitle}>
                Cloud kitchen &amp; food management tools
              </p>

              {stackedFood.length > 0 ? (
                <>
                  {stackedFood.map((sub: any, idx: number) => (
                    <div key={sub.id || idx} className={styles.planItemBox}>
                      <div className={styles.planItemTop}>
                        <h3 className={styles.planItemName}>
                          {idx + 1}. {sub.plan?.name || "Food Subscription"}
                        </h3>
                        <button
                          type="button"
                          className={styles.renewSmallBtn}
                          onClick={() => router.push(`/seller/payment?category=FOOD&planId=${sub.planId || sub.plan?.id || ""}`)}
                        >
                          Renew
                        </button>
                      </div>
                      <div className={styles.planItemDetailRow}>
                        <span className={styles.planItemDetailKey}>Amount:</span>
                        <span className={styles.planItemDetailVal}>₹{sub.amount || sub.plan?.price} / {sub.plan?.durationMonths || 1} mo</span>
                      </div>
                      <div className={styles.planItemDetailRow}>
                        <span className={styles.planItemDetailKey}>Validity:</span>
                        <span className={styles.planItemDetailVal}>
                          {new Date(sub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} –{" "}
                          {new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className={styles.expiryRow}>
                    <span className={styles.expiryKey}>Final Food Expiry</span>
                    <span className={styles.expiryValRed}>
                      {foodExpiry?.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.noPlanBox}>
                  <p className={styles.noPlanText}>
                    {isFoodVerified
                      ? "No active food subscription. Subscribe to unlock kitchen orders and dispatch."
                      : "Food category not verified. Apply for food category verification to start selling."}
                  </p>
                  <button
                    type="button"
                    className={`${styles.categoryBtn} ${styles.foodBtn}`}
                    onClick={() => {
                      if (isFoodVerified) {
                        router.push("/seller/payment?category=FOOD");
                      } else {
                        window.dispatchEvent(new CustomEvent("open-category-upgrade", { detail: { category: "FOOD" } }));
                      }
                    }}
                  >
                    {isFoodVerified ? "Get Food Subscription" : "Upgrade Food Category"}
                  </button>
                </div>
              )}
            </div>

            {/* Property Bookings Group */}
            <div className={styles.planGroup}>
              <div className={styles.planGroupHeader}>
                <span className={styles.planGroupTitle}>PROPERTY BOOKINGS</span>
                <span className={`${styles.categoryTag} ${stackedProperty.length > 0 ? styles.categoryTagActiveProperty : styles.categoryTagInactive}`}>
                  {stackedProperty.length > 0 ? "PROPERTY ACTIVE" : isPropertyVerified ? "NOT SUBSCRIBED" : "UNVERIFIED"}
                </span>
              </div>
              <p className={styles.planGroupSubtitle}>
                Listing, info &amp; reservation tools
              </p>

              {stackedProperty.length > 0 ? (
                <>
                  {stackedProperty.map((sub: any, idx: number) => (
                    <div key={sub.id || idx} className={styles.planItemBox}>
                      <div className={styles.planItemTop}>
                        <h3 className={styles.planItemName}>
                          {idx + 1}. {sub.plan?.name || "Property Subscription"}
                        </h3>
                        <button
                          type="button"
                          className={styles.renewSmallBtn}
                          onClick={() => router.push(`/seller/payment?category=PROPERTY&planId=${sub.planId || sub.plan?.id || ""}`)}
                        >
                          Renew
                        </button>
                      </div>
                      <div className={styles.planItemDetailRow}>
                        <span className={styles.planItemDetailKey}>Amount:</span>
                        <span className={styles.planItemDetailVal}>₹{sub.amount || sub.plan?.price} / {sub.plan?.durationMonths || 1} mo</span>
                      </div>
                      <div className={styles.planItemDetailRow}>
                        <span className={styles.planItemDetailKey}>Validity:</span>
                        <span className={styles.planItemDetailVal}>
                          {new Date(sub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} –{" "}
                          {new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className={styles.expiryRow}>
                    <span className={styles.expiryKey}>Final Property Expiry</span>
                    <span className={styles.expiryValBlue}>
                      {propertyExpiry?.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.noPlanBox}>
                  <p className={styles.noPlanText}>
                    {isPropertyVerified
                      ? "No active property subscription. Subscribe to unlock room listings and bookings."
                      : "Room & Property category not verified. Apply for property category verification."}
                  </p>
                  <button
                    type="button"
                    className={`${styles.categoryBtn} ${styles.propertyBtn}`}
                    onClick={() => {
                      if (isPropertyVerified) {
                        router.push("/seller/payment?category=PROPERTY");
                      } else {
                        window.dispatchEvent(new CustomEvent("open-category-upgrade", { detail: { category: "PROPERTY" } }));
                      }
                    }}
                  >
                    {isPropertyVerified ? "Get Property Subscription" : "Upgrade Rooms Category"}
                  </button>
                </div>
              )}
            </div>

            {/* Upgrade Plan Button */}
            <button
              type="button"
              className={styles.upgradePlanBtn}
              onClick={() => router.push("/seller/payment")}
            >
              <Sparkles size={18} />
              <span>{hasAnyActiveSub ? "Upgrade / Change Plan" : "Get Subscription Plan"}</span>
            </button>
          </section>
        </main>


        {/* Toast Notification */}
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

export default ResSellerProfile;
