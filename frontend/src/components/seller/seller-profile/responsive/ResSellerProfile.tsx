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
} from "lucide-react";
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
  onBack,
  onSaveProfile,
  onLogout,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // Form State
  const [ownerName, setOwnerName] = useState(
    initialOwnerName && !isGenericFallbackName(initialOwnerName)
      ? initialOwnerName
      : (seller.userFullName || seller.ownerName)
  );
  const [mobileNumber, setMobileNumber] = useState(
    initialMobileNumber && initialMobileNumber !== "+91 98887 76655" ? initialMobileNumber : seller.phone
  );
  const [primaryEmail, setPrimaryEmail] = useState(
    initialPrimaryEmail && initialPrimaryEmail !== "john.doe@neocloudroom.com"
      ? initialPrimaryEmail
      : seller.email
  );
  const [outletName, setOutletName] = useState(
    initialOutletName && !isGenericFallbackName(initialOutletName)
      ? initialOutletName
      : (seller.businessName || seller.ownerName)
  );
  const [registeredAddress, setRegisteredAddress] = useState(
    initialRegisteredAddress && !initialRegisteredAddress.includes("Koramangala")
      ? initialRegisteredAddress
      : seller.address
  );

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
  }, [seller.ownerName, seller.userFullName, seller.phone, seller.email, seller.businessName, seller.address]);

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

  const handleSaveChanges = () => {
    const payload = {
      ownerName,
      mobileNumber,
      primaryEmail,
      outletName,
      registeredAddress,
    };

    updateCachedProfile({
      ownerName: outletName || ownerName,
      businessName: outletName,
      userFullName: ownerName,
      email: primaryEmail,
      phone: mobileNumber,
      address: registeredAddress,
      avatarInitials: computeInitials(outletName || ownerName),
    });

    if (onSaveProfile) {
      onSaveProfile(payload);
    } else {
      showToast("Profile Changes Saved Successfully!");
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

  const handleShareQR = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://neocloud.app/kitchen/bangalore-central");
      showToast("Kitchen QR Link copied to clipboard!");
    } else {
      showToast("QR Link Ready to Share!");
    }
  };

  const handleDownloadQR = () => {
    showToast("Kitchen QR Code downloaded!");
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
            <h2 className={styles.cardTitle}>Profile &amp; Check-in QR</h2>

            {/* Kitchen QR Code */}
            <div className={styles.qrSubSection}>
              <h3 className={styles.qrSectionTitle}>Your Kitchen QR Code</h3>
              <p className={styles.qrSubtext}>
                Scan this QR code to view your kitchen profile
              </p>

              <div className={styles.qrBox}>
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 140 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="140" height="140" rx="8" fill="white" />
                  {/* Outer corner squares */}
                  <rect x="14" y="14" width="36" height="36" rx="6" fill="#0F172A" />
                  <rect x="22" y="22" width="20" height="20" rx="3" fill="white" />
                  <rect x="27" y="27" width="10" height="10" rx="2" fill="#0F172A" />

                  <rect x="90" y="14" width="36" height="36" rx="6" fill="#0F172A" />
                  <rect x="98" y="22" width="20" height="20" rx="3" fill="white" />
                  <rect x="103" y="27" width="10" height="10" rx="2" fill="#0F172A" />

                  <rect x="14" y="90" width="36" height="36" rx="6" fill="#0F172A" />
                  <rect x="22" y="98" width="20" height="20" rx="3" fill="white" />
                  <rect x="27" y="103" width="10" height="10" rx="2" fill="#0F172A" />

                  {/* QR Pattern Data Dots */}
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

              <p className={styles.qrInstruction}>
                Scan from the NeoCloud app to check in
              </p>

              <div className={styles.qrBtnRow}>
                <button
                  type="button"
                  className={styles.shareBtn}
                  onClick={handleShareQR}
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={handleDownloadQR}
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Payment QR Section */}
            <div className={styles.qrSubSection} style={{ marginTop: "6px" }}>
              <h3 className={styles.qrSectionTitle}>Payment QR</h3>
              <p className={styles.qrSubtext}>
                Sample Payment QR for in-store payments.
              </p>

              <div className={styles.paymentQrBox}>
                <QrCode size={64} color="#94A3B8" strokeWidth={1.5} />
              </div>
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
