"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, Globe, ShoppingBag, User } from "lucide-react";
import styles from "./Navbar.module.css";
import logoImg from "./logo-nav.png";
import profilePic from "./Rectangle.jpg";

export interface NavbarProps {
  initialActiveItem?: "Food" | "Mess/Tiffin" | "Rooms" | "Settings";
  onNavItemClick?: (item: string) => void;
  location?: string;
  cartCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  initialActiveItem = "Rooms",
  onNavItemClick,
  location = "Kothrud, Pune",
  cartCount = 0,
}) => {
  const [activeItem, setActiveItem] = useState<string>(initialActiveItem);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(true);

  // Middle options specifically for Room Booking: Food, Mess/Tiffin, Rooms, Settings
  const navItems = ["Food", "Mess/Tiffin", "Rooms", "Settings"] as const;

  const handleNavClick = (item: string) => {
    setActiveItem(item);
    if (onNavItemClick) {
      onNavItemClick(item);
    }
  };

  const toggleVegOnly = () => {
    setIsVegOnly((prev: boolean) => !prev);
  };

  return (
    <header className={styles.navbarHeader}>
      <div className={styles.navbarContainer}>
        {/* 1. LEFT SECTION */}
        <div className={styles.leftSection}>
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
              <span>{location}</span>
              <ChevronDown size={14} className={styles.locationIcon} />
            </div>
          </div>
        </div>

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
            aria-label={`Shopping Bag (${cartCount} items)`}
          >
            <ShoppingBag size={22} strokeWidth={2.2} />
          </button>

          {/* Profile Avatar */}
          <button
            type="button"
            className={styles.profileAvatar}
            aria-label="User Profile"
          >
            <Image
              src={profilePic}
              alt="Rahul Sharma"
              width={38}
              height={38}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
