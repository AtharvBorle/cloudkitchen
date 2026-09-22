"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowRight, MapPin, IndianRupee, Users, Check, X, RotateCcw } from "lucide-react";
import styles from "./RoomSearchFilter.module.css";

export interface RoomSearchFilterProps {
  location?: string;
  budget?: string;
  roomType?: string;
  availableLocations?: string[];
  onLocationChange?: (location: string) => void;
  onBudgetChange?: (budget: string) => void;
  onRoomTypeChange?: (roomType: string) => void;
  onSearch?: () => void;
  onReset?: () => void;
}

const BUDGET_OPTIONS = [
  { id: "all", label: "All Budgets", sub: "Any price range" },
  { id: "under-1000", label: "Under ₹1,000", sub: "Budget Friendly" },
  { id: "1000-3000", label: "₹1,000 – ₹3,000", sub: "Standard Economy" },
  { id: "3000-6000", label: "₹3,000 – ₹6,000", sub: "Premium Comfort" },
  { id: "6000-plus", label: "₹6,000+", sub: "Luxury Suite" },
];

const ROOM_TYPE_OPTIONS = [
  { id: "all", label: "All Room Types", sub: "Any occupancy" },
  { id: "1", label: "Single Sharing", sub: "1 Guest" },
  { id: "2", label: "Double Sharing", sub: "2 Guests" },
  { id: "3", label: "Triple Sharing", sub: "3 Guests" },
  { id: "4", label: "4+ Guests / Hostel", sub: "Dorm / Flat" },
];

