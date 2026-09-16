"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Menu as MenuIcon,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Trash2,
  Package,
  Bell,
  Clock,
  Truck,
  Star,
  Shield,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import SellerNotificationChannels from "../notification-channels/SellerNotificationChannels";
import {
  PasswordManagementCard,
  ActiveLoginSessionsCard,
} from "../security-settings/SellerSecuritySettings";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import styles from "./ResponsiveSellerSettings.module.css";

export type SettingsTabType = "General" | "Notifications" | "Security" | "Preferences";

export interface OperatingHoursDay {
  day: string;
  shortDay: string;
  timeRange: string;
  isOpen: boolean;
}

export interface ResponsiveSellerSettingsData {
  // General - Restaurant Information
  businessName: string;
  businessEmail: string;
  phoneNumber: string;
  address: string;

  // General - Operating Hours
  operatingHours: OperatingHoursDay[];

  // General - Language & Region
  language: string;
  timezone: string;
  currency: string;

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
  requirePinForRefund: boolean;
  sessionTimeout: boolean;
  unfamiliarLoginAlerts: boolean;
  passwordResetSafetyCheck: boolean;

  // Preferences
  storeOnline: boolean;
  autoAcceptOrders: boolean;
  enableInHouseDelivery: boolean;
  allowCod: boolean;
  shareAnonymizedData: boolean;
  autoDeleteSessionHistory: boolean;
}

const DEFAULT_OPERATING_HOURS: OperatingHoursDay[] = [
  { day: "Monday", shortDay: "Mon", timeRange: "09:00 AM - 10:00 PM", isOpen: true },
  { day: "Tuesday", shortDay: "Tue", timeRange: "09:00 AM - 10:00 PM", isOpen: true },
  { day: "Wednesday", shortDay: "Wed", timeRange: "09:00 AM - 10:00 PM", isOpen: true },
  { day: "Thursday", shortDay: "Thu", timeRange: "09:00 AM - 10:00 PM", isOpen: true },
  { day: "Friday", shortDay: "Fri", timeRange: "09:00 AM - 10:00 PM", isOpen: true },
  { day: "Saturday", shortDay: "Sat", timeRange: "09:00 AM - 10:00 PM", isOpen: true },
  { day: "Sunday", shortDay: "Sun", timeRange: "09:00 AM - 10:00 PM", isOpen: false },
];

const INITIAL_SETTINGS: ResponsiveSellerSettingsData = {
  businessName: "Neo Cloud Kitchen & Rooms",
  businessEmail: "hello@neocloudbite.com",
  phoneNumber: "+91 98765 43210",
  address: "451 Innovation Way, Suite 300, Mumbai, MH 400001",
  operatingHours: DEFAULT_OPERATING_HOURS,
  language: "English",
  timezone: "Asia/Kolkata (UTC+5:30)",
  currency: "INR (₹)",

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
  requirePinForRefund: true,
  sessionTimeout: true,
  unfamiliarLoginAlerts: true,
  passwordResetSafetyCheck: true,

  // Preferences
  storeOnline: true,
  autoAcceptOrders: false,
  enableInHouseDelivery: true,
  allowCod: true,
  shareAnonymizedData: true,
  autoDeleteSessionHistory: false,
};

import { useSellerProfile, toggleSellerOnlineStatus } from "@/hooks/useSellerProfile";

export interface ResponsiveSellerSettingsProps {
  ownerName?: string;
  avatarInitials?: string;
  initialTab?: SettingsTabType;
  initialData?: Partial<ResponsiveSellerSettingsData>;
  onSave?: (data: ResponsiveSellerSettingsData) => void;
  onSyncDevices?: () => void;
}

