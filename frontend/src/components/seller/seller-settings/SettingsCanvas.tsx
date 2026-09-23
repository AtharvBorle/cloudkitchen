"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Trash2,
  Bell,
  Shield,
  Clock,
  Package,
  Truck,
  CalendarCheck,
  Star,
  Lock,
  MapPin,
} from "lucide-react";
import SellerNotificationChannels, {
  NotificationChannelsData,
  DEFAULT_NOTIFICATION_CHANNELS,
} from "./notification-channels/SellerNotificationChannels";
import {
  PasswordManagementCard,
  ActiveLoginSessionsCard,
} from "./security-settings/SellerSecuritySettings";
import { useSellerProfile, updateCachedProfile, computeInitials } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import SellerMapPicker from "@/components/seller/seller-registration/business-information/SellerMapPicker";
import styles from "./SettingsCanvas.module.css";

export type SettingsTab = "General" | "Notifications" | "Security" | "Preferences";

export interface OperatingHoursItem {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface SettingsFormData {
  businessName: string;
  businessEmail: string;
  phoneNumber: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  isLocationPinned?: boolean;
  language: string;
  timezone: string;
  currency: string;
  operatingHours: OperatingHoursItem[];

  // Notification Channels & Quiet Hours (Reference Image)
  emailNotifications: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  whatsappUpdates: boolean;
  enableQuietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // 1. Stock & Inventory Alerts
  lowStockAlert: boolean;
  outOfStockAlert: boolean;
  autoPauseOutOfStock: boolean;

  // 2. Order & Kitchen Notifications
  orderAlerts: boolean;
  orderCancellationAlerts: boolean;
  specialInstructionsAlerts: boolean;
  highValueOrderAlerts: boolean;

  // 3. Shop Timings & Closing Alerts
  closingReminder30Min: boolean;
  closingReminder15Min: boolean;
  autoCloseStatusAlert: boolean;

  // 4. Delivery & Logistics Status
  riderAssignedAlert: boolean;
  outForDeliveryAlert: boolean;
  deliveryDelayAlert: boolean;
  orderDeliveredAlert: boolean;

  // Marketing & Growth Alerts (Reference Image)
  weeklyGrowthPerformance: boolean;
  promotionsProductBeta: boolean;

  // Bookings, Reviews & Summaries
  bookingRequestAlert: boolean;
  negativeReviewAlert: boolean;
  dailyDigest: boolean;

  // Security
  twoFactorAuth: boolean;
  pinRequiredForCancel: boolean;
  sessionTimeout: boolean;
  unfamiliarLoginAlerts: boolean;
  passwordResetSafetyCheck: boolean;

