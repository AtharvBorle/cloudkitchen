"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Globe, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";
import styles from "./Navbar.module.css";
import logoImg from "./logo-nav.png";

export const DEFAULT_NAV_ITEMS = [
  "Home",
  "Explore",
  "Rooms",
  "Furniture",
  "Orders",
] as const;

export const NAV_ITEM_ROUTES: Record<string, string> = {
  Home: "/",
  Explore: "/explore-desktop",
  Food: "/explore-desktop",
  Rooms: "/room-booking",
  Furniture: "/explore/furniture",
  "Mess/Tiffin": "/explore-desktop",
  Orders: "/dashboard/user",
  Settings: "/dashboard/user/profile",
};

export interface NavbarProps {
  navItems?: readonly string[];
  activeItem?: string;
  initialActiveItem?: string;
  onNavItemClick?: (item: string) => void;
  location?: string;
  cartCount?: number;
  isVegOnly?: boolean;
  onVegToggle?: (isVeg: boolean) => void;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onLocationClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  navItems = DEFAULT_NAV_ITEMS,
  activeItem: controlledActiveItem,
  initialActiveItem = "Home",
  onNavItemClick,
  location: controlledLocation,
  cartCount: controlledCartCount,
  isVegOnly: controlledVegOnly,
  onVegToggle,
  onCartClick,
  onProfileClick,
  onLocationClick,
}) => {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { cartItems } = useCart();
  const { defaultAddress } = useLocation();
  const { data: session } = useSession();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [internalActiveItem, setInternalActiveItem] = useState<string>(initialActiveItem);
  const [internalVegOnly, setInternalVegOnly] = useState<boolean>(false);

  // Derive active item from current route if not explicitly controlled
  const getActiveItemFromPath = (): string => {
    if (controlledActiveItem !== undefined) return controlledActiveItem;
    if (pathname === "/") return "Home";
    if (pathname.startsWith("/explore-desktop")) {
      return navItems.includes("Food") ? "Food" : "Explore";
    }
    if (pathname.startsWith("/room-booking")) {
      return "Rooms";
    }
    if (pathname.startsWith("/explore/furniture")) {
      return "Furniture";
    }
    if (pathname.startsWith("/dashboard")) {
      return "Orders";
    }
    return internalActiveItem;
  };

  const currentActiveItem = getActiveItemFromPath();

  // Cart count: use controlled count if provided, otherwise compute from live cartItems
  const liveCartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const currentCartCount = controlledCartCount !== undefined ? controlledCartCount : liveCartCount;

  // Location string: use controlled prop if provided, otherwise use LocationProvider
  const displayLocation = controlledLocation || (
    defaultAddress?.locality || defaultAddress?.city
      ? `${defaultAddress.locality ? defaultAddress.locality + ", " : ""}${defaultAddress.city || defaultAddress.pincode}`
      : defaultAddress?.pincode
        ? `PIN: ${defaultAddress.pincode}`
        : "Kothrud, Pune"
  );

  const currentVegOnly = controlledVegOnly !== undefined ? controlledVegOnly : internalVegOnly;

  const handleNavClick = (item: string) => {
    setInternalActiveItem(item);
    setIsMobileMenuOpen(false);
    if (onNavItemClick) {
      onNavItemClick(item);
    } else {
      const targetRoute = NAV_ITEM_ROUTES[item] || `/${item.toLowerCase()}`;
      router.push(targetRoute);
    }
  };

  const toggleVegOnly = () => {
    const nextState = !currentVegOnly;
    setInternalVegOnly(nextState);
    if (onVegToggle) {
      onVegToggle(nextState);
    }
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      router.push("/dashboard/user/checkout");
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else if (session?.user) {
      const role = (session.user as any)?.role;
      if (role === "SELLER") {
        router.push("/dashboard/seller");
      } else if (role === "ADMIN" || role === "SUPERADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/user");
      }
    } else {
      router.push("/user");
    }
  };

  const handleLocationClick = () => {
    if (onLocationClick) {
      onLocationClick();
    }
  };

  return (
    <header className={styles.navbarHeader}>
      <div className={styles.navbarContainer}>
        {/* 1. LEFT SECTION */}
        <Link href="/" className={styles.leftSection}>
          <div className={styles.logoWrapper}>
            <Image
              src={logoImg}
              alt="Neo Cloud Bites Logo"
              width={58}
              height={58}
              className={styles.logoImage}
              priority
            />
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>NEO CLOUD BITES</span>
            <div
              className={styles.locationContainer}
              title="Location"
              onClick={(e) => {
                if (onLocationClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLocationClick();
                }
              }}
            >
              <span>{displayLocation}</span>
              <ChevronDown size={14} className={styles.locationIcon} />
            </div>
          </div>
        </Link>

        {/* 2. CENTER SECTION */}
        <nav className={styles.centerSection} aria-label="Desktop Navigation">
          {navItems.map((item) => {
            const isActive = currentActiveItem === item;
            return (
              <button
                key={item}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={() => handleNavClick(item)}
                aria-current={isActive ? "page" : undefined}
              >
                {item}
              </button>
            );
          })}
        </nav>

        {/* 3. RIGHT SECTION */}
        <div className={styles.rightSection}>
          {/* Veg Only Toggle */}
          <div
            className={styles.vegToggleWrapper}
            onClick={toggleVegOnly}
            role="switch"
            aria-checked={currentVegOnly}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleVegOnly();
              }
            }}
          >
            <span className={styles.vegLabel}>VEG ONLY</span>
            <div
              className={`${styles.toggleTrack} ${
                currentVegOnly ? styles.toggleTrackActive : ""
              }`}
            >
              <div
                className={`${styles.toggleThumb} ${
                  currentVegOnly ? styles.toggleThumbActive : ""
                }`}
              />
            </div>
          </div>

          {/* Language Selector Pill */}
          <button
            type="button"
            className={styles.langSelector}
            title="Select Language"
            aria-label="Language: English"
          >
            <Globe size={20} strokeWidth={2.2} />
            <span className={styles.langText}>EN</span>
            <ChevronDown size={16} strokeWidth={2.8} />
          </button>

          {/* Food Delivery Bag / Cart Icon */}
          <button
            type="button"
            className={styles.cartButton}
            onClick={handleCartClick}
            aria-label={`Shopping Bag (${currentCartCount} items)`}
          >
            <ShoppingBag size={22} strokeWidth={2.2} />
            {currentCartCount > 0 && (
              <span className={styles.cartBadge}>{currentCartCount}</span>
            )}
          </button>

          {/* Profile Avatar */}
          <button
            type="button"
            className={styles.profileAvatar}
            onClick={handleProfileClick}
            aria-label={session?.user ? (session.user.name || "User Profile") : "Sign In"}
            title={session?.user ? (session.user.name || "User Profile") : "Sign In"}
          >
            <User size={20} className={styles.avatarIcon} />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className={styles.mobileDrawerBackdrop}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className={styles.mobileDrawer}>
            {navItems.map((item) => {
              const isActive = currentActiveItem === item;
              return (
                <div
                  key={item}
                  className={`${styles.mobileNavItem} ${isActive ? styles.active : ""}`}
                  onClick={() => handleNavClick(item)}
                >
                  {item}
                </div>
              );
            })}
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E5E7EB" }}>
              <div
                onClick={handleProfileClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  cursor: "pointer",
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                <User size={20} color="#FF5500" />
                <span>{session?.user ? (session.user.name || "My Account") : "Sign In"}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
