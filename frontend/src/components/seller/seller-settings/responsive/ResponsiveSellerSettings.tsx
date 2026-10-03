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
  MapPin,
  ImagePlus,
  LayoutGrid,
  Upload,
  Save,
  Edit2,
  Check,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import SellerNotificationChannels from "../notification-channels/SellerNotificationChannels";
import {
  PasswordManagementCard,
  ActiveLoginSessionsCard,
} from "../security-settings/SellerSecuritySettings";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import { validateEmail } from "@/lib/email-validation";
import { validateKitchenName } from "@/lib/kitchen-validation";
import { convertBusinessDataToCSV } from "@/lib/export-business-data-csv";
import SellerMapPicker from "@/components/seller/seller-registration/business-information/SellerMapPicker";
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
  latitude?: number | null;
  longitude?: number | null;
  isLocationPinned?: boolean;
  deliveryRadiusKm?: number;

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
  latitude: null,
  longitude: null,
  isLocationPinned: false,
  operatingHours: DEFAULT_OPERATING_HOURS,
  language: "English",
  timezone: "Asia/Kolkata (UTC+5:30)",
  currency: "INR (₹)",

  // Notification Channels & Quiet Hours (Reference Image)
  emailNotifications: true,
  smsAlerts: true,
  pushNotifications: true,
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