  // Preferences
  soundChimes: boolean;
  autoAcceptOrders: boolean;
  defaultPrepTime: string;
  shareAnonymizedData: boolean;
  autoDeleteSessionHistory: boolean;
}

const DEFAULT_HOURS: OperatingHoursItem[] = [
  { day: "Mon", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Tue", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Wed", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Thu", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Fri", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Sat", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: true },
  { day: "Sun", openTime: "09:00 AM", closeTime: "10:00 PM", isOpen: false },
];

const TIME_OPTIONS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
];

const DEFAULT_DATA: SettingsFormData = {
  businessName: "",
  businessEmail: "",
  phoneNumber: "",
  address: "",
  latitude: null,
  longitude: null,
  isLocationPinned: false,
  language: "English",
  timezone: "Asia/Kolkata (UTC+5:30)",
  currency: "INR (₹)",
  operatingHours: DEFAULT_HOURS,

  // Notification Channels & Quiet Hours (Reference Image)
  emailNotifications: true,
  smsAlerts: true,
  pushNotifications: true,
  whatsappUpdates: false,
  enableQuietHours: true,
  quietHoursStart: "10:00 PM",
  quietHoursEnd: "07:00 AM",

  // Stock
  lowStockAlert: true,
  outOfStockAlert: true,
  autoPauseOutOfStock: true,

  // Orders
  orderAlerts: true,
  orderCancellationAlerts: true,
  specialInstructionsAlerts: true,
  highValueOrderAlerts: false,

  // Timings
  closingReminder30Min: true,
  closingReminder15Min: true,
  autoCloseStatusAlert: true,

  // Delivery
  riderAssignedAlert: true,
  outForDeliveryAlert: true,
  deliveryDelayAlert: true,
  orderDeliveredAlert: true,

  // Marketing & Growth Alerts (Reference Image)
  weeklyGrowthPerformance: true,
  promotionsProductBeta: false,

  // Bookings & Reports
  bookingRequestAlert: true,
  negativeReviewAlert: true,
  dailyDigest: true,

  // Security
  twoFactorAuth: false,
  pinRequiredForCancel: true,
  sessionTimeout: true,
  unfamiliarLoginAlerts: true,
  passwordResetSafetyCheck: true,

  // Preferences
  soundChimes: true,
  autoAcceptOrders: false,
  defaultPrepTime: "25 mins",
  shareAnonymizedData: true,
  autoDeleteSessionHistory: false,
};

export interface SettingsCanvasProps {
  initialTab?: SettingsTab;
  initialData?: Partial<SettingsFormData>;
  onSave?: (data: SettingsFormData) => void;
  onCancel?: () => void;
}

export const SettingsCanvas: React.FC<SettingsCanvasProps> = ({
  initialTab = "General",
  initialData,
  onSave,
  onCancel,
}) => {
  const searchParams = useSearchParams();
  const seller = useSellerProfile();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [formData, setFormData] = useState<SettingsFormData>(() => ({
    ...DEFAULT_DATA,
    businessName: initialData?.businessName || seller.businessName,
    businessEmail: initialData?.businessEmail || seller.email,
    phoneNumber: initialData?.phoneNumber || seller.phone,
    address: initialData?.address || seller.address,
    latitude: initialData?.latitude !== undefined ? initialData.latitude : (seller.latitude ?? null),
    longitude: initialData?.longitude !== undefined ? initialData.longitude : (seller.longitude ?? null),
    isLocationPinned: initialData?.isLocationPinned !== undefined ? initialData.isLocationPinned : (seller.isLocationPinned ?? false),
    ...initialData,
  }));

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedRegional = localStorage.getItem("seller_regional_settings");
        if (savedRegional) {
          const parsed = JSON.parse(savedRegional);
          setFormData((prev) => ({
            ...prev,
            language: parsed.language || prev.language,
            timezone: parsed.timezone || prev.timezone,
            currency: parsed.currency || prev.currency,
            operatingHours: parsed.operatingHours || prev.operatingHours,
          }));
        }
      }
    } catch (e) {
      console.error("Error reading saved regional settings:", e);
    }
  }, []);

  useEffect(() => {
    if (seller.businessName || seller.email || seller.phone || seller.address || seller.latitude || seller.longitude) {
      setFormData((prev) => ({
        ...prev,
        businessName: (!prev.businessName || prev.businessName === "Neo Cloud Kitchen & Rooms") && seller.businessName ? seller.businessName : prev.businessName,
        businessEmail: (!prev.businessEmail || prev.businessEmail === "hello@neocloudbite.com") && seller.email ? seller.email : prev.businessEmail,
        phoneNumber: (!prev.phoneNumber || prev.phoneNumber === "+91 98765 43210") && seller.phone ? seller.phone : prev.phoneNumber,
        address: (!prev.address || prev.address.includes("Innovation Way")) && seller.address ? seller.address : prev.address,
        latitude: seller.latitude !== undefined && seller.latitude !== null ? seller.latitude : prev.latitude,
        longitude: seller.longitude !== undefined && seller.longitude !== null ? seller.longitude : prev.longitude,
        isLocationPinned: seller.isLocationPinned ?? prev.isLocationPinned,
      }));
    }
  }, [seller.businessName, seller.email, seller.phone, seller.address, seller.latitude, seller.longitude, seller.isLocationPinned]);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTab[]).find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (matched) {
        setActiveTab(matched);
      }
    }
  }, [searchParams]);

  const [saving, setSaving] = useState(false);
  const [toastData, setToastData] = useState<{ title: string; status: "ON" | "OFF" | null } | null>(null);

  const NOTIFICATION_TITLES: Partial<Record<keyof SettingsFormData, string>> = {
    emailNotifications: "Email Notifications",
    smsAlerts: "SMS Alerts",
    pushNotifications: "Push Notifications",
    whatsappUpdates: "WhatsApp Updates",
    enableQuietHours: "Quiet Hours & Do Not Disturb",
    orderAlerts: "New Order Incoming",
    orderCancellationAlerts: "Order Cancellation",
    bookingRequestAlert: "Room Bookings",
    deliveryDelayAlert: "Delayed Deliveries",
    weeklyGrowthPerformance: "Weekly Growth Performance",
    promotionsProductBeta: "Promotions & Product Beta",
    twoFactorAuth: "Two-Factor Authentication (2FA)",
    pinRequiredForCancel: "Manager PIN for Cancellations",
    sessionTimeout: "Auto Session Timeout",
    unfamiliarLoginAlerts: "Unfamiliar Login Alerts",
    passwordResetSafetyCheck: "Password Reset Safety Check",
    autoAcceptOrders: "Auto-Accept Paid Orders",
    soundChimes: "Sound Chimes",
    shareAnonymizedData: "Share Anonymized Usage Data",
    autoDeleteSessionHistory: "Auto-Delete Session History",
  };

  const showNotificationToast = (title: string, isOn: boolean) => {
    setToastData({ title, status: isOn ? "ON" : "OFF" });
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!toastData) return;
    const timer = setTimeout(() => {
      setToastData(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleOperatingDay = (index: number) => {
    setFormData((prev) => {
      const updatedHours = [...prev.operatingHours];
      const targetDay = updatedHours[index];
      const nextIsOpen = !targetDay.isOpen;
      updatedHours[index] = {
        ...targetDay,
        isOpen: nextIsOpen,
      };
      showNotificationToast(`${targetDay.day} Schedule`, nextIsOpen);
      return { ...prev, operatingHours: updatedHours };
    });
  };

  const handleTimeChange = (
    index: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setFormData((prev) => {
      const updatedHours = [...prev.operatingHours];
      const targetDay = updatedHours[index];
      updatedHours[index] = {
        ...targetDay,
        [field]: value,
      };
      const label = field === "openTime" ? "Opens at" : "Closes at";
      setToastData({ title: `${targetDay.day} ${label} ${value}`, status: "ON" });
      return { ...prev, operatingHours: updatedHours };
    });
  };

  const handleCheckboxToggle = (field: keyof SettingsFormData) => {
    setFormData((prev) => {
      const nextVal = !prev[field];
      const title = NOTIFICATION_TITLES[field];
      if (title) {
        showNotificationToast(title, nextVal);
      }
      return {
        ...prev,
        [field]: nextVal,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Save regional and preferences to localStorage
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "seller_regional_settings",
            JSON.stringify({
              language: formData.language,
              timezone: formData.timezone,
              currency: formData.currency,
              operatingHours: formData.operatingHours,
            })
          );
        }
      } catch (err) {
        console.error("Failed to save regional settings to localStorage:", err);
      }

      // 2. Persist Restaurant Information to backend database
      const res = await fetchApi("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          email: formData.businessEmail,
          phone: formData.phoneNumber,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          isLocationPinned: Boolean(formData.latitude && formData.longitude),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile settings");
      }

      // 3. Update cached profile state across all components
      updateCachedProfile({
        ownerName: formData.businessName,
        businessName: formData.businessName,
        email: formData.businessEmail,
        phone: formData.phoneNumber,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        isLocationPinned: Boolean(formData.latitude && formData.longitude),
        avatarInitials: computeInitials(formData.businessName),
      });

      if (onSave) {
        onSave(formData);
      }

      setToastData({ title: "Settings saved successfully!", status: "ON" });
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setToastData({ title: err.message || "Failed to save settings", status: "OFF" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      setFormData({ ...DEFAULT_DATA, ...initialData });
      setToastData({ title: "Changes reverted", status: null });
    }
  };

  const handleConfirmDeleteAccount = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") return;
    setIsDeletingAccount(true);

    setTimeout(() => {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
      setToastData({ title: "Account deleted successfully. Redirecting...", status: "OFF" });
      setTimeout(() => {
        window.location.href = "/seller/login";
      }, 1500);
    }, 1200);
  };

  return (
    <div className={styles.canvasContainer}>
      {/* 1. Header Title & Subtitle */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Manage your account preferences, notifications, security credentials, and application rules.
        </p>
      </div>

      {/* 2. Tabs Navigation */}
      <div className={styles.tabsContainer} role="tablist">
        {(["General", "Notifications", "Security", "Preferences"] as SettingsTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Form Body */}
      <form onSubmit={handleSubmit}>
        {/* Tab 1: General (Matches the Exact Provided Image) */}
        {activeTab === "General" && (
          <div className={styles.mainGrid}>
            {/* Left Column: Restaurant Info & Language */}
            <div className={styles.leftColumn}>
              {/* Card 1: Restaurant Information */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Restaurant Information</h2>

                {/* Business Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Enter business name"
                  />
                </div>

                {/* Business Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Business Email</label>
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Enter business email"
                  />
                </div>

                {/* Phone Number */}
                <div className={styles.fieldGroup}>
                  <PhoneInput
                    id="settings-phone"
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, phoneNumber: val }))
                    }
                    placeholder="98765 43210"
                  />
                </div>

                {/* Delivery Coverage & Nearby Customers Notice Banner */}
                <div
                  style={{
                    backgroundColor: "#FFF7ED",
                    border: "1.5px solid #FED7AA",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginTop: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#9A3412" }}>
                        Delivery Distance &amp; Nearby Reach
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "8px",
                          backgroundColor: "#EA580C",
                          color: "#FFFFFF",
                          textTransform: "uppercase",
                        }}
                      >
                        Important Notice
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#C2410C", margin: 0, lineHeight: 1.45 }}>
                      📍 <strong>Note:</strong> This exact GPS map pin is used to calculate delivery distance and display your kitchen to nearby customers. Drag or search to set your exact kitchen entrance.
                    </p>
                  </div>
                </div>

                {/* Interactive Map Pin Picker */}
                <div className={styles.fieldGroup}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <label className={styles.label} style={{ margin: 0 }}>
                      Kitchen Location on Map <span style={{ color: "#EA580C" }}>*</span>
                    </label>
                    {formData.latitude && formData.longitude ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#16A34A",
                          backgroundColor: "#F0FDF4",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          border: "1px solid #BBF7D0",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircle2 size={12} /> Pinned: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#EA580C",
                          backgroundColor: "#FFF7ED",
                          padding: "2px 8px",
                          borderRadius: "10px",
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
                      setFormData((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                        isLocationPinned: true,
                        address: formattedAddress || prev.address,
                      }));
                    }}
                  />
                </div>

                {/* Address */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Registered Address &amp; Building Details <span style={{ color: "#EA580C" }}>*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    placeholder="Flat / Shop No., Building Name, Street / Road, Area, City, Pincode"
                    rows={3}
                  />
                  <p style={{ fontSize: "12px", color: "#64748B", margin: "3px 0 0 0" }}>
                    Shown on customer receipts and used by delivery riders for store pickup navigation.
                  </p>
                </div>
              </div>

              {/* Card 2: Language & Region */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Language &amp; Region</h2>

                {/* Language (Commented out for now) */}
                {/*
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Language</label>
                  <div className={styles.selectWrapper}>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                    <ChevronDown size={18} className={styles.selectChevron} />
                  </div>
                </div>
                */}

                {/* Timezone */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Timezone</label>
                  <div className={styles.selectWrapper}>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="Asia/Kolkata (UTC+5:30)">Asia/Kolkata (UTC+5:30)</option>
                      <option value="Asia/Dubai (UTC+4:00)">Asia/Dubai (UTC+4:00)</option>
                      <option value="UTC (UTC+0:00)">UTC (UTC+0:00)</option>
                    </select>
                    <ChevronDown size={18} className={styles.selectChevron} />
                  </div>
                </div>

                {/* Currency */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Currency</label>
                  <div className={styles.selectWrapper}>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="USD ($)">USD ($)</option>
                      <option value="AED (AED)">AED (AED)</option>
                    </select>
                    <ChevronDown size={18} className={styles.selectChevron} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Operating Hours */}
            <div className={styles.rightColumn}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Operating Hours</h2>

                <div className={styles.hoursTable}>
                  {/* Table Column Headers */}
                  <div className={styles.tableHeader}>
                    <span className={styles.headerCell}>Day</span>
                    <span className={styles.headerCell}>Open</span>
                    <span className={styles.headerCell}>Close</span>
                    <span className={`${styles.headerCell} ${styles.headerCellRight}`}>Status</span>
                  </div>

                  {/* 7 Days Row List */}
                  {formData.operatingHours.map((row, idx) => (
                    <div key={row.day} className={styles.dayRow}>
                      <span className={styles.dayName}>{row.day}</span>

                      {/* Open Select */}
                      <div className={styles.timeSelectWrapper}>
                        <select
                          value={row.openTime}
                          disabled={!row.isOpen}
                          onChange={(e) => handleTimeChange(idx, "openTime", e.target.value)}
                          className={styles.timeSelect}
                          style={{ opacity: row.isOpen ? 1 : 0.5 }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className={styles.timeSelectChevron} />
                      </div>

                      {/* Close Select */}
                      <div className={styles.timeSelectWrapper}>
                        <select
                          value={row.closeTime}
                          disabled={!row.isOpen}
                          onChange={(e) => handleTimeChange(idx, "closeTime", e.target.value)}
                          className={styles.timeSelect}
                          style={{ opacity: row.isOpen ? 1 : 0.5 }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className={styles.timeSelectChevron} />
                      </div>

                      {/* Status Toggle Switch */}
                      <div className={styles.switchWrapper}>
                        <label className={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={row.isOpen}
                            onChange={() => handleToggleOperatingDay(idx)}
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === "Notifications" && (
          <div className={styles.mainGrid}>
            {/* Left Column: Notification Channels & Quiet Hours (Exact Reference Image Design) */}
            <div className={styles.leftColumn}>
              <SellerNotificationChannels
                data={{
                  emailNotifications: formData.emailNotifications,
                  smsAlerts: formData.smsAlerts,
                  pushNotifications: formData.pushNotifications,
                  whatsappUpdates: formData.whatsappUpdates,
                  enableQuietHours: formData.enableQuietHours,
                  quietHoursStart: formData.quietHoursStart,
                  quietHoursEnd: formData.quietHoursEnd,
                }}
                onChange={(field, value) => {
                  setFormData((prev) => ({
                    ...prev,
                    [field]: value,
                  }));
                }}
                onToggle={(field) => {
                  setFormData((prev) => {
                    const nextVal = !prev[field as keyof SettingsFormData];
                    const title = NOTIFICATION_TITLES[field as keyof SettingsFormData];
                    if (title) {
                      showNotificationToast(title, nextVal);
                    }
                    return {
                      ...prev,
                      [field]: nextVal,
                    };
                  });
                }}
              />
            </div>

            {/* Right Column: Order, Stock & Delivery Operational Alerts */}
            <div className={styles.rightColumn}>
              {/* 1. Order & Booking Alerts */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                  Order &amp; Booking Alerts
                </h2>

                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>New Order Incoming</span>
                      <span className={styles.notificationDesc}>Trigger alarm and print invoice instantly upon receiving customer orders.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.orderAlerts}
                        onChange={() => handleCheckboxToggle("orderAlerts")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Order Cancellation</span>
                      <span className={styles.notificationDesc}>Immediate SMS and push ping when a customer cancels an order.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.orderCancellationAlerts}
                        onChange={() => handleCheckboxToggle("orderCancellationAlerts")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Room Bookings</span>
                      <span className={styles.notificationDesc}>Alert when a customer books a cloud dining space or workspace.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.bookingRequestAlert}
                        onChange={() => handleCheckboxToggle("bookingRequestAlert")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Delayed Deliveries</span>
                      <span className={styles.notificationDesc}>Ping when a rider hasn&apos;t picked up an order within 15 minutes.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.deliveryDelayAlert}
                        onChange={() => handleCheckboxToggle("deliveryDelayAlert")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Marketing & Growth Alerts */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                  Marketing &amp; Growth Alerts
                </h2>

                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Weekly Growth Performance</span>
                      <span className={styles.notificationDesc}>Receive analytics detailing revenue, popular items, and rider performance.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.weeklyGrowthPerformance}
                        onChange={() => handleCheckboxToggle("weeklyGrowthPerformance")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Promotions &amp; Product Beta</span>
                      <span className={styles.notificationDesc}>Receive updates regarding new cloud kitchen features, partner promos, and discounts.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.promotionsProductBeta}
                        onChange={() => handleCheckboxToggle("promotionsProductBeta")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security */}
        {activeTab === "Security" && (
          <div className={styles.mainGrid}>
            <div className={styles.leftColumn}>
              {/* 1. Password Management Card (Matching Reference Image) */}
              <PasswordManagementCard />

              {/* 2. Authentication & Access Control Card (Disabled via comment - uncomment to re-enable) */}
              {/*
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Shield size={18} color="#F97316" />
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Authentication &amp; Access Control</h2>
                </div>
                
                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Two-Factor Authentication (2FA)</span>
                      <span className={styles.notificationDesc}>Require OTP code via SMS / Authenticator app when signing in</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.twoFactorAuth}
                        onChange={() => handleCheckboxToggle("twoFactorAuth")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Require PIN for Order Cancellations &amp; Voids</span>
                      <span className={styles.notificationDesc}>Ask for 4-digit manager PIN to void or refund orders</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.pinRequiredForCancel}
                        onChange={() => handleCheckboxToggle("pinRequiredForCancel")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Auto Session Timeout (30 Mins)</span>
                      <span className={styles.notificationDesc}>Automatically lock console if inactive to protect kitchen POS</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.sessionTimeout}
                        onChange={() => handleCheckboxToggle("sessionTimeout")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>
              */}
            </div>

            <div className={styles.rightColumn}>
              {/* 3. Active Login Sessions Card (Matching Reference Image) */}
              <ActiveLoginSessionsCard />

              {/* 4. Login & Recovery Controls Card (Disabled via comment - uncomment to re-enable) */}
              {/*
              <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                  Login &amp; Recovery Controls
                </h2>

                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Unfamiliar Login Alerts</span>
                      <span className={styles.notificationDesc}>Send instant email alerts upon logins from new browsers/locations.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.unfamiliarLoginAlerts}
                        onChange={() => handleCheckboxToggle("unfamiliarLoginAlerts")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Password Reset Safety Check</span>
                      <span className={styles.notificationDesc}>Require recovery email confirmation before allowing password resets.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.passwordResetSafetyCheck}
                        onChange={() => handleCheckboxToggle("passwordResetSafetyCheck")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>
              */}
            </div>
          </div>
        )}

        {/* Tab 4: Preferences */}
        {activeTab === "Preferences" && (
          <div className={styles.mainGrid}>
            {/* Left Column: Localization */}
            <div className={styles.leftColumn}>
              {/* Localization */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Localization</h2>

                {/* Default Interface Language (Commented out for now) */}
                {/*
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Default Interface Language</label>
                  <div className={styles.selectWrapper}>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="English (United States)">English (United States)</option>
                      <option value="English (India)">English (India)</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                    <ChevronDown size={18} className={styles.selectChevron} />
                  </div>
                </div>
                */}

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Console Timezone</label>
                  <div className={styles.selectWrapper}>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="Asia/Kolkata (GMT+05:30)">Asia/Kolkata (GMT+05:30)</option>
                      <option value="Asia/Dubai (GMT+04:00)">Asia/Dubai (GMT+04:00)</option>
                      <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                    </select>
                    <ChevronDown size={18} className={styles.selectChevron} />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Primary Business Currency</label>
                  <div className={styles.selectWrapper}>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="INR (₹) - Indian Rupee">INR (₹) - Indian Rupee</option>
                      <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                      <option value="AED (AED) - UAE Dirham">AED (AED) - UAE Dirham</option>
                    </select>
                    <ChevronDown size={18} className={styles.selectChevron} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Privacy & Data Options */}
            <div className={styles.rightColumn}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Privacy &amp; Data Options</h2>

                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Share Anonymized Usage Data</span>
                      <span className={styles.notificationDesc}>Help us build better cloud operations by sharing aggregated diagnostic reports.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.shareAnonymizedData}
                        onChange={() => handleCheckboxToggle("shareAnonymizedData")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Auto-Delete Session History</span>
                      <span className={styles.notificationDesc}>Remove logs and activity metrics older than 30 days automatically.</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.autoDeleteSessionHistory}
                        onChange={() => handleCheckboxToggle("autoDeleteSessionHistory")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                {/* Backup and Archival */}
                <div className={styles.backupSection}>
                  <span className={styles.label} style={{ display: "block", marginBottom: "10px", fontSize: "13px", fontWeight: 700 }}>
                    Backup and Archival
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={styles.exportBtn}
                      onClick={() => {
                        setToastData({ title: "Exporting Business Data...", status: "ON" });
                      }}
                    >
                      Export My Business Data
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "9px 16px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#FEE2E2",
                        color: "#DC2626",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => {
                        setDeleteConfirmationText("");
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      Delete Account Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Bottom Action Buttons: Cancel & Save Changes */}
        <div className={styles.actionsBar}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancelClick}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={styles.saveBtn}
          >
            {saving && <Loader2 size={16} className="spinner" />}
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrapper}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className={styles.modalTitle}>Delete Seller Account?</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#DC2626" }}>
                  This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>

            <p className={styles.modalBody}>
              Deleting your account will immediately remove all your active cloud kitchen menus, room booking calendars, rider assignments, customer reviews, and payout records.
            </p>

            <div className={styles.modalWarningList}>
              <span>• All active customer food orders will be cancelled &amp; refunded</span>
              <span>• Room and table reservations will be voided</span>
              <span>• Merchant subscription and payout settlements will be closed</span>
            </div>

            <div className={styles.modalConfirmInputGroup}>
              <label className={styles.modalConfirmLabel}>
                Type <strong style={{ color: "#EF4444" }}>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                className={styles.modalInput}
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                autoFocus
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalDeleteBtn}
                disabled={deleteConfirmationText.trim().toUpperCase() !== "DELETE" || isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Confirmation */}
      {toastData && (
        <div key={`${toastData.title}-${toastData.status}`} className={styles.toast}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: toastData.status === "ON" ? "#10B981" : "#EF4444",
            boxShadow: toastData.status === "ON" ? "0 0 10px #10B981" : "0 0 10px #EF4444",
          }} />
          <span style={{ color: "#F8FAFC" }}>{toastData.title}</span>
          <span
            className={`${styles.toastStatusBadge} ${
              toastData.status === "ON" ? styles.toastStatusOn : styles.toastStatusOff
            }`}
          >
            {toastData.status}
          </span>
        </div>
      )}
    </div>
  );
};

export default SettingsCanvas;