export const ResponsiveSellerSettings: React.FC<ResponsiveSellerSettingsProps> = ({
  ownerName,
  avatarInitials,
  initialTab = "General",
  initialData,
  onSave,
  onSyncDevices,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seller = useSellerProfile();
  const effectiveOwnerName =
    ownerName &&
    ownerName !== "Rahul Sharma" &&
    ownerName !== "Rahul" &&
    ownerName !== "John Doe" &&
    ownerName !== "Kitchen Owner"
      ? ownerName
      : seller.ownerName;
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);

  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [formData, setFormData] = useState<ResponsiveSellerSettingsData>({
    ...INITIAL_SETTINGS,
    businessName: seller.businessName || INITIAL_SETTINGS.businessName,
    phoneNumber: seller.phone || INITIAL_SETTINGS.phoneNumber,
    businessEmail: seller.email || INITIAL_SETTINGS.businessEmail,
    address: seller.address || INITIAL_SETTINGS.address,
    storeOnline: typeof seller.isOnline === "boolean" ? seller.isOnline : INITIAL_SETTINGS.storeOnline,
    ...initialData,
  });

  useEffect(() => {
    if (typeof seller.isOnline === "boolean") {
      setFormData((prev) => ({ ...prev, storeOnline: seller.isOnline }));
    }
  }, [seller.isOnline]);

  useEffect(() => {
    if (seller.businessName || seller.phone || seller.email || seller.address) {
      setFormData((prev) => ({
        ...prev,
        businessName: prev.businessName === "Neo Cloud Kitchen & Rooms" && seller.businessName ? seller.businessName : prev.businessName,
        phoneNumber: prev.phoneNumber === "+91 98765 43210" && seller.phone ? seller.phone : prev.phoneNumber,
        businessEmail: prev.businessEmail === "hello@neocloudbite.com" && seller.email ? seller.email : prev.businessEmail,
        address: prev.address.includes("Innovation Way") && seller.address ? seller.address : prev.address,
      }));
    }
  }, [seller.businessName, seller.phone, seller.email, seller.address]);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTabType[]).find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (matched) {
        setActiveTab(matched);
      }
    }
  }, [searchParams]);

  const [saving, setSaving] = useState(false);
  const [toastData, setToastData] = useState<{ title: string; status: "ON" | "OFF" | null } | null>(null);

  const NOTIFICATION_TITLES: Partial<Record<keyof ResponsiveSellerSettingsData, string>> = {
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
    requirePinForRefund: "Manager PIN for Cancellations",
    sessionTimeout: "Auto Session Timeout",
    unfamiliarLoginAlerts: "Unfamiliar Login Alerts",
    passwordResetSafetyCheck: "Password Reset Safety Check",
    autoAcceptOrders: "Auto-Accept Orders",
    enableInHouseDelivery: "In-House Fleet Delivery",
    allowCod: "Cash On Delivery (COD)",
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

  const tabs: SettingsTabType[] = ["General", "Notifications", "Security", "Preferences"];

  const handleInputChange = (field: keyof ResponsiveSellerSettingsData, value: any) => {
    setFormData((prev) => {
      const title = NOTIFICATION_TITLES[field];
      if (title && typeof value === "boolean") {
        showNotificationToast(title, value);
      }
      return {
        ...prev,
        [field]: value,
      };
    });
    if (field === "storeOnline") {
      toggleSellerOnlineStatus(Boolean(value));
    }
  };

  const handleDayToggle = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.operatingHours];
      const targetDay = updated[index];
      const nextIsOpen = !targetDay.isOpen;
      updated[index] = {
        ...targetDay,
        isOpen: nextIsOpen,
      };
      showNotificationToast(`${targetDay.day} Schedule`, nextIsOpen);
      return {
        ...prev,
        operatingHours: updated,
      };
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      await toggleSellerOnlineStatus(formData.storeOnline);
      if (onSave) {
        onSave(formData);
      }
      setToastMessage("Settings updated successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
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
    <div className={styles.screenWrapper}>
      {/* Slide-out Navigation Drawer */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="settings"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      <div className={styles.mobileContainer}>
        {/* Top Sticky Header */}
        <header className={styles.topBar}>
          <div className={styles.headerLeftGroup}>
            <button
              type="button"
              className={styles.iconButton}
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

          <h1 className={styles.pageTitle}>Settings</h1>

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
        </header>

        {/* Horizontal Scrollable Tabs */}
        <div className={styles.pillsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.pillBtn} ${activeTab === tab ? styles.activePill : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <main className={styles.contentArea}>
          {activeTab === "General" && (
            <>
              {/* 1. Restaurant Information */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Restaurant Information</h2>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Business Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="e.g. Neo Cloud Kitchen & Rooms"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Business Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                    placeholder="e.g. hello@neocloudbite.com"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <PhoneInput
                    id="res-settings-phone"
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(val) => handleInputChange("phoneNumber", val)}
                    placeholder="98765 43210"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Address</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter full physical address"
                    rows={3}
                  />
                </div>
              </div>

              {/* 2. Operating Hours */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Operating Hours</h2>

                <div className={styles.hoursList}>
                  {formData.operatingHours.map((item, idx) => (
                    <div key={item.day} className={styles.hoursRow}>
                      <span className={styles.dayLabel}>{item.day}</span>
                      <span className={styles.timeRangeText}>{item.timeRange}</span>
                      <div className={styles.switchWrapper}>
                        <label className={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={item.isOpen}
                            onChange={() => handleDayToggle(idx)}
                            aria-label={`Toggle ${item.day} status`}
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Language & Region */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Language &amp; Region</h2>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Language</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.language}
                    onChange={(e) => handleInputChange("language", e.target.value)}
                    placeholder="e.g. English"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Timezone</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.timezone}
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                    placeholder="e.g. Asia/Kolkata (UTC+5:30)"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Currency</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.currency}
                    onChange={(e) => handleInputChange("currency", e.target.value)}
                    placeholder="e.g. INR (₹)"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "Notifications" && (
            <>
              {/* Notification Channels & Quiet Hours (Exact Reference Image Design) */}
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
                    [field]: !prev[field as keyof ResponsiveSellerSettingsData],
                  }));
                }}
              />

              {/* 1. Order & Booking Alerts */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: 700 }}>
                  Order &amp; Booking Alerts
                </h2>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>New Order Incoming</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Trigger alarm and print invoice instantly upon receiving customer orders.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.orderAlerts}
                        onChange={(e) => handleInputChange("orderAlerts", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Order Cancellation</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Immediate SMS and push ping when a customer cancels an order.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.orderCancellationAlerts}
                        onChange={(e) => handleInputChange("orderCancellationAlerts", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Room Bookings</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Alert when a customer books a cloud dining space or workspace.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.bookingRequestAlert}
                        onChange={(e) => handleInputChange("bookingRequestAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Delayed Deliveries</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Ping when a rider hasn&apos;t picked up an order within 15 minutes.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.deliveryDelayAlert}
                        onChange={(e) => handleInputChange("deliveryDelayAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Marketing & Growth Alerts */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle} style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: 700 }}>
                  Marketing &amp; Growth Alerts
                </h2>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Weekly Growth Performance</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Receive analytics detailing revenue, popular items, and rider performance.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.weeklyGrowthPerformance}
                        onChange={(e) => handleInputChange("weeklyGrowthPerformance", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Promotions &amp; Product Beta</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Receive updates regarding new cloud kitchen features, partner promos, and discounts.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.promotionsProductBeta}
                        onChange={(e) => handleInputChange("promotionsProductBeta", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 5. Bookings, Reviews & Summaries */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <Star size={17} className={styles.cardHeaderIcon} />
                  <h2 className={styles.cardTitle}>Bookings, Reviews &amp; Reports</h2>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Room &amp; Table Reservations</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>New booking requests &amp; check-in alerts</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.bookingRequestAlert}
                        onChange={(e) => handleInputChange("bookingRequestAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Critical Customer Review (≤ 2 Stars)</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Urgent alert to resolve low customer feedback</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.negativeReviewAlert}
                        onChange={(e) => handleInputChange("negativeReviewAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Daily Settlement &amp; Payout Email</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Nightly sales digest to registered email</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.dailyDigest}
                        onChange={(e) => handleInputChange("dailyDigest", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>SMS Customer Updates</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Send customer automated SMS updates</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.smsAlerts}
                        onChange={(e) => handleInputChange("smsAlerts", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>WhatsApp Order Notifications</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Auto-send live tracking on WhatsApp</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.whatsappUpdates}
                        onChange={(e) => handleInputChange("whatsappUpdates", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Security" && (
            <>
              {/* 1. Password Management Card (Matching Reference Image) */}
              <PasswordManagementCard />

              {/* 2. Security & Access Card */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <Shield size={17} className={styles.cardHeaderIcon} />
                  <h2 className={styles.cardTitle}>Authentication &amp; Access Control</h2>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Two-Factor Authentication (2FA)</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Require OTP verification on login</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.twoFactorAuth}
                        onChange={(e) => handleInputChange("twoFactorAuth", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Require PIN for Refunds &amp; Voids</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Manager code needed before refunding</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.requirePinForRefund}
                        onChange={(e) => handleInputChange("requirePinForRefund", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Auto Session Timeout (30 Mins)</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Auto-lock dashboard when inactive</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.sessionTimeout}
                        onChange={(e) => handleInputChange("sessionTimeout", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Active Login Sessions Card (Matching Reference Image) */}
              <ActiveLoginSessionsCard />

              {/* 4. Login & Recovery Controls Card */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Login &amp; Recovery Controls</h2>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Unfamiliar Login Alerts</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Send instant email alerts upon logins from new browsers/locations.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.unfamiliarLoginAlerts}
                        onChange={(e) => handleInputChange("unfamiliarLoginAlerts", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Password Reset Safety Check</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Require recovery email confirmation before allowing password resets.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.passwordResetSafetyCheck}
                        onChange={(e) => handleInputChange("passwordResetSafetyCheck", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "Preferences" && (
            <>
              {/* 1. Localization */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Localization</h2>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Default Interface Language</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.language}
                    onChange={(e) => handleInputChange("language", e.target.value)}
                    placeholder="e.g. English (United States)"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Console Timezone</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.timezone}
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                    placeholder="e.g. Asia/Kolkata (GMT+05:30)"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Primary Business Currency</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.currency}
                    onChange={(e) => handleInputChange("currency", e.target.value)}
                    placeholder="e.g. INR (₹) - Indian Rupee"
                  />
                </div>
              </div>

              {/* 2. Privacy & Data Options */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Privacy &amp; Data Options</h2>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Share Anonymized Usage Data</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Help us build better cloud operations by sharing aggregated diagnostic reports.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.shareAnonymizedData}
                        onChange={(e) => handleInputChange("shareAnonymizedData", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Auto-Delete Session History</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Remove logs and activity metrics older than 30 days automatically.</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.autoDeleteSessionHistory}
                        onChange={(e) => handleInputChange("autoDeleteSessionHistory", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                {/* Backup and Archival */}
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #F1F5F9" }}>
                  <span className={styles.label} style={{ display: "block", marginBottom: "8px", fontSize: "12.5px", fontWeight: 700 }}>
                    Backup and Archival
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button
                      type="button"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#FFFFFF",
                        color: "#334155",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        width: "100%",
                      }}
                      onClick={() => {
                        showNotificationToast("Exporting Business Data...", true);
                      }}
                    >
                      Export My Business Data
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#FEE2E2",
                        color: "#DC2626",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        width: "100%",
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
            </>
          )}
        </main>

        {/* Sticky Bottom Save Changes Action Bar */}
        <div className={styles.bottomActionContainer}>
          <button
            type="button"
            disabled={saving}
            className={styles.saveChangesBtn}
            onClick={() => handleSave()}
          >
            {saving ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

        {/* Delete Account Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
            <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalIconWrapper}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Delete Seller Account?</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#DC2626" }}>
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
                  className={styles.modalDeleteBtn}
                  disabled={deleteConfirmationText.trim().toUpperCase() !== "DELETE" || isDeletingAccount}
                  onClick={handleConfirmDeleteAccount}
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastData && (
          <div key={`${toastData.title}-${toastData.status}`} className={styles.toast}>
            <div style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: toastData.status === "ON" ? "#10B981" : "#EF4444",
              boxShadow: toastData.status === "ON" ? "0 0 8px #10B981" : "0 0 8px #EF4444",
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
    </div>
  );
};

export default ResponsiveSellerSettings;
