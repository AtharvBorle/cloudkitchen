"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, Globe, ShoppingBag, User } from "lucide-react";
import styles from "./Navbar.module.css";
import logoImg from "./logo-nav.png";

export const DEFAULT_NAV_ITEMS = [
  "Home",
  "Explore",
  "Orders",
  "Rooms",
  "Settings",
] as const;

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
}

export const Navbar: React.FC<NavbarProps> = ({
  navItems = DEFAULT_NAV_ITEMS,
  activeItem: controlledActiveItem,
  initialActiveItem = "Home",
  onNavItemClick,
  location = "Kothrud, Pune",
  cartCount = 0,
  isVegOnly: controlledVegOnly,
  onVegToggle,
  onCartClick,
  onProfileClick,
}) => {
  const [internalActiveItem, setInternalActiveItem] = useState<string>(
    initialActiveItem
  );
  const [internalVegOnly, setInternalVegOnly] = useState<boolean>(true);

  const currentActiveItem =
    controlledActiveItem !== undefined
      ? controlledActiveItem
      : internalActiveItem;

  const currentVegOnly =
    controlledVegOnly !== undefined ? controlledVegOnly : internalVegOnly;

  const handleNavClick = (item: string) => {
    setInternalActiveItem(item);
    if (onNavItemClick) {
      onNavItemClick(item);
    }
  };

  const toggleVegOnly = () => {
    const nextState = !currentVegOnly;
    setInternalVegOnly(nextState);
    if (onVegToggle) {
      onVegToggle(nextState);
    }
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

        {/* 2. CENTER SECTION */}
        <nav className={styles.centerSection} aria-label="Desktop Navigation">
          {navItems.map((item) => {
            const isActive = currentActiveItem === item;
            return (
              <button
                key={item}
                type="button"
                className={`${styles.navItem} ${
                  isActive ? styles.active : ""
                }`}
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
            onClick={onCartClick}
            aria-label={`Shopping Bag (${cartCount} items)`}
          >
            <ShoppingBag size={22} strokeWidth={2.2} />
          </button>

          {/* Profile Avatar */}
          <button
            type="button"
            className={styles.profileAvatar}
            onClick={onProfileClick}
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
