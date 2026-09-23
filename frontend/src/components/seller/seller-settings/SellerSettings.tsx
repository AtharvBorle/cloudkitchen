"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import {
  Store,
  Truck,
  Bell,
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
  ImagePlus,
  Upload,
  Trash2,
  Star,
  LayoutGrid,
} from "lucide-react";
import styles from "./SellerSettings.module.css";

export interface SellerSettingsData {
  storeOnline: boolean;
  autoAcceptOrders: boolean;
  soundAlerts: boolean;
  prepTimeMinutes: number;
  autoConfirmBookings: boolean;
  enableInHouseDelivery: boolean;
  deliveryRadiusKm: number;
  freeDeliveryThreshold: string;
  allowCod: boolean;
  smsAlerts: boolean;
  whatsappUpdates: boolean;
  dailyEmailSummary: boolean;
  requirePinForRefund: boolean;
  twoFactorAuth: boolean;
}

const DEFAULT_SETTINGS: SellerSettingsData = {
  storeOnline: true,
  autoAcceptOrders: false,
  soundAlerts: true,
  prepTimeMinutes: 25,
  autoConfirmBookings: true,
  enableInHouseDelivery: true,
  deliveryRadiusKm: 8,
  freeDeliveryThreshold: "₹499",
  allowCod: true,
  smsAlerts: true,
  whatsappUpdates: true,
  dailyEmailSummary: true,
  requirePinForRefund: true,
  twoFactorAuth: false,
};

import { useSellerProfile, toggleSellerOnlineStatus, updateCachedProfile } from "@/hooks/useSellerProfile";

export interface SellerSettingsProps {
  initialSettings?: Partial<SellerSettingsData>;
  onSave?: (settings: SellerSettingsData) => void;
}

