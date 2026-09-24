"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ArrowRight,
  MapPin,
  IndianRupee,
  Users,
  Check,
  X,
  RotateCcw,
  Navigation,
  Map as MapIcon,
  Search,
  Loader2,
} from "lucide-react";
import { HouseMapPicker } from "@/components/house-map-picker";
import { getPincodeCoordinates } from "@/lib/geo-distance";
import styles from "./RoomSearchFilter.module.css";

export interface LocationStatItem {
  name: string;
  count?: number;
  label?: string;
}

export interface RoomSearchFilterProps {
  location?: string;
  budget?: string;
  roomType?: string;
  availableLocations?: Array<string | LocationStatItem>;
  onLocationChange?: (location: string, coords?: { lat: number; lng: number } | null) => void;
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
  const [searchLocationInput, setSearchLocationInput] = useState("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5204,
    lng: 73.8567,
  });
  const [pickedAddressDetails, setPickedAddressDetails] = useState<{
    street?: string;
    landmark?: string;
    pincode?: string;
    houseNumber?: string;
  } | null>(null);

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

  // Dynamic non-static locations derived strictly from actual live room listings
  const normalizedLocations: LocationStatItem[] = React.useMemo(() => {
    const seen = new Set<string>();
    const list: LocationStatItem[] = [];
    availableLocations.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        const key = item.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ name: item, label: item });
        }
      } else if (item.name) {
        const key = item.name.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push(item);
        }
      }
    });
    return list;
  }, [availableLocations]);

  const filteredDynamicLocations = normalizedLocations.filter((item) =>
    item.name.toLowerCase().includes(searchLocationInput.toLowerCase().trim()) ||
    (item.label && item.label.toLowerCase().includes(searchLocationInput.toLowerCase().trim()))
  );

  // 1. Handle selection of custom typed area or pincode
  const handleSelectCustomLocation = (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    const pinMatch = clean.match(/\b\d{6}\b/);
    let resolvedCoords: { lat: number; lng: number } | null = null;
    if (pinMatch) {
      const pinCoords = getPincodeCoordinates(pinMatch[0]);
      if (pinCoords) {
        resolvedCoords = { lat: pinCoords.lat, lng: pinCoords.lng };
      }
    }
    if (onLocationChange) {
      onLocationChange(clean, resolvedCoords);
    }
    setOpenDropdown(null);
    setSearchLocationInput("");
  };

  // 2. Handle GPS Current Location Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const suburb =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.city_district ||
              addr.road ||
              "Current Location";
            const city = addr.city || addr.town || addr.state_district || "Pune";
            const pincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

            const formatted = suburb
              ? `${suburb}, ${city}`
              : pincode
              ? `PIN: ${pincode}`
              : "Current Location";

            if (onLocationChange) {
              onLocationChange(formatted, { lat, lng });
            }
          } else if (onLocationChange) {
            onLocationChange("Current Location", { lat, lng });
          }
        } catch (e) {
          console.error("GPS Reverse Geocoding Error:", e);
          if (onLocationChange) {
            onLocationChange("Current Location", { lat, lng });
          }
        } finally {
          setIsDetectingGps(false);
          setOpenDropdown(null);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        console.warn("GPS Permission error:", err);
        alert("Unable to access GPS location. Please choose from map or search by name.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 3. Handle applying location picked from OpenStreetMap Leaflet modal
  const handleApplyMapLocation = () => {
    let formatted = "Selected Location";
    if (pickedAddressDetails) {
      const { street, landmark, pincode } = pickedAddressDetails;
      if (street || landmark) {
        formatted = `${street || landmark}${pincode ? ` (${pincode})` : ""}`;
      } else if (pincode) {
        formatted = `PIN: ${pincode}`;
      }
    } else {
      formatted = `Map Location (${mapCoords.lat.toFixed(3)}, ${mapCoords.lng.toFixed(3)})`;
    }

    if (onLocationChange) {
      onLocationChange(formatted, mapCoords);
    }
    setIsMapModalOpen(false);
    setOpenDropdown(null);
  };

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

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {location && location !== "all" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onLocationChange) onLocationChange("all", null);
                  setSearchLocationInput("");
                }}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "50%",
                  width: "22px",
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: 0,
                  transition: "all 0.2s ease",
                }}
                title="Clear location (reset to all)"
                aria-label="Clear location"
              >
                <X size={13} />
              </button>
            )}

            <ChevronDown
              size={18}
              className={styles.chevronIcon}
              style={{
                transform: openDropdown === "location" ? "rotate(180deg)" : "none",
                color: openDropdown === "location" ? "#EA580C" : undefined,
              }}
            />
          </div>

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
                width: "320px",
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.16)",
                border: "1px solid #E2E8F0",
                zIndex: 100,
                padding: "10px",
                maxHeight: "380px",
                overflowY: "auto",
              }}
            >
              <div style={{ padding: "6px 10px 4px 10px", fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>
                Select Location
              </div>

              {/* Active Selection Banner with Clear Action */}
              {location && location !== "all" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    marginBottom: "6px",
                    backgroundColor: "#FFF7ED",
                    borderRadius: "8px",
                    border: "1px solid #FFEDD5",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                    <MapPin size={13} color="#EA580C" style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#EA580C",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={location}
                    >
                      {location}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onLocationChange) onLocationChange("all", null);
                      setSearchLocationInput("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EA580C",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      padding: "2px 4px",
                      flexShrink: 0,
                    }}
                  >
                    <X size={12} />
                    <span>Clear</span>
                  </button>
                </div>
              )}

              {/* 1. All Locations Option */}
              <button
                type="button"
                onClick={() => {
                  if (onLocationChange) onLocationChange("all", null);
                  setOpenDropdown(null);
                  setSearchLocationInput("");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  background: (!location || location === "all") ? "#FFF7ED" : "transparent",
                  color: (!location || location === "all") ? "#EA580C" : "#1E293B",
                  fontWeight: (!location || location === "all") ? "700" : "600",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={15} color={(!location || location === "all") ? "#EA580C" : "#64748B"} />
                  <span>All Locations (Pune)</span>
                </div>
                {(!location || location === "all") && <Check size={16} color="#EA580C" strokeWidth={2.5} />}
              </button>

              {/* 2. Pick on Map & GPS Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "6px 0", padding: "6px 0", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsMapModalOpen(true);
                    setOpenDropdown(null);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#FFF8F0",
                    color: "#C63A22",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <MapIcon size={15} color="#C63A22" />
                  <span>Select Location on Map</span>
                </button>

                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingGps}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#F8FAFC",
                    color: "#0F172A",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {isDetectingGps ? (
                    <Loader2 size={15} className="animate-spin" color="#EA580C" />
                  ) : (
                    <Navigation size={15} color="#EA580C" />
                  )}
                  <span>{isDetectingGps ? "Detecting GPS..." : "Use Current GPS Location"}</span>
                </button>
              </div>

              {/* 3. Live Search Input with Erase / Clear Button */}
              <div style={{ padding: "4px 2px 8px 2px", position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "13px", color: "#94A3B8" }} />
                <input
                  type="text"
                  value={searchLocationInput}
                  onChange={(e) => setSearchLocationInput(e.target.value)}
                  placeholder="Search area, city or pincode..."
                  style={{
                    width: "100%",
                    padding: "7px 28px 7px 30px",
                    fontSize: "12.5px",
                    borderRadius: "8px",
                    border: "1.5px solid #E2E8F0",
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#F8FAFC",
                    color: "#0F172A",
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchLocationInput.trim()) {
                      e.preventDefault();
                      handleSelectCustomLocation(searchLocationInput.trim());
                    }
                  }}
                />
                {searchLocationInput && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchLocationInput("");
                    }}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      color: "#94A3B8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Clear search text"
                    aria-label="Clear search text"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* 4. Filtered Dynamic Listing Areas */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {filteredDynamicLocations.map((item) => {
                  const isSelected =
                    location &&
                    (location.toLowerCase() === item.name.toLowerCase() ||
                      location.toLowerCase() === item.label?.toLowerCase());
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        handleSelectCustomLocation(item.name);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        background: isSelected ? "#FFF7ED" : "transparent",
                        color: isSelected ? "#EA580C" : "#1E293B",
                        fontWeight: isSelected ? "700" : "500",
                        fontSize: "13px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={13} color={isSelected ? "#EA580C" : "#94A3B8"} />
                        <span>{item.label || item.name}</span>
                      </div>
                      {isSelected && <Check size={15} color="#EA580C" strokeWidth={2.5} />}
                    </button>
                  );
                })}

                {/* Custom Search Option if user typed arbitrary text */}
                {searchLocationInput.trim() &&
                  !normalizedLocations.some(
                    (d) =>
                      d.name.toLowerCase() === searchLocationInput.toLowerCase().trim() ||
                      (d.label && d.label.toLowerCase() === searchLocationInput.toLowerCase().trim())
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleSelectCustomLocation(searchLocationInput.trim())}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px dashed #CBD5E1",
                        background: "#F8FAFC",
                        color: "#EA580C",
                        fontWeight: "600",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        textAlign: "left",
                        marginTop: "4px",
                      }}
                    >
                      <Search size={13} />
                      <span>Search &quot;{searchLocationInput.trim()}&quot;</span>
                    </button>
                  )}
              </div>
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

      {/* 5. OpenStreetMap Interactive Location Picker Modal */}
      {isMapModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIsMapModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              maxWidth: "600px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "#FFF7ED",
                    color: "#EA580C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0F172A" }}>
                    Select Location on Map
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B" }}>
                    Drag the pin or click on the map to find nearby rooms & stays
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  color: "#94A3B8",
                  borderRadius: "8px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Leaflet OpenStreetMap Container */}
            <div style={{ height: "320px", width: "100%", position: "relative" }}>
              <HouseMapPicker
                latitude={mapCoords.lat}
                longitude={mapCoords.lng}
                onChange={(lat, lng, details) => {
                  setMapCoords({ lat, lng });
                  if (details) {
                    setPickedAddressDetails(details);
                  }
                }}
              />
            </div>

            {/* Address Preview & Action Footer */}
            <div
              style={{
                padding: "16px 24px",
                backgroundColor: "#F8FAFC",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <MapPin size={16} color="#EA580C" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1E293B" }}>
                  {pickedAddressDetails
                    ? `${pickedAddressDetails.street ? pickedAddressDetails.street + ", " : ""}${
                        pickedAddressDetails.landmark ? `Near ${pickedAddressDetails.landmark}, ` : ""
                      }${pickedAddressDetails.pincode ? `PIN: ${pickedAddressDetails.pincode}` : "Selected Area"}`
                    : `Lat: ${mapCoords.lat.toFixed(4)}, Lng: ${mapCoords.lng.toFixed(4)}`}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyMapLocation}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#EA580C",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
                  }}
                >
                  Apply Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomSearchFilter;
