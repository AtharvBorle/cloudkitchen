"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./OrderFilters.module.css";
import { Calendar, ChevronDown, Check, X } from "lucide-react";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state if props change
  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    setSelectedRange(dateRangeText);
  }, [dateRangeText]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

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

  const handleResetDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleRangeSelect("All Time");
  };

  const dateOptions = [
    { label: "All Time", desc: "All previous orders" },
    { label: "Today", desc: "Day wise - orders placed today" },
    { label: "Yesterday", desc: "Orders placed yesterday" },
    { label: "This Week", desc: "Week wise - current calendar week" },
    { label: "Last 7 Days", desc: "Past 7 days orders" },
    { label: "This Month", desc: "Month wise - current calendar month" },
    { label: "Last 30 Days", desc: "Past 30 days orders" },
    { label: "Last 3 Months", desc: "Past 90 days quarterly orders" },
    { label: "This Year", desc: "All orders placed in 2026" },
  ];

  const isCustomFilterActive = selectedRange && selectedRange !== "All Time";

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
      <div className={styles.datePickerContainer} ref={dropdownRef}>
        <button
          type="button"
          className={`${styles.datePickerBtn} ${isCustomFilterActive ? styles.datePickerBtnActive : ""}`}
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            if (onDateRangeClick) onDateRangeClick();
          }}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <Calendar size={17} className={isCustomFilterActive ? styles.calendarIconActive : styles.calendarIcon} />
          <span className={styles.dateText}>{selectedRange}</span>
          {isCustomFilterActive && (
            <span
              onClick={handleResetDate}
              className={styles.clearFilterBtn}
              title="Reset date filter"
              role="button"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`${styles.chevronIcon} ${
              isDropdownOpen ? styles.chevronRotated : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className={styles.dropdownMenu} role="listbox">
            {dateOptions.map((opt) => {
              const isSelected = selectedRange === opt.label;
              return (
                <div
                  key={opt.label}
                  className={`${styles.dropdownOption} ${
                    isSelected ? styles.selectedOption : ""
                  }`}
                  onClick={() => handleRangeSelect(opt.label)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{opt.label}</span>
                    <span style={{ fontSize: "11px", color: isSelected ? "#ea580c" : "#94a3b8" }}>
                      {opt.desc}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className={styles.checkIcon} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;
