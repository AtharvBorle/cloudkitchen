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
  dietary?: "all" | "veg" | "non_veg" | "vegan" | "jain";
  priceTier?: "all" | "under-150" | "150-300" | "300-plus" | null;
  cuisines?: string[];
}

export interface FilterCounts {
  all?: number;
  veg?: number;
  non_veg?: number;
  vegan?: number;
  jain?: number;
  under150?: number;
  price150to300?: number;
  price300plus?: number;
  cuisineCounts?: Record<string, number>;
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
  counts?: FilterCounts;
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
  counts,
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

  const handleSelectDietary = (dietary: "all" | "veg" | "non_veg" | "vegan" | "jain") => {
    updateFilters({ dietary });
    setOpenPopover(null);
  };

  const handleSelectPrice = (tier: "all" | "under-150" | "150-300" | "300-plus") => {
    updateFilters({ priceTier: tier === "all" ? null : tier });
    setOpenPopover(null);
    if (typeof window !== "undefined") {
      try {
        if (tier && tier !== "all") {
          let min: number | undefined;
          let max: number | undefined;
          if (tier === "under-150") max = 150;
          else if (tier === "150-300") { min = 150; max = 300; }
          else if (tier === "300-plus") min = 300;

          const payload = { preset: tier, minPrice: min, maxPrice: max };
          localStorage.setItem("cloudkitchen_price_filter", JSON.stringify(payload));
          window.dispatchEvent(new CustomEvent("cloudkitchen_price_filter_changed", { detail: payload }));
        } else {
          localStorage.removeItem("cloudkitchen_price_filter");
          window.dispatchEvent(new CustomEvent("cloudkitchen_price_filter_changed", { detail: null }));
        }
      } catch {}
    }
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
  const isNonVeg = internalFilters.dietary === "non_veg";
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
        position: "relative",
        zIndex: 50,
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
          overflow: "visible",
          flexWrap: "wrap",
          paddingBottom: "4px",
          boxSizing: "border-box",
          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          position: "relative",
          zIndex: 55,
        }}
        className="filter-row-container"
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
              transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              flexShrink: 0,
            }}
            className="filter-clear-pill"
          >
            <span className="filter-pill-icon" style={{ display: "inline-flex", alignItems: "center" }}>
              <SlidersHorizontal size={14} />
            </span>
            <span>Clear ({activeCount})</span>
            <span className="filter-clear-x" style={{ display: "inline-flex", alignItems: "center" }}>
              <X size={14} />
            </span>
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
            transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: internalFilters.fastest
              ? "0 3px 10px rgba(255, 107, 0, 0.25)"
              : "0 1px 3px rgba(0, 0, 0, 0.02)",
            flexShrink: 0,
          }}
          className={`filter-pill-btn ${internalFilters.fastest ? "is-active" : ""}`}
        >
          <span className="filter-pill-icon" style={{ display: "inline-flex", alignItems: "center" }}>
            <Zap
              size={14}
              color={internalFilters.fastest ? "#FFFFFF" : "#FF6B00"}
              fill={internalFilters.fastest ? "#FFFFFF" : "#FF6B00"}
            />
          </span>
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
            transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: internalFilters.minRating === 4.5
              ? "0 3px 10px rgba(255, 107, 0, 0.25)"
              : "0 1px 3px rgba(0, 0, 0, 0.02)",
            flexShrink: 0,
          }}
          className={`filter-pill-btn ${internalFilters.minRating === 4.5 ? "is-active" : ""}`}
        >
          <span className="filter-pill-icon" style={{ display: "inline-flex", alignItems: "center" }}>
            <Star
              size={14}
              color={internalFilters.minRating === 4.5 ? "#FFFFFF" : "#F59E0B"}
              fill={internalFilters.minRating === 4.5 ? "#FFFFFF" : "#F59E0B"}
            />
          </span>
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
            transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: internalFilters.offersOnly
              ? "0 3px 10px rgba(255, 107, 0, 0.25)"
              : "0 1px 3px rgba(0, 0, 0, 0.02)",
            flexShrink: 0,
          }}
          className={`filter-pill-btn ${internalFilters.offersOnly ? "is-active" : ""}`}
        >
          <span className="filter-pill-icon" style={{ display: "inline-flex", alignItems: "center" }}>
            <Tag size={14} color={internalFilters.offersOnly ? "#FFFFFF" : "#FF6B00"} />
          </span>
          <span>Offers &amp; Deals</span>
        </button>

        {/* 4. Dietary Preference Popover (Pure Veg / Non-Veg / All) */}
        <div ref={dietaryRef} style={{ position: "relative", flexShrink: 0, zIndex: openPopover === "dietary" ? 100 : 1 }}>
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
              border: isNonVeg
                ? "1.5px solid #EF4444"
                : isDietaryActive
                ? "1.5px solid #10B981"
                : "1px solid #E2E8F0",
              backgroundColor: isNonVeg
                ? "#FEF2F2"
                : isDietaryActive
                ? "#ECFDF5"
                : "#FFFFFF",
              color: isNonVeg
                ? "#DC2626"
                : isDietaryActive
                ? "#047857"
                : "#334155",
              fontSize: "0.88rem",
              fontWeight: isDietaryActive ? "700" : "500",
              cursor: "pointer",
              gap: "6px",
              whiteSpace: "nowrap",
              transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className={`filter-pill-btn ${isDietaryActive ? (isNonVeg ? "is-active is-nonveg" : "is-active is-dietary") : ""} ${openPopover === "dietary" ? "is-open" : ""}`}
          >
            <span className="filter-pill-icon" style={{ display: "inline-flex", alignItems: "center" }}>
              {isNonVeg ? (
                <UtensilsCrossed size={14} color="#DC2626" />
              ) : (
                <Leaf size={14} color={isDietaryActive ? "#047857" : "#10B981"} />
              )}
            </span>
            <span>
              {internalFilters.dietary === "veg"
                ? "Pure Veg 🥦"
                : internalFilters.dietary === "non_veg"
                ? "Non-Veg 🍗"
                : internalFilters.dietary === "vegan"
                ? "Vegan 🌱"
                : internalFilters.dietary === "jain"
                ? "Jain 🌿"
                : "Dietary"}
            </span>
            <span className={`filter-chevron ${openPopover === "dietary" ? "is-open" : ""}`} style={{ display: "inline-flex", alignItems: "center" }}>
              <ChevronDown
                size={13}
                color={
                  isNonVeg
                    ? "#DC2626"
                    : isDietaryActive
                    ? "#047857"
                    : "#94A3B8"
                }
              />
            </span>
          </button>

          {openPopover === "dietary" && (
            <div
              className="filter-popover-menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "8px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)",
                border: "1px solid #E2E8F0",
                zIndex: 9999,
                minWidth: "185px",
                maxWidth: "calc(100vw - 32px)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {[
                { id: "all", label: "All Items", count: counts?.all },
                { id: "veg", label: "Pure Veg 🥦", count: counts?.veg },
                { id: "non_veg", label: "Non-Veg 🍗", count: counts?.non_veg },
                { id: "vegan", label: "Vegan 🌱", count: counts?.vegan },
                { id: "jain", label: "Jain 🌿", count: counts?.jain },
              ].map((opt) => {
                const isSelected = (internalFilters.dietary || "all") === opt.id;
                const isItemNonVeg = opt.id === "non_veg";
                const activeBg = isItemNonVeg ? "#FEF2F2" : "#ECFDF5";
                const activeColor = isItemNonVeg ? "#DC2626" : "#047857";

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDietary(opt.id as any)}
                    className={`filter-popover-item ${isItemNonVeg ? "item-nonveg" : ""} ${isSelected ? "is-selected" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: isSelected ? activeBg : "transparent",
                      color: isSelected ? activeColor : "#334155",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "13.5px",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: "8px",
                    }}
                  >
                    <span>{opt.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {opt.count !== undefined && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: isSelected ? activeColor : "#94A3B8",
                          }}
                        >
                          ({opt.count})
                        </span>
                      )}
                      {isSelected && <Check size={14} color={activeColor} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Price Range Popover */}
        <div ref={priceRef} style={{ position: "relative", flexShrink: 0, zIndex: openPopover === "price" ? 100 : 1 }}>
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
              transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className={`filter-pill-btn ${isPriceActive ? "is-active" : ""} ${openPopover === "price" ? "is-open" : ""}`}
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
            <span className={`filter-chevron ${openPopover === "price" ? "is-open" : ""}`} style={{ display: "inline-flex", alignItems: "center" }}>
              <ChevronDown size={13} color={isPriceActive ? "#FF6B00" : "#94A3B8"} />
            </span>
          </button>

          {openPopover === "price" && (
            <div
              className="filter-popover-menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "8px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)",
                border: "1px solid #E2E8F0",
                zIndex: 9999,
                minWidth: "180px",
                maxWidth: "calc(100vw - 32px)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {[
                { id: "all", label: "Any Price", count: counts?.all },
                { id: "under-150", label: "Under ₹150", count: counts?.under150 },
                { id: "150-300", label: "₹150 – ₹300", count: counts?.price150to300 },
                { id: "300-plus", label: "₹300+", count: counts?.price300plus },
              ].map((opt) => {
                const isSelected =
                  (internalFilters.priceTier || "all") === opt.id ||
                  (!internalFilters.priceTier && opt.id === "all");
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPrice(opt.id as any)}
                    className={`filter-popover-item ${isSelected ? "is-selected" : ""}`}
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
                      gap: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap" }}>{opt.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      {opt.count !== undefined && (
                        <span style={{ fontSize: "11px", fontWeight: "600", color: isSelected ? "#FF6B00" : "#94A3B8" }}>
                          ({opt.count})
                        </span>
                      )}
                      {isSelected && <Check size={14} color="#FF6B00" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Dynamic Cuisines Popover */}
        <div ref={cuisinesRef} style={{ position: "relative", flexShrink: 0, zIndex: openPopover === "cuisines" ? 100 : 1 }}>
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
              transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className={`filter-pill-btn ${isCuisinesActive ? "is-active" : ""} ${openPopover === "cuisines" ? "is-open" : ""}`}
          >
            <span className="filter-pill-icon" style={{ display: "inline-flex", alignItems: "center" }}>
              <UtensilsCrossed size={14} color={isCuisinesActive ? "#FF6B00" : "#64748B"} />
            </span>
            <span>
              {isCuisinesActive
                ? `Cuisines (${internalFilters.cuisines?.length})`
                : "Cuisines"}
            </span>
            <span className={`filter-chevron ${openPopover === "cuisines" ? "is-open" : ""}`} style={{ display: "inline-flex", alignItems: "center" }}>
              <ChevronDown size={13} color={isCuisinesActive ? "#FF6B00" : "#94A3B8"} />
            </span>
          </button>

          {openPopover === "cuisines" && (
            <div
              className="filter-popover-menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "10px",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)",
                border: "1px solid #E2E8F0",
                zIndex: 9999,
                minWidth: "230px",
                maxWidth: "calc(100vw - 32px)",
                boxSizing: "border-box",
                maxHeight: "280px",
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
                const cCount = counts?.cuisineCounts ? counts.cuisineCounts[c] : undefined;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleToggleCuisine(c)}
                    className={`filter-popover-item ${isSelected ? "is-selected" : ""}`}
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
                      gap: "8px",
                    }}
                  >
                    <span>{c}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {cCount !== undefined && (
                        <span style={{ fontSize: "11px", fontWeight: "600", color: isSelected ? "#FF6B00" : "#94A3B8" }}>
                          ({cCount})
                        </span>
                      )}
                      {isSelected && <Check size={14} color="#FF6B00" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Base Filter Pill */
        .filter-pill-btn {
          position: relative;
          user-select: none;
          will-change: transform, box-shadow;
        }

        /* Inactive Button Hover: Professional warm lift, delicate theme border and ambient glow */
        .filter-pill-btn:not(.is-active):hover {
          transform: translateY(-2.5px);
          border-color: #FFB27D !important;
          background: #FFFDF9 !important;
          color: #0F172A !important;
          box-shadow: 0 6px 16px rgba(255, 107, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.04) !important;
        }

        /* Inactive Button Hover Icon Micro-Pop */
        .filter-pill-btn:not(.is-active):hover .filter-pill-icon {
          transform: scale(1.15) translateY(-0.5px);
        }

        /* Active Button (Orange Theme) Hover: Rich warm deeper orange, elevated glow */
        .filter-pill-btn.is-active:not(.is-dietary):hover {
          transform: translateY(-2.5px);
          background-color: #FA5A00 !important;
          border-color: #E65100 !important;
          box-shadow: 0 7px 20px rgba(255, 107, 0, 0.38), 0 2px 6px rgba(255, 107, 0, 0.2) !important;
        }

        .filter-pill-btn.is-active:not(.is-dietary):hover .filter-pill-icon {
          transform: scale(1.15);
        }

        /* Active Dietary Button (Green Theme) Hover */
        .filter-pill-btn.is-active.is-dietary:hover {
          transform: translateY(-2.5px);
          background-color: #D1FAE5 !important;
          border-color: #059669 !important;
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.22), 0 2px 6px rgba(0, 0, 0, 0.04) !important;
        }

        .filter-pill-btn.is-active.is-dietary:hover .filter-pill-icon {
          transform: scale(1.15) rotate(-6deg);
        }

        /* Active Non-Veg Button (Reddish Theme) Hover */
        .filter-pill-btn.is-active.is-nonveg:hover {
          transform: translateY(-2.5px);
          background-color: #FEE2E2 !important;
          border-color: #DC2626 !important;
          box-shadow: 0 6px 18px rgba(239, 68, 68, 0.25), 0 2px 6px rgba(0, 0, 0, 0.04) !important;
        }

        .filter-pill-btn.is-active.is-nonveg:hover .filter-pill-icon {
          transform: scale(1.15) rotate(-6deg);
        }

        /* Tactile Press State */
        .filter-pill-btn:active {
          transform: translateY(0px) scale(0.97) !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
          transition-duration: 0.08s !important;
        }

        /* Icons & Chevrons Smooth Transitions */
        .filter-pill-icon {
          display: inline-flex;
          align-items: center;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .filter-chevron {
          display: inline-flex;
          align-items: center;
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .filter-pill-btn:not(.is-open):hover .filter-chevron {
          transform: translateY(1.5px);
        }

        .filter-chevron.is-open {
          transform: rotate(180deg);
        }

        /* Clear All Badge Animation */
        .filter-clear-pill {
          position: relative;
          user-select: none;
          will-change: transform, box-shadow;
        }

        .filter-clear-pill:hover {
          transform: translateY(-2.5px);
          background-color: #FF6B00 !important;
          color: #FFFFFF !important;
          border-color: #FF6B00 !important;
          box-shadow: 0 6px 18px rgba(255, 107, 0, 0.32) !important;
        }

        .filter-clear-pill:hover .filter-pill-icon {
          transform: rotate(-15deg) scale(1.12);
        }

        .filter-clear-pill .filter-clear-x {
          display: inline-flex;
          align-items: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .filter-clear-pill:hover .filter-clear-x {
          transform: rotate(90deg) scale(1.15);
        }

        .filter-clear-pill:active {
          transform: translateY(0px) scale(0.97) !important;
          box-shadow: 0 1px 3px rgba(255, 107, 0, 0.15) !important;
          transition-duration: 0.08s !important;
        }

        /* Popover Menu Dropdown Animation */
        .filter-popover-menu {
          animation: filterPopoverSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top left;
        }

        @keyframes filterPopoverSlide {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Popover Item Hover Animation */
        .filter-popover-item {
          transition: all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .filter-popover-item:not(.is-selected):not(.item-nonveg):hover {
          background-color: #FFF3EB !important;
          color: #FF6B00 !important;
          transform: translateX(3px);
          padding-left: 14px !important;
        }

        .filter-popover-item.item-nonveg:not(.is-selected):hover {
          background-color: #FEF2F2 !important;
          color: #DC2626 !important;
          transform: translateX(3px);
          padding-left: 14px !important;
        }

        .filter-popover-item.is-selected:not(.item-nonveg):hover {
          filter: brightness(0.96);
          transform: translateX(2px);
        }

        .filter-popover-item.item-nonveg.is-selected {
          background-color: #FEF2F2 !important;
          color: #DC2626 !important;
        }

        .filter-popover-item.item-nonveg.is-selected:hover {
          background-color: #FEE2E2 !important;
          color: #B91C1C !important;
          transform: translateX(2px);
        }

        @media (max-width: 768px) {
          .filter-row-section {
            padding: 0 16px !important;
            margin: 0 0 14px 0 !important;
          }
          .filter-row-container {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 6px !important;
            width: 100% !important;
          }
          .filter-row-container::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

