"use client";

import React from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import styles from "./RoomSearchFilter.module.css";

export interface RoomSearchFilterProps {
  location?: string;
  budget?: string;
  roomType?: string;
  onSearch?: () => void;
}

export const RoomSearchFilter: React.FC<RoomSearchFilterProps> = ({
  location = "Kothrud, Pune",
  budget = "₹8,000 – ₹15,000/mo",
  roomType = "Single Sharing",
  onSearch,
}) => {
  const handleSearchClick = () => {
    if (onSearch) {
      onSearch();
    }
  };

  return (
    <div
      className={styles.filterContainer}
      role="search"
      aria-label="Room Search Filters"
    >
      <div className={styles.filtersGroup}>
        {/* 1. Location Section */}
        <div className={styles.filterSection} tabIndex={0} role="button" aria-label={`Location: ${location}`}>
          <div className={styles.filterInfo}>
            <span className={styles.filterLabel}>LOCATION</span>
            <span className={styles.filterValue}>{location}</span>
          </div>
          <ChevronDown size={18} className={styles.chevronIcon} />
        </div>

        <div className={styles.divider} />

        {/* 2. Budget Section */}
        <div className={styles.filterSection} tabIndex={0} role="button" aria-label={`Budget: ${budget}`}>
          <div className={styles.filterInfo}>
            <span className={styles.filterLabel}>BUDGET</span>
            <span className={styles.filterValue}>{budget}</span>
          </div>
          <ChevronDown size={18} className={styles.chevronIcon} />
        </div>

        <div className={styles.divider} />

        {/* 3. Room Type Section */}
        <div className={styles.filterSection} tabIndex={0} role="button" aria-label={`Room Type: ${roomType}`}>
          <div className={styles.filterInfo}>
            <span className={styles.filterLabel}>ROOM TYPE</span>
            <span className={styles.filterValue}>{roomType}</span>
          </div>
          <ChevronDown size={18} className={styles.chevronIcon} />
        </div>
      </div>

      {/* 4. Search Button */}
      <button
        type="button"
        className={styles.searchButton}
        onClick={handleSearchClick}
        aria-label="Search Rooms"
      >
        <span>Search Rooms</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

export default RoomSearchFilter;
