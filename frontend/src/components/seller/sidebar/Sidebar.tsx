"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { usePathname } from "next/navigation";
import { performLogout } from "@/lib/logout";
import { fetchApi, uploadWithProgress } from "@/lib/fetch-api";
import CameraCaptureModal from "@/app/components/CameraCaptureModal";
import navLogoImg from "@/components/navbar/logo-nav.png";
import {
  LayoutGrid,
  ShoppingBag,
  BookOpen,
  Home,
  CalendarCheck,
  Truck,
  CreditCard,
  UserCircle,
  Headphones,
  Settings,
  Bell,
  Compass,
  BedDouble,
  LogOut,
  X,
  ChevronDown,
  Utensils,
  ChefHat,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Percent,
  Star,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  UploadCloud,
  Camera as CameraIcon,
  Trash2,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import styles from "./ConsoleSidebar.module.css";
import { useSellerProfile, computeInitials, isGenericFallbackName } from "@/hooks/useSellerProfile";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;
  href: string;
  badge?: string;
}

export const SELLER_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/seller/dashboard" },
  { id: "orders", label: "Orders", icon: ShoppingBag, href: "/seller/orders" },
  { id: "menu", label: "Menu", icon: BookOpen, href: "/seller/menu" },
  { id: "rooms-seller", label: "Rooms", icon: BedDouble, href: "/seller/rooms" },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/seller/booking" },
  { id: "delivery", label: "Delivery", icon: Truck, href: "/seller/delivery" },
  { id: "reviews", label: "Reviews & Feedback", icon: Star, href: "/seller/reviews" },
  { id: "subscription", label: "Subscription", icon: CreditCard, href: "/seller/subscription" },
  { id: "support", label: "Support Tickets", icon: Headphones, href: "/seller/support" },
  { id: "profile", label: "Profile", icon: UserCircle, href: "/seller/profile" },
  { id: "offers", label: "Offers & Coupons", icon: Percent, href: "/seller/offers" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/seller/notifications" },
  { id: "settings", label: "Settings", icon: Settings, href: "/seller/settings" },
];


export interface SellerSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  activeItemId?: string;
  logoSrc?: string | StaticImageData;
  roleTagText?: string;
  isCollapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
}