import { useSellerProfile, toggleSellerOnlineStatus, updateCachedProfile, computeInitials } from "@/hooks/useSellerProfile";
import { useSellerNotifications } from "@/hooks/useSellerNotifications";
import { fetchApi } from "@/lib/fetch-api";
import { compressImage } from "@/lib/image-compression";

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
  const { unreadCount } = useSellerNotifications();
  const effectiveOwnerName =
    ownerName &&
    ownerName !== "Rahul Sharma" &&
    ownerName !== "Rahul" &&
    ownerName !== "John Doe" &&
    ownerName !== "Kitchen Owner"
      ? ownerName
      : seller.ownerName;

  const [activeTab, setActiveTab] = useState<SettingsTabType>(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTabType[]).find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (matched) return matched;
    }
    if (typeof window !== "undefined") {
      try {
        const savedTab = localStorage.getItem("seller_settings_active_tab");
        if (savedTab) {
          const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTabType[]).find(
            (t) => t.toLowerCase() === savedTab.toLowerCase()
          );
          if (matched) return matched;
        }
      } catch {}
    }
    return initialTab;
  });

  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [originalGeneralData, setOriginalGeneralData] = useState<ResponsiveSellerSettingsData | null>(null);

  const handleTabChange = (tab: SettingsTabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("seller_settings_active_tab", tab.toLowerCase());
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab.toLowerCase());
        window.history.replaceState(null, "", url.toString());
      } catch {}
    }
  };

  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [formData, setFormData] = useState<ResponsiveSellerSettingsData>(() => {
    let savedHours = DEFAULT_OPERATING_HOURS;
    let savedLanguage = "English";
    let savedTimezone = "Asia/Kolkata (UTC+5:30)";
    let savedCurrency = "INR (₹)";

    if (typeof window !== "undefined") {
      try {
        const savedRegional = localStorage.getItem("seller_regional_settings");
        if (savedRegional) {
          const parsed = JSON.parse(savedRegional);
          if (parsed.operatingHours && Array.isArray(parsed.operatingHours) && parsed.operatingHours.length > 0) {
            savedHours = parsed.operatingHours;
          }
          if (parsed.language) savedLanguage = parsed.language;
          if (parsed.timezone) savedTimezone = parsed.timezone;
          if (parsed.currency) savedCurrency = parsed.currency;
        } else {
          const savedPrefs = localStorage.getItem("seller_settings_preferences");
          if (savedPrefs) {
            const parsed = JSON.parse(savedPrefs);
            if (parsed.operatingHours && Array.isArray(parsed.operatingHours) && parsed.operatingHours.length > 0) {
              savedHours = parsed.operatingHours;
            }
          }
        }
      } catch (err) {
        console.error("Error reading initial settings in responsive:", err);
      }
    }

    return {
      ...INITIAL_SETTINGS,
      operatingHours: savedHours,
      language: savedLanguage,
      timezone: savedTimezone,
      currency: savedCurrency,
      businessName: seller.businessName || INITIAL_SETTINGS.businessName,
      phoneNumber: seller.phone || INITIAL_SETTINGS.phoneNumber,
      businessEmail: seller.email || INITIAL_SETTINGS.businessEmail,
      address: seller.address || INITIAL_SETTINGS.address,
      latitude: initialData?.latitude !== undefined ? initialData.latitude : (seller.latitude ?? null),
      longitude: initialData?.longitude !== undefined ? initialData.longitude : (seller.longitude ?? null),
      isLocationPinned: initialData?.isLocationPinned !== undefined ? initialData.isLocationPinned : (seller.isLocationPinned ?? false),
      deliveryRadiusKm: initialData?.deliveryRadiusKm !== undefined ? initialData.deliveryRadiusKm : (seller.deliveryRadiusKm ?? 5),
      storeOnline: typeof seller.isOnline === "boolean" ? seller.isOnline : INITIAL_SETTINGS.storeOnline,
      ...initialData,
    };
  });

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
            operatingHours: parsed.operatingHours && Array.isArray(parsed.operatingHours) && parsed.operatingHours.length > 0 ? parsed.operatingHours : prev.operatingHours,
          }));
        }

        const savedPrefs = localStorage.getItem("seller_settings_preferences");
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          setFormData((prev) => ({
            ...prev,
            ...parsed,
            operatingHours: parsed.operatingHours && Array.isArray(parsed.operatingHours) && parsed.operatingHours.length > 0 ? parsed.operatingHours : prev.operatingHours,
          }));
        }
      }
    } catch (e) {
      console.error("Error reading saved regional settings in responsive:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof seller.isOnline === "boolean") {
      setFormData((prev) => ({ ...prev, storeOnline: seller.isOnline }));
    }
  }, [seller.isOnline]);

  useEffect(() => {
    if (seller.businessName || seller.phone || seller.email || seller.address || seller.latitude || seller.longitude || seller.deliveryRadiusKm !== undefined) {
      setFormData((prev) => ({
        ...prev,
        businessName: (!prev.businessName || prev.businessName === "Neo Cloud Kitchen & Rooms") && seller.businessName ? seller.businessName : prev.businessName,
        phoneNumber: (!prev.phoneNumber || prev.phoneNumber === "+91 98765 43210") && seller.phone ? seller.phone : prev.phoneNumber,
        businessEmail: (!prev.businessEmail || prev.businessEmail === "hello@neocloudbite.com") && seller.email ? seller.email : prev.businessEmail,
        address: (!prev.address || prev.address.includes("Innovation Way")) && seller.address ? seller.address : prev.address,
        latitude: seller.latitude !== undefined && seller.latitude !== null ? seller.latitude : prev.latitude,
        longitude: seller.longitude !== undefined && seller.longitude !== null ? seller.longitude : prev.longitude,
        isLocationPinned: seller.isLocationPinned ?? prev.isLocationPinned,
        deliveryRadiusKm: seller.deliveryRadiusKm !== undefined && seller.deliveryRadiusKm !== null ? seller.deliveryRadiusKm : prev.deliveryRadiusKm,
      }));
    }
  }, [seller.businessName, seller.phone, seller.email, seller.address, seller.latitude, seller.longitude, seller.isLocationPinned, seller.deliveryRadiusKm]);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTabType[]).find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (matched) {
        setActiveTab(matched);
        try {
          localStorage.setItem("seller_settings_active_tab", matched.toLowerCase());
        } catch {}
      }
    }
  }, [searchParams]);

  const [saving, setSaving] = useState(false);
  const [toastData, setToastData] = useState<{ title: string; status: "ON" | "OFF" | null } | null>(null);

  // Kitchen Card Grid Photo State
  const [cardPreview, setCardPreview] = useState<string>(
    seller.cardImageUrl || ""
  );
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [isUploadingCard, setIsUploadingCard] = useState<boolean>(false);

  useEffect(() => {
    if (seller.cardImageUrl && !cardFile) {
      setCardPreview(seller.cardImageUrl);
    }
  }, [seller.cardImageUrl, cardFile]);

  const handleCardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToastData({ title: "Image size must be less than 10MB", status: "OFF" });
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setCardPreview(localUrl);
    setCardFile(file);
    setToastData({ title: "Card photo selected. Tap Save to apply.", status: "ON" });

    try {
      const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.82 });
      setCardFile(compressed);
    } catch {
      // Fallback to original file
    }
  };

  const handleQuickUploadCard = async () => {
    if (!cardFile) return;
    setIsUploadingCard(true);
    try {
      const fileToUpload = await compressImage(cardFile, { maxDimension: 1200, quality: 0.82 });
      const data = new FormData();
      data.append("cardImageFile", fileToUpload);
      data.append("businessName", formData.businessName || seller.businessName);
      data.append("phone", formData.phoneNumber || seller.phone);
      data.append("email", formData.businessEmail || seller.email);
      data.append("address", formData.address || seller.address);
      if (formData.latitude) data.append("latitude", String(formData.latitude));
      if (formData.longitude) data.append("longitude", String(formData.longitude));
      data.append("isLocationPinned", String(Boolean(formData.latitude && formData.longitude)));

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
      setToastData({ title: "Card photo updated successfully!", status: "ON" });
    } catch (err: any) {
      console.error("Card upload error:", err);
      setToastData({ title: err.message || "Card upload failed", status: "OFF" });
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
      setToastData({ title: "Card photo reset to default theme", status: "ON" });
    } catch {
      setToastData({ title: "Card photo reset to default theme", status: "ON" });
    }
  };

  // Storefront Banner State
  const [bannerPreview, setBannerPreview] = useState<string>(
    seller.bannerImageUrl || (seller.profile as any)?.bannerImageUrl || ""
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);

  useEffect(() => {
    if (seller.bannerImageUrl && !bannerFile) {
      setBannerPreview(seller.bannerImageUrl);
    }
  }, [seller.bannerImageUrl, bannerFile]);

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToastData({ title: "Image size must be less than 10MB", status: "OFF" });
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setBannerPreview(localUrl);
    setBannerFile(file);
    setToastData({ title: "Banner selected. Tap Save to apply.", status: "ON" });

    try {
      const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.82 });
      setBannerFile(compressed);
    } catch {
      // Fallback to original file
    }
  };

  const handleQuickUploadBanner = async () => {
    if (!bannerFile) return;
    setIsUploadingBanner(true);
    try {
      const fileToUpload = await compressImage(bannerFile, { maxDimension: 1600, quality: 0.82 });
      const data = new FormData();
      data.append("bannerImageFile", fileToUpload);
      data.append("businessName", formData.businessName || seller.businessName);
      data.append("phone", formData.phoneNumber || seller.phone);
      data.append("email", formData.businessEmail || seller.email);
      data.append("address", formData.address || seller.address);
      if (formData.latitude) data.append("latitude", String(formData.latitude));
      if (formData.longitude) data.append("longitude", String(formData.longitude));
      data.append("isLocationPinned", String(Boolean(formData.latitude && formData.longitude)));

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
      setToastData({ title: "Banner updated successfully!", status: "ON" });
    } catch (err: any) {
      console.error("Banner upload error:", err);
      setToastData({ title: err.message || "Banner upload failed", status: "OFF" });
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
      setToastData({ title: "Banner removed and reset to default theme", status: "ON" });
    } catch {
      setToastData({ title: "Banner reset to default theme", status: "ON" });
    }
  };

  const NOTIFICATION_TITLES: Partial<Record<keyof ResponsiveSellerSettingsData, string>> = {
    emailNotifications: "Email Notifications",
    smsAlerts: "SMS Alerts",
    pushNotifications: "Push Notifications",
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

  // Address Direct Edit / Update states
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [addressUpdatedSuccess, setAddressUpdatedSuccess] = useState(false);
  const addressTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleToggleEditAddress = () => {
    setIsEditingAddress(true);
    setTimeout(() => {
      addressTextareaRef.current?.focus();
    }, 50);
  };

  const handleQuickUpdateAddress = async () => {
    if (!formData.address.trim()) {
      setToastData({ title: "Address cannot be empty", status: "OFF" });
      return;
    }

    setIsUpdatingAddress(true);
    try {
      const res = await fetchApi("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formData.address.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
          isLocationPinned: Boolean(formData.latitude && formData.longitude),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to update address");
      }

      // Update cached profile state
      updateCachedProfile({
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        isLocationPinned: Boolean(formData.latitude && formData.longitude),
      });

      // Sync localStorage
      if (typeof window !== "undefined") {
        try {
          const prevPrefs = JSON.parse(localStorage.getItem("seller_settings_preferences") || "{}");
          localStorage.setItem(
            "seller_settings_preferences",
            JSON.stringify({ ...prevPrefs, address: formData.address.trim() })
          );
        } catch {}
        window.dispatchEvent(new CustomEvent("seller-status-updated"));
      }

      setAddressUpdatedSuccess(true);
      setIsEditingAddress(false);
      setToastData({ title: "Registered address updated successfully!", status: "ON" });
      setTimeout(() => setAddressUpdatedSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to update address:", err);
      setToastData({ title: err.message || "Failed to update address", status: "OFF" });
    } finally {
      setIsUpdatingAddress(false);
    }
  };

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
      const updated = {
        ...prev,
        [field]: value,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("seller_settings_preferences", JSON.stringify(updated));
        } catch {}
      }
      return updated;
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
      const nextFormData = {
        ...prev,
        operatingHours: updated,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "seller_regional_settings",
            JSON.stringify({
              language: prev.language,
              timezone: prev.timezone,
              currency: prev.currency,
              operatingHours: updated,
            })
          );
          localStorage.setItem(
            "seller_settings_preferences",
            JSON.stringify(nextFormData)
          );
        } catch {}
      }
      return nextFormData;
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (formData.businessName) {
      const nameValidation = validateKitchenName(formData.businessName);
      if (!nameValidation.isValid) {
        setToastData({
          title: nameValidation.error || "Please enter a valid kitchen name.",
          status: "OFF",
        });
        return;
      }
    }

    if (formData.businessEmail) {
      const emailValidation = validateEmail(formData.businessEmail);
      if (!emailValidation.isValid) {
        setToastData({
          title: emailValidation.error || "Please enter a valid email address.",
          status: "OFF",
        });
        return;
      }
    }

    // Validate operating hours: Start Time and End Time cannot be the same
    const invalidOperatingDay = formData.operatingHours.find(
      (row) => row.isOpen && row.timeRange && (
        row.timeRange.split("-")[0]?.trim() === row.timeRange.split("-")[1]?.trim()
      )
    );
    if (invalidOperatingDay) {
      setToastData({
        title: `Start Time and End Time cannot be the same for ${invalidOperatingDay.day}.`,
        status: "OFF",
      });
      return;
    }

    setSaving(true);

    try {
      // 1. Save regional settings to localStorage
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
          localStorage.setItem(
            "seller_settings_preferences",
            JSON.stringify(formData)
          );
        }
      } catch (err) {
        console.error("Failed to save settings in responsive:", err);
      }

      // 2. Persist Restaurant Information, Card Photo & Banner to backend database
      let res: Response;
      if (cardFile || bannerFile) {
        const fd = new FormData();
        fd.append("businessName", formData.businessName);
        fd.append("email", formData.businessEmail);
        fd.append("phone", formData.phoneNumber);
        fd.append("address", formData.address);
        if (formData.latitude) fd.append("latitude", String(formData.latitude));
        if (formData.longitude) fd.append("longitude", String(formData.longitude));
        fd.append("isLocationPinned", String(Boolean(formData.latitude && formData.longitude)));
        if (formData.deliveryRadiusKm) fd.append("deliveryRadiusKm", String(formData.deliveryRadiusKm));
        if (cardFile) fd.append("cardImageFile", cardFile);
        if (bannerFile) fd.append("bannerImageFile", bannerFile);

        res = await fetchApi("/api/seller/profile", {
          method: "POST",
          body: fd,
        });
      } else {
        res = await fetchApi("/api/seller/profile", {
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
            deliveryRadiusKm: formData.deliveryRadiusKm || 5,
          }),
        });
      }
      updateCachedProfile({ deliveryRadiusKm: formData.deliveryRadiusKm || 5 });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update settings");
      }

      const resJson = await res.json().catch(() => ({}));
      const profileData = resJson.data?.profile || resJson.profile;
      let rawKImages: string[] = [];
      if (profileData?.kitchenImages) {
        try {
          rawKImages = typeof profileData.kitchenImages === "string" ? JSON.parse(profileData.kitchenImages) : profileData.kitchenImages;
        } catch {
          rawKImages = [];
        }
      }
      const updatedCardUrl = (Array.isArray(rawKImages) && rawKImages[0]) || profileData?.bannerImageUrl || cardPreview;
      const updatedBannerUrl = profileData?.bannerImageUrl || bannerPreview;

      if (cardFile) {
        setCardFile(null);
        setCardPreview(updatedCardUrl);
      }
      if (bannerFile) {
        setBannerFile(null);
        setBannerPreview(updatedBannerUrl);
      }

      // 3. Update cached profile state
      updateCachedProfile({
        ownerName: formData.businessName,
        businessName: formData.businessName,
        email: formData.businessEmail,
        phone: formData.phoneNumber,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        isLocationPinned: Boolean(formData.latitude && formData.longitude),
        cardImageUrl: updatedCardUrl,
        bannerImageUrl: updatedBannerUrl,
        kitchenImages: rawKImages.length > 0 ? rawKImages : undefined,
        avatarInitials: computeInitials(formData.businessName),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("seller-status-updated", { detail: { cardImageUrl: updatedCardUrl, bannerImageUrl: updatedBannerUrl } }));
      }

      // 4. Toggle store online status if needed
      await toggleSellerOnlineStatus(formData.storeOnline);

      if (onSave) {
        onSave(formData);
      }
      setIsEditingGeneral(false);
      setToastData({ title: "Settings updated successfully!", status: "ON" });
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setToastData({ title: err.message || "Failed to save settings", status: "OFF" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelGeneral = () => {
    if (isEditingGeneral && originalGeneralData) {
      setFormData(originalGeneralData);
    }
    setIsEditingGeneral(false);
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

  const [isExportingData, setIsExportingData] = useState<boolean>(false);

  const handleExportBusinessData = async () => {
    if (isExportingData) return;
    setIsExportingData(true);
    setToastData({ title: "Exporting Business Data...", status: "ON" });
    try {
      const res = await fetchApi("/api/seller/export-data", {
        method: "GET",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to export business data");
      }
      const json = await res.json();
      const payload = json.data || json;

      const csvContent = convertBusinessDataToCSV(payload);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      const safeName = (formData.businessName || seller.businessName || "business-data")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `${safeName}-business-data-${dateStr}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      setToastData({ title: "Business data exported and downloaded as CSV (Excel) successfully!", status: "ON" });
    } catch (err: any) {
      console.error("Export data error:", err);
      setToastData({ title: err.message || "Failed to export business data", status: "OFF" });
    } finally {
      setIsExportingData(false);
    }
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
            {unreadCount > 0 && <span className={styles.notificationDot} />}
          </button>
        </header>

        {/* Horizontal Scrollable Tabs */}
        <div className={styles.pillsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.pillBtn} ${activeTab === tab ? styles.activePill : ""}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <main className={styles.contentArea}>
          {activeTab === "General" && (
            <>
              {/* General Edit / Read-Only Header Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isEditingGeneral ? "#FFF7ED" : "#FFFFFF",
                  border: `1.5px solid ${isEditingGeneral ? "#FED7AA" : "#E2E8F0"}`,
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "12px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                      General Settings
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "6px",
                        backgroundColor: isEditingGeneral ? "#EA580C" : "#F1F5F9",
                        color: isEditingGeneral ? "#FFFFFF" : "#64748B",
                        textTransform: "uppercase",
                      }}
                    >
                      {isEditingGeneral ? "Editing Mode" : "Read-Only"}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: isEditingGeneral ? "#C2410C" : "#64748B" }}>
                    {isEditingGeneral
                      ? "Fields unlocked. Tap Save Changes at the bottom."
                      : "Information is locked in read-only mode."}
                  </p>
                </div>
                {!isEditingGeneral ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginalGeneralData(formData);
                      setIsEditingGeneral(true);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 14px",
                      backgroundColor: "#EA580C",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit Details</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelGeneral}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #CBD5E1",
                      borderRadius: "8px",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* 0A. Kitchen Card Grid Photo Card */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "#EEF2FF",
                        border: "1px solid #C7D2FE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4F46E5",
                      }}
                    >
                      <LayoutGrid size={17} />
                    </div>
                    <div>
                      <h2 className={styles.cardTitle} style={{ margin: 0, fontSize: "15px" }}>
                        Kitchen Card Grid Photo
                      </h2>
                      <p style={{ fontSize: "11px", color: "#64748B", margin: "1px 0 0 0" }}>
                        Main photo shown on explore &amp; customer cards
                      </p>
                    </div>
                  </div>
                  {cardPreview ? (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#16A34A",
                        backgroundColor: "#F0FDF4",
                        padding: "2px 8px",
                        borderRadius: "16px",
                        border: "1px solid #BBF7D0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <CheckCircle2 size={11} /> Live
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#64748B",
                        backgroundColor: "#F1F5F9",
                        padding: "2px 8px",
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>

                {/* Mobile Card Mockup Preview */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "280px",
                    margin: "10px auto 0 auto",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div style={{ width: "100%", height: "135px", position: "relative", backgroundColor: "#FFEBD8" }}>
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
                        top: "8px",
                        left: "8px",
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        color: "#FFFFFF",
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      Explore Grid Card
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        backgroundColor: "#16A34A",
                        color: "#FFFFFF",
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      OPEN
                    </div>
                  </div>

                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "13.5px",
                        fontWeight: 700,
                        color: "#0F172A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formData.businessName || seller.businessName || "Your Kitchen"}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "2px",
                          backgroundColor: "#F0FDF4",
                          color: "#16A34A",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          border: "1px solid #BBF7D0",
                        }}
                      >
                        <Star size={9} fill="#16A34A" /> 4.8
                      </span>
                      <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 600 }}>20-30 mins</span>
                      <span style={{ fontSize: "10.5px", color: "#EA580C", fontWeight: 600 }}>Free Delivery</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Card Action Buttons */}
                {isEditingGeneral ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="file"
                      id="res-card-file-input"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      style={{ display: "none" }}
                      onChange={handleCardFileSelect}
                    />
                    <label
                      htmlFor="res-card-file-input"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "7px 13px",
                        backgroundColor: "#EA580C",
                        color: "#FFFFFF",
                        borderRadius: "7px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Upload size={13} />
                      <span>{cardPreview ? "Replace Photo" : "Upload Photo"}</span>
                    </label>

                    {cardFile && (
                      <button
                        type="button"
                        onClick={handleQuickUploadCard}
                        disabled={isUploadingCard}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "7px 11px",
                          backgroundColor: "#16A34A",
                          color: "#FFFFFF",
                          borderRadius: "7px",
                          fontSize: "12px",
                          fontWeight: 600,
                          border: "none",
                          cursor: isUploadingCard ? "not-allowed" : "pointer",
                        }}
                      >
                        {isUploadingCard ? <Loader2 size={13} className={styles.spinner} /> : <Save size={13} />}
                        <span>{isUploadingCard ? "Saving..." : "Save Photo"}</span>
                      </button>
                    )}

                    {cardPreview && (
                      <button
                        type="button"
                        onClick={handleResetCard}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "7px 10px",
                          backgroundColor: "#FFF1F2",
                          color: "#E11D48",
                          border: "1px solid #FECDD3",
                          borderRadius: "7px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: "11.5px", color: "#94A3B8", margin: "10px 0 0 0", fontStyle: "italic" }}>
                    🔒 Photo modification is locked in read-only mode.
                  </p>
                )}
              </div>

              {/* 0B. Storefront Cover Banner Card */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "#FFF7ED",
                        border: "1px solid #FED7AA",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#EA580C",
                      }}
                    >
                      <ImagePlus size={17} />
                    </div>
                    <div>
                      <h2 className={styles.cardTitle} style={{ margin: 0, fontSize: "15px" }}>
                        Storefront Cover Banner
                      </h2>
                      <p style={{ fontSize: "11px", color: "#64748B", margin: "1px 0 0 0" }}>
                        Hero banner shown on explore pages
                      </p>
                    </div>
                  </div>
                  {bannerPreview ? (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#16A34A",
                        backgroundColor: "#F0FDF4",
                        padding: "2px 8px",
                        borderRadius: "16px",
                        border: "1px solid #BBF7D0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <CheckCircle2 size={11} /> Live
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#64748B",
                        backgroundColor: "#F1F5F9",
                        padding: "2px 8px",
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>

                {/* Banner Preview Frame */}
                <div
                  style={{
                    width: "100%",
                    height: "135px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "#0F172A",
                    marginTop: "10px",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <img
                    src={bannerPreview || "/images/default-store-banner.jpg"}
                    alt="Storefront Banner Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/default-store-banner.jpg";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.05) 60%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "10px 12px",
                    }}
                  >
                    <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.8px", color: "#FDBA74", fontWeight: 700 }}>
                      Customer View
                    </span>
                    <h3 style={{ margin: "1px 0 0 0", color: "#FFFFFF", fontSize: "14px", fontWeight: 700 }}>
                      {formData.businessName || seller.businessName || "Your Kitchen"}
                    </h3>
                  </div>
                </div>

                {/* Action buttons */}
                {isEditingGeneral ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <input
                        type="file"
                        id="mobile-banner-file-input"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        style={{ display: "none" }}
                        onChange={handleBannerFileSelect}
                      />
                      <label
                        htmlFor="mobile-banner-file-input"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "7px 13px",
                          backgroundColor: "#EA580C",
                          color: "#FFFFFF",
                          borderRadius: "7px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Upload size={13} />
                        <span>{bannerPreview ? "Replace" : "Upload"}</span>
                      </label>

                      {bannerFile && (
                        <button
                          type="button"
                          onClick={handleQuickUploadBanner}
                          disabled={isUploadingBanner}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "7px 12px",
                            backgroundColor: "#16A34A",
                            color: "#FFFFFF",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: "none",
                          }}
                        >
                          {isUploadingBanner ? <Loader2 size={13} className={styles.spinner} /> : <Save size={13} />}
                          <span>{isUploadingBanner ? "Saving..." : "Apply"}</span>
                        </button>
                      )}

                      {bannerPreview && (
                        <button
                          type="button"
                          onClick={handleResetBanner}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "7px 10px",
                            backgroundColor: "#FFF1F2",
                            color: "#E11D48",
                            border: "1px solid #FECDD3",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                      3:1 (1200x400) Max 5MB
                    </span>
                  </div>
                ) : (
                  <p style={{ fontSize: "11.5px", color: "#94A3B8", margin: "10px 0 0 0", fontStyle: "italic" }}>
                    🔒 Banner modification is locked in read-only mode.
                  </p>
                )}
              </div>

              {/* 1. Restaurant Information */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Restaurant Information</h2>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Kitchen / Business Name</label>
                  <input
                    type="text"
                    maxLength={50}
                    className={styles.input}
                    value={formData.businessName}
                    readOnly={!isEditingGeneral}
                    disabled={!isEditingGeneral}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="e.g. Spice Symphony, Mama's Kitchen"
                    style={!isEditingGeneral ? { backgroundColor: "#F8FAFC", color: "#475569", cursor: "not-allowed" } : {}}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Business Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={formData.businessEmail}
                    readOnly={!isEditingGeneral}
                    disabled={!isEditingGeneral}
                    onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                    placeholder="e.g. hello@neocloudbite.com"
                    style={!isEditingGeneral ? { backgroundColor: "#F8FAFC", color: "#475569", cursor: "not-allowed" } : {}}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <PhoneInput
                    id="res-settings-phone"
                    label="Phone Number"
                    value={formData.phoneNumber}
                    disabled={!isEditingGeneral}
                    onChange={(val) => handleInputChange("phoneNumber", val)}
                    placeholder="98765 43210"
                  />
                </div>

                {/* Delivery Coverage & Nearby Customers Notice Banner */}
                <div
                  style={{
                    backgroundColor: "#FFF7ED",
                    border: "1.5px solid #FED7AA",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginTop: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      backgroundColor: "#FFEDD5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    <MapPin size={16} color="#EA580C" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#9A3412" }}>
                        Delivery Distance &amp; Nearby Reach
                      </span>
                      <span
                        style={{
                          fontSize: "9.5px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "8px",
                          backgroundColor: "#EA580C",
                          color: "#FFFFFF",
                          textTransform: "uppercase",
                        }}
                      >
                        Important
                      </span>
                    </div>
                    <p style={{ fontSize: "11.5px", color: "#C2410C", margin: 0, lineHeight: 1.4 }}>
                      📍 <strong>Note:</strong> This exact GPS map pin is used to calculate delivery distance and display your kitchen to nearby customers.
                    </p>
                  </div>
                </div>

                {/* Interactive Kitchen Map Pin Picker */}
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
                          padding: "2px 6px",
                          borderRadius: "10px",
                          border: "1px solid #BBF7D0",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <CheckCircle2 size={11} /> Pinned: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#EA580C",
                          backgroundColor: "#FFF7ED",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          border: "1px solid #FED7AA",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <AlertTriangle size={11} /> Pin Required
                      </span>
                    )}
                  </div>

                  <div style={{ pointerEvents: isEditingGeneral ? "auto" : "none", opacity: isEditingGeneral ? 1 : 0.85 }}>
                    <SellerMapPicker
                      latitude={formData.latitude ?? null}
                      longitude={formData.longitude ?? null}
                      isPinned={formData.isLocationPinned}
                      onChange={(lat, lng, formattedAddress) => {
                        handleInputChange("latitude", lat);
                        handleInputChange("longitude", lng);
                        handleInputChange("isLocationPinned", true);
                        if (formattedAddress) {
                          handleInputChange("address", formattedAddress);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label className={styles.label} style={{ margin: 0 }}>
                      Registered Address &amp; Building Details <span style={{ color: "#EA580C" }}>*</span>
                    </label>
                    {isEditingGeneral && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {addressUpdatedSuccess && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#16A34A",
                              backgroundColor: "#F0FDF4",
                              padding: "3px 8px",
                              borderRadius: "8px",
                              border: "1px solid #BBF7D0",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle2 size={12} /> Address Updated
                          </span>
                        )}
                        {!isEditingAddress ? (
                          <button
                            type="button"
                            onClick={handleToggleEditAddress}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              border: "1px solid #FED7AA",
                              backgroundColor: "#FFF7ED",
                              color: "#EA580C",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Edit2 size={12} />
                            <span>Edit Address</span>
                          </button>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(false)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#FFFFFF",
                                color: "#64748B",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleQuickUpdateAddress}
                              disabled={isUpdatingAddress}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 12px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#EA580C",
                                color: "#FFFFFF",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: isUpdatingAddress ? "not-allowed" : "pointer",
                                boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                              }}
                            >
                              {isUpdatingAddress ? <Loader2 size={12} className={styles.spinner} /> : <Save size={12} />}
                              <span>{isUpdatingAddress ? "Updating..." : "Update Address"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <textarea
                    ref={addressTextareaRef}
                    className={styles.textarea}
                    value={formData.address}
                    readOnly={!isEditingGeneral}
                    disabled={!isEditingGeneral}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Flat / Shop No., Building Name, Street / Road, Area, City, Pincode"
                    rows={3}
                    style={
                      !isEditingGeneral
                        ? { backgroundColor: "#F8FAFC", color: "#475569", cursor: "not-allowed" }
                        : isEditingAddress
                        ? {
                            borderColor: "#EA580C",
                            boxShadow: "0 0 0 3px rgba(234, 88, 12, 0.15)",
                            backgroundColor: "#FFFFFF",
                          }
                        : {}
                    }
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px", flexWrap: "wrap", gap: "6px" }}>
                    <p className={styles.helperText} style={{ margin: 0 }}>
                      Shown on customer receipts and used by delivery riders for store pickup navigation.
                    </p>
                    {isEditingGeneral && isEditingAddress && (
                      <button
                        type="button"
                        onClick={handleQuickUpdateAddress}
                        disabled={isUpdatingAddress}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "#EA580C",
                          color: "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: isUpdatingAddress ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                        }}
                      >
                        {isUpdatingAddress ? <Loader2 size={12} className={styles.spinner} /> : <Check size={12} />}
                        <span>Save &amp; Update Address</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Delivery Radius Slider (1 km - 15 km) */}
                <div style={{ marginTop: "14px", padding: "14px 16px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <label style={{ marginBottom: "2px", fontWeight: 700, fontSize: "14px", color: "#1E293B", display: "block" }}>
                        Maximum Delivery Radius
                      </label>
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                        Only customers within this radius will discover and order from your kitchen
                      </p>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#EA580C", backgroundColor: "#FFF7ED", padding: "3px 12px", borderRadius: "8px", border: "1px solid #FED7AA" }}>
                      {formData.deliveryRadiusKm ?? 5} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    name="deliveryRadiusKm"
                    value={formData.deliveryRadiusKm ?? 5}
                    disabled={!isEditingGeneral}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, deliveryRadiusKm: Number(e.target.value) }));
                    }}
                    style={{
                      width: "100%",
                      accentColor: "#EA580C",
                      cursor: !isEditingGeneral ? "not-allowed" : "pointer",
                      height: "6px",
                      borderRadius: "4px",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                    <span>1 km (Hyperlocal)</span>
                    <span>15 km (Extended reach)</span>
                  </div>
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
                            disabled={!isEditingGeneral}
                            onChange={() => handleDayToggle(idx)}
                            aria-label={`Toggle ${item.day} status`}
                          />
                          <span className={styles.toggleSlider} style={!isEditingGeneral ? { opacity: 0.6, cursor: "not-allowed" } : {}} />
                        </label>
                      </div>
                    </div>
                  ))}
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
                  enableQuietHours: formData.enableQuietHours,
                  quietHoursStart: formData.quietHoursStart,
                  quietHoursEnd: formData.quietHoursEnd,
                }}
                onChange={(field, value) => {
                  setFormData((prev) => {
                    const updated = {
                      ...prev,
                      [field]: value,
                    };
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("seller_settings_preferences", JSON.stringify(updated));
                      } catch {}
                    }
                    return updated;
                  });
                }}
                onToggle={(field) => {
                  setFormData((prev) => {
                    const nextVal = !prev[field as keyof ResponsiveSellerSettingsData];
                    const updated = {
                      ...prev,
                      [field]: nextVal,
                    };
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("seller_settings_preferences", JSON.stringify(updated));
                      } catch {}
                    }
                    return updated;
                  });
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
              </div>
            </>
          )}

          {activeTab === "Security" && (
            <>
              {/* 1. Password Management Card (Matching Reference Image) */}
              <PasswordManagementCard />

              {/* 2. Security & Access Card (Disabled via comment - uncomment to re-enable) */}
              {/*
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
              */}

              {/* 3. Active Login Sessions Card (Matching Reference Image) */}
              <ActiveLoginSessionsCard />

              {/* 4. Login & Recovery Controls Card (Disabled via comment - uncomment to re-enable) */}
              {/*
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
              */}
            </>
          )}

          {activeTab === "Preferences" && (
            <>
              {/* 1. Localization */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Localization</h2>

                {/* Default Interface Language (Commented out for now) */}
                {/*
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
                */}

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
                        cursor: isExportingData ? "not-allowed" : "pointer",
                        opacity: isExportingData ? 0.7 : 1,
                        fontFamily: "inherit",
                        width: "100%",
                      }}
                      disabled={isExportingData}
                      onClick={handleExportBusinessData}
                    >
                      {isExportingData ? "Exporting Business Data..." : "Export My Business Data"}
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
          {activeTab === "General" && !isEditingGeneral ? (
            <button
              type="button"
              className={styles.saveChangesBtn}
              onClick={() => {
                setOriginalGeneralData(formData);
                setIsEditingGeneral(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Edit2 size={16} />
              <span>Edit Information</span>
            </button>
          ) : activeTab === "General" && isEditingGeneral ? (
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button
                type="button"
                onClick={handleCancelGeneral}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1.5px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                className={styles.saveChangesBtn}
                style={{ flex: 2 }}
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
          ) : (
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
          )}
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