export const RoomSearchFilter: React.FC<RoomSearchFilterProps> = ({
  location = "all",
  budget = "all",
  roomType = "all",
  availableLocations = [],
  onLocationChange,
  onBudgetChange,
  onRoomTypeChange,
  onSearch,
  onReset,
}) => {
  const [openDropdown, setOpenDropdown] = useState<"location" | "budget" | "roomType" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchClick = () => {
    setOpenDropdown(null);
    if (onSearch) {
      onSearch();
    }
  };

  // Human-readable labels
  const getLocationLabel = () => {
    if (!location || location === "all") return "All Areas (Pune)";
    return location;
  };

  const getBudgetLabel = () => {
    const found = BUDGET_OPTIONS.find((b) => b.id === budget);
    return found ? found.label : "All Budgets";
  };

  const getRoomTypeLabel = () => {
    const found = ROOM_TYPE_OPTIONS.find((r) => r.id === roomType);
    return found ? found.label : "All Room Types";
  };

  const isFiltered = location !== "all" || budget !== "all" || roomType !== "all";

  const allLocationsList = Array.from(
    new Set(["all", "Kothrud", "Dattawadi", "Karve Nagar", "Paud Road", ...availableLocations.filter(Boolean)])
  );

  return (
    <div
      ref={containerRef}
      className={styles.filterContainer}
      role="search"
      aria-label="Room Search Filters"
      style={{ position: "relative" }}
    >
      <div className={styles.filtersGroup}>
        {/* 1. Location Section */}
        <div
          className={`${styles.filterSection} ${openDropdown === "location" ? styles.filterSectionActive : ""}`}
          tabIndex={0}
          role="button"
          onClick={() => setOpenDropdown(openDropdown === "location" ? null : "location")}
          aria-label={`Location: ${getLocationLabel()}`}
          style={{ position: "relative" }}
        >
          <div className={styles.filterInfo}>
            <span className={styles.filterLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={12} color="#EA580C" />
              LOCATION
            </span>
            <span className={styles.filterValue}>{getLocationLabel()}</span>
          </div>
          <ChevronDown
            size={18}
            className={styles.chevronIcon}
            style={{
              transform: openDropdown === "location" ? "rotate(180deg)" : "none",
              color: openDropdown === "location" ? "#EA580C" : undefined,
            }}
          />

          {/* Location Dropdown Modal */}
          {openDropdown === "location" && (
            <div
              className={styles.dropdownMenu}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                left: "0",
                marginTop: "12px",
                width: "280px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
                border: "1px solid #E2E8F0",
                zIndex: 100,
                padding: "8px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>
                Select Location
              </div>
              {allLocationsList.map((loc) => {
                const isSelected = (loc === "all" && (location === "all" || !location)) || location.toLowerCase() === loc.toLowerCase();
                const displayTitle = loc === "all" ? "All Locations (Pune)" : loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      if (onLocationChange) onLocationChange(loc);
                      setOpenDropdown(null);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: isSelected ? "#FFF7ED" : "transparent",
                      color: isSelected ? "#EA580C" : "#1E293B",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    className={styles.dropdownOption}
                  >
                    <span>{displayTitle}</span>
                    {isSelected && <Check size={16} color="#EA580C" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* 2. Budget Section */}
        <div
          className={`${styles.filterSection} ${openDropdown === "budget" ? styles.filterSectionActive : ""}`}
          tabIndex={0}
          role="button"
          onClick={() => setOpenDropdown(openDropdown === "budget" ? null : "budget")}
          aria-label={`Budget: ${getBudgetLabel()}`}
          style={{ position: "relative" }}
        >
          <div className={styles.filterInfo}>
            <span className={styles.filterLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <IndianRupee size={12} color="#EA580C" />
              BUDGET
            </span>
            <span className={styles.filterValue}>{getBudgetLabel()}</span>
          </div>
          <ChevronDown
            size={18}
            className={styles.chevronIcon}
            style={{
              transform: openDropdown === "budget" ? "rotate(180deg)" : "none",
              color: openDropdown === "budget" ? "#EA580C" : undefined,
            }}
          />

          {/* Budget Dropdown Modal */}
          {openDropdown === "budget" && (
            <div
              className={styles.dropdownMenu}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                left: "0",
                marginTop: "12px",
                width: "280px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
                border: "1px solid #E2E8F0",
                zIndex: 100,
                padding: "8px",
              }}
            >
              <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>
                Select Price Budget
              </div>
              {BUDGET_OPTIONS.map((opt) => {
                const isSelected = budget === opt.id || (!budget && opt.id === "all");
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onBudgetChange) onBudgetChange(opt.id);
                      setOpenDropdown(null);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: isSelected ? "#FFF7ED" : "transparent",
                      color: isSelected ? "#EA580C" : "#1E293B",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    className={styles.dropdownOption}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: isSelected ? "700" : "600" }}>{opt.label}</span>
                      <span style={{ fontSize: "11px", color: isSelected ? "#F97316" : "#64748B" }}>{opt.sub}</span>
                    </div>
                    {isSelected && <Check size={16} color="#EA580C" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* 3. Room Type Section */}
        <div
          className={`${styles.filterSection} ${openDropdown === "roomType" ? styles.filterSectionActive : ""}`}
          tabIndex={0}
          role="button"
          onClick={() => setOpenDropdown(openDropdown === "roomType" ? null : "roomType")}
          aria-label={`Room Type: ${getRoomTypeLabel()}`}
          style={{ position: "relative" }}
        >
          <div className={styles.filterInfo}>
            <span className={styles.filterLabel} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={12} color="#EA580C" />
              ROOM TYPE
            </span>
            <span className={styles.filterValue}>{getRoomTypeLabel()}</span>
          </div>
          <ChevronDown
            size={18}
            className={styles.chevronIcon}
            style={{
              transform: openDropdown === "roomType" ? "rotate(180deg)" : "none",
              color: openDropdown === "roomType" ? "#EA580C" : undefined,
            }}
          />

          {/* Room Type Dropdown Modal */}
          {openDropdown === "roomType" && (
            <div
              className={styles.dropdownMenu}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                marginTop: "12px",
                width: "280px",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
                border: "1px solid #E2E8F0",
                zIndex: 100,
                padding: "8px",
              }}
            >
              <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>
                Select Room Type / Sharing
              </div>
              {ROOM_TYPE_OPTIONS.map((opt) => {
                const isSelected = roomType === opt.id || (!roomType && opt.id === "all");
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (onRoomTypeChange) onRoomTypeChange(opt.id);
                      setOpenDropdown(null);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: isSelected ? "#FFF7ED" : "transparent",
                      color: isSelected ? "#EA580C" : "#1E293B",
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    className={styles.dropdownOption}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: isSelected ? "700" : "600" }}>{opt.label}</span>
                      <span style={{ fontSize: "11px", color: isSelected ? "#F97316" : "#64748B" }}>{opt.sub}</span>
                    </div>
                    {isSelected && <Check size={16} color="#EA580C" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Reset + Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {isFiltered && onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Reset Filters"
            style={{
              background: "#F1F5F9",
              border: "1px solid #CBD5E1",
              borderRadius: "9999px",
              padding: "12px 16px",
              fontSize: "0.88rem",
              fontWeight: "700",
              color: "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        )}

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
    </div>
  );
};

export default RoomSearchFilter;

