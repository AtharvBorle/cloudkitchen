"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Check } from "lucide-react";
import Link from "next/link";

import { isKitchenMatchingDiet, isNonVegDish } from "@/lib/dietary-filter";

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
  foodType?: string;
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

const CUISINE_KEYWORDS: Record<string, string[]> = {
  biryani: ["biryani", "mughlai", "indian", "rice", "curry", "kebab", "tandoor", "tikka", "hyderabadi", "dum", "pulao"],
  homemeals: ["mess", "homemeal", "thali", "maharashtrian", "roti", "chapati", "dal", "sabzi", "sabji", "lunch", "dinner", "tiffin", "bhaat", "pithla", "poli", "khichdi"],
  italian: ["italian", "pizza", "pasta", "garlic bread", "lasagna", "calzone", "crust", "cheese", "margherita", "parmesan", "oregano"],
  healthy: ["healthy", "salad", "salads", "organic", "bowl", "smoothie", "fruit", "diet", "sprouts", "oats", "greens", "juice", "avocado", "keto", "vegetable", "vegetables", "veggie", "veggies", "boiled", "steamed", "whole wheat", "wrap", "grilled paneer", "quinoa", "protein", "superfood", "nutritious"],
  bakery: ["bakery", "cake", "dessert", "pastry", "brownie", "bread", "sweet", "croissant", "ice cream", "mousse", "cupcake", "donut", "cookies", "biscuit", "pie"],
  fastfood: ["burger", "snack", "fast food", "fries", "sandwich", "wrap", "roll", "shawarma", "nuggets", "hot dog", "pao", "chaat", "samosa", "frankie"],
  chinese: ["chinese", "noodle", "wok", "manchurian", "fried rice", "momos", "asian", "chilli", "schezwan", "hakka", "spring roll", "chowmein"],
  "south-indian": ["south", "dosa", "idli", "vada", "uttapam", "sambar", "chutney", "appam", "medu vada", "mysore"],
};

function kitchenMatchesCuisine(
  kitchen: PlaceCardData,
  cuisineId: string,
  foodItems: Array<any> = []
): boolean {
  const keywords = CUISINE_KEYWORDS[cuisineId] || [cuisineId];
  const kText = `${kitchen.name || ""} ${kitchen.category || ""}`.toLowerCase();

  // 1. Direct kitchen category / name keyword match
  if (keywords.some((kw) => kText.includes(kw))) {
    return true;
  }

  // 2. Kitchen child dishes keyword match
  const dishes = foodItems.filter((f) => {
    const matchId = kitchen.id && f.sellerId && String(f.sellerId).toLowerCase() === String(kitchen.id).toLowerCase();
    const matchTracking = kitchen.trackingId && f.sellerTrackingId && String(f.sellerTrackingId).toLowerCase() === String(kitchen.trackingId).toLowerCase();
    const matchKitchenId = kitchen.kitchenId && (
      (f.sellerId && String(f.sellerId).toLowerCase() === String(kitchen.kitchenId).toLowerCase()) ||
      (f.sellerTrackingId && String(f.sellerTrackingId).toLowerCase() === String(kitchen.kitchenId).toLowerCase())
    );
    const matchCrossId =
      (kitchen.id && f.sellerTrackingId && String(f.sellerTrackingId).toLowerCase() === String(kitchen.id).toLowerCase()) ||
      (kitchen.trackingId && f.sellerId && String(f.sellerId).toLowerCase() === String(kitchen.trackingId).toLowerCase());
    const matchName = kitchen.name && f.sellerName && kitchen.name.toLowerCase().trim() === f.sellerName.toLowerCase().trim();
    return matchId || matchTracking || matchKitchenId || matchCrossId || matchName;
  });

  return dishes.some((dish) => {
    const dText = `${dish.name || ""} ${dish.categoryName || ""} ${dish.description || ""}`.toLowerCase();
    return keywords.some((kw) => dText.includes(kw));
  });
}

function getKitchenDishes(kitchen: PlaceCardData, foodItems: Array<any> = []): Array<any> {
  const kId = (kitchen.id || "").toLowerCase().trim();
  const kTracking = (kitchen.trackingId || "").toLowerCase().trim();
  const kKitchenId = (kitchen.kitchenId || "").toLowerCase().trim();
  const kName = (kitchen.name || "").toLowerCase().trim();

  return foodItems.filter((f) => {
    const fSellerId = (f.sellerId || "").toLowerCase().trim();
    const fTracking = (f.sellerTrackingId || "").toLowerCase().trim();
    const fSellerName = (f.sellerName || "").toLowerCase().trim();

    const matchId = kId && fSellerId && (fSellerId === kId || fTracking === kId);
    const matchTracking = kTracking && (fTracking === kTracking || fSellerId === kTracking);
    const matchKitchenId = kKitchenId && (fSellerId === kKitchenId || fTracking === kKitchenId);
    const matchName = kName && fSellerName && (
      kName === fSellerName ||
      kName.includes(fSellerName) ||
      fSellerName.includes(kName)
    );

    return matchId || matchTracking || matchKitchenId || matchName;
  });
}