export default function SellerSidebar({
  isMobileOpen = false,
  onClose,
  activeItemId,
  logoSrc = navLogoImg,
  roleTagText = "OWNER ROLE",
  isCollapsed,
  defaultCollapsed = false,
  onToggleCollapse,
  showCollapseToggle = true,
  ownerName,
  partnerRole,
  avatarInitials,
}: SellerSidebarProps) {
  const pathname = usePathname();
  const seller = useSellerProfile();

  const effectiveOwnerName =
    ownerName && !isGenericFallbackName(ownerName)
      ? ownerName
      : (seller.businessName || seller.ownerName);
  const effectivePartnerRole =
    partnerRole && partnerRole !== "Neo Cloud Partner" ? partnerRole : seller.partnerRole;
  const effectiveAvatarInitials =
    avatarInitials && !isGenericFallbackName(avatarInitials) && avatarInitials !== "JD" && avatarInitials !== "KP" && avatarInitials !== "SE"
      ? avatarInitials
      : (seller.avatarInitials || computeInitials(effectiveOwnerName));

  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  // Status & gating states
  const [statusData, setStatusData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"SUBSCRIPTION" | "UPGRADE" | null>(null);
  const [modalCategory, setModalCategory] = useState<"FOOD" | "PROPERTY">("FOOD");
  const [categoryPlans, setCategoryPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Category Upgrade Upload Form State
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [kitchenImages, setKitchenImages] = useState<(File | null)[]>([null, null, null]);
  const [cuisineImages, setCuisineImages] = useState<(File | null)[]>([null, null, null]);
  const [roomImages, setRoomImages] = useState<(File | null)[]>([null, null, null]);
  const [cameraMode, setCameraMode] = useState<
    "fssai" | "kitchen0" | "kitchen1" | "kitchen2" | "cuisine0" | "cuisine1" | "cuisine2" | "room0" | "room1" | "room2" | null
  >(null);

  const fetchStatus = async () => {
    try {
      const res = await fetchApi("/api/seller/dashboard/status");
      if (res.ok) {
        const data = await res.json();
        setStatusData(data.data || data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard status in sidebar:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    const handleOpenUpgrade = (e: Event) => {
      const customEvent = e as CustomEvent;
      const category = customEvent.detail?.category || "FOOD";
      openCategoryUpgradeModal(category);
    };

    const handleOpenSubscription = (e: Event) => {
      const customEvent = e as CustomEvent;
      const category = customEvent.detail?.category || "FOOD";
      openSubscriptionModal(category);
    };

    window.addEventListener("open-category-upgrade", handleOpenUpgrade);
    window.addEventListener("open-subscription-modal", handleOpenSubscription);
    return () => {
      window.removeEventListener("open-category-upgrade", handleOpenUpgrade);
      window.removeEventListener("open-subscription-modal", handleOpenSubscription);
    };
  }, [statusData]);

  const openSubscriptionModal = async (category: "FOOD" | "PROPERTY") => {
    setModalCategory(category);
    setModalType("SUBSCRIPTION");
    setModalOpen(true);
    setLoadingPlans(true);
    try {
      const res = await fetchApi(`/api/seller/subscription/plans?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setCategoryPlans(data.data || data || []);
      }
    } catch (err) {
      console.error("Failed to load subscription plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const openCategoryUpgradeModal = (category: "FOOD" | "PROPERTY") => {
    setModalCategory(category);
    setModalType("UPGRADE");
    setModalOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    if (cameraMode === "fssai") {
      setFssaiFile(file);
    } else if (cameraMode?.startsWith("kitchen")) {
      const idx = parseInt(cameraMode.replace("kitchen", ""));
      const copy = [...kitchenImages];
      copy[idx] = file;
      setKitchenImages(copy);
    } else if (cameraMode?.startsWith("cuisine")) {
      const idx = parseInt(cameraMode.replace("cuisine", ""));
      const copy = [...cuisineImages];
      copy[idx] = file;
      setCuisineImages(copy);
    } else if (cameraMode?.startsWith("room")) {
      const idx = parseInt(cameraMode.replace("room", ""));
      const copy = [...roomImages];
      copy[idx] = file;
      setRoomImages(copy);
    }
    setCameraMode(null);
  };

  const handleCategoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", modalCategory);

      if (modalCategory === "FOOD") {
        if (fssaiFile) formData.append("fssaiFile", fssaiFile);
        kitchenImages.forEach((img, idx) => {
          if (img) formData.append(`kitchenImage_${idx}`, img);
        });
        cuisineImages.forEach((img, idx) => {
          if (img) formData.append(`cuisineImage_${idx}`, img);
        });
      } else if (modalCategory === "PROPERTY") {
        roomImages.forEach((img, idx) => {
          if (img) formData.append(`roomImage_${idx}`, img);
        });
      }

      setUploadProgress(0);
      const res = await uploadWithProgress("/api/seller/category-application", formData, (pct) => {
        setUploadProgress(pct);
      });

      if (res.ok) {
        alert(`Successfully submitted application for ${modalCategory === "FOOD" ? "Food" : "Property"} verification!`);
        setFssaiFile(null);
        setKitchenImages([null, null, null]);
        setCuisineImages([null, null, null]);
        setRoomImages([null, null, null]);
        setModalOpen(false);
        await fetchStatus();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error applying for category:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavItemClick = (e: React.MouseEvent, item: NavItem) => {
    const isFoodTab =
      item.id === "orders" ||
      item.id === "menu" ||
      item.id === "delivery" ||
      item.id === "subscription" ||
      item.id === "offers" ||
      item.id === "reviews";
    const isPropertyTab = item.id === "rooms-seller" || item.id === "rooms" || item.id === "bookings";

    if (statusData) {
      const hasActiveSub = Boolean(statusData.hasActiveSub);
      const isFoodActive = Boolean(statusData.isFoodActive);
      const isPropertyActive = Boolean(statusData.isPropertyActive);

      if (isFoodTab) {
        if (!hasActiveSub) {
          e.preventDefault();
          openSubscriptionModal("FOOD");
          return;
        }
        if (!isFoodActive) {
          e.preventDefault();
          const foodVerification = statusData?.sellerProfile?.foodVerificationStatus;
          if (foodVerification === "APPROVED") {
            openSubscriptionModal("FOOD");
          } else {
            openCategoryUpgradeModal("FOOD");
          }
          return;
        }
      } else if (isPropertyTab) {
        if (!hasActiveSub) {
          e.preventDefault();
          openSubscriptionModal("PROPERTY");
          return;
        }
        if (!isPropertyActive) {
          e.preventDefault();
          const propVerification = statusData?.sellerProfile?.propertyVerificationStatus;
          if (propVerification === "APPROVED") {
            openSubscriptionModal("PROPERTY");
          } else {
            openCategoryUpgradeModal("PROPERTY");
          }
          return;
        }
      }
    }

    if (onClose) onClose();
  };

  // Controlled or uncontrolled collapse state
  const isEffectiveCollapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Helper to determine if a nav item is currently active
  const isItemActive = (item: NavItem) => {
    if (activeItemId) {
      if (activeItemId === item.id) return true;
      if (activeItemId === "rooms" && item.id === "rooms-seller") return true;
      if (activeItemId === "rooms-seller" && item.id === "rooms-seller") return true;
    }
    if (item.id === "dashboard") {
      return (
        pathname?.startsWith("/seller/dashboard") ||
        pathname?.startsWith("/seller/res/dashboard") ||
        pathname === "/seller" ||
        pathname === "/seller/"
      );
    }
    if (item.id === "orders") {
      return (
        pathname?.startsWith("/seller/orders") ||
        pathname?.startsWith("/seller/order-default") ||
        pathname?.startsWith("/seller/res/orders")
      );
    }
    if (item.id === "menu") {
      return (
        pathname?.startsWith("/seller/menu") ||
        pathname?.startsWith("/seller/edit-menu") ||
        pathname?.startsWith("/seller/res/menu")
      );
    }
    if (item.id === "rooms-seller") {
      return (
        pathname?.startsWith("/seller/rooms") ||
        pathname?.startsWith("/seller/res/rooms")
      );
    }
    if (item.id === "bookings") {
      return (
        pathname?.startsWith("/seller/booking") ||
        pathname?.startsWith("/seller/res/booking")
      );
    }
    if (item.id === "delivery") {
      return (
        pathname?.startsWith("/seller/delivery") ||
        pathname?.startsWith("/seller/riderMng") ||
        pathname?.startsWith("/seller/res/delivery")
      );
    }
    if (item.id === "subscription") {
      return (
        pathname?.startsWith("/seller/subscription") ||
        pathname?.startsWith("/seller/payment") ||
        pathname?.startsWith("/seller/res/payment") ||
        pathname?.startsWith("/seller/create-subscription-plan") ||
        pathname?.startsWith("/seller/res/subscription")
      );
    }
    if (item.id === "support") {
      return (
        pathname?.startsWith("/seller/support")
      );
    }
    if (item.id === "profile") {
      return (
        pathname?.startsWith("/seller/profile") ||
        pathname?.startsWith("/seller/res/profile")
      );
    }
    if (item.id === "offers") {
      return (
        pathname?.startsWith("/seller/offers") ||
        pathname?.startsWith("/seller/res/offers")
      );
    }
    if (item.id === "reviews") {
      return (
        pathname?.startsWith("/seller/reviews") ||
        pathname?.startsWith("/seller/res/reviews")
      );
    }
    if (item.id === "notifications") {
      return (
        pathname?.startsWith("/seller/notifications") ||
        pathname?.startsWith("/seller/res/notifications")
      );
    }
    if (item.id === "settings") {
      return (
        pathname?.startsWith("/seller/settings") ||
        pathname?.startsWith("/seller/res/settings")
      );
    }
    return Boolean(pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)));
  };

  const sidebarWidth = isEffectiveCollapsed ? "76px" : "250px";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onClose}
          className={`${styles.backdrop} ${styles.open}`}
          aria-hidden="false"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
          height: "100vh",
          maxHeight: "100vh",
          overflowY: "auto",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #F1F5F9",
          padding: isEffectiveCollapsed ? "20px 10px" : "20px 16px 28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: isEffectiveCollapsed ? "20px" : "20px",
          boxSizing: "border-box",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          transition: "width 0.25s ease, transform 0.3s ease",
        }}
        className={`${styles.sellerSidebar} seller-sidebar ${
          isMobileOpen ? styles.open : ""
        } ${isEffectiveCollapsed ? styles.collapsed : styles.expanded}`}
        aria-label="Seller Operations Navigation"
      >
        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
          }}
          className={styles.brandWrapper}
        >
          {/* Logo Row */}
          <div
            style={{
              width: "100%",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: isEffectiveCollapsed ? "center" : "space-between",
              gap: "8px",
            }}
            className={styles.logoRow}
          >
            <Link
              href="/seller/dashboard"
              className={styles.logoLink}
              title="Neo Cloud Bites Seller Dashboard"
              onClick={() => {
                if (onClose) onClose();
              }}
            >
              <div className={styles.logoImgWrapper}>
                <Image
                  src={logoSrc}
                  alt="Neo Cloud Bites Logo"
                  width={34}
                  height={34}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  priority
                />
              </div>

              {!isEffectiveCollapsed && (
                <span className={styles.brandTitle}>NEO CLOUD BITES</span>
              )}
            </Link>

            {/* Desktop Collapse / Expand Button in Header */}
            {!isEffectiveCollapsed && showCollapseToggle && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                className={styles.desktopCollapseBtn}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            )}

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`${styles.sidebarCloseBtn} sidebar-close-btn`}
                aria-label="Close sidebar"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* User Profile Card inside Sidebar (Expanded only) */}
        {!isEffectiveCollapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              backgroundColor: "#F8FAFC",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              boxSizing: "border-box",
              width: "100%",
            }}
            className="sidebar-user-card"
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: "#FF5500",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "13.5px",
                letterSpacing: "0.5px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(255, 85, 0, 0.25)",
              }}
            >
              {effectiveAvatarInitials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, overflow: "hidden" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0F172A",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.2,
                }}
              >
                {effectiveOwnerName}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#F97316",
                    backgroundColor: "#FFF1E8",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {roleTagText}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Nav Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: 1,
            width: "100%",
          }}
        >
          {SELLER_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const IconComponent = item.icon;
            const isFood =
              item.id === "orders" ||
              item.id === "menu" ||
              item.id === "delivery" ||
              item.id === "subscription" ||
              item.id === "offers" ||
              item.id === "reviews";
            const isProp = item.id === "rooms-seller" || item.id === "rooms" || item.id === "bookings";
            const isLocked = Boolean(
              statusData &&
                ((isFood && !statusData.isFoodActive) ||
                  (isProp && !statusData.isPropertyActive))
            );

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavItemClick(e, item)}
                title={isLocked ? `${item.label} (Requires active subscription)` : item.label}
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "8px",
                  padding: isEffectiveCollapsed ? "0" : "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isEffectiveCollapsed ? "center" : "flex-start",
                  gap: isEffectiveCollapsed ? "0" : "10px",
                  textDecoration: "none",
                  boxSizing: "border-box",
                  backgroundColor: active ? "#FFF1E8" : "transparent",
                  color: active ? "#F97316" : isLocked ? "#94A3B8" : "#475569",
                  fontWeight: active ? 700 : 500,
                  fontSize: "13.5px",
                  transition: "all 0.18s ease",
                  position: "relative",
                }}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <IconComponent
                  size={18}
                  color={active ? "#F97316" : isLocked ? "#94A3B8" : "#64748B"}
                />
                {!isEffectiveCollapsed && (
                  <span style={{ lineHeight: 1, whiteSpace: "nowrap", flex: 1 }}>
                    {item.label}
                  </span>
                )}
                {!isEffectiveCollapsed && isLocked && (
                  <Lock size={13} color="#CBD5E1" style={{ marginLeft: "auto", flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer with Logout Action & Collapse Trigger */}
        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "8px" }}>
          {isEffectiveCollapsed ? (
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                performLogout({ role: "SELLER" });
              }}
              title="Log Out"
              style={{
                width: "100%",
                height: "38px",
                borderRadius: "8px",
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: "transparent",
                color: "#EF4444",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              className="nav-logout-btn"
            >
              <LogOut size={18} color="#EF4444" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                performLogout({ role: "SELLER" });
              }}
              style={{
                width: "100%",
                height: "38px",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "none",
                background: "transparent",
                color: "#EF4444",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                boxSizing: "border-box",
                transition: "all 0.18s ease",
              }}
              className="nav-logout-btn"
            >
              <LogOut size={18} color="#EF4444" />
              <span>Log Out</span>
            </button>
          )}

          {showCollapseToggle && (
            <button
              type="button"
              onClick={handleToggleCollapse}
              className={styles.footerToggleBtn}
              title={isEffectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                width: "100%",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: isEffectiveCollapsed ? "center" : "space-between",
                padding: isEffectiveCollapsed ? "0" : "6px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "transparent",
                color: "#64748B",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {isEffectiveCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <>
                  <span style={{ fontSize: "12px", color: "#94A3B8" }}>Collapse Sidebar</span>
                  <ChevronLeft size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Category Upgrade & Subscription Modals */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {modalType === "SUBSCRIPTION" ? (
              <>
                <div className={styles.modalHeader}>
                  <div className={styles.modalTitleWrapper}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#fff1e8", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Lock size={18} />
                      </div>
                      <h3 className={styles.modalTitle}>
                        {modalCategory === "FOOD" ? "Activate Food Services" : "Activate Room Bookings"}
                      </h3>
                    </div>
                    <p className={styles.modalSubtitle}>
                      An active subscription plan is required to access orders, menu management, and operations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className={styles.modalCloseBtn}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className={styles.plansList}>
                  {loadingPlans ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                      <Loader2 size={24} className="animate-spin" color="#f97316" style={{ margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "13px" }}>Loading available plans...</p>
                    </div>
                  ) : categoryPlans.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                      No active subscription plans found for this category. Please check back shortly.
                    </div>
                  ) : (
                    categoryPlans.map((plan) => (
                      <div key={plan.id} className={styles.planCard}>
                        <div className={styles.planTopRow}>
                          <div>
                            <div className={styles.planName}>{plan.name}</div>
                            <div className={styles.planMeta}>
                              <Clock size={13} />
                              <span>{plan.durationMonths} Months Duration</span>
                            </div>
                          </div>
                          <div className={styles.planPrice}>₹{plan.price.toLocaleString("en-IN")}</div>
                        </div>

                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                          <div className={styles.planFeatures}>
                            {plan.features.slice(0, 3).map((feat: string, idx: number) => (
                              <div key={idx} className={styles.planFeatureItem}>
                                <Check size={13} color="#16a34a" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <Link
                          href={`/seller/payment?planId=${plan.id}&category=${modalCategory}`}
                          onClick={() => setModalOpen(false)}
                          className={styles.planSelectBtn}
                        >
                          <span>Subscribe Now</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.modalFooterBtns}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className={styles.modalCancelBtn}
                  >
                    Close
                  </button>
                  <Link
                    href={`/seller/payment?category=${modalCategory}`}
                    onClick={() => setModalOpen(false)}
                    className={styles.modalPrimaryBtn}
                  >
                    View All Plans
                  </Link>
                </div>
              </>
            ) : modalType === "UPGRADE" ? (() => {
              const verification = modalCategory === "FOOD"
                ? (statusData?.sellerProfile?.foodVerificationStatus || "NONE")
                : (statusData?.sellerProfile?.propertyVerificationStatus || "NONE");

              if (verification === "PENDING") {
                return (
                  <div className={styles.pendingCard}>
                    <div className={styles.pendingIcon}>⏳</div>
                    <h3 className={styles.modalTitle}>Verification Under Review</h3>
                    <p className={styles.modalSubtitle} style={{ maxWidth: "380px" }}>
                      Your request to add the {modalCategory === "FOOD" ? "Food" : "Property"} category is currently being reviewed by our administration team.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className={styles.modalPrimaryBtn}
                      style={{ marginTop: "12px", width: "100%" }}
                    >
                      Got It
                    </button>
                  </div>
                );
              }

              return (
                <form onSubmit={handleCategoryFormSubmit}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitleWrapper}>
                      <h3 className={styles.modalTitle}>
                        {modalCategory === "FOOD" ? "Food Category Verification" : "Property Category Verification"}
                      </h3>
                      <p className={styles.modalSubtitle}>
                        Please provide verification documents to enable {modalCategory === "FOOD" ? "food menu & kitchen orders" : "rooms & bookings"} on your dashboard.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className={styles.modalCloseBtn}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                    {modalCategory === "FOOD" && (
                      <>
                        {/* FSSAI */}
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>
                            <span>FSSAI License / Certificate</span>
                            {!statusData?.sellerProfile?.fssaiUrl && <span className={styles.fieldLabelRequired}>*</span>}
                          </label>
                          {!fssaiFile ? (
                            <div className={styles.fileInputRow}>
                              <label className={styles.uploadFileBtn}>
                                <UploadCloud size={16} />
                                <span>Upload File</span>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(e) => setFssaiFile(e.target.files?.[0] || null)}
                                  style={{ display: "none" }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setCameraMode("fssai")}
                                className={styles.cameraFileBtn}
                              >
                                <CameraIcon size={16} />
                                <span>Take Photo</span>
                              </button>
                            </div>
                          ) : (
                            <div className={styles.filePreviewRow}>
                              <span className={styles.fileName}>{fssaiFile.name}</span>
                              <button
                                type="button"
                                onClick={() => setFssaiFile(null)}
                                className={styles.fileRemoveBtn}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Kitchen Images */}
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>
                            <span>Kitchen Images (1-3 photos)</span>
                            <span className={styles.fieldLabelRequired}>*</span>
                          </label>
                          {[0, 1, 2].map((idx) => {
                            const file = kitchenImages[idx];
                            return (
                              <div key={`k_${idx}`} style={{ marginBottom: "6px" }}>
                                {!file ? (
                                  <div className={styles.fileInputRow}>
                                    <label className={styles.uploadFileBtn}>
                                      <UploadCloud size={15} />
                                      <span>Kitchen Photo {idx + 1} {idx === 0 && "*"}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const copy = [...kitchenImages];
                                          copy[idx] = e.target.files?.[0] || null;
                                          setKitchenImages(copy);
                                        }}
                                        style={{ display: "none" }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setCameraMode(`kitchen${idx}` as any)}
                                      className={styles.cameraFileBtn}
                                    >
                                      <CameraIcon size={15} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={styles.filePreviewRow}>
                                    <span className={styles.fileName}>{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = [...kitchenImages];
                                        copy[idx] = null;
                                        setKitchenImages(copy);
                                      }}
                                      className={styles.fileRemoveBtn}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Cuisine Images */}
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>
                            <span>Cuisine / Dish Images (1-3 photos)</span>
                            <span className={styles.fieldLabelRequired}>*</span>
                          </label>
                          {[0, 1, 2].map((idx) => {
                            const file = cuisineImages[idx];
                            return (
                              <div key={`c_${idx}`} style={{ marginBottom: "6px" }}>
                                {!file ? (
                                  <div className={styles.fileInputRow}>
                                    <label className={styles.uploadFileBtn}>
                                      <UploadCloud size={15} />
                                      <span>Dish Photo {idx + 1} {idx === 0 && "*"}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const copy = [...cuisineImages];
                                          copy[idx] = e.target.files?.[0] || null;
                                          setCuisineImages(copy);
                                        }}
                                        style={{ display: "none" }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setCameraMode(`cuisine${idx}` as any)}
                                      className={styles.cameraFileBtn}
                                    >
                                      <CameraIcon size={15} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={styles.filePreviewRow}>
                                    <span className={styles.fileName}>{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = [...cuisineImages];
                                        copy[idx] = null;
                                        setCuisineImages(copy);
                                      }}
                                      className={styles.fileRemoveBtn}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {modalCategory === "PROPERTY" && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          <span>Room Photos (1-3 photos)</span>
                          <span className={styles.fieldLabelRequired}>*</span>
                        </label>
                        {[0, 1, 2].map((idx) => {
                          const file = roomImages[idx];
                          return (
                            <div key={`r_${idx}`} style={{ marginBottom: "6px" }}>
                              {!file ? (
                                <div className={styles.fileInputRow}>
                                  <label className={styles.uploadFileBtn}>
                                    <UploadCloud size={15} />
                                    <span>Room Photo {idx + 1} {idx === 0 && "*"}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const copy = [...roomImages];
                                        copy[idx] = e.target.files?.[0] || null;
                                        setRoomImages(copy);
                                      }}
                                      style={{ display: "none" }}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setCameraMode(`room${idx}` as any)}
                                    className={styles.cameraFileBtn}
                                  >
                                    <CameraIcon size={15} />
                                  </button>
                                </div>
                              ) : (
                                <div className={styles.filePreviewRow}>
                                  <span className={styles.fileName}>{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copy = [...roomImages];
                                      copy[idx] = null;
                                      setRoomImages(copy);
                                    }}
                                    className={styles.fileRemoveBtn}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className={styles.modalFooterBtns}>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className={styles.modalCancelBtn}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={styles.modalPrimaryBtn}
                    >
                      {submitting ? "Uploading..." : "Submit Documents"}
                    </button>
                  </div>
                </form>
              );
            })() : null}
          </div>
        </div>
      )}

      {/* Submitting Progress Modal */}
      {submitting && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: "400px", textAlign: "center", padding: "32px 24px" }}>
            <Loader2 className="animate-spin" size={38} color="#ea580c" style={{ margin: "0 auto 16px" }} />
            <h3 className={styles.modalTitle} style={{ marginBottom: "8px" }}>
              {uploadProgress === 100 ? "Processing Category Request..." : "Submitting Upgrade Documents"}
            </h3>
            <p className={styles.modalSubtitle} style={{ marginBottom: "16px" }}>
              {uploadProgress === 100
                ? "Files uploaded successfully! Saving to server..."
                : "Please wait while your files are uploaded..."}
            </p>
            <div style={{ width: "100%", backgroundColor: "#e2e8f0", borderRadius: "999px", height: "8px", overflow: "hidden", marginBottom: "8px" }}>
              <div
                style={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  backgroundColor: "#ea580c",
                  transition: "width 0.2s ease-out",
                }}
              />
            </div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#ea580c" }}>{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {cameraMode && (
        <CameraCaptureModal
          onCapture={handleCameraCapture}
          onClose={() => setCameraMode(null)}
          skipWatermark={cameraMode === "fssai"}
        />
      )}

      <style jsx>{`
        .nav-item:hover:not(.active) {
          background-color: #F8FAFC !important;
          color: #0F172A !important;
        }
        .nav-item:hover:not(.active) :global(svg) {
          color: #0F172A !important;
        }
        .nav-logout-btn:hover {
          background-color: #FEF2F2 !important;
        }
      `}</style>
    </>
  );
}


