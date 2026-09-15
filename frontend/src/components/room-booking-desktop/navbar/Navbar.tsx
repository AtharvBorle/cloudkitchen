"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";
import styles from "./Navbar.module.css";
import logoImg from "./logo-nav.png";
import profilePic from "./Rectangle.jpg";

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
  Settings: "/settings-desktop",
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
  const [internalVegOnly, setInternalVegOnly] = useState<boolean>(true);

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
    if (session?.user) {
      const role = (session.user as any)?.role;
      if (role === "SELLER") {
        router.push("/dashboard/seller");
      } else if (role === "ADMIN" || role === "SUPERADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/settings-desktop");
      }
    } else {
      router.push("/settings-desktop");
    }
  };

  const handleCartClick = () => {
    router.push("/user/cart");
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

        {/* 2. CENTER SECTION (Food, Mess/Tiffin, Rooms, Settings) */}
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
              <span className={styles.navItemText}>{item}</span>
            </button>
          ))}
        </nav>

        {/* 3. RIGHT SECTION */}
        <div className={styles.rightSection}>

          {/* Language Selector Pill with Globe, EN, Chevron in #F97316 */}
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

          {/* Food Delivery Bag / Cart Icon in #F97316 */}
          <button
            type="button"
            className={styles.cartButton}
            onClick={handleCartClick}
            aria-label={`Shopping Bag (${totalCartCount} items)`}
          >
            <ShoppingBag size={22} strokeWidth={2.2} />
            {totalCartCount > 0 && (
              <span className={styles.cartBadge}>{totalCartCount}</span>
            )}
          </button>

          {/* Profile Avatar */}
          <button
            type="button"
            className={styles.profileAvatar}
            onClick={handleProfileClick}
            aria-label={session?.user ? (session.user.name || "User Profile") : "Sign In"}
            title={session?.user ? `${session.user.name || "User"} (${session.user.email || ""})` : "Sign In / Register"}
          >
            {session?.user?.name ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: "#FF5500",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "15px",
                  userSelect: "none",
                }}
              >
                {session.user.name.trim().charAt(0).toUpperCase()}
              </div>
            ) : (
              <Image
                src={profilePic}
                alt="Sign In"
                width={38}
                height={38}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
