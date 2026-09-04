"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";
import styles from "./Navbar.module.css";
import logoImg from "@/components/navbar/logo-nav.png";

export interface NavbarProps {
  initialActiveItem?: "Food" | "Mess/Tiffin" | "Rooms" | "Settings" | string;
  onNavItemClick?: (item: string) => void;
  location?: string;
  cartCount?: number;
  isVegOnly?: boolean;
  onVegToggle?: (isVeg: boolean) => void;
}

const NAV_ITEM_ROUTES: Record<string, string> = {
  Food: "/explore-desktop",
  "Mess/Tiffin": "/explore-desktop?category=mess",
  Rooms: "/room-booking",
  Settings: "/dashboard/user/profile",
};

export const Navbar: React.FC<NavbarProps> = ({
  initialActiveItem = "Rooms",
  onNavItemClick,
  location: customLocation,
  cartCount: customCartCount,
  isVegOnly: controlledVegOnly,
  onVegToggle,
}) => {
  const router = useRouter();
  const { cartItems } = useCart();
  const { defaultAddress } = useLocation();
  const { data: session } = useSession();

  const [activeItem, setActiveItem] = useState<string>(initialActiveItem);
  const [internalVegOnly, setInternalVegOnly] = useState<boolean>(false);

  const isVegOnly = controlledVegOnly !== undefined ? controlledVegOnly : internalVegOnly;

  const totalCartCount =
    customCartCount !== undefined
      ? customCartCount
      : cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const displayLocation =
    customLocation ||
    (defaultAddress
      ? `${defaultAddress.locality || defaultAddress.city || "Pune"}`
      : "Kothrud, Pune");

  const navItems = ["Food", "Mess/Tiffin", "Rooms", "Settings"] as const;

  const handleNavClick = (item: string) => {
    setActiveItem(item);
    if (onNavItemClick) {
      onNavItemClick(item);
    }
    const route = NAV_ITEM_ROUTES[item];
    if (route) {
      router.push(route);
    }
  };

  const toggleVegOnly = () => {
    const nextVal = !isVegOnly;
    setInternalVegOnly(nextVal);
    if (onVegToggle) {
      onVegToggle(nextVal);
    }
  };

  const handleProfileClick = () => {
    if (session) {
      router.push("/dashboard/user");
    } else {
      router.push("/auth/login/user");
    }
  };

  const handleCartClick = () => {
    router.push("/dashboard/user/checkout");
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
            <div className={styles.locationContainer} title="Location">
              <span>{displayLocation}</span>
              <ChevronDown size={14} className={styles.locationIcon} />
            </div>
          </div>
        </Link>

        {/* 2. CENTER SECTION */}
        <nav className={styles.centerSection} aria-label="Room Booking Desktop Navigation">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.navItem} ${
                activeItem === item ? styles.active : ""
              }`}
              onClick={() => handleNavClick(item)}
              aria-current={activeItem === item ? "page" : undefined}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* 3. RIGHT SECTION */}
        <div className={styles.rightSection}>
          {/* Veg Only Toggle */}
          <div
            className={styles.vegToggleWrapper}
            onClick={toggleVegOnly}
            role="switch"
            aria-checked={isVegOnly}
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
                isVegOnly ? styles.toggleTrackActive : ""
              }`}
            >
              <div
                className={`${styles.toggleThumb} ${
                  isVegOnly ? styles.toggleThumbActive : ""
                }`}
              />
            </div>
          </div>

          {/* Language Selector */}
          <button
            type="button"
            className={styles.langSelector}
            title="Select Language"
            aria-label="Language: English"
          >
            <Globe size={18} />
            <span className={styles.langText}>EN</span>
          </button>

          {/* Cart Icon */}
          <button
            type="button"
            className={styles.cartButton}
            onClick={handleCartClick}
            aria-label={`Shopping Cart (${totalCartCount} items)`}
          >
            <ShoppingCart size={21} />
            {totalCartCount > 0 && (
              <span className={styles.cartBadge}>{totalCartCount}</span>
            )}
          </button>

          {/* Profile Avatar */}
          <button
            type="button"
            className={styles.profileAvatar}
            onClick={handleProfileClick}
            aria-label="User Profile"
          >
            <User size={20} className={styles.avatarIcon} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
