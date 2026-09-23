"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, Check } from "lucide-react";
import Link from "next/link";

export interface PlaceCardData {
  id: string;
  name: string;
  rating: number;
  time: string;
  imageUrl: string;
  category: string;
  kitchenId?: string;
  trackingId?: string;
  locality?: string;
  price?: number;
  isOnline?: boolean;
}

const CUISINES = [
  { id: "biryani", label: "Biryani & Mughlai" },
  { id: "homemeals", label: "Homely Meals / Thali" },
  { id: "italian", label: "Pizzas & Italian" },
  { id: "healthy", label: "Healthy Bowls & Salads" },
  { id: "bakery", label: "Bakery & Desserts" },
  { id: "fastfood", label: "Burgers & Fast Food" },
  { id: "chinese", label: "Chinese & Asian" },
  { id: "south-indian", label: "South Indian" },
];

const DIETARY = [
  { id: "veg", label: "Pure Veg 🥦" },
  { id: "non-veg", label: "Non-Veg 🍗" },
  { id: "vegan", label: "Vegan (Plant-Based 🌱)" },
  { id: "jain", label: "Jain / Satvik 🌿" },
];

interface PropertiesProps {
  places?: PlaceCardData[];
}

export default function Properties({ places }: PropertiesProps) {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [activePricePreset, setActivePricePreset] = useState<string>("all");

  const basePlaces = places || [];

  // Compute dynamic cuisine counts from available places
  const dynamicCuisines = React.useMemo(() => {
    return CUISINES.map((c) => {
      const matchCount = basePlaces.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        if (c.id === "biryani") return cat.includes("biryani") || cat.includes("mughlai") || cat.includes("indian") || name.includes("biryani");
        if (c.id === "homemeals") return cat.includes("mess") || cat.includes("homemeal") || cat.includes("thali") || cat.includes("maharashtrian");
        if (c.id === "italian") return cat.includes("italian") || cat.includes("pizza") || name.includes("pizza");
        if (c.id === "healthy") return cat.includes("healthy") || cat.includes("salad") || cat.includes("organic") || cat.includes("bowl");
        if (c.id === "bakery") return cat.includes("bakery") || cat.includes("cake") || cat.includes("dessert");
        if (c.id === "fastfood") return cat.includes("burger") || cat.includes("snack") || cat.includes("fast food");
        if (c.id === "chinese") return cat.includes("chinese") || cat.includes("noodle") || cat.includes("wok");
        if (c.id === "south-indian") return cat.includes("south") || cat.includes("dosa");
        return cat.includes(c.id);
      }).length;
      return {
        ...c,
        count: matchCount,
      };
    });
  }, [basePlaces]);

  // Compute dynamic dietary counts
  const dynamicDietary = React.useMemo(() => {
    return DIETARY.map((d) => {
      const matchCount = basePlaces.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        if (d.id === "veg") return cat.includes("veg") && !cat.includes("non-veg");
        if (d.id === "non-veg") return cat.includes("non-veg") || cat.includes("biryani") || cat.includes("mughlai");
        if (d.id === "vegan") return cat.includes("vegan") || cat.includes("organic");
        if (d.id === "jain") return cat.includes("satvik") || cat.includes("jain") || cat.includes("pure veg");
        return true;
      }).length;
      return {
        ...d,
        count: matchCount,
      };
    });
  }, [basePlaces]);

  // Dynamically filter places
  const filteredPlaces = React.useMemo(() => {
    let list = basePlaces;

    if (selectedCuisines.length > 0) {
      list = list.filter((p) => {
        const cat = p.category.toLowerCase();
        const name = p.name.toLowerCase();
        return selectedCuisines.some((c) => {
          if (c === "biryani") return cat.includes("biryani") || cat.includes("mughlai") || cat.includes("indian") || name.includes("biryani");
          if (c === "homemeals") return cat.includes("mess") || cat.includes("homemeal") || cat.includes("thali") || cat.includes("maharashtrian");
          if (c === "italian") return cat.includes("italian") || cat.includes("pizza") || name.includes("pizza");
          if (c === "healthy") return cat.includes("healthy") || cat.includes("salad") || cat.includes("organic") || cat.includes("bowl");
          if (c === "bakery") return cat.includes("bakery") || cat.includes("cake") || cat.includes("dessert");
          if (c === "fastfood") return cat.includes("burger") || cat.includes("snack") || cat.includes("fast food");
          if (c === "chinese") return cat.includes("chinese") || cat.includes("noodle") || cat.includes("wok");
          if (c === "south-indian") return cat.includes("south") || cat.includes("dosa");
          return cat.includes(c);
        });
      });
    }

    if (selectedDietary.length > 0) {
      if (selectedDietary.includes("veg")) {
        list = list.filter((p) =>
          p.category.toLowerCase().includes("veg") &&
          !p.category.toLowerCase().includes("non-veg")
        );
      }
      if (selectedDietary.includes("non-veg")) {
        list = list.filter((p) =>
          p.category.toLowerCase().includes("non-veg") ||
          p.category.toLowerCase().includes("biryani")
        );
      }
      if (selectedDietary.includes("vegan")) {
        list = list.filter((p) =>
          p.category.toLowerCase().includes("vegan") ||
          p.category.toLowerCase().includes("healthy")
        );
      }
      if (selectedDietary.includes("jain")) {
        list = list.filter((p) =>
          p.category.toLowerCase().includes("satvik") ||
          p.category.toLowerCase().includes("jain") ||
          p.category.toLowerCase().includes("pure veg")
        );
      }
    }

    // Filter by price range (0 to 1000+)
    if (activePricePreset === "under-150") {
      list = list.filter((p) => (p.price || 199) <= 150);
    } else if (activePricePreset === "150-400") {
      list = list.filter((p) => (p.price || 199) >= 150 && (p.price || 199) <= 400);
    } else if (activePricePreset === "400-plus") {
      list = list.filter((p) => (p.price || 199) >= 400);
    } else if (maxPrice < 1000) {
      list = list.filter((p) => (p.price || 199) <= maxPrice);
    }

    return list;
  }, [basePlaces, selectedCuisines, selectedDietary, maxPrice, activePricePreset]);

  const displayPlaces = filteredPlaces;

  const toggleCuisine = (id: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter((item) => item !== id);
      } else {
        if (id === "non-veg" || id === "Non-Veg") {
          return [id];
        } else {
          const withoutNonVeg = prev.filter((item) => item !== "non-veg" && item !== "Non-Veg");
          return [...withoutNonVeg, id];
        }
      }
    });
  };

  const handleClearAll = () => {
    setSelectedCuisines([]);
    setSelectedDietary([]);
    setMaxPrice(1000);
    setActivePricePreset("all");
  };

  return (
    <section
      style={{
        width: "100%",
        background: "transparent",
        padding: "0",
      }}
      className="properties-wrapper"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1283px",
          minHeight: "843px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "40px",
          boxSizing: "border-box",
        }}
        className="properties-container Properties"
      >
        {/* ================= 1. sidebarFilters (Adaptive Height, No Overflow) ================= */}
        <aside
          style={{
            width: "270px",
            minWidth: "270px",
            height: "auto",
            minHeight: "fit-content",
            borderRadius: "20px",
            border: "1px solid #E2E8F0",
            padding: "24px 20px",
            backgroundColor: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            boxSizing: "border-box",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
          className="sidebar-filters sidebarFilters"
        >
          {/* Header Row: Filters Title + Clear All button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Filters
            </h3>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                color: "#FF6B00",
                fontSize: "14px",
                fontWeight: "600",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#E65F00";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#FF6B00";
              }}
            >
              Clear All
            </button>
          </div>

          {/* Section 1: Cuisines */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Cuisines
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {dynamicCuisines.map((item) => {
                const isChecked = selectedCuisines.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCuisine(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {/* Custom Checkbox */}
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "5px",
                          border: isChecked
                            ? "1.5px solid #FF6B00"
                            : "1.5px solid #94A3B8",
                          backgroundColor: isChecked ? "#FF6B00" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                          boxSizing: "border-box",
                        }}
                      >
                        {isChecked && (
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          color: isChecked ? "#0F172A" : "#475569",
                          fontWeight: isChecked ? "500" : "400",
                          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#94A3B8",
                        fontWeight: "400",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dietary Preferences */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Dietary Preferences
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {dynamicDietary.map((item) => {
                const isChecked = selectedDietary.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleDietary(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "5px",
                          border: isChecked
                            ? "1.5px solid #FF6B00"
                            : "1.5px solid #94A3B8",
                          backgroundColor: isChecked ? "#FF6B00" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                          boxSizing: "border-box",
                        }}
                      >
                        {isChecked && (
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          color: isChecked ? "#0F172A" : "#475569",
                          fontWeight: isChecked ? "500" : "400",
                          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#94A3B8",
                        fontWeight: "400",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Price Range (Interactive Slider & Preset Figures) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#0F172A",
                  margin: 0,
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
              >
                Price Range
              </h4>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "#FF6B00",
                  backgroundColor: "#FFF3EB",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                {activePricePreset === "under-150"
                  ? "Under ₹150"
                  : activePricePreset === "150-400"
                  ? "₹150 – ₹400"
                  : activePricePreset === "400-plus"
                  ? "₹400+"
                  : maxPrice >= 1000
                  ? "₹0 – ₹1000+"
                  : `Up to ₹${maxPrice}`}
              </span>
            </div>

            {/* Range Slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={activePricePreset !== "all" && activePricePreset !== "custom" ? (activePricePreset === "under-150" ? 150 : activePricePreset === "150-400" ? 400 : 1000) : maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setActivePricePreset("custom");
                }}
                style={{
                  width: "100%",
                  accentColor: "#FF6B00",
                  cursor: "pointer",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#94A3B8", fontWeight: "600" }}>
                <span>₹0</span>
                <span>₹500</span>
                <span>₹1000+</span>
              </div>
            </div>

            {/* Quick Preset Figure Chips */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { id: "all", label: "Any Price" },
                { id: "under-150", label: "Under ₹150" },
                { id: "150-400", label: "₹150 – ₹400" },
                { id: "400-plus", label: "₹400+" },
              ].map((tier) => {
                const isSelected = activePricePreset === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setActivePricePreset("all");
                        setMaxPrice(1000);
                      } else {
                        setActivePricePreset(tier.id);
                        if (tier.id === "under-150") setMaxPrice(150);
                        else if (tier.id === "150-400") setMaxPrice(400);
                        else if (tier.id === "400-plus") setMaxPrice(1000);
                        else setMaxPrice(1000);
                      }
                    }}
                    style={{
                      height: "32px",
                      borderRadius: "8px",
                      border: isSelected
                        ? "1.5px solid #FF6B00"
                        : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#FFF3EB" : "#FFFFFF",
                      color: isSelected ? "#FF6B00" : "#334155",
                      fontWeight: isSelected ? "700" : "500",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ================= 2. Properties2 (Right Column: 983px x 843px) ================= */}
        <div
          style={{
            width: "983px",
            flex: "1 1 983px",
            minHeight: "843px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxSizing: "border-box",
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
          }}
          className="properties2-column Properties2"
        >
          {/* Header Title: Best Places Nearby */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.3px",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              Best Places Nearby
            </h2>
          </div>

          {/* PlacesGrid: 4 columns grid with 24px gap, ~250px hug cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: displayPlaces.length > 0 ? "repeat(4, minmax(0, 1fr))" : "1fr",
              gap: "24px",
              width: "100%",
              boxSizing: "border-box",
            }}
            className="places-grid-layout PlacesGrid"
          >
            {displayPlaces.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1px dashed #CBD5E1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#FFF4E6",
                    color: "#FF6B00",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                  }}
                >
                  🍽️
                </div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1E293B" }}>
                  No Kitchens Found
                </h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748B", maxWidth: "380px" }}>
                  No cloud kitchens match your selected criteria or location. Try clearing filters or changing your delivery address.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    marginTop: "8px",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    backgroundColor: "#FF6B00",
                    color: "#FFFFFF",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              displayPlaces.map((place) => {
                const isClosed = place.isOnline === false;
                return (
                <Link
                  href={place.trackingId ? `/shop/${place.trackingId}` : `/restaurant/${place.kitchenId || "7-12-kitchen"}`}
                  key={place.id}
                  style={{
                    width: "100%",
                    height: "250px",
                    backgroundColor: isClosed ? "#F8FAFC" : "#FFFFFF",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: isClosed ? "1px solid #E2E8F0" : "1px solid #F1F5F9",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    textDecoration: "none",
                    color: "inherit",
                    boxSizing: "border-box",
                    opacity: isClosed ? 0.85 : 1,
                  }}
                  className="place-card"
                >
                  {/* Card Food Image */}
                  <div
                    style={{
                      width: "100%",
                      height: "155px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <Image
                    src={place.imageUrl || "/images/places/place-pizza.png"}
                    alt={place.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 250px"
                    style={{
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                      filter: isClosed ? "grayscale(100%)" : "none",
                    }}
                    className="place-card-img"
                  />
                  {isClosed && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#0F172A",
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: "800",
                          letterSpacing: "0.8px",
                          padding: "5px 12px",
                          borderRadius: "14px",
                          textTransform: "uppercase",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        🔴 CLOSED
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content Footer */}
                <div
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flex: 1,
                    boxSizing: "border-box",
                    backgroundColor: isClosed ? "#F1F5F9" : "#FFFFFF",
                  }}
                >
                  {/* Restaurant Name */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        color: isClosed ? "#475569" : "#0F172A",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      {place.name}
                    </h3>
                    {isClosed && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: "#64748B",
                          backgroundColor: "#E2E8F0",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        OFFLINE
                      </span>
                    )}
                  </div>

                  {/* Rating & Delivery Time Meta Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Star Rating Badge */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: isClosed ? "#E2E8F0" : "#E8FBF2",
                        color: isClosed ? "#64748B" : "#10B981",
                        border: isClosed ? "1px solid #CBD5E1" : "1px solid rgba(16, 185, 129, 0.2)",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      <Star size={12} fill={isClosed ? "#64748B" : "#10B981"} color={isClosed ? "#64748B" : "#10B981"} />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>

                    {/* Delivery Time / Closed Text */}
                    <span
                      style={{
                        fontSize: "12px",
                        color: isClosed ? "#94A3B8" : "#64748B",
                        fontWeight: "500",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      {isClosed ? "Not accepting orders" : place.time}
                    </span>
                  </div>
                </div>
              </Link>
              );
            })
          )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .place-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08) !important;
        }
        .place-card:hover .place-card-img {
          transform: scale(1.05);
        }
        @media (max-width: 1200px) {
          .properties-container {
            flex-direction: column !important;
            align-items: center !important;
            height: auto !important;
          }
          .Properties2 {
            width: 100% !important;
            height: auto !important;
          }
          .PlacesGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 1024px) {
          .sidebarFilters,
          .sidebar-filters {
            display: none !important;
          }
          .properties-container {
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .PlacesGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 480px) {
          .PlacesGrid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </section>
  );
}
