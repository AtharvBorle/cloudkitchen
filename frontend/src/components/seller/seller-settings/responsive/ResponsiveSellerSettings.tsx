"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  smsAlerts: boolean;
  whatsappUpdates: boolean;

  // Security
  twoFactorAuth: boolean;
  requirePinForRefund: boolean;
  sessionTimeout: boolean;

  // Preferences
  storeOnline: boolean;
  autoAcceptOrders: boolean;
  enableInHouseDelivery: boolean;
  allowCod: boolean;
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
  smsAlerts: true,
  whatsappUpdates: true,

  // Security
  twoFactorAuth: false,
  requirePinForRefund: true,
  sessionTimeout: true,

  // Preferences
  storeOnline: true,
  autoAcceptOrders: false,
  enableInHouseDelivery: true,
  allowCod: true,
};

export interface ResponsiveSellerSettingsProps {
  ownerName?: string;
  avatarInitials?: string;
  initialData?: Partial<ResponsiveSellerSettingsData>;
  onSave?: (data: ResponsiveSellerSettingsData) => void;
  onSyncDevices?: () => void;
}

export const ResponsiveSellerSettings: React.FC<ResponsiveSellerSettingsProps> = ({
  ownerName = "Rahul Sharma",
  avatarInitials = "JD",
  initialData,
  onSave,
  onSyncDevices,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>("General");
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [formData, setFormData] = useState<ResponsiveSellerSettingsData>({
    ...INITIAL_SETTINGS,
    ...initialData,
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const tabs: SettingsTabType[] = ["General", "Notifications", "Security", "Preferences"];

  const handleInputChange = (field: keyof ResponsiveSellerSettingsData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDayToggle = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.operatingHours];
      updated[index] = {
        ...updated[index],
        isOpen: !updated[index].isOpen,
      };
      return {
        ...prev,
        operatingHours: updated,
      };
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    if (onSave) {
      onSave(formData);
    }

    setTimeout(() => {
      setSaving(false);
      setToastMessage("Settings updated successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    }, 600);
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
        ownerName={ownerName}
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
            className={styles.avatarCircle}
            onClick={() => setIsNavMenuOpen(true)}
            aria-label="Open Navigation Menu"
            title="Open Menu"
          >
            {avatarInitials}
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
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="e.g. +91 98765 43210"
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
              {/* 1. Stock & Inventory Alerts */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <Package size={17} className={styles.cardHeaderIcon} />
                  <h2 className={styles.cardTitle}>Stock &amp; Inventory Alerts</h2>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Low Stock Alert</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Alert when item quantity drops below 5</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.lowStockAlert}
                        onChange={(e) => handleInputChange("lowStockAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Out of Stock Critical Alert</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Immediate alarm when an item reaches 0</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.outOfStockAlert}
                        onChange={(e) => handleInputChange("outOfStockAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Auto-Pause Sold Out Dishes</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Hide 0-stock dishes on online store</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.autoPauseOutOfStock}
                        onChange={(e) => handleInputChange("autoPauseOutOfStock", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Order & Kitchen Notifications */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <Bell size={17} className={styles.cardHeaderIcon} />
                  <h2 className={styles.cardTitle}>Order &amp; Kitchen Alerts</h2>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>New Incoming Order Chime</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Ring audio chime when order arrives</span>
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
                    <span className={styles.label}>Order Cancellation / Voids</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Alert when customer cancels order</span>
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
                    <span className={styles.label}>Special Cooking &amp; Allergy Notes</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Highlight dietary/custom prep notes</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.specialInstructionsAlerts}
                        onChange={(e) => handleInputChange("specialInstructionsAlerts", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>High-Value Orders (&gt; ₹2,000)</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Priority alert for large bulk orders</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.highValueOrderAlerts}
                        onChange={(e) => handleInputChange("highValueOrderAlerts", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Shop Timings & Closing Alerts */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <Clock size={17} className={styles.cardHeaderIcon} />
                  <h2 className={styles.cardTitle}>Shop Timings &amp; Closing Alerts</h2>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Closing Reminder (30 mins before)</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Prepare staff for kitchen shutdown</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.closingReminder30Min}
                        onChange={(e) => handleInputChange("closingReminder30Min", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Final Order Cut-Off (15 mins before)</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Stop accepting new orders alert</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.closingReminder15Min}
                        onChange={(e) => handleInputChange("closingReminder15Min", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Shop Auto-Closed Status Alert</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Confirm offline status at closing time</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.autoCloseStatusAlert}
                        onChange={(e) => handleInputChange("autoCloseStatusAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* 4. Order Delivery Status Notifications */}
              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <Truck size={17} className={styles.cardHeaderIcon} />
                  <h2 className={styles.cardTitle}>Delivery Status &amp; Tracking</h2>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Rider Assigned &amp; Arrival</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Alert when rider reaches kitchen</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.riderAssignedAlert}
                        onChange={(e) => handleInputChange("riderAssignedAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Out for Delivery Dispatch</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Notify when order leaves kitchen</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.outForDeliveryAlert}
                        onChange={(e) => handleInputChange("outForDeliveryAlert", e.target.checked)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Delayed Delivery Alert (&gt; 15 mins)</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Alert kitchen if rider is delayed</span>
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

                <div className={styles.hoursRow}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.label}>Order Delivered Confirmation</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Notification on successful drop-off</span>
                  </div>
                  <div className={styles.switchWrapper}>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={formData.orderDeliveredAlert}
                        onChange={(e) => handleInputChange("orderDeliveredAlert", e.target.checked)}
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
              {/* Security & Access Card */}
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

              {/* Danger Zone: Delete Account */}
              <div className={styles.dangerCard}>
                <div className={styles.dangerHeader}>
                  <AlertTriangle size={18} />
                  <h2 className={styles.dangerTitle}>Danger Zone: Delete Account</h2>
                </div>

                <p className={styles.dangerDesc}>
                  Permanently delete your cloud kitchen account, menu listings, room configurations, order records, and merchant subscriptions. Once deleted, this account cannot be restored.
                </p>

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
            </>
          )}

          {activeTab === "Preferences" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Operational Preferences</h2>

              <div className={styles.hoursRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className={styles.label}>Store Online</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Accept live orders across platforms</span>
                </div>
                <div className={styles.switchWrapper}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={formData.storeOnline}
                      onChange={(e) => handleInputChange("storeOnline", e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <div className={styles.hoursRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className={styles.label}>Auto-Accept Orders</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Directly dispatch to kitchen display</span>
                </div>
                <div className={styles.switchWrapper}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={formData.autoAcceptOrders}
                      onChange={(e) => handleInputChange("autoAcceptOrders", e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <div className={styles.hoursRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className={styles.label}>In-House Fleet Delivery</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Assign orders to local store riders</span>
                </div>
                <div className={styles.switchWrapper}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={formData.enableInHouseDelivery}
                      onChange={(e) => handleInputChange("enableInHouseDelivery", e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>

              <div className={styles.hoursRow}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span className={styles.label}>Cash On Delivery (COD)</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Allow cash payments upon drop-off</span>
                </div>
                <div className={styles.switchWrapper}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={formData.allowCod}
                      onChange={(e) => handleInputChange("allowCod", e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>
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
        {toastMessage && (
          <div className={styles.toast}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveSellerSettings;