function isKitchenMatchingPrice(
  kitchen: PlaceCardData,
  pricePreset: string,
  maxPrice: number,
  foodItems: Array<any> = []
): boolean {
  if (pricePreset === "all" && maxPrice >= 2500) {
    return true;
  }

  const dishes = getKitchenDishes(kitchen, foodItems);
  const prices = dishes.map((d) => Number(d.price) || 0).filter((pr) => pr > 0);

  if (prices.length === 0) {
    if (kitchen.price && kitchen.price > 0) {
      prices.push(kitchen.price);
    } else {
      return false;
    }
  }

  if (pricePreset === "under-150") {
    return prices.some((p) => p <= 150);
  } else if (pricePreset === "under-300") {
    return prices.some((p) => p <= 300);
  } else if (pricePreset === "150-300") {
    return prices.some((p) => p >= 150 && p <= 300);
  } else if (pricePreset === "150-400") {
    return prices.some((p) => p >= 150 && p <= 400);
  } else if (pricePreset === "300-plus") {
    return prices.some((p) => p >= 300);
  } else if (pricePreset === "400-plus") {
    return prices.some((p) => p >= 400);
  } else if (maxPrice < 2500) {
    return prices.some((p) => p <= maxPrice);
  }

  return true;
}

function isPlacePureVeg(
  kitchen: PlaceCardData,
  foodItems: Array<any> = []
): boolean {
  const rawFoodType = String(kitchen.foodType || "").toUpperCase().replace(/[\s-]/g, "_").trim();
  if (
    rawFoodType === "PURE_VEG" ||
    rawFoodType === "VEG" ||
    rawFoodType === "VEG_ONLY" ||
    rawFoodType === "PUREVEG"
  ) {
    return true;
  }
  const kText = `${kitchen.name || ""} ${kitchen.category || ""}`.toLowerCase();
  if (kText.includes("pure veg") || kText.includes("pure-veg") || kText.includes("100% veg") || kText.includes("pureveg")) {
    const hasNonVegKeywords = /\b(chicken|mutton|fish|meat|biryani|egg|eggs|non[\s-_]?veg|kebab|shawarma|seafood|prawns?)\b/i.test(kText);
    if (!hasNonVegKeywords) return true;
  }
  if (rawFoodType === "BOTH" || rawFoodType === "NON_VEG" || rawFoodType === "VEG_NON_VEG" || rawFoodType === "VEG_AND_NON_VEG") {
    return false;
  }
  const dishes = getKitchenDishes(kitchen, foodItems);
  if (dishes.length > 0) {
    const hasNonVegDish = dishes.some((d) => isNonVegDish(d));
    return !hasNonVegDish;
  }
  return false;
}

function isPlaceVegAndNonVeg(
  kitchen: PlaceCardData,
  foodItems: Array<any> = []
): boolean {
  if (isPlacePureVeg(kitchen, foodItems)) return false;
  const rawFoodType = String(kitchen.foodType || "").toUpperCase().replace(/[\s-]/g, "_").trim();
  if (
    rawFoodType === "BOTH" ||
    rawFoodType === "VEG_NON_VEG" ||
    rawFoodType === "VEG_AND_NON_VEG"
  ) {
    return true;
  }
  const dishes = getKitchenDishes(kitchen, foodItems);
  if (dishes.length > 0) {
    const hasVeg = dishes.some((d) => !isNonVegDish(d));
    const hasNonVeg = dishes.some((d) => isNonVegDish(d));
    if (hasVeg && hasNonVeg) return true;
  }
  return rawFoodType !== "NON_VEG";
}

const DIETARY = [
  { id: "pure_veg", label: "Pure Veg 🥦" },
  { id: "non-veg", label: "Non-Veg 🍗" },
  { id: "vegan", label: "Vegan (Plant-Based 🌱)" },
  { id: "jain", label: "Jain / Satvik 🌿" },
];

interface PropertiesProps {
  places?: PlaceCardData[];
  foodItems?: Array<{
    id: string;
    name: string;
    price?: number;
    categoryName?: string;
    description?: string;
    sellerId?: string;
    sellerTrackingId?: string;
    itemType?: string;
  }>;
  allKitchens?: PlaceCardData[];
  isLoading?: boolean;
}

