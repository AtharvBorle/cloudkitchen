"use client";

import React, { useState } from "react";
import styles from "./OrderFilters.module.css";
import { Calendar, ChevronDown } from "lucide-react";

export type OrderFilterTab = "all" | "delivered" | "cancelled";

export interface OrderFiltersProps {
  activeTab?: OrderFilterTab;
  onTabChange?: (tab: OrderFilterTab) => void;
  dateRangeText?: string;
  onDateRangeChange?: (range: string) => void;
  onDateRangeClick?: () => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  activeTab = "all",
  onTabChange,
  dateRangeText = "All Time",
  onDateRangeChange,
  onDateRangeClick,
}) => {
  const [selectedTab, setSelectedTab] = useState<OrderFilterTab>(activeTab);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(dateRangeText);

  // Sync state if props change
  React.useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    setSelectedRange(dateRangeText);
  }, [dateRangeText]);

  const handleTabClick = (tab: OrderFilterTab) => {
    setSelectedTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleRangeSelect = (range: string) => {
    setSelectedRange(range);
    setIsDropdownOpen(false);
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  const dateOptions = [
    "All Time",
    "Today",
    "Last 7 Days",
    "Last 30 Days",
    "Last 3 Months",
    "This Year",
  ];

  return (
    <div className={styles.filterBar}>
      {/* Left: Filter Tabs */}
      <div className={styles.tabsGroup}>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            selectedTab === "all" ? styles.tabActive : styles.tabInactive
          }`}
          onClick={() => handleTabClick("all")}
        >
          All Orders
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            selectedTab === "delivered" ? styles.tabActive : styles.tabInactive
          }`}
          onClick={() => handleTabClick("delivered")}
        >
          Delivered
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${
            selectedTab === "cancelled" ? styles.tabActive : styles.tabInactive
          }`}
          onClick={() => handleTabClick("cancelled")}
        >
          Cancelled
        </button>
      </div>

      {/* Right: Date Range Dropdown */}
      <div className={styles.datePickerContainer}>
        <button
          type="button"
          className={styles.datePickerBtn}
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            if (onDateRangeClick) onDateRangeClick();
          }}
        >
          <Calendar size={17} className={styles.calendarIcon} />
          <span className={styles.dateText}>{selectedRange}</span>
          <ChevronDown
            size={16}
            className={`${styles.chevronIcon} ${
              isDropdownOpen ? styles.chevronRotated : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className={styles.dropdownMenu}>
            {dateOptions.map((option) => (
              <div
                key={option}
                className={`${styles.dropdownOption} ${
                  selectedRange === option ? styles.selectedOption : ""
                }`}
                onClick={() => handleRangeSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;
