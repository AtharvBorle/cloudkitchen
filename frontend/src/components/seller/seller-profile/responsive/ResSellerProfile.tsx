"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Menu as MenuIcon,
  Share2,
  Download,
  CreditCard,
  CheckCircle2,
  QrCode,
  Sparkles,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import styles from "./ResSellerProfile.module.css";

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
  initialOwnerName = "John Doe",
  initialMobileNumber = "+91 98887 76655",
  initialPrimaryEmail = "john.doe@neocloudroom.com",
  initialOutletName = "Neo Cloud Room - Bangalore Central Hub",
  initialRegisteredAddress = "45, 1st Main Rd, Koramangala 4th Block, Bangalore, Karnataka 560034",
  onBack,
  onSaveProfile,
  onLogout,
  onSyncDevices,
}) => {
  const router = useRouter();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // Form State
  const [ownerName, setOwnerName] = useState(initialOwnerName);
  const [mobileNumber, setMobileNumber] = useState(initialMobileNumber);
  const [primaryEmail, setPrimaryEmail] = useState(initialPrimaryEmail);
  const [outletName, setOutletName] = useState(initialOutletName);
  const [registeredAddress, setRegisteredAddress] = useState(initialRegisteredAddress);

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
        router.push("/auth/login/seller");
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

  return (
    <div className={styles.screenWrapper}>
      {/* Slide-out Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="profile"
        ownerName={ownerName}
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

          {/* Top-Right Back Button with Back text for UX */}
          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
              aria-label="Back to Dashboard"
              title="Back"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
              <span className={styles.backText}>Back</span>
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
              <label htmlFor="ownerMobile" className={styles.label}>
                Mobile Number
              </label>
              <input
                id="ownerMobile"
                type="tel"
                className={styles.input}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
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
            <div className={styles.subHeaderRow}>
              <CreditCard size={20} color="#0F172A" />
              <h2 className={styles.subTitle}>Subscription &amp; Plan</h2>
            </div>

            <div className={styles.activeSubBadge}>
              <span className={styles.subDot} />
              <span>Active Subscription</span>
            </div>

            {/* Food Services Group */}
            <div className={styles.planGroup}>
              <div className={styles.planGroupHeader}>
                <span className={styles.planGroupTitle}>FOOD SERVICES</span>
              </div>
              <p className={styles.planGroupSubtitle}>
                Cloud kitchen &amp; food management tools
              </p>

              {/* 1. Monthly Bolt */}
              <div className={styles.planItemBox}>
                <div className={styles.planItemTop}>
                  <h3 className={styles.planItemName}>1. Monthly Bolt</h3>
                  <button
                    type="button"
                    className={styles.editPlanLink}
                    onClick={() => router.push("/seller/res/subscription/editPlan")}
                  >
                    Edit
                  </button>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Current Plan:</span>
                  <span className={styles.planItemDetailVal}>Monthly Bolt</span>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Validity:</span>
                  <span className={styles.planItemDetailVal}>7/6 – 8/5/2025</span>
                </div>
              </div>

              {/* 2. Monthly Gold */}
              <div className={styles.planItemBox}>
                <div className={styles.planItemTop}>
                  <h3 className={styles.planItemName}>2. Monthly Gold</h3>
                  <button
                    type="button"
                    className={styles.editPlanLink}
                    onClick={() => router.push("/seller/res/subscription/editPlan")}
                  >
                    Edit
                  </button>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Current Plan:</span>
                  <span className={styles.planItemDetailVal}>Monthly Gold</span>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Validity:</span>
                  <span className={styles.planItemDetailVal}>7/6 – 8/5/2025</span>
                </div>
              </div>

              <div className={styles.expiryRow}>
                <span className={styles.expiryKey}>Final Expiry</span>
                <span className={styles.expiryValRed}>Oct 5, 2025</span>
              </div>
            </div>

            {/* Property Bookings Group */}
            <div className={styles.planGroup}>
              <div className={styles.planGroupHeader}>
                <span className={styles.planGroupTitle}>PROPERTY BOOKINGS</span>
                <Link href="/seller/res/subscription" className={styles.upgradeLink}>
                  Upgrade
                </Link>
              </div>
              <p className={styles.planGroupSubtitle}>
                Listing, info &amp; reservation tools
              </p>

              {/* 1. Monthly Bolt */}
              <div className={styles.planItemBox}>
                <div className={styles.planItemTop}>
                  <h3 className={styles.planItemName}>1. Monthly Bolt</h3>
                  <button
                    type="button"
                    className={styles.editPlanLink}
                    onClick={() => router.push("/seller/res/subscription/editPlan")}
                  >
                    Edit
                  </button>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Current Plan:</span>
                  <span className={styles.planItemDetailVal}>Monthly Bolt</span>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Validity:</span>
                  <span className={styles.planItemDetailVal}>7/6 – 8/5/2025</span>
                </div>
              </div>

              {/* 2. Monthly Property Gold */}
              <div className={styles.planItemBox}>
                <div className={styles.planItemTop}>
                  <h3 className={styles.planItemName}>2. Monthly Property Gold</h3>
                  <button
                    type="button"
                    className={styles.editPlanLink}
                    onClick={() => router.push("/seller/res/subscription/editPlan")}
                  >
                    Edit
                  </button>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Current Plan:</span>
                  <span className={styles.planItemDetailVal}>Monthly Property Gold</span>
                </div>
                <div className={styles.planItemDetailRow}>
                  <span className={styles.planItemDetailKey}>Validity:</span>
                  <span className={styles.planItemDetailVal}>7/6 – 8/5/2025</span>
                </div>
              </div>

              <div className={styles.expiryRow}>
                <span className={styles.expiryKey}>Final Expiry</span>
                <span className={styles.expiryValBlue}>Sep 20, 2025</span>
              </div>
            </div>

            {/* Upgrade Plan Button */}
            <button
              type="button"
              className={styles.upgradePlanBtn}
              onClick={() => router.push("/seller/res/subscription/newPlan")}
            >
              <Sparkles size={18} />
              <span>Upgrade Plan</span>
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
