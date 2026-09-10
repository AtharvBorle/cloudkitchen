"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Zap,
  Star,
  Tag,
  ChevronDown,
  X,
  SlidersHorizontal,
  Check,
  UtensilsCrossed,
  Leaf,
} from "lucide-react";

export interface ActiveHomeFilters {
  fastest?: boolean;
  minRating?: number | null;
  offersOnly?: boolean;
  dietary?: "all" | "veg" | "non_veg";
  priceTier?: "all" | "under-150" | "150-300" | "300-plus" | null;
  cuisines?: string[];
}

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterRowProps {
  activeFilters?: ActiveHomeFilters;
  onFilterChange?: (filters: ActiveHomeFilters) => void;
  // Legacy / custom filter list support
  filters?: FilterOption[];
  activeFilterId?: string;
  onLegacyFilterClick?: (filterId: string) => void;
  availableCuisines?: string[];
}

const DEFAULT_CUISINES = [
  "Italian",
  "Indian / Mughlai",
  "Bakery",
  "Healthy / Bowls",
  "Burgers & Fast Food",
  "Biryani",
  "Desserts",
  "South Indian",
  "Chinese",
];

export default function FilterRow({
  activeFilters = {},
  onFilterChange,
  availableCuisines = DEFAULT_CUISINES,
}: FilterRowProps) {
  const [internalFilters, setInternalFilters] = useState<ActiveHomeFilters>(activeFilters);
  const [openPopover, setOpenPopover] = useState<"dietary" | "price" | "cuisines" | null>(null);

  const dietaryRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const cuisinesRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop changes
  useEffect(() => {
    setInternalFilters(activeFilters);
  }, [activeFilters]);

  // Click outside listener to close popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        openPopover === "dietary" &&
        dietaryRef.current &&
        !dietaryRef.current.contains(target)
      ) {
        setOpenPopover(null);
      }
      if (
        openPopover === "price" &&
        priceRef.current &&
        !priceRef.current.contains(target)
      ) {
        setOpenPopover(null);
      }
      if (
        openPopover === "cuisines" &&
        cuisinesRef.current &&
        !cuisinesRef.current.contains(target)
      ) {
        setOpenPopover(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPopover]);

  const updateFilters = (updated: Partial<ActiveHomeFilters>) => {
    const newFilters = { ...internalFilters, ...updated };
    setInternalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleToggleFastest = () => {
    updateFilters({ fastest: !internalFilters.fastest });
  };

  const handleToggleRating = () => {
    updateFilters({
      minRating: internalFilters.minRating === 4.5 ? null : 4.5,
    });
  };

  const handleToggleOffers = () => {
    updateFilters({ offersOnly: !internalFilters.offersOnly });
  };

  const handleSelectDietary = (dietary: "all" | "veg" | "non_veg") => {
    updateFilters({ dietary });
    setOpenPopover(null);
  };

  const handleSelectPrice = (tier: "all" | "under-150" | "150-300" | "300-plus") => {
    updateFilters({ priceTier: tier === "all" ? null : tier });
    setOpenPopover(null);
  };

  const handleToggleCuisine = (cuisineName: string) => {
    const current = internalFilters.cuisines || [];
    const updated = current.includes(cuisineName)
      ? current.filter((c) => c !== cuisineName)
      : [...current, cuisineName];
    updateFilters({ cuisines: updated });
  };

  const handleClearAll = () => {
    const cleared: ActiveHomeFilters = {
      fastest: false,
      minRating: null,
      offersOnly: false,
      dietary: "all",
      priceTier: null,
      cuisines: [],
    };
    setInternalFilters(cleared);
    if (onFilterChange) {
      onFilterChange(cleared);
    }
    setOpenPopover(null);
  };

  // Count how many filters are active
  const activeCount =
    (internalFilters.fastest ? 1 : 0) +
    (internalFilters.minRating ? 1 : 0) +
    (internalFilters.offersOnly ? 1 : 0) +
    (internalFilters.dietary && internalFilters.dietary !== "all" ? 1 : 0) +
    (internalFilters.priceTier ? 1 : 0) +
    (internalFilters.cuisines && internalFilters.cuisines.length > 0 ? 1 : 0);

  const isDietaryActive = internalFilters.dietary && internalFilters.dietary !== "all";
  const isPriceActive = Boolean(internalFilters.priceTier && internalFilters.priceTier !== "all");
  const isCuisinesActive = Boolean(internalFilters.cuisines && internalFilters.cuisines.length > 0);

  const displayCuisinesList =
    availableCuisines && availableCuisines.length > 0
      ? availableCuisines
      : DEFAULT_CUISINES;

  return (
    <section
      style={{
        width: "100%",
        padding: "0",
        background: "transparent",
      }}
      className="filter-row-section"
    >
      <div
        style={{
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "10px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingBottom: "4px",
          boxSizing: "border-box",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        }}
        className="hide-scrollbar"
      >
        {/* Reset / All Filters Count Badge */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "38px",
              padding: "0 14px",
              borderRadius: "18px",
              border: "1.5px solid #FF6B00",
              backgroundColor: "#FFF3EB",
              color: "#FF6B00",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: "pointer",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            className="filter-clear-pill"
          >
            <SlidersHorizontal size={14} />
            <span>Clear ({activeCount})</span>
            <X size={14} />
          </button>
        )}

        {/* 1. Fastest Delivery Filter (<30 min) */}
        <button
          type="button"
          onClick={handleToggleFastest}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "38px",
            padding: "0 16px",
            borderRadius: "18px",
            border: internalFilters.fastest
              ? "1.5px solid #FF6B00"
              : "1px solid #E2E8F0",
            backgroundColor: internalFilters.fastest ? "#FF6B00" : "#FFFFFF",
            color: internalFilters.fastest ? "#FFFFFF" : "#334155",
            fontSize: "0.88rem",
            fontWeight: internalFilters.fastest ? "700" : "500",
            cursor: "pointer",
            gap: "6px",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
            boxShadow: internalFilters.fastest
              ? "0 3px 10px rgba(255, 107, 0, 0.25)"
              : "0 1px 3px rgba(0, 0, 0, 0.02)",
            flexShrink: 0,
          }}
          className="filter-pill-btn"
        >
          <Zap
            size={14}
            color={internalFilters.fastest ? "#FFFFFF" : "#FF6B00"}
            fill={internalFilters.fastest ? "#FFFFFF" : "#FF6B00"}
          />
          <span>Fastest Delivery</span>
        </button>

        {/* 2. Rating 4.5+ Filter */}
        <button
          type="button"
          onClick={handleToggleRating}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "38px",
            padding: "0 16px",
            borderRadius: "18px",
            border: internalFilters.minRating === 4.5
              ? "1.5px solid #FF6B00"
              : "1px solid #E2E8F0",
            backgroundColor: internalFilters.minRating === 4.5 ? "#FF6B00" : "#FFFFFF",
            color: internalFilters.minRating === 4.5 ? "#FFFFFF" : "#334155",
            fontSize: "0.88rem",
            fontWeight: internalFilters.minRating === 4.5 ? "700" : "500",
            cursor: "pointer",
            gap: "6px",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
            boxShadow: internalFilters.minRating === 4.5
              ? "0 3px 10px rgba(255, 107, 0, 0.25)"
              : "0 1px 3px rgba(0, 0, 0, 0.02)",
            flexShrink: 0,
          }}
          className="filter-pill-btn"
        >
          <Star
            size={14}
            color={internalFilters.minRating === 4.5 ? "#FFFFFF" : "#F59E0B"}
            fill={internalFilters.minRating === 4.5 ? "#FFFFFF" : "#F59E0B"}
          />
          <span>Rating 4.5+</span>
        </button>

        {/* 3. Special Offers Filter */}
        <button
          type="button"
          onClick={handleToggleOffers}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "38px",
            padding: "0 16px",
            borderRadius: "18px",
            border: internalFilters.offersOnly
              ? "1.5px solid #FF6B00"
              : "1px solid #E2E8F0",
            backgroundColor: internalFilters.offersOnly ? "#FF6B00" : "#FFFFFF",
            color: internalFilters.offersOnly ? "#FFFFFF" : "#334155",
            fontSize: "0.88rem",
            fontWeight: internalFilters.offersOnly ? "700" : "500",
            cursor: "pointer",
            gap: "6px",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
            boxShadow: internalFilters.offersOnly
              ? "0 3px 10px rgba(255, 107, 0, 0.25)"
              : "0 1px 3px rgba(0, 0, 0, 0.02)",
            flexShrink: 0,
          }}
          className="filter-pill-btn"
        >
          <Tag size={14} color={internalFilters.offersOnly ? "#FFFFFF" : "#FF6B00"} />
          <span>Offers &amp; Deals</span>
        </button>

        {/* 4. Dietary Preference Popover (Pure Veg / Non-Veg / All) */}
        <div ref={dietaryRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === "dietary" ? null : "dietary")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "38px",
              padding: "0 16px",
              borderRadius: "18px",
              border: isDietaryActive ? "1.5px solid #10B981" : "1px solid #E2E8F0",
              backgroundColor: isDietaryActive ? "#ECFDF5" : "#FFFFFF",
              color: isDietaryActive ? "#047857" : "#334155",
              fontSize: "0.88rem",
              fontWeight: isDietaryActive ? "700" : "500",
              cursor: "pointer",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            className="filter-pill-btn"
          >
            <Leaf size={14} color={isDietaryActive ? "#047857" : "#10B981"} />
            <span>
              {internalFilters.dietary === "veg"
                ? "Pure Veg 🥦"
                : internalFilters.dietary === "non_veg"
                ? "Non-Veg 🍗"
                : "Dietary"}
            </span>
            <ChevronDown size={13} color={isDietaryActive ? "#047857" : "#94A3B8"} />
          </button>

          {openPopover === "dietary" && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "8px",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                border: "1px solid #E2E8F0",
                zIndex: 50,
                minWidth: "160px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {[
                { id: "all", label: "All Items" },
                { id: "veg", label: "Pure Veg 🥦" },
                { id: "non_veg", label: "Non-Veg 🍗" },
              ].map((opt) => {
                const isSelected = (internalFilters.dietary || "all") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDietary(opt.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: isSelected ? "#ECFDF5" : "transparent",
                      color: isSelected ? "#047857" : "#334155",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} color="#047857" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Price Range Popover */}
        <div ref={priceRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === "price" ? null : "price")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "38px",
              padding: "0 16px",
              borderRadius: "18px",
              border: isPriceActive ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
              backgroundColor: isPriceActive ? "#FFF3EB" : "#FFFFFF",
              color: isPriceActive ? "#FF6B00" : "#334155",
              fontSize: "0.88rem",
              fontWeight: isPriceActive ? "700" : "500",
              cursor: "pointer",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            className="filter-pill-btn"
          >
            <span>
              {internalFilters.priceTier === "under-150"
                ? "Under ₹150"
                : internalFilters.priceTier === "150-300"
                ? "₹150 – ₹300"
                : internalFilters.priceTier === "300-plus"
                ? "₹300+"
                : "Price Range"}
            </span>
            <ChevronDown size={13} color={isPriceActive ? "#FF6B00" : "#94A3B8"} />
          </button>

          {openPopover === "price" && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "8px",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                border: "1px solid #E2E8F0",
                zIndex: 50,
                minWidth: "170px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {[
                { id: "all", label: "Any Price" },
                { id: "under-150", label: "Under ₹150 (Budget)" },
                { id: "150-300", label: "₹150 – ₹300 (Standard)" },
                { id: "300-plus", label: "₹300+ (Premium)" },
              ].map((opt) => {
                const isSelected =
                  (internalFilters.priceTier || "all") === opt.id ||
                  (!internalFilters.priceTier && opt.id === "all");
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPrice(opt.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: isSelected ? "#FFF3EB" : "transparent",
                      color: isSelected ? "#FF6B00" : "#334155",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} color="#FF6B00" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Dynamic Cuisines Popover */}
        <div ref={cuisinesRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === "cuisines" ? null : "cuisines")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "38px",
              padding: "0 16px",
              borderRadius: "18px",
              border: isCuisinesActive ? "1.5px solid #FF6B00" : "1px solid #E2E8F0",
              backgroundColor: isCuisinesActive ? "#FFF3EB" : "#FFFFFF",
              color: isCuisinesActive ? "#FF6B00" : "#334155",
              fontSize: "0.88rem",
              fontWeight: isCuisinesActive ? "700" : "500",
              cursor: "pointer",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            className="filter-pill-btn"
          >
            <UtensilsCrossed size={14} color={isCuisinesActive ? "#FF6B00" : "#64748B"} />
            <span>
              {isCuisinesActive
                ? `Cuisines (${internalFilters.cuisines?.length})`
                : "Cuisines"}
            </span>
            <ChevronDown size={13} color={isCuisinesActive ? "#FF6B00" : "#94A3B8"} />
          </button>

          {openPopover === "cuisines" && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "10px",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                border: "1px solid #E2E8F0",
                zIndex: 50,
                minWidth: "220px",
                maxHeight: "260px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "11.5px",
                  fontWeight: "700",
                  color: "#94A3B8",
                  padding: "4px 8px",
                  textTransform: "uppercase",
                }}
              >
                Select Cuisines
              </div>
              {displayCuisinesList.map((c) => {
                const isSelected = (internalFilters.cuisines || []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleToggleCuisine(c)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isSelected ? "#FFF3EB" : "transparent",
                      color: isSelected ? "#FF6B00" : "#334155",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{c}</span>
                    {isSelected && <Check size={14} color="#FF6B00" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .filter-pill-btn:not(:active):hover {
          border-color: #CBD5E1;
          background-color: #F8FAFC;
        }
        .filter-clear-pill:hover {
          background-color: #FFE6D6;
        }
      `}</style>
    </section>
  );
}

