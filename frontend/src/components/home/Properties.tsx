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
  return isKitchenMatchingDiet(
    { foodType: kitchen.foodType, category: kitchen.category, name: kitchen.name, id: kitchen.id, trackingId: kitchen.trackingId, locality: kitchen.locality },
    "pure_veg",
    foodItems
  );
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
  selectedDietary?: string[];
  onDietaryChange?: (dietary: string[]) => void;
}

export default function Properties({
  places,
  foodItems = [],
  allKitchens = [],
  isLoading = false,
  selectedDietary: controlledDietary,
  onDietaryChange,
}: PropertiesProps) {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("cloudkitchen_selected_cuisines") || localStorage.getItem("cloudkitchen_selected_cuisines");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [internalSelectedDietary, setInternalSelectedDietary] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cloudkitchen_diet_preference");
        if (saved === "pure_veg" || saved === "pureveg") return ["pure_veg"];
        if (saved === "veg") return ["veg"];
        if (saved === "non-veg" || saved === "non_veg") return ["non-veg"];
        if (saved === "vegan") return ["vegan"];
        if (saved === "jain") return ["jain"];
        if (saved === "all") return [];
      } catch {}
    }
    return ["veg"];
  });
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlMax = params.get("maxPrice");
        const urlPrice = params.get("price");
        if (urlMax) {
          const num = Number(urlMax);
          if (!isNaN(num) && num > 0) return num;
        }
        if (urlPrice) {
          if (urlPrice === "under-150") return 150;
          if (urlPrice === "150-300" || urlPrice === "under-300") return 300;
          if (urlPrice === "150-400") return 400;
        }

        const stored = localStorage.getItem("cloudkitchen_price_filter") || sessionStorage.getItem("cloudkitchen_price_filter");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed) {
            if (typeof parsed.maxPrice === "number" && parsed.maxPrice > 0) {
              return parsed.maxPrice;
            }
            if (parsed.preset === "under-150") return 150;
            if (parsed.preset === "150-300" || parsed.preset === "under-300") return 300;
            if (parsed.preset === "150-400") return 400;
          }
        }
      } catch {}
    }
    return 2500;
  });
  const [activePricePreset, setActivePricePreset] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlPrice = params.get("price");
        const urlMax = params.get("maxPrice");
        if (urlPrice) return urlPrice;
        if (urlMax && Number(urlMax) < 2500) return "custom";

        const stored = localStorage.getItem("cloudkitchen_price_filter") || sessionStorage.getItem("cloudkitchen_price_filter");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed) {
            if (parsed.preset) return parsed.preset;
            if (parsed.maxPrice && Number(parsed.maxPrice) < 2500) return "custom";
          }
        }
      } catch {}
    }
    return "all";
  });

  const selectedDietary = controlledDietary !== undefined ? controlledDietary : internalSelectedDietary;

  // Persist selected cuisines across session and back-navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (selectedCuisines.length > 0) {
        sessionStorage.setItem("cloudkitchen_selected_cuisines", JSON.stringify(selectedCuisines));
        localStorage.setItem("cloudkitchen_selected_cuisines", JSON.stringify(selectedCuisines));
      } else {
        sessionStorage.removeItem("cloudkitchen_selected_cuisines");
        localStorage.removeItem("cloudkitchen_selected_cuisines");
      }
    } catch {}
  }, [selectedCuisines]);

  // Sync external events / localStorage changes
  useEffect(() => {
    const handleDietEvent = (e: any) => {
      const d = e?.detail;
      if (!d) return;
      if (d === "pure_veg" || d === "pureveg") {
        setInternalSelectedDietary(["pure_veg"]);
      } else if (d === "veg") {
        setInternalSelectedDietary([]);
      } else if (d === "non-veg" || d === "non_veg") {
        setInternalSelectedDietary(["non-veg"]);
      } else if (d === "vegan") {
        setInternalSelectedDietary(["vegan"]);
      } else if (d === "jain") {
        setInternalSelectedDietary(["jain"]);
      } else if (d === "all") {
        setInternalSelectedDietary([]);
      }
    };

    const syncPrice = (e?: any) => {
      try {
        if (e?.detail) {
          const payload = e.detail;
          if (payload.maxPrice !== undefined) {
            setMaxPrice(Number(payload.maxPrice));
          }
          if (payload.preset !== undefined) {
            setActivePricePreset(payload.preset);
          }
          return;
        }

        const stored = localStorage.getItem("cloudkitchen_price_filter") || sessionStorage.getItem("cloudkitchen_price_filter");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed) {
            let restoredMax = 2500;
            if (typeof parsed.maxPrice === "number" && parsed.maxPrice > 0) {
              restoredMax = parsed.maxPrice;
            } else if (parsed.preset === "under-150") {
              restoredMax = 150;
            } else if (parsed.preset === "150-300" || parsed.preset === "under-300") {
              restoredMax = 300;
            } else if (parsed.preset === "150-400") {
              restoredMax = 400;
            }
            const restoredPreset = parsed.preset || (restoredMax < 2500 ? "custom" : "all");
            setMaxPrice(restoredMax);
            setActivePricePreset(restoredPreset);
            return;
          }
        }
      } catch {}
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cloudkitchen_diet_preference_changed", handleDietEvent);
      window.addEventListener("cloudkitchen_price_filter_changed", syncPrice);
      window.addEventListener("storage", handleDietEvent);
      window.addEventListener("storage", syncPrice);
      window.addEventListener("popstate", syncPrice);
      return () => {
        window.removeEventListener("cloudkitchen_diet_preference_changed", handleDietEvent);
        window.removeEventListener("cloudkitchen_price_filter_changed", syncPrice);
        window.removeEventListener("storage", handleDietEvent);
        window.removeEventListener("storage", syncPrice);
        window.removeEventListener("popstate", syncPrice);
      };
    }
  }, []);

  const basePlaces = Array.isArray(places) ? places : (allKitchens && allKitchens.length > 0 ? allKitchens : []);
  const allPlacesSource = allKitchens && allKitchens.length > 0 ? allKitchens : basePlaces;

  // Compute dynamic cuisine counts from available places & dishes
  const dynamicCuisines = React.useMemo(() => {
    const cuisinePool = basePlaces.length > 0 ? basePlaces : allPlacesSource;
    return CUISINES.map((c) => {
      const matchCount = cuisinePool.filter((p) =>
        kitchenMatchesCuisine(p, c.id, foodItems)
      ).length;
      return {
        ...c,
        count: matchCount,
      };
    });
  }, [basePlaces, allPlacesSource, foodItems]);

  // Compute dynamic dietary counts from all kitchens (filtered by cuisine/price, not dietary) so counts don't collapse to 0 when toggling a diet
  const dynamicDietary = React.useMemo(() => {
    let countSource = allPlacesSource;
    if (selectedCuisines.length > 0) {
      countSource = countSource.filter((p) =>
        selectedCuisines.some((cId) => kitchenMatchesCuisine(p, cId, foodItems))
      );
    }
    countSource = countSource.filter((p) =>
      isKitchenMatchingPrice(p, activePricePreset, maxPrice, foodItems)
    );

    return DIETARY.map((d) => {
      const matchCount = countSource.filter((p) =>
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
  }, [allPlacesSource, selectedCuisines, activePricePreset, maxPrice, foodItems]);

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
    const isPureVegId = id === "pure_veg" || id === "pure-veg";
    const isNonVegId = id === "non-veg" || id === "non_veg";

    const isCurrentlyChecked = isPureVegId
      ? selectedDietary.includes("pure_veg") || selectedDietary.includes("pure-veg")
      : isNonVegId
      ? selectedDietary.includes("non-veg") || selectedDietary.includes("non_veg")
      : selectedDietary.includes(id);

    const normalizedId = isPureVegId ? "pure_veg" : isNonVegId ? "non-veg" : id;
    const next: string[] = isCurrentlyChecked ? [] : [normalizedId];

    setInternalSelectedDietary(next);
    if (onDietaryChange) {
      onDietaryChange(next);
    } else if (typeof window !== "undefined") {
      try {
        const dietVal =
          next.length === 0
            ? "all"
            : next.includes("pure_veg")
            ? "pure_veg"
            : next.includes("non-veg") || next.includes("non_veg")
            ? "non-veg"
            : next.includes("vegan")
            ? "vegan"
            : next.includes("jain")
            ? "jain"
            : "all";
        localStorage.setItem("cloudkitchen_diet_preference", dietVal);
        const isVeg = dietVal === "pure_veg" || dietVal === "vegan" || dietVal === "jain";
        localStorage.setItem("cloudkitchen_veg_preference", String(isVeg));
        window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: dietVal }));
        window.dispatchEvent(new CustomEvent("cloudkitchen_veg_preference_changed", { detail: isVeg }));
      } catch {}
    }
  };

  const handleClearAll = () => {
    setSelectedCuisines([]);
    setInternalSelectedDietary([]);
    onDietaryChange?.([]);
    setMaxPrice(2500);
    setActivePricePreset("all");
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cloudkitchen_diet_preference", "all");
        localStorage.setItem("cloudkitchen_veg_preference", "false");
        window.dispatchEvent(new CustomEvent("cloudkitchen_diet_preference_changed", { detail: "all" }));
        window.dispatchEvent(new CustomEvent("cloudkitchen_veg_preference_changed", { detail: false }));
        localStorage.removeItem("cloudkitchen_price_filter");
        sessionStorage.removeItem("cloudkitchen_price_filter");
        localStorage.removeItem("cloudkitchen_selected_cuisines");
        sessionStorage.removeItem("cloudkitchen_selected_cuisines");
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
        sessionStorage.setItem("cloudkitchen_price_filter", JSON.stringify(filterPayload));
        window.dispatchEvent(
          new CustomEvent("cloudkitchen_price_filter_changed", { detail: filterPayload })
        );
      } else {
        localStorage.removeItem("cloudkitchen_price_filter");
        sessionStorage.removeItem("cloudkitchen_price_filter");
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
    const isPureVegActive = selectedDietary.includes("pure_veg") || selectedDietary.includes("pure-veg");

    if (selectedDietary.includes("vegan")) {
      params.set("diet", "vegan");
    } else if (selectedDietary.includes("jain")) {
      params.set("diet", "jain");
    } else if (selectedDietary.includes("non-veg") || selectedDietary.includes("non_veg")) {
      params.set("diet", "non-veg");
    } else if (isPure || isPureVegActive) {
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
                const isChecked =
                  item.id === "pure_veg"
                    ? selectedDietary.includes("pure_veg") || selectedDietary.includes("pure-veg")
                    : item.id === "non-veg"
                    ? selectedDietary.includes("non-veg") || selectedDietary.includes("non_veg")
                    : selectedDietary.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleDietary(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
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
                  const val = Number(e.target.value);
                  setMaxPrice(val);
                  setActivePricePreset(val >= 2500 ? "all" : "custom");
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
          {/* Header Row */}
          <div className="best-places-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2
                className="best-places-title"
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
                className="best-places-count-badge"
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
                  className="place-card-skeleton"
                >
                  <div className="skeleton-pulse place-card-skeleton-image" />
                  <div className="place-card-content">
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
                  <div
                    key={place.id}
                    className={`place-card ${isClosed ? "is-closed" : ""}`}
                  >
                    <Link
                      href={getKitchenHref(place)}
                      className="place-card-link"
                    >
                      {/* Card Food Image */}
                      <div className="place-card-image-box">
                        <Image
                          src={place.imageUrl || "/images/places/place-pizza.png"}
                          alt={place.name}
                          fill
                          sizes="(max-width: 768px) 140px, 250px"
                          style={{
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                            filter: isClosed ? "grayscale(100%)" : "none",
                          }}
                          className="place-card-img"
                        />
                        <div className="place-card-mobile-overlay" />
                        {isClosed && (
                          <div className="place-card-closed-pill">
                            <span className="place-card-closed-text">
                              🔴 CLOSED
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Content Footer */}
                      <div className="place-card-content">
                        {/* Restaurant Name */}
                        <div className="place-card-header-line">
                          <h3 className="place-card-title">
                            {place.name}
                          </h3>
                          {isClosed && (
                            <span className="place-card-offline-tag">
                              OFFLINE
                            </span>
                          )}
                        </div>

                        {/* Rating & Delivery Time Meta Row */}
                        <div className="place-card-meta-line">
                          {/* Star Rating Badge */}
                          <div className="place-card-rating-badge">
                            <Star size={12} className="place-star-icon" fill={isClosed ? "#64748B" : (place.rating > 0 ? "#10B981" : "#94A3B8")} color={isClosed ? "#64748B" : (place.rating > 0 ? "#10B981" : "#94A3B8")} />
                            <span className="place-rating-text-desktop">{place.rating > 0 ? place.rating.toFixed(1) : "New"}</span>
                            <span className="place-rating-text-mobile">{Number(place.rating || 0).toFixed(1)}</span>
                          </div>

                          {/* Delivery Time / Closed Text */}
                          <span className="place-card-time">
                            {isClosed ? "Not accepting orders" : place.time}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
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
        .place-card {
          width: 100%;
          height: 250px;
          background-color: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #F1F5F9;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          box-sizing: border-box;
        }
        .place-card.is-closed {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          opacity: 0.85;
        }
        .place-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08) !important;
        }
        .place-card:hover .place-card-img {
          transform: scale(1.05);
        }
        .place-card-link {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          position: relative;
          overflow: hidden;
          border-radius: inherit;
        }
        .place-card-skeleton {
          width: 100%;
          height: 250px;
          background-color: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #F1F5F9;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          position: relative;
        }
        .place-card-image-box {
          width: 100%;
          height: 155px;
          position: relative;
          overflow: hidden;
          background-color: #F8FAFC;
        }
        .place-card-skeleton-image {
          width: 100%;
          height: 155px;
        }
        .place-card-mobile-overlay {
          display: none;
        }
        .place-rating-text-mobile {
          display: none;
        }
        .place-rating-text-desktop {
          display: inline;
        }
        .place-card-closed-pill {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .place-card-closed-text {
          background-color: #0F172A;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          padding: 5px 12px;
          border-radius: 14px;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .place-card-content {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          box-sizing: border-box;
          background-color: #FFFFFF;
        }
        .place-card.is-closed .place-card-content {
          background-color: #F1F5F9;
        }
        .place-card-header-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .place-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: var(--font-poppins), 'Poppins', sans-serif;
        }
        .place-card.is-closed .place-card-title {
          color: #475569;
        }
        .place-card-offline-tag {
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          background-color: #E2E8F0;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .place-card-meta-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .place-card-rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #E8FBF2;
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 700;
          font-family: var(--font-poppins), 'Poppins', sans-serif;
        }
        .place-star-icon {
          color: #10B981;
        }
        .place-card-time {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
          font-family: var(--font-poppins), 'Poppins', sans-serif;
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
          .properties-wrapper {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .properties-container,
          .Properties {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .properties2-column,
          .Properties2 {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            min-height: auto !important;
            flex: 1 1 100% !important;
            gap: 10px !important;
          }
          .best-places-header-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin: 0 0 2px 0 !important;
            width: 100% !important;
          }
          .best-places-title {
            font-size: 1.25rem !important;
            font-weight: 800 !important;
            color: #18181B !important;
            letter-spacing: -0.02em !important;
            margin: 0 !important;
            line-height: 1.2 !important;
          }
          .best-places-count-badge {
            display: none !important;
          }
          .PlacesGrid,
          .places-grid-layout {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            gap: 12px !important;
            padding: 2px 2px 8px 2px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .PlacesGrid::-webkit-scrollbar,
          .places-grid-layout::-webkit-scrollbar {
            display: none !important;
          }
          .place-card,
          .place-card-skeleton {
            flex: 0 0 138px !important;
            width: 138px !important;
            min-width: 138px !important;
            max-width: 138px !important;
            height: 138px !important;
            min-height: 138px !important;
            max-height: 138px !important;
            border-radius: 18px !important;
            position: relative !important;
            overflow: hidden !important;
            background-color: #0F172A !important;
            border: none !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08) !important;
            flex-shrink: 0 !important;
          }
          .place-card-link {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            display: block !important;
          }
          .place-card-image-box {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 18px !important;
            overflow: hidden !important;
            background-color: #1E293B !important;
          }
          .place-card-skeleton-image {
            width: 100% !important;
            height: 100% !important;
            border-radius: 18px !important;
          }
          .place-card-img {
            border-radius: 18px !important;
            object-fit: cover !important;
          }
          .place-card-mobile-overlay {
            display: block !important;
            position: absolute !important;
            inset: 0 !important;
            z-index: 1 !important;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.45) 60%, rgba(0, 0, 0, 0.88) 100%) !important;
            pointer-events: none;
          }
          .place-card-content {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 2 !important;
            background: transparent !important;
            padding: 8px 10px 9px 10px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-end !important;
            gap: 2px !important;
          }
          .place-card-header-line {
            width: 100% !important;
            display: flex !important;
          }
          .place-card-title {
            color: #FFFFFF !important;
            font-size: 13.5px !important;
            font-weight: 700 !important;
            line-height: 1.25 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
            margin: 0 !important;
          }
          .place-card-offline-tag {
            display: none !important;
          }
          .place-card-meta-line {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            gap: 4px !important;
            margin-top: 1px !important;
          }
          .place-card-rating-badge {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            gap: 3px !important;
            color: #FFFFFF !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
          }
          .place-star-icon {
            fill: #F59E0B !important;
            color: #F59E0B !important;
            width: 11px !important;
            height: 11px !important;
          }
          .place-rating-text-desktop {
            display: none !important;
          }
          .place-rating-text-mobile {
            display: inline !important;
            color: #FFFFFF !important;
            font-size: 12px !important;
            font-weight: 600 !important;
          }
          .place-card-time {
            display: none !important;
          }
          .place-card-closed-pill {
            position: absolute !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2 !important;
          }
          .place-card-closed-text {
            font-size: 10px !important;
            padding: 3px 8px !important;
          }
          .place-card-skeleton .place-card-content {
            display: none !important;
          }
        }
        @media (max-width: 540px) {
          .place-card,
          .place-card-skeleton {
            flex: 0 0 134px !important;
            width: 134px !important;
            min-width: 134px !important;
            max-width: 134px !important;
            height: 134px !important;
            min-height: 134px !important;
            max-height: 134px !important;
          }
        }
      `}</style>
    </section>
  );
}
