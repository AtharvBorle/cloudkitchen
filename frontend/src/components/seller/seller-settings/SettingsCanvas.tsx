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
  ImagePlus,
  LayoutGrid,
  Upload,
  Save,
  Edit2,
  Check,
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
import { validateEmail } from "@/lib/email-validation";
import { validateKitchenName } from "@/lib/kitchen-validation";
import { convertBusinessDataToCSV } from "@/lib/export-business-data-csv";
import { compressImage } from "@/lib/image-compression";
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
  deliveryRadiusKm?: number;
  language: string;
  timezone: string;
  currency: string;
  operatingHours: OperatingHoursItem[];

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
  deliveryRadiusKm: 5,
  language: "English",
  timezone: "Asia/Kolkata (UTC+5:30)",
  currency: "INR (₹)",
  operatingHours: DEFAULT_HOURS,

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
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTab[]).find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (matched) return matched;
    }
    if (typeof window !== "undefined") {
      try {
        const savedTab = localStorage.getItem("seller_settings_active_tab");
        if (savedTab) {
          const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTab[]).find(
            (t) => t.toLowerCase() === savedTab.toLowerCase()
          );
          if (matched) return matched;
        }
      } catch {}
    }
    return initialTab;
  });

  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [originalGeneralData, setOriginalGeneralData] = useState<SettingsFormData | null>(null);

  const handleTabChange = (tab: SettingsTab) => {
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
  const [formData, setFormData] = useState<SettingsFormData>(() => {
    let savedHours = DEFAULT_HOURS;
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
        console.error("Error reading initial settings from localStorage:", err);
      }
    }

    return {
      ...DEFAULT_DATA,
      operatingHours: savedHours,
      language: savedLanguage,
      timezone: savedTimezone,
      currency: savedCurrency,
      businessName: initialData?.businessName || seller.businessName,
      businessEmail: initialData?.businessEmail || seller.email,
      phoneNumber: initialData?.phoneNumber || seller.phone,
      address: initialData?.address || seller.address,
      latitude: initialData?.latitude !== undefined ? initialData.latitude : (seller.latitude ?? null),
      longitude: initialData?.longitude !== undefined ? initialData.longitude : (seller.longitude ?? null),
      isLocationPinned: initialData?.isLocationPinned !== undefined ? initialData.isLocationPinned : (seller.isLocationPinned ?? false),
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
      console.error("Error reading saved settings from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    if (seller.businessName || seller.email || seller.phone || seller.address || seller.latitude || seller.longitude || seller.deliveryRadiusKm) {
      setFormData((prev) => ({
        ...prev,
        businessName: (!prev.businessName || prev.businessName === "Neo Cloud Kitchen & Rooms") && seller.businessName ? seller.businessName : prev.businessName,
        businessEmail: (!prev.businessEmail || prev.businessEmail === "hello@neocloudbite.com") && seller.email ? seller.email : prev.businessEmail,
        phoneNumber: (!prev.phoneNumber || prev.phoneNumber === "+91 98765 43210") && seller.phone ? seller.phone : prev.phoneNumber,
        address: (!prev.address || prev.address.includes("Innovation Way")) && seller.address ? seller.address : prev.address,
        latitude: seller.latitude !== undefined && seller.latitude !== null ? seller.latitude : prev.latitude,
        longitude: seller.longitude !== undefined && seller.longitude !== null ? seller.longitude : prev.longitude,
        isLocationPinned: seller.isLocationPinned ?? prev.isLocationPinned,
        deliveryRadiusKm: seller.deliveryRadiusKm !== undefined ? seller.deliveryRadiusKm : prev.deliveryRadiusKm,
      }));
    }
  }, [seller.businessName, seller.email, seller.phone, seller.address, seller.latitude, seller.longitude, seller.isLocationPinned, seller.deliveryRadiusKm]);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      const matched = (["General", "Notifications", "Security", "Preferences"] as SettingsTab[]).find(
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
    setToastData({ title: "Card photo selected. Click Save to publish.", status: "ON" });
    
    // Fast pre-compression in background
    try {
      const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.82 });
      setCardFile(compressed);
    } catch {
      // Keep original file if compression fails
    }
  };

  const handleQuickUploadCard = async () => {
    if (!cardFile) return;
    setIsUploadingCard(true);
    try {
      // Ensure file is compressed before upload
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
      setToastData({ title: "Card grid photo uploaded and published live!", status: "ON" });
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
      setToastData({ title: "Card grid photo removed and reset to default theme", status: "ON" });
    } catch {
      setToastData({ title: "Card grid photo reset to default theme", status: "ON" });
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
    setToastData({ title: "Banner selected. Click Save Changes to publish.", status: "ON" });

    // Fast pre-compression in background
    try {
      const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.82 });
      setBannerFile(compressed);
    } catch {
      // Keep original file if compression fails
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
      setToastData({ title: "Banner uploaded and published live!", status: "ON" });
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
      setToastData({ title: "Banner reset to default theme image", status: "ON" });
    }
  };

  const NOTIFICATION_TITLES: Partial<Record<keyof SettingsFormData, string>> = {
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
      const nextFormData = { ...prev, operatingHours: updatedHours };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "seller_regional_settings",
            JSON.stringify({
              language: prev.language,
              timezone: prev.timezone,
              currency: prev.currency,
              operatingHours: updatedHours,
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

  const handleTimeChange = (
    index: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    const targetDay = formData.operatingHours[index];
    const otherField = field === "openTime" ? "closeTime" : "openTime";
    const otherValue = targetDay[otherField];

    if (value === otherValue) {
      setToastData({
        title: "Start Time and End Time cannot be the same.",
        status: "OFF",
      });
      return;
    }

    setFormData((prev) => {
      const updatedHours = [...prev.operatingHours];
      updatedHours[index] = {
        ...targetDay,
        [field]: value,
      };
      const label = field === "openTime" ? "Opens at" : "Closes at";
      setToastData({ title: `${targetDay.day} ${label} ${value}`, status: "ON" });
      const nextFormData = { ...prev, operatingHours: updatedHours };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "seller_regional_settings",
            JSON.stringify({
              language: prev.language,
              timezone: prev.timezone,
              currency: prev.currency,
              operatingHours: updatedHours,
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

  const handleCheckboxToggle = (field: keyof SettingsFormData) => {
    setFormData((prev) => {
      const nextVal = !prev[field];
      const title = NOTIFICATION_TITLES[field];
      if (title) {
        showNotificationToast(title, nextVal);
      }
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
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

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
      (row) => row.isOpen && row.openTime && row.closeTime && row.openTime === row.closeTime
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
          localStorage.setItem(
            "seller_settings_preferences",
            JSON.stringify(formData)
          );
        }
      } catch (err) {
        console.error("Failed to save settings to localStorage:", err);
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
        throw new Error(errorData.message || "Failed to update profile settings");
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
        cardImageUrl: updatedCardUrl,
        bannerImageUrl: updatedBannerUrl,
        kitchenImages: rawKImages.length > 0 ? rawKImages : undefined,
        avatarInitials: computeInitials(formData.businessName),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("seller-status-updated", { detail: { cardImageUrl: updatedCardUrl, bannerImageUrl: updatedBannerUrl } }));
      }

      if (onSave) {
        onSave(formData);
      }

      setIsEditingGeneral(false);
      setToastData({ title: "Settings saved successfully!", status: "ON" });
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setToastData({ title: err.message || "Failed to save settings", status: "OFF" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isEditingGeneral && originalGeneralData) {
      setFormData(originalGeneralData);
    } else if (onCancel) {
      onCancel();
    } else {
      setFormData({ ...DEFAULT_DATA, ...initialData });
      setToastData({ title: "Changes reverted", status: null });
    }
    setIsEditingGeneral(false);
  };

  const handleConfirmDeleteAccount = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") return;
    setIsDeletingAccount(true);

    setTimeout(() => {
      setIsDeletingAccount(false);
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
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Form Body */}
      <div>
        {/* Tab 1: General (Matches the Exact Provided Image) */}
        {activeTab === "General" && (
          <div className={styles.mainGrid}>
            <div style={{ gridColumn: "1 / -1", marginBottom: "6px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isEditingGeneral ? "#FFF7ED" : "#FFFFFF",
                  border: `1.5px solid ${isEditingGeneral ? "#FED7AA" : "#E2E8F0"}`,
                  borderRadius: "14px",
                  padding: "14px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                      General Kitchen Information
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: isEditingGeneral ? "#EA580C" : "#F1F5F9",
                        color: isEditingGeneral ? "#FFFFFF" : "#64748B",
                        textTransform: "uppercase",
                      }}
                    >
                      {isEditingGeneral ? "Editing Mode" : "Read-Only"}
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: isEditingGeneral ? "#C2410C" : "#64748B" }}>
                    {isEditingGeneral
                      ? "Fields are unlocked. Make your changes and click 'Save Changes' below to update."
                      : "Saved kitchen details are displayed in a read-only state. Click 'Edit Information' to update."}
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
                      gap: "6px",
                      padding: "9px 18px",
                      backgroundColor: "#EA580C",
                      color: "#FFFFFF",
                      borderRadius: "10px",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Edit2 size={14} />
                    <span>Edit Information</span>
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      style={{
                        padding: "8px 14px",
                        backgroundColor: "#FFFFFF",
                        border: "1.5px solid #CBD5E1",
                        borderRadius: "10px",
                        color: "#475569",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 18px",
                        backgroundColor: "#EA580C",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        border: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: saving ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
                      }}
                    >
                      {saving && <Loader2 size={14} className="spinner" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Left Column: Storefront Banner & Restaurant Info */}
            <div className={styles.leftColumn}>
              {/* Card 0A: Kitchen Card Grid Photo (Dashboard & Explore Listings) */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#EEF2FF",
                        border: "1px solid #C7D2FE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4F46E5",
                      }}
                    >
                      <LayoutGrid size={19} />
                    </div>
                    <div>
                      <h2 className={styles.cardTitle} style={{ margin: 0, fontSize: "16px" }}>
                        Kitchen Card Grid Photo
                      </h2>
                      <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                        Main listing photo displayed on customer dashboard &amp; explore cards
                      </p>
                    </div>
                  </div>
                  {cardPreview ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#16A34A",
                        backgroundColor: "#F0FDF4",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        border: "1px solid #BBF7D0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 size={12} /> Custom Photo Live
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748B",
                        backgroundColor: "#F1F5F9",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      Default Theme Photo
                    </span>
                  )}
                </div>

                {/* Live Card Mockup matching customer dashboard */}
                <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: "250px",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1.5px solid #E2E8F0",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
                      display: "flex",
                      flexDirection: "column",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ width: "100%", height: "145px", position: "relative", backgroundColor: "#FFEBD8" }}>
                      <img
                        src={cardPreview || "/images/places/place-pizza.png"}
                        alt="Card Grid Preview"
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
                          fontSize: "9.5px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "5px",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        Explore Card Mockup
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px",
                          backgroundColor: "#16A34A",
                          color: "#FFFFFF",
                          fontSize: "9.5px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "5px",
                        }}
                      >
                        OPEN
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "14px",
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
                            gap: "3px",
                            backgroundColor: "#F0FDF4",
                            color: "#16A34A",
                            padding: "2px 6px",
                            borderRadius: "5px",
                            fontSize: "11px",
                            fontWeight: 700,
                            border: "1px solid #BBF7D0",
                          }}
                        >
                          <Star size={10} fill="#16A34A" /> 4.8
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>20-30 mins</span>
                        <span style={{ fontSize: "11px", color: "#EA580C", fontWeight: 600 }}>Free Delivery</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Instructions */}
                  <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p style={{ fontSize: "12.5px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                      Customize the card photo customers see in discovery lists, user dashboard, and category explore tiles.
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <input
                        type="file"
                        id="card-file-input"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        style={{ display: "none" }}
                        disabled={!isEditingGeneral}
                        onChange={handleCardFileSelect}
                      />
                      <label
                        htmlFor={isEditingGeneral ? "card-file-input" : undefined}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          backgroundColor: !isEditingGeneral ? "#CBD5E1" : "#EA580C",
                          color: "#FFFFFF",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: !isEditingGeneral ? "not-allowed" : "pointer",
                          pointerEvents: !isEditingGeneral ? "none" : "auto",
                          transition: "background-color 0.15s ease",
                          boxShadow: isEditingGeneral ? "0 2px 8px rgba(234, 88, 12, 0.25)" : "none",
                        }}
                      >
                        <Upload size={14} />
                        <span>{cardPreview ? "Replace Card Photo" : "Upload Card Photo"}</span>
                      </label>

                      {cardFile && isEditingGeneral && (
                        <button
                          type="button"
                          onClick={handleQuickUploadCard}
                          disabled={isUploadingCard}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
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
                          <span>{isUploadingCard ? "Uploading..." : "Save Photo"}</span>
                        </button>
                      )}

                      {cardPreview && isEditingGeneral && (
                        <button
                          type="button"
                          onClick={handleResetCard}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "8px 12px",
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
                          <span>Reset Default</span>
                        </button>
                      )}
                    </div>

                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                      1:1 or 4:3 Ratio • JPG/PNG/WebP up to 5MB
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 0B: Storefront Cover Banner */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#FFF7ED",
                        border: "1px solid #FED7AA",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#EA580C",
                      }}
                    >
                      <ImagePlus size={19} />
                    </div>
                    <div>
                      <h2 className={styles.cardTitle} style={{ margin: 0, fontSize: "16px" }}>
                        Storefront Cover Banner
                      </h2>
                      <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                        Hero banner displayed on user &amp; restaurant explore pages
                      </p>
                    </div>
                  </div>
                  {bannerPreview ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#16A34A",
                        backgroundColor: "#F0FDF4",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        border: "1px solid #BBF7D0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 size={12} /> Custom Banner Live
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748B",
                        backgroundColor: "#F1F5F9",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      Default Theme
                    </span>
                  )}
                </div>

                {/* Live Banner Preview Box */}
                <div
                  style={{
                    width: "100%",
                    height: "160px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: "#0F172A",
                    marginTop: "12px",
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
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
                      background: "linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.1) 60%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", color: "#FDBA74", fontWeight: 700 }}>
                          Live Customer View
                        </span>
                        <h3 style={{ margin: "2px 0 0 0", color: "#FFFFFF", fontSize: "15px", fontWeight: 700 }}>
                          {formData.businessName || seller.businessName || "Your Kitchen"}
                        </h3>
                      </div>
                      <span
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(6px)",
                          color: "#FFFFFF",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        Store Header
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banner Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      id="banner-file-input"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      style={{ display: "none" }}
                      disabled={!isEditingGeneral}
                      onChange={handleBannerFileSelect}
                    />
                    <label
                      htmlFor={isEditingGeneral ? "banner-file-input" : undefined}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        backgroundColor: !isEditingGeneral ? "#CBD5E1" : "#EA580C",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: !isEditingGeneral ? "not-allowed" : "pointer",
                        pointerEvents: !isEditingGeneral ? "none" : "auto",
                        transition: "background-color 0.15s ease",
                        boxShadow: isEditingGeneral ? "0 2px 8px rgba(234, 88, 12, 0.25)" : "none",
                      }}
                    >
                      <Upload size={14} />
                      <span>{bannerPreview ? "Replace Banner" : "Upload Banner"}</span>
                    </label>

                    {bannerFile && isEditingGeneral && (
                      <button
                        type="button"
                        onClick={handleQuickUploadBanner}
                        disabled={isUploadingBanner}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
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
                        <span>{isUploadingBanner ? "Uploading..." : "Save Banner"}</span>
                      </button>
                    )}

                    {bannerPreview && isEditingGeneral && (
                      <button
                        type="button"
                        onClick={handleResetBanner}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "8px 12px",
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
                        <span>Reset Default</span>
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    3:1 Ratio • JPG/PNG/WebP up to 5MB
                  </span>
                </div>
              </div>

              {/* Card 1: Restaurant Information */}
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Restaurant Information</h2>
                  {!isEditingGeneral && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748B",
                        backgroundColor: "#F1F5F9",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Locked (Read-Only)
                    </span>
                  )}
                </div>

                {/* Business / Kitchen Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Kitchen / Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    maxLength={50}
                    disabled={!isEditingGeneral}
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="e.g. Spice Symphony, Mama's Kitchen"
                    style={!isEditingGeneral ? { backgroundColor: "#F8FAFC", cursor: "not-allowed", color: "#334155" } : undefined}
                  />
                </div>

                {/* Business Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Business Email</label>
                  <input
                    type="email"
                    name="businessEmail"
                    disabled={!isEditingGeneral}
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Enter business email"
                    style={!isEditingGeneral ? { backgroundColor: "#F8FAFC", cursor: "not-allowed", color: "#334155" } : undefined}
                  />
                </div>

                {/* Phone Number */}
                <div className={styles.fieldGroup}>
                  <PhoneInput
                    id="settings-phone"
                    label="Phone Number"
                    disabled={!isEditingGeneral}
                    value={formData.phoneNumber}
                    onChange={(val) => {
                      if (!isEditingGeneral) return;
                      setFormData((prev) => ({ ...prev, phoneNumber: val }));
                    }}
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

                  <div style={{ pointerEvents: isEditingGeneral ? "auto" : "none", opacity: isEditingGeneral ? 1 : 0.88 }}>
                    <SellerMapPicker
                      latitude={formData.latitude ?? null}
                      longitude={formData.longitude ?? null}
                      isPinned={formData.isLocationPinned}
                      onChange={(lat, lng, formattedAddress) => {
                        if (!isEditingGeneral) return;
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
                </div>

                {/* Address */}
                <div className={styles.fieldGroup}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label className={styles.label} style={{ margin: 0 }}>
                      Registered Address &amp; Building Details <span style={{ color: "#EA580C" }}>*</span>
                    </label>
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
                  </div>
                  <textarea
                    ref={addressTextareaRef}
                    name="address"
                    disabled={!isEditingGeneral && !isEditingAddress}
                    value={formData.address}
                    onChange={handleInputChange}
                    className={styles.textarea}
                    placeholder="Flat / Shop No., Building Name, Street / Road, Area, City, Pincode"
                    rows={3}
                    style={
                      isEditingAddress || isEditingGeneral
                        ? {
                            borderColor: "#EA580C",
                            boxShadow: "0 0 0 3px rgba(234, 88, 12, 0.15)",
                            backgroundColor: "#FFFFFF",
                          }
                        : {
                            backgroundColor: "#F8FAFC",
                            cursor: "not-allowed",
                            color: "#334155",
                          }
                    }
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px", flexWrap: "wrap", gap: "6px" }}>
                    <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                      Shown on customer receipts and used by delivery riders for store pickup navigation.
                    </p>
                    {isEditingAddress && (
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
                <div className={styles.fieldGroup} style={{ marginTop: "14px", padding: "14px 16px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <label className={styles.label} style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                        Maximum Delivery Radius
                      </label>
                      <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                        Only customers within this radius will discover and order from your kitchen
                      </p>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#EA580C", backgroundColor: "#FFF7ED", padding: "3px 12px", borderRadius: "8px", border: "1px solid #FED7AA" }}>
                      {formData.deliveryRadiusKm ?? 5} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    disabled={!isEditingGeneral}
                    name="deliveryRadiusKm"
                    value={formData.deliveryRadiusKm ?? 5}
                    onChange={(e) => {
                      if (!isEditingGeneral) return;
                      setFormData((prev) => ({ ...prev, deliveryRadiusKm: Number(e.target.value) }));
                    }}
                    style={{
                      width: "100%",
                      accentColor: isEditingGeneral ? "#EA580C" : "#94A3B8",
                      cursor: isEditingGeneral ? "pointer" : "not-allowed",
                      opacity: isEditingGeneral ? 1 : 0.6,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                    <span>1 km (Hyperlocal)</span>
                    <span>15 km (Extended reach)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Operating Hours */}
            <div className={styles.rightColumn}>
              <div className={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h2 className={styles.cardTitle} style={{ margin: 0 }}>Operating Hours</h2>
                  {!isEditingGeneral && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748B",
                        backgroundColor: "#F1F5F9",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Locked
                    </span>
                  )}
                </div>

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
                          disabled={!isEditingGeneral || !row.isOpen}
                          onChange={(e) => isEditingGeneral && handleTimeChange(idx, "openTime", e.target.value)}
                          className={styles.timeSelect}
                          style={{
                            opacity: isEditingGeneral && row.isOpen ? 1 : 0.5,
                            cursor: isEditingGeneral && row.isOpen ? "pointer" : "not-allowed",
                            backgroundColor: !isEditingGeneral ? "#F8FAFC" : undefined,
                          }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t} disabled={t === row.closeTime}>
                              {t} {t === row.closeTime ? "(Same as Close Time)" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className={styles.timeSelectChevron} />
                      </div>

                      {/* Close Select */}
                      <div className={styles.timeSelectWrapper}>
                        <select
                          value={row.closeTime}
                          disabled={!isEditingGeneral || !row.isOpen}
                          onChange={(e) => isEditingGeneral && handleTimeChange(idx, "closeTime", e.target.value)}
                          className={styles.timeSelect}
                          style={{
                            opacity: isEditingGeneral && row.isOpen ? 1 : 0.5,
                            cursor: isEditingGeneral && row.isOpen ? "pointer" : "not-allowed",
                            backgroundColor: !isEditingGeneral ? "#F8FAFC" : undefined,
                          }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t} disabled={t === row.openTime}>
                              {t} {t === row.openTime ? "(Same as Open Time)" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className={styles.timeSelectChevron} />
                      </div>

                      {/* Status Toggle Switch */}
                      <div className={styles.switchWrapper}>
                        <label className={styles.toggleSwitch} style={{ opacity: isEditingGeneral ? 1 : 0.65, cursor: isEditingGeneral ? "pointer" : "not-allowed" }}>
                          <input
                            type="checkbox"
                            checked={row.isOpen}
                            disabled={!isEditingGeneral}
                            onChange={() => isEditingGeneral && handleToggleOperatingDay(idx)}
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
                    const nextVal = !prev[field as keyof SettingsFormData];
                    const title = NOTIFICATION_TITLES[field as keyof SettingsFormData];
                    if (title) {
                      showNotificationToast(title, nextVal);
                    }
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
            <div className={styles.leftColumn} style={{ gridColumn: "1 / -1", maxWidth: "800px" }}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Data &amp; Account Management</h2>

                {/* Backup and Archival */}
                <div className={styles.backupSection} style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                  <span className={styles.label} style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                    Backup and Archival
                  </span>
                  <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px", lineHeight: "1.5" }}>
                    Export your complete store profile, menu catalog, operational schedules, and metrics, or permanently delete your seller account.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={styles.exportBtn}
                      disabled={isExportingData}
                      onClick={handleExportBusinessData}
                    >
                      {isExportingData ? "Exporting Business Data..." : "Export My Business Data"}
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
          {activeTab === "General" && !isEditingGeneral ? (
            <button
              type="button"
              onClick={() => {
                setOriginalGeneralData(formData);
                setIsEditingGeneral(true);
              }}
              className={styles.saveBtn}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <Edit2 size={16} />
              <span>Edit Information</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancelClick}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={styles.saveBtn}
              >
                {saving && <Loader2 size={16} className="spinner" />}
                <span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </div>

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
