"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, ChevronDown, Bell, Globe, Check } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import logoImg from "@/components/navbar/logo-nav.png";
import styles from "./OrdersHeader.module.css";

const LANG_OPTIONS = [
  { id: "hi", label: "Hindi", code: "HI" },
  { id: "mr", label: "Marathi", code: "MR" },
  { id: "en", label: "English", code: "EN" },
];

export const ORDER_CATEGORIES = [
  "All",
  "Food",
  "Mess",
  "Bakery",
  "Home Meals",
  "Rooms",
] as const;

export interface OrdersHeaderProps {
  title?: string;
  subtitle?: string;
  categories?: readonly string[];
  defaultCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  title = "Orders",
  subtitle = "Track and manage your orders",
  categories = ORDER_CATEGORIES,
  defaultCategory = "All",
  onCategoryChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  const handleLangSelect = (id: string) => {
    setSelectedLang(id);
    setIsLangDropdownOpen(false);
  };

  const getSelectedLangCode = () => {
    const found = LANG_OPTIONS.find((l) => l.id === selectedLang);
    return found ? found.code : "EN";
  };

  return (
    <div className={styles.headerContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="My Orders"
      />

      {/* 1. Mobile Top Navigation Bar matching Explore Page (<=768px) */}
      <nav className={styles.topNavRow} aria-label="Orders Mobile Top Navigation">
        <div className={styles.navLeftGroup}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open navigation menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} strokeWidth={2.2} />
          </button>

          <Link href="/" className={styles.brandLink}>
            <div className={styles.logoWrapper}>
              <Image
                src={logoImg}
                alt="Cloud Kitchen Logo"
                width={40}
                height={40}
                className={styles.logoImage}
                priority
              />
            </div>
            <div className={styles.brandInfo}>
              <span className={styles.brandTitle}>Cloud Kitchen</span>
              <div className={styles.locationContainer}>
                <span>Kothrud, Pune</span>
                <ChevronDown size={14} />
              </div>
            </div>
          </Link>
        </div>

        <div className={styles.navRightGroup}>
          {/* Notification Bell Button */}
          <button
            type="button"
            className={styles.bellBtn}
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={2} />
          </button>

          {/* Language Selector Pill with Dropdown */}
          <div className={styles.langWrapper}>
            <button
              type="button"
              className={styles.langBtn}
              onClick={() => setIsLangDropdownOpen((prev) => !prev)}
              aria-label={`Language: ${getSelectedLangCode()}`}
              aria-expanded={isLangDropdownOpen}
            >
              <Globe size={20} strokeWidth={2.2} />
            </button>

            {isLangDropdownOpen && (
              <>
                <div
                  className={styles.langBackdrop}
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div className={styles.langDropdown} role="menu">
                  {LANG_OPTIONS.map((option) => {
                    const isSelected = selectedLang === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.langItem} ${
                          isSelected ? styles.langItemActive : ""
                        }`}
                        onClick={() => handleLangSelect(option.id)}
                        role="menuitem"
                      >
                        <span className={styles.langLabel}>{option.label}</span>
                        {isSelected && (
                          <Check size={18} color="#16A34A" strokeWidth={2.8} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Orders Title Section */}
      <div className={styles.ordersTitleSection}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      {/* 3. Filter Categories Row */}
      <div className={styles.filtersRow} role="tablist" aria-label="Order Categories">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.filterBtn} ${
                isActive ? styles.activeFilterBtn : ""
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersHeader;