export default function Properties({ places, foodItems = [], allKitchens = [], isLoading = false }: PropertiesProps) {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [activePricePreset, setActivePricePreset] = useState<string>("all");

  const basePlaces = (places && places.length > 0) ? places : (allKitchens && allKitchens.length > 0 ? allKitchens : []);

  // Compute dynamic cuisine counts from available places & dishes
  const dynamicCuisines = React.useMemo(() => {
    return CUISINES.map((c) => {
      const matchCount = basePlaces.filter((p) =>
        kitchenMatchesCuisine(p, c.id, foodItems)
      ).length;
      return {
        ...c,
        count: matchCount,
      };
    });
  }, [basePlaces, foodItems]);

  // Compute dynamic dietary counts
  const dynamicDietary = React.useMemo(() => {
    return DIETARY.map((d) => {
      const matchCount = basePlaces.filter((p) =>
        isKitchenMatchingDiet(
          { foodType: p.foodType, category: p.category, name: p.name, id: p.id, trackingId: p.trackingId },
          d.id,
          foodItems
        )
      ).length;
      return {
        ...d,
        count: matchCount,
      };
    });
  }, [basePlaces, foodItems]);

  // Dynamically filter places
  const filteredPlaces = React.useMemo(() => {
    let list = basePlaces;

    if (selectedCuisines.length > 0) {
      list = list.filter((p) =>
        selectedCuisines.some((cId) => kitchenMatchesCuisine(p, cId, foodItems))
      );
    }

    if (selectedDietary.length > 0) {
      list = list.filter((p) =>
        selectedDietary.some((diet) =>
          isKitchenMatchingDiet(
            { foodType: p.foodType, category: p.category, name: p.name, id: p.id, trackingId: p.trackingId },
            diet,
            foodItems
          )
        )
      );
    }

    // Filter by price range (0 to 1000+ and presets)
    list = list.filter((p) =>
      isKitchenMatchingPrice(p, activePricePreset, maxPrice, foodItems)
    );

    return list;
  }, [basePlaces, selectedCuisines, selectedDietary, maxPrice, activePricePreset, foodItems]);

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
    setMaxPrice(2500);
    setActivePricePreset("all");
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("cloudkitchen_price_filter");
        window.dispatchEvent(
          new CustomEvent("cloudkitchen_price_filter_changed", { detail: null })
        );
      } catch {}
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (activePricePreset !== "all" || maxPrice < 2500) {
        let min: number | undefined;
        let max: number | undefined;
        if (activePricePreset === "under-150") {
          max = 150;
        } else if (activePricePreset === "150-300") {
          min = 150;
          max = 300;
        } else if (activePricePreset === "150-400") {
          min = 150;
          max = 400;
        } else if (activePricePreset === "300-plus") {
          min = 300;
        } else if (activePricePreset === "400-plus") {
          min = 400;
        } else if (maxPrice < 2500) {
          max = maxPrice;
        }

        const filterPayload = {
          preset: activePricePreset,
          minPrice: min,
          maxPrice: max,
        };
        localStorage.setItem("cloudkitchen_price_filter", JSON.stringify(filterPayload));
        window.dispatchEvent(
          new CustomEvent("cloudkitchen_price_filter_changed", { detail: filterPayload })
        );
      } else {
        localStorage.removeItem("cloudkitchen_price_filter");
        window.dispatchEvent(
          new CustomEvent("cloudkitchen_price_filter_changed", { detail: null })
        );
      }
    } catch {}
  }, [activePricePreset, maxPrice]);

  const getKitchenHref = (place: PlaceCardData) => {
    const base = place.trackingId ? `/shop/${place.trackingId}` : `/restaurant/${place.kitchenId || "7-12-kitchen"}`;
    const params = new URLSearchParams();

    const isPure = isPlacePureVeg(place, foodItems);
    const isPureVegActive = selectedDietary.includes("pure_veg") || selectedDietary.includes("pure-veg") || selectedDietary.includes("veg");

    if (isPure || isPureVegActive) {
      params.set("vegOnly", "true");
    }
    if (activePricePreset && activePricePreset !== "all") {
      params.set("price", activePricePreset);
      if (activePricePreset === "under-150") {
        params.set("maxPrice", "150");
      } else if (activePricePreset === "150-300") {
        params.set("minPrice", "150");
        params.set("maxPrice", "300");
      } else if (activePricePreset === "150-400") {
        params.set("minPrice", "150");
        params.set("maxPrice", "400");
      } else if (activePricePreset === "300-plus") {
        params.set("minPrice", "300");
      } else if (activePricePreset === "400-plus") {
        params.set("minPrice", "400");
      }
    } else if (maxPrice < 2500) {
      params.set("maxPrice", String(maxPrice));
      params.set("price", "custom");
    }

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <section
      id="places-section"
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
                  : activePricePreset === "150-300"
                  ? "₹150 – ₹300"
                  : activePricePreset === "150-400"
                  ? "₹150 – ₹400"
                  : activePricePreset === "300-plus"
                  ? "₹300+"
                  : activePricePreset === "400-plus"
                  ? "₹400+"
                  : maxPrice >= 2500
                  ? "₹0 – ₹2500+"
                  : `Up to ₹${maxPrice}`}
              </span>
            </div>

            {/* Range Slider */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <input
                type="range"
                min="0"
                max="2500"
                step="25"
                value={activePricePreset !== "all" && activePricePreset !== "custom" ? (activePricePreset === "under-150" ? 150 : activePricePreset === "150-300" ? 300 : activePricePreset === "150-400" ? 400 : 2500) : maxPrice}
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
                <span>₹1250</span>
                <span>₹2500+</span>
              </div>
            </div>

            {/* Quick Preset Figure Chips */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { id: "all", label: "Any Price" },
                { id: "under-150", label: "Under ₹150" },
                { id: "150-300", label: "₹150 – ₹300" },
                { id: "300-plus", label: "₹300+" },
              ].map((tier) => {
                const isSelected = activePricePreset === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setActivePricePreset("all");
                        setMaxPrice(2500);
                      } else {
                        setActivePricePreset(tier.id);
                        if (tier.id === "under-150") setMaxPrice(150);
                        else if (tier.id === "150-300") setMaxPrice(300);
                        else if (tier.id === "150-400") setMaxPrice(400);
                        else if (tier.id === "300-plus") setMaxPrice(2500);
                        else if (tier.id === "400-plus") setMaxPrice(2500);
                        else setMaxPrice(2500);
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "#FF6B00",
                  backgroundColor: "#FFF3EB",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  border: "1px solid #FFD8C2",
                }}
              >
                {isLoading ? "Loading..." : `${displayPlaces.length} ${displayPlaces.length === 1 ? "Kitchen" : "Kitchens"}`}
              </span>
            </div>
          </div>

          {/* PlacesGrid: 4 columns grid with 24px gap, ~250px hug cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: (isLoading || displayPlaces.length > 0) ? "repeat(4, minmax(0, 1fr))" : "1fr",
              gap: "24px",
              width: "100%",
              boxSizing: "border-box",
            }}
            className="places-grid-layout PlacesGrid"
          >
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={`kitchen-skeleton-${idx}`}
                  style={{
                    width: "100%",
                    height: "250px",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid #F1F5F9",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                  }}
                  className="place-card-skeleton"
                >
                  <div
                    className="skeleton-pulse"
                    style={{
                      width: "100%",
                      height: "155px",
                    }}
                  />
                  <div
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      flex: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div className="skeleton-pulse" style={{ width: "70%", height: "18px", borderRadius: "6px", marginBottom: "6px" }} />
                      <div className="skeleton-pulse" style={{ width: "45%", height: "13px", borderRadius: "4px" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="skeleton-pulse" style={{ width: "52px", height: "18px", borderRadius: "10px" }} />
                      <div className="skeleton-pulse" style={{ width: "56px", height: "18px", borderRadius: "10px" }} />
                    </div>
                  </div>
                </div>
              ))
            ) : displayPlaces.length === 0 ? (
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
                  href={getKitchenHref(place)}
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
                        backgroundColor: isClosed ? "#E2E8F0" : (place.rating > 0 ? "#E8FBF2" : "#F1F5F9"),
                        color: isClosed ? "#64748B" : (place.rating > 0 ? "#10B981" : "#64748B"),
                        border: isClosed ? "1px solid #CBD5E1" : (place.rating > 0 ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #E2E8F0"),
                        padding: "2px 7px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      }}
                    >
                      <Star size={12} fill={isClosed ? "#64748B" : (place.rating > 0 ? "#10B981" : "#94A3B8")} color={isClosed ? "#64748B" : (place.rating > 0 ? "#10B981" : "#94A3B8")} />
                      <span>{place.rating > 0 ? place.rating.toFixed(1) : "New"}</span>
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
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite ease-in-out;
        }
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
            min-height: auto !important;
          }
          .Properties2 {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
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
            min-height: auto !important;
          }
          .Properties2 {
            min-height: auto !important;
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
