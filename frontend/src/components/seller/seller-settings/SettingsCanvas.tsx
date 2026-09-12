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
} from "lucide-react";
import SellerNotificationChannels, {
  NotificationChannelsData,
  DEFAULT_NOTIFICATION_CHANNELS,
} from "./notification-channels/SellerNotificationChannels";
import {
  PasswordManagementCard,
  ActiveLoginSessionsCard,
} from "./security-settings/SellerSecuritySettings";
import { useSellerProfile } from "@/hooks/useSellerProfile";
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

  // 5. Bookings, Reviews & Summaries
  bookingRequestAlert: boolean;
  negativeReviewAlert: boolean;
  dailyDigest: boolean;

  // Security
  twoFactorAuth: boolean;
  pinRequiredForCancel: boolean;
  sessionTimeout: boolean;

  // Preferences
  soundChimes: boolean;
  autoAcceptOrders: boolean;
  defaultPrepTime: string;
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

  // Bookings & Reports
  bookingRequestAlert: true,
  negativeReviewAlert: true,
  dailyDigest: true,

  // Security
  twoFactorAuth: false,
  pinRequiredForCancel: true,
  sessionTimeout: true,

  // Preferences
  soundChimes: true,
  autoAcceptOrders: false,
  defaultPrepTime: "25 mins",
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
    ...initialData,
  }));

  useEffect(() => {
    if (seller.businessName) {
      setFormData((prev) => {
        if (prev.businessName && prev.businessName !== "Neo Cloud Kitchen & Rooms") return prev;
        return {
          ...prev,
          businessName: seller.businessName || prev.businessName,
          businessEmail: seller.email || prev.businessEmail,
          phoneNumber: seller.phone || prev.phoneNumber,
          address: seller.address || prev.address,
        };
      });
    }
  }, [seller.businessName, seller.email, seller.phone, seller.address]);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
      updatedHours[index] = {
        ...updatedHours[index],
        isOpen: !updatedHours[index].isOpen,
      };
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
      updatedHours[index] = {
        ...updatedHours[index],
        [field]: value,
      };
      return { ...prev, operatingHours: updatedHours };
    });
  };

  const handleCheckboxToggle = (field: keyof SettingsFormData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (onSave) {
      onSave(formData);
    }

    setTimeout(() => {
      setSaving(false);
      setToastMessage("Settings saved successfully!");
      setTimeout(() => setToastMessage(null), 3500);
    }, 500);
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      setFormData({ ...DEFAULT_DATA, ...initialData });
      setToastMessage("Changes reverted");
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleConfirmDeleteAccount = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") return;
    setIsDeletingAccount(true);

    setTimeout(() => {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
      setToastMessage("Account deleted successfully. Redirecting...");
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
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Address */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    placeholder="Enter full registered address"
                    rows={3}
                  />
                </div>
              </div>

              {/* Card 2: Language & Region */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Language &amp; Region</h2>

                {/* Language */}
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
                  setFormData((prev) => ({
                    ...prev,
                    [field]: !prev[field as keyof SettingsFormData],
                  }));
                }}
              />
            </div>

            {/* Right Column: Order, Stock & Delivery Operational Alerts */}
            <div className={styles.rightColumn}>
              {/* 1. Order & Kitchen Notifications */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Bell size={18} color="#F97316" />
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Order &amp; Kitchen Alerts</h2>
                </div>

                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>New Incoming Order Chime</span>
                      <span className={styles.notificationDesc}>Play sound notification &amp; show popup on incoming orders</span>
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
                      <span className={styles.notificationLabel}>Order Cancellation &amp; Voids</span>
                      <span className={styles.notificationDesc}>Instant alert when an order is cancelled or refunded by customer</span>
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
                      <span className={styles.notificationLabel}>Special Cooking &amp; Allergy Notes</span>
                      <span className={styles.notificationDesc}>Highlight custom preparation notes and dietary instructions</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.specialInstructionsAlerts}
                        onChange={() => handleCheckboxToggle("specialInstructionsAlerts")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>High-Value Order Alerts</span>
                      <span className={styles.notificationDesc}>Special alert for large catering or party orders exceeding ₹2,000</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.highValueOrderAlerts}
                        onChange={() => handleCheckboxToggle("highValueOrderAlerts")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Stock & Inventory Alerts */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Package size={18} color="#F97316" />
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Stock &amp; Inventory Alerts</h2>
                </div>

                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Low Stock Alert</span>
                      <span className={styles.notificationDesc}>Notify immediately when item inventory drops below 5 units</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.lowStockAlert}
                        onChange={() => handleCheckboxToggle("lowStockAlert")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Out of Stock Critical Alert</span>
                      <span className={styles.notificationDesc}>Push critical sound alert when an ingredient reaches zero</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.outOfStockAlert}
                        onChange={() => handleCheckboxToggle("outOfStockAlert")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Auto-Pause Sold Out Items</span>
                      <span className={styles.notificationDesc}>Automatically mark depleted dishes as unavailable on online menus</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.autoPauseOutOfStock}
                        onChange={() => handleCheckboxToggle("autoPauseOutOfStock")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Delivery & Logistics Status */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Truck size={18} color="#F97316" />
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Delivery &amp; Rider Tracking</h2>
                </div>

                <div className={styles.notificationGroup}>
                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Rider Assigned &amp; Arrival</span>
                      <span className={styles.notificationDesc}>Alert when delivery rider accepts trip and arrives at store</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.riderAssignedAlert}
                        onChange={() => handleCheckboxToggle("riderAssignedAlert")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Out for Delivery</span>
                      <span className={styles.notificationDesc}>Notify when rider picks up package and leaves for destination</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.outForDeliveryAlert}
                        onChange={() => handleCheckboxToggle("outForDeliveryAlert")}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>

                  <div className={styles.notificationRow}>
                    <div className={styles.notificationInfo}>
                      <span className={styles.notificationLabel}>Order Delivered Confirmation</span>
                      <span className={styles.notificationDesc}>Live confirmation when customer receives order successfully</span>
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.orderDeliveredAlert}
                        onChange={() => handleCheckboxToggle("orderDeliveredAlert")}
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

              {/* 2. Authentication & Access Control Card */}
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
            </div>

            <div className={styles.rightColumn}>
              {/* 3. Active Login Sessions Card (Matching Reference Image) */}
              <ActiveLoginSessionsCard />

              {/* 4. Danger Zone: Delete Account */}
              <div className={styles.dangerCard}>
                <div className={styles.dangerHeader}>
                  <AlertTriangle size={20} />
                  <h2 className={styles.dangerTitle}>Danger Zone: Delete Account</h2>
                </div>

                <p className={styles.dangerDesc}>
                  Permanently delete your seller account, cloud kitchen profile, dish listings, room configurations, order records, and merchant subscriptions. Once deleted, this account cannot be restored.
                </p>

                <div className={styles.dangerActionRow}>
                  <button
                    type="button"
                    className={styles.deleteAccountBtn}
                    onClick={() => {
                      setDeleteConfirmationText("");
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Seller Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Preferences */}
        {activeTab === "Preferences" && (
          <div className={styles.mainGrid}>
            <div className={styles.leftColumn}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Kitchen &amp; Console Preferences</h2>
                
                <div className={styles.notificationRow}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationLabel}>Auto-Accept Paid Orders</span>
                    <span className={styles.notificationDesc}>Automatically push incoming orders to kitchen display system</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={formData.autoAcceptOrders}
                      onChange={() => handleCheckboxToggle("autoAcceptOrders")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.notificationRow}>
                  <div className={styles.notificationInfo}>
                    <span className={styles.notificationLabel}>Sound Chimes</span>
                    <span className={styles.notificationDesc}>Play chime on general status updates</span>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={formData.soundChimes}
                      onChange={() => handleCheckboxToggle("soundChimes")}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.fieldGroup} style={{ marginTop: "14px" }}>
                  <label className={styles.label}>Default Estimated Prep Window</label>
                  <input
                    type="text"
                    name="defaultPrepTime"
                    value={formData.defaultPrepTime}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g. 25 mins"
                  />
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
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsCanvas;
