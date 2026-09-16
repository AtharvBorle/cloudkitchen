"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import {
  X,
  Home,
  Search,
  ShoppingBag,
  Tag,
  Settings,
  HelpCircle,
  LogOut,
  LogIn,
  ChevronRight,
  ChevronDown,
  Star,
  Utensils,
  ChefHat,
  BedDouble,
  Check,
  Calendar,
  Bell,
  CreditCard,
  MapPin,
  History,
  FileText,
  Shield,
} from "lucide-react";
import styles from "./MobileSidebar.module.css";
import userAvatar from "../settings-desktop/settings-sidebar/rahul-sharma-avatar.jpg";
import logoImg from "@/components/navbar/logo-nav.png";

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?:
    | "Home"
    | "Explore"
    | "My Orders"
    | "Orders"
    | "Rooms"
    | "Food"
    | "Mess/Tiffin"
    | "Settings"
    | "General Overview"
    | "My Subscriptions"
    | "Notifications"
    | "Payment Methods"
    | "Delivery Addresses"
    | "Order History"
    | "Help & Support"
    | string;
  userName?: string;
  isGoldMember?: boolean;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  activeItem = "Home",
  userName: customUserName,
  isGoldMember = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isRoomRoute = Boolean(pathname?.startsWith("/room-booking") || activeItem === "Rooms");
  const isSettingsRoute = Boolean(
    pathname?.startsWith("/settings-desktop") ||
    pathname?.startsWith("/my-subscriptions-desktop") ||
    pathname?.startsWith("/my-subscription") ||
    pathname?.startsWith("/notifications-desktop") ||
    pathname?.startsWith("/payment-methods-desktop") ||
    pathname?.startsWith("/delivery-addresses-desktop") ||
    pathname?.startsWith("/order-history-desktop") ||
    pathname?.startsWith("/support") ||
    pathname?.startsWith("/terms") ||
    pathname?.startsWith("/privacy") ||
    pathname?.startsWith("/rate") ||
    activeItem === "Settings" ||
    activeItem === "General Overview" ||
    activeItem === "My Subscriptions" ||
    activeItem === "Notifications" ||
    activeItem === "Payment Methods" ||
    activeItem === "Delivery Addresses" ||
    activeItem === "Order History" ||
    activeItem === "Help & FAQ" ||
    activeItem === "Terms & Conditions" ||
    activeItem === "Privacy Policy" ||
    activeItem === "Rate Our App"
  );
  const [isRoomsDropdownOpen, setIsRoomsDropdownOpen] = useState<boolean>(isRoomRoute);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState<boolean>(isSettingsRoute);

  const userName = customUserName || session?.user?.name || "Siddharth Sharma";

  // Lock body scroll and sync dropdown state when drawer is opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsRoomsDropdownOpen(Boolean(pathname?.startsWith("/room-booking") || activeItem === "Rooms"));
      setIsSettingsDropdownOpen(Boolean(isSettingsRoute));
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, pathname, activeItem, isSettingsRoute]);

  const handleAuthAction = () => {
    onClose();
    if (session?.user) {
      performLogout({ role: "USER" });
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/settings-desktop")}`);
    }
  };

  const navLinks = [
    {
      label: "Home",
      href: "/",
      icon: <Home className={styles.navIcon} size={18} />,
      hasBadge: false,
    },
    {
      label: "Explore",
      href: "/explore-desktop",
      icon: <Search className={styles.navIcon} size={18} />,
      hasBadge: false,
    },
    {
      label: "My Orders",
      href: "/orders-desktop",
      icon: <ShoppingBag className={styles.navIcon} size={18} />,
      hasBadge: false,
    },
    {
      label: "Cart",
      href: "/user/cart",
      icon: <ShoppingBag className={styles.navIcon} size={19} />,
      hasBadge: false,
    },
    {
      label: "Rooms",
      href: "/room-booking",
      icon: <BedDouble className={styles.navIcon} size={18} />,
      hasBadge: true,
      badgeText: "NEW",
      isDropdown: true,
    },
    {
      label: "Settings",
      href: "/settings-desktop",
      icon: <Settings className={styles.navIcon} size={18} />,
      hasBadge: false,
      isDropdown: true,
    },
    {
      label: "Help & Support",
      href: "/support",
      icon: <HelpCircle className={styles.navIcon} size={18} />,
      hasBadge: false,
    },
  ];

  const roomSubOptions = [
    {
      label: "Rooms",
      href: "/room-booking",
      icon: <BedDouble className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Food",
      href: "/explore-desktop",
      icon: <Utensils className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Mess/Tiffin",
      href: "/explore-desktop",
      icon: <ChefHat className={styles.subnavIcon} size={15} />,
    },
  ];

  const settingsSubOptions = [
    {
      label: "General Overview",
      href: "/settings-desktop",
      icon: <Settings className={styles.subnavIcon} size={15} />,
    },
    {
      label: "My Subscriptions",
      href: "/my-subscriptions-desktop",
      icon: <Calendar className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Notifications",
      href: "/notifications-desktop",
      icon: <Bell className={styles.subnavIcon} size={15} />,
    },
    /*
    // PAYMENT METHODS (Disabled via comment - uncomment to re-enable in future)
    {
      label: "Payment Methods",
      href: "/payment-methods-desktop",
      icon: <CreditCard className={styles.subnavIcon} size={15} />,
    },
    */
    {
      label: "Delivery Addresses",
      href: "/delivery-addresses-desktop",
      icon: <MapPin className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Order History",
      href: "/order-history-desktop",
      icon: <History className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Help & FAQ",
      href: "/support",
      icon: <HelpCircle className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Terms & Conditions",
      href: "/terms",
      icon: <FileText className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Privacy Policy",
      href: "/privacy",
      icon: <Shield className={styles.subnavIcon} size={15} />,
    },
    {
      label: "Rate Our App",
      href: "/rate-app",
      icon: <Star className={styles.subnavIcon} size={15} />,
    },
  ];

  const isLinkActive = (item: { label: string; href: string }) => {
    if (item.href === "/" && (pathname === "/" || activeItem === "Home")) return true;
    if (item.label === "Rooms") {
      return pathname?.startsWith("/room-booking") || activeItem === "Rooms";
    }
    if (item.label === "Settings") {
      return isSettingsRoute;
    }
    if (item.href !== "/" && pathname?.startsWith(item.href)) return true;
    if (activeItem === item.label) return true;
    if (item.label === "My Orders" && activeItem === "Orders") return true;
    return false;
  };

  const isSubOptionActive = (sub: { label: string; href: string }) => {
    if (sub.label === "Rooms") {
      return (
        pathname?.startsWith("/room-booking") ||
        activeItem === "Rooms" ||
        (activeItem !== "Food" &&
          activeItem !== "Mess/Tiffin" &&
          !pathname?.startsWith("/explore-desktop") &&
          !pathname?.startsWith("/my-subscription") &&
          !pathname?.startsWith("/my-subscriptions-desktop") &&
          pathname?.startsWith("/room-booking"))
      );
    }
    if (sub.label === "Food") {
      return pathname === "/explore-desktop" || activeItem === "Food";
    }
    if (sub.label === "Mess/Tiffin") {
      return pathname === "/explore-desktop" || activeItem === "Mess/Tiffin";
    }
    return false;
  };

  const isSettingsSubOptionActive = (sub: { label: string; href: string }) => {
    if (sub.href === "#") return false;
    if (sub.href === "/settings-desktop") {
      return pathname === "/settings-desktop" || pathname === "/settings";
    }
    if (sub.href === "/my-subscriptions-desktop") {
      return pathname === "/my-subscriptions-desktop" || pathname === "/my-subscription";
    }
    if (sub.href === "/support") {
      return pathname === "/support" || pathname?.startsWith("/support/");
    }
    if (sub.href === "/terms") {
      return pathname === "/terms";
    }
    if (sub.href === "/privacy") {
      return pathname === "/privacy";
    }
    if (sub.href === "/rate-app" || sub.href === "/rate") {
      return pathname === "/rate-app" || pathname === "/rate";
    }
    return Boolean(pathname?.startsWith(sub.href));
  };

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Slide-out Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        aria-label="Navigation Drawer"
      >
        {/* Header: Cloud Kitchen Logo + Brand Name + Close Button */}
        <div className={styles.drawerHeader}>
          <div className={styles.brandGroup}>
            <div className={styles.logoCircle}>
              <Image
                src={logoImg}
                alt="Neo Cloud Bites Logo"
                width={32}
                height={32}
                className={styles.logoImg}
              />
            </div>
            <span className={styles.brandText}>Neo Cloud Bites</span>
          </div>

          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* User Profile Card */}
        <div
          className={styles.profileSection}
          onClick={() => {
            onClose();
            router.push("/settings-desktop");
          }}
          style={{ cursor: "pointer" }}
          role="button"
          tabIndex={0}
          aria-label="View User Profile & Settings"
        >
          <div className={styles.avatarWrapper}>
            <Image
              src={userAvatar}
              alt={userName}
              fill
              className={styles.avatarImg}
            />
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>{userName}</h3>
            {isGoldMember && (
              <div className={styles.goldBadge}>
                <Star size={11} fill="#FFFFFF" color="#FFFFFF" />
                <span>Gold Member</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className={styles.navContainer}>
          <div className={styles.navGroup}>
            {navLinks.map((item) => {
              if (item.isDropdown) {
                const isRooms = item.label === "Rooms";
                const isSettings = item.label === "Settings";
                const isDropdownOpen = isRooms ? isRoomsDropdownOpen : isSettings ? isSettingsDropdownOpen : false;
                const toggleDropdown = isRooms
                  ? () => setIsRoomsDropdownOpen((prev) => !prev)
                  : () => setIsSettingsDropdownOpen((prev) => !prev);
                const subOptions = isRooms ? roomSubOptions : settingsSubOptions;
                const checkSubActive = isRooms ? isSubOptionActive : isSettingsSubOptionActive;
                const isHeaderActive = isLinkActive(item);

                return (
                  <div key={item.label} className={styles.dropdownContainer}>
                    <div
                      className={`${styles.dropdownHeader} ${isHeaderActive ? styles.dropdownHeaderActive : ""}`}
                      onClick={toggleDropdown}
                    >
                      <div className={styles.navItemLeft}>
                        {item.icon}
                        <span>{item.label}</span>
                      </div>

                      <div className={styles.dropdownRight}>
                        {item.hasBadge && (
                          <span className={styles.newBadge}>{item.badgeText}</span>
                        )}
                        <button
                          type="button"
                          className={styles.dropdownToggleBtn}
                          aria-label={`Toggle ${item.label} dropdown`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown();
                          }}
                        >
                          <ChevronDown
                            className={`${styles.dropdownChevron} ${
                              isDropdownOpen ? styles.dropdownChevronOpen : ""
                            }`}
                            size={16}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Submenu Dropdown List with smooth accordion animation */}
                    <div
                      className={`${styles.subnavWrapper} ${
                        isDropdownOpen ? styles.subnavWrapperOpen : ""
                      }`}
                    >
                      <div className={styles.subnavInner}>
                        {subOptions.map((sub, index) => {
                          const isSubActive = checkSubActive(sub);
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              style={{
                                animationDelay: `${index * 0.04}s`,
                              }}
                              className={`${styles.subnavItem} ${
                                isSubActive ? styles.subnavItemActive : ""
                              }`}
                              onClick={onClose}
                            >
                              <div className={styles.subnavItemLeft}>
                                {sub.icon}
                                <span>{sub.label}</span>
                              </div>
                              {isSubActive && (
                                <span className={styles.subnavActiveBadge}>
                                  <Check size={11} strokeWidth={3} />
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = isLinkActive(item);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  onClick={onClose}
                >
                  <div className={styles.navItemLeft}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.hasBadge ? (
                    <span className={styles.newBadge}>{item.badgeText}</span>
                  ) : (
                    <ChevronRight size={16} className={styles.navChevron} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer with Log Out & Version */}
        <div className={styles.drawerFooter}>
          <button className={styles.logoutBtn} onClick={handleAuthAction} aria-label={session?.user ? "Log Out" : "Sign In"}>
            {session?.user ? (
              <>
                <LogOut className={styles.logoutIcon} size={18} strokeWidth={2.4} />
                <span>Log Out</span>
              </>
            ) : (
              <>
                <LogIn className={styles.logoutIcon} size={18} strokeWidth={2.4} />
                <span>Sign In</span>
              </>
            )}
          </button>

          <div className={styles.footerBrandRow}>
            <span className={styles.versionText}>v2.4.1 (124040)</span>
            <span className={styles.footerBrandText}>CLOUD KITCHEN</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;