export const SellerSettings: React.FC<SellerSettingsProps> = ({
  initialSettings,
  onSave,
}) => {
  const searchParams = useSearchParams();
  const seller = useSellerProfile();
  const [settings, setSettings] = useState<SellerSettingsData>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "notifications") {
      const el = document.getElementById("notifications-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [searchParams]);

  // Card Grid Photo state (for Explore, User Dashboard & Best Places cards)
  const initialCardImg =
    seller.cardImageUrl ||
    (Array.isArray(seller.kitchenImages) && seller.kitchenImages[0]) ||
    seller.bannerImageUrl ||
    (seller.profile as any)?.bannerImageUrl ||
    "";
  const [cardPreview, setCardPreview] = useState<string>(initialCardImg);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [isUploadingCard, setIsUploadingCard] = useState<boolean>(false);

  // Storefront Cover Banner state (for top of menu page)
  const [bannerPreview, setBannerPreview] = useState<string>(
    seller.bannerImageUrl || (seller.profile as any)?.bannerImageUrl || ""
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof seller.isOnline === "boolean") {
      setSettings((prev) => ({ ...prev, storeOnline: seller.isOnline }));
    }
  }, [seller.isOnline]);

  React.useEffect(() => {
    const liveCardImg =
      seller.cardImageUrl ||
      (Array.isArray(seller.kitchenImages) && seller.kitchenImages[0]) ||
      seller.bannerImageUrl ||
      "";
    if (liveCardImg && !cardFile) {
      setCardPreview(liveCardImg);
    }
  }, [seller.cardImageUrl, seller.kitchenImages, seller.bannerImageUrl, cardFile]);

  React.useEffect(() => {
    if (seller.bannerImageUrl && !bannerFile) {
      setBannerPreview(seller.bannerImageUrl);
    }
  }, [seller.bannerImageUrl, bannerFile]);

  const handleCardFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSuccessMessage("Card grid image must be less than 5MB");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    setCardFile(file);
    const localUrl = URL.createObjectURL(file);
    setCardPreview(localUrl);
  };

  const handleQuickUploadCard = async () => {
    if (!cardFile) return;
    setIsUploadingCard(true);
    try {
      const data = new FormData();
      data.append("cardImageFile", cardFile);
      data.append("businessName", seller.businessName);

      const res = await fetchApi("/api/seller/profile", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error("Failed to upload card grid image");
      }

      const json = await res.json();
      const profileData = json.data?.profile || json.profile;
      let rawKImages: string[] = [];
      if (profileData?.kitchenImages) {
        try {
          rawKImages = typeof profileData.kitchenImages === "string" ? JSON.parse(profileData.kitchenImages) : profileData.kitchenImages;
        } catch {
          rawKImages = [];
        }
      }
      const updatedCardUrl = (Array.isArray(rawKImages) && rawKImages[0]) || profileData?.bannerImageUrl || cardPreview;
      setCardPreview(updatedCardUrl);
      setCardFile(null);
      updateCachedProfile({ cardImageUrl: updatedCardUrl, kitchenImages: rawKImages.length > 0 ? rawKImages : [updatedCardUrl] });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("seller-status-updated", { detail: { cardImageUrl: updatedCardUrl } }));
      }
      setSuccessMessage("Card grid photo published live on user dashboard & explore!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error("Card image upload error:", err);
      setSuccessMessage(err.message || "Card image upload failed");
      setTimeout(() => setSuccessMessage(null), 3500);
    } finally {
      setIsUploadingCard(false);
    }
  };

  const handleResetCard = async () => {
    setCardFile(null);
    setCardPreview("");
    updateCachedProfile({ cardImageUrl: "", kitchenImages: [] });
    try {
      const data = new FormData();
      data.append("removeCardImage", "true");
      await fetchApi("/api/seller/profile", {
        method: "POST",
        body: data,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("seller-status-updated", { detail: {} }));
      }
      setSuccessMessage("Card grid photo removed and reset to default theme");
    } catch {
      setSuccessMessage("Card grid photo reset to default theme");
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSuccessMessage("Banner image must be less than 5MB");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    setBannerFile(file);
    const localUrl = URL.createObjectURL(file);
    setBannerPreview(localUrl);
  };

  const handleQuickUploadBanner = async () => {
    if (!bannerFile) return;
    setIsUploadingBanner(true);
    try {
      const data = new FormData();
      data.append("bannerImageFile", bannerFile);
      data.append("businessName", seller.businessName);

      const res = await fetchApi("/api/seller/profile", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error("Failed to upload banner");
      }

      const json = await res.json();
      const updatedBannerUrl = json.data?.profile?.bannerImageUrl || json.profile?.bannerImageUrl || bannerPreview;
      setBannerPreview(updatedBannerUrl);
      setBannerFile(null);
      updateCachedProfile({ bannerImageUrl: updatedBannerUrl });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("seller-status-updated", { detail: { bannerImageUrl: updatedBannerUrl } }));
      }
      setSuccessMessage("Storefront cover banner uploaded and published live!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error("Banner upload error:", err);
      setSuccessMessage(err.message || "Banner upload failed");
      setTimeout(() => setSuccessMessage(null), 3500);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleResetBanner = async () => {
    setBannerFile(null);
    setBannerPreview("");
    updateCachedProfile({ bannerImageUrl: "" });
    try {
      const data = new FormData();
      data.append("removeBannerImage", "true");
      await fetchApi("/api/seller/profile", {
        method: "POST",
        body: data,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("seller-status-updated", { detail: {} }));
      }
      setSuccessMessage("Banner removed and reset to default theme");
    } catch {
      setSuccessMessage("Banner reset to default theme");
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleToggle = (key: keyof SellerSettingsData) => {
    const newVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    if (key === "storeOnline") {
      toggleSellerOnlineStatus(newVal);
    }
  };

  const handleNumberChange = (key: keyof SellerSettingsData, val: number) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleTextChange = (key: keyof SellerSettingsData, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleValueChange = (key: keyof SellerSettingsData, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      if (cardFile) {
        await handleQuickUploadCard();
      }
      if (bannerFile) {
        await handleQuickUploadBanner();
      }
      await toggleSellerOnlineStatus(settings.storeOnline);
      if (onSave) onSave(settings);
      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Left Desktop Sidebar */}
      <SellerSidebar
        activeItemId="settings"
        ownerName={seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* 2. Main Content Area */}
      <div className={styles.contentWrapper}>
        <Topbar
          title="Seller Settings"
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
        />

        <main className={styles.mainCanvas}>
          {/* Header Title */}
          <div className={styles.headerSection}>
            <h1 className={styles.pageTitle}>Operations &amp; Store Settings</h1>
            <p className={styles.pageDescription}>
              Manage your kitchen dispatch rules, storefront hero banner, delivery radii, and security controls.
            </p>
          </div>

          {/* Success Alert Banner */}
          {successMessage && (
            <div className={styles.successAlert}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 0A. Kitchen Card Grid Image (Dashboard & Explore Feed) */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Kitchen Card Grid Image (Dashboard &amp; Explore Listings)</h2>
                  <p className={styles.cardDescription}>
                    Photo displayed on your kitchen listing card in the Customer Dashboard, Explore search, and Best Places grid
                  </p>
                </div>
              </div>

              {/* Live Card Mockup matching customer dashboard */}
              <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "280px",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: "100%", height: "170px", position: "relative", backgroundColor: "#FFEBD8" }}>
                    <img
                      src={cardPreview || "/images/places/place-pizza.png"}
                      alt="Kitchen Card Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/places/place-pizza.png";
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        color: "#FFFFFF",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      Live Grid Card
                    </div>
                  </div>

                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#0F172A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {seller.businessName || "Your Kitchen"}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "#E8FBF2",
                          color: "#10B981",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "12.5px",
                          fontWeight: 800,
                          border: "1px solid #A7F3D0",
                        }}
                      >
                        <Star size={13} fill="#10B981" />
                        <span>4.8</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>20-30 min</span>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", gap: "14px", justifyContent: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                      Manage Listing Showcase Photo
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748B", lineHeight: "1.5" }}>
                      Customers first see this promotional card image when browsing nearby cloud kitchens. Upload high-definition food packaging, combo platters, or kitchen promo banners.
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "6px" }}>
                    <input
                      type="file"
                      id="operations-card-file-input"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      style={{ display: "none" }}
                      onChange={handleCardFileSelect}
                    />
                    <label
                      htmlFor="operations-card-file-input"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 18px",
                        backgroundColor: "#EA580C",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
                      }}
                    >
                      <Upload size={15} />
                      <span>{cardPreview ? "Replace Card Photo" : "Upload Card Photo"}</span>
                    </label>

                    {cardFile && (
                      <button
                        type="button"
                        onClick={handleQuickUploadCard}
                        disabled={isUploadingCard}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "9px 16px",
                          backgroundColor: "#16A34A",
                          color: "#FFFFFF",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          border: "none",
                          cursor: isUploadingCard ? "not-allowed" : "pointer",
                        }}
                      >
                        {isUploadingCard ? <Loader2 size={14} className={styles.spinner} /> : <Save size={14} />}
                        <span>{isUploadingCard ? "Uploading..." : "Publish Card Photo"}</span>
                      </button>
                    )}

                    {cardPreview && (
                      <button
                        type="button"
                        onClick={handleResetCard}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "9px 14px",
                          backgroundColor: "#FFF1F2",
                          color: "#E11D48",
                          border: "1px solid #FECDD3",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    Recommended: 600 x 600px (Square 1:1 or 4:3) • JPG/PNG/WebP up to 5MB
                  </span>
                </div>
              </div>
            </div>

            {/* 0B. Storefront Hero Banner & Visual Branding Card */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <ImagePlus size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Storefront Cover Banner &amp; Branding</h2>
                  <p className={styles.cardDescription}>
                    Hero cover image displayed at the top of your restaurant menu page for customers
                  </p>
                </div>
              </div>

              {/* Banner Preview Box */}
              <div
                style={{
                  width: "100%",
                  height: "170px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  position: "relative",
                  backgroundColor: "#0F172A",
                  marginTop: "8px",
                  border: "1.5px solid #E2E8F0",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
                }}
              >
                <img
                  src={bannerPreview || "/images/places/place-pizza.png"}
                  alt="Storefront Banner Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/places/place-pizza.png";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.1) 60%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", color: "#FDBA74", fontWeight: 700 }}>
                        Live Storefront Cover
                      </span>
                      <h3 style={{ margin: "2px 0 0 0", color: "#FFFFFF", fontSize: "16px", fontWeight: 700 }}>
                        {seller.businessName || "Your Kitchen"}
                      </h3>
                    </div>
                    <span
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(6px)",
                        color: "#FFFFFF",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      {bannerPreview ? "Custom Banner Live" : "Default Theme"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="file"
                    id="operations-banner-file-input"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    style={{ display: "none" }}
                    onChange={handleBannerFileSelect}
                  />
                  <label
                    htmlFor="operations-banner-file-input"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 18px",
                      backgroundColor: "#EA580C",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
                    }}
                  >
                    <Upload size={15} />
                    <span>{bannerPreview ? "Replace Banner" : "Upload Banner"}</span>
                  </label>

                  {bannerFile && (
                    <button
                      type="button"
                      onClick={handleQuickUploadBanner}
                      disabled={isUploadingBanner}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        backgroundColor: "#16A34A",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "none",
                        cursor: isUploadingBanner ? "not-allowed" : "pointer",
                      }}
                    >
                      {isUploadingBanner ? <Loader2 size={14} className={styles.spinner} /> : <Save size={14} />}
                      <span>{isUploadingBanner ? "Uploading..." : "Publish Banner"}</span>
                    </button>
                  )}

                  {bannerPreview && (
                    <button
                      type="button"
                      onClick={handleResetBanner}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "8px 14px",
                        backgroundColor: "#FFF1F2",
                        color: "#E11D48",
                        border: "1px solid #FECDD3",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Remove Banner</span>
                    </button>
                  )}
                </div>

                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Recommended: 1200 x 400px (3:1 ratio) • JPG/PNG/WebP up to 5MB
                </span>
              </div>
            </div>

            {/* 1. Kitchen & Store Operations */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <Store size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Kitchen &amp; Order Handling</h2>
                  <p className={styles.cardDescription}>
                    Configure incoming orders and online availability
                  </p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* Store Live Status */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Store Online / Live</p>
                    <p className={styles.settingSubtext}>
                      {settings.storeOnline ? "Currently accepting online orders" : "Store is marked offline"}
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.storeOnline}
                      onChange={() => handleToggle("storeOnline")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Auto-accept Orders */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Auto-Accept New Orders</p>
                    <p className={styles.settingSubtext}>
                      Automatically send paid orders to kitchen prep queue
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.autoAcceptOrders}
                      onChange={() => handleToggle("autoAcceptOrders")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Sound Alerts */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Sound Notification Chimes</p>
                    <p className={styles.settingSubtext}>
                      Play loud chime when a new delivery or dining order arrives
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.soundAlerts}
                      onChange={() => handleToggle("soundAlerts")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Auto Confirm Bookings */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Auto-Confirm Room Bookings</p>
                    <p className={styles.settingSubtext}>
                      Instantly approve reservation requests with valid payments
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.autoConfirmBookings}
                      onChange={() => handleToggle("autoConfirmBookings")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Kitchen Prep Time Selection */}
                <div className={styles.settingItem} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Default Estimated Prep Time</p>
                    <p className={styles.settingSubtext}>
                      Shown to customers as average order preparation window
                    </p>
                  </div>
                  <div className={styles.prepTimeGroup}>
                    {[15, 25, 35, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        className={`${styles.prepTimeBtn} ${
                          settings.prepTimeMinutes === mins ? styles.active : ""
                        }`}
                        onClick={() => handleValueChange("prepTimeMinutes", mins)}
                      >
                        {mins} Mins
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery & Fulfillment */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Delivery &amp; Logistics</h2>
                  <p className={styles.cardDescription}>
                    Set dispatch radius, threshold charges, and rider payment terms
                  </p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* In-House Delivery */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>In-House Fleet Delivery</p>
                    <p className={styles.settingSubtext}>
                      Assign orders directly to registered delivery agents
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.enableInHouseDelivery}
                      onChange={() => handleToggle("enableInHouseDelivery")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Cash On Delivery */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Cash On Delivery (COD)</p>
                    <p className={styles.settingSubtext}>
                      Permit riders to collect cash payments on doorstep
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.allowCod}
                      onChange={() => handleToggle("allowCod")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Delivery Radius */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Maximum Delivery Radius</p>
                    <p className={styles.settingSubtext}>Orders beyond this radius will be restricted</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.deliveryRadiusKm}
                    onChange={(e) => handleValueChange("deliveryRadiusKm", Number(e.target.value))}
                    className={styles.inputField}
                  />
                </div>

                {/* Free Delivery Threshold */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Free Delivery Minimum Cart</p>
                    <p className={styles.settingSubtext}>Minimum order total to waive delivery fee</p>
                  </div>
                  <input
                    type="text"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => handleValueChange("freeDeliveryThreshold", e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>

            {/* 3. Notifications & Security */}
            <div id="notifications-section" className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrapper}>
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Notifications &amp; Security</h2>
                  <p className={styles.cardDescription}>
                    Manage alert channels, SMS dispatch, and staff security PIN requirements
                  </p>
                </div>
              </div>

              <div className={styles.settingsGrid}>
                {/* SMS Alerts */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>SMS Dispatch Alerts</p>
                    <p className={styles.settingSubtext}>Send text updates for high-value orders</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.smsAlerts}
                      onChange={() => handleToggle("smsAlerts")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* WhatsApp Updates */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>WhatsApp Customer Updates</p>
                    <p className={styles.settingSubtext}>Live delivery tracking link via WhatsApp</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.whatsappUpdates}
                      onChange={() => handleToggle("whatsappUpdates")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* Daily Digest */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Daily Email Digest</p>
                    <p className={styles.settingSubtext}>Receive nightly settlement &amp; order metrics report</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.dailyEmailSummary}
                      onChange={() => handleToggle("dailyEmailSummary")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* PIN for Refund */}
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <p className={styles.settingLabel}>Manager PIN for Cancellations</p>
                    <p className={styles.settingSubtext}>Require manager PIN to void or cancel active orders</p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={settings.requirePinForRefund}
                      onChange={() => handleToggle("requirePinForRefund")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className={styles.saveBar}>
              <button type="submit" disabled={saving} className={styles.saveBtn}>
                {saving ? (
                  <Loader2 size={18} className={styles.spinner} />
                ) : (
                  <Save size={18} />
                )}
                <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default SellerSettings;
