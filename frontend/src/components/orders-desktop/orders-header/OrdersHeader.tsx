"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./OrdersHeader.module.css";

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
  title = "My Orders",
  subtitle = "Track and manage your orders",
  categories = ORDER_CATEGORIES,
  defaultCategory = "All",
  onCategoryChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (onCategoryChange) {
      onCategoryChange(cat);
    }
  };

  return (
    <div className={styles.headerContainer}>
      {/* Slide-out Mobile Sidebar Drawer matching Image 2 */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="My Orders"
      />

      {/* Top Header Row matching Image 1 on mobile */}
      <div className={styles.headerTopRow}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Open navigation menu"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} strokeWidth={2.2} />
        </button>

        <div className={styles.headerTitleCol}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

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
