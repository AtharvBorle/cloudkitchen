"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import {
  HeroSection,
  CategoryBar,
  PromoRow2,
  FilterRow,
  Properties,
  PopularOrders,
  BestPlaces,
  DashboardBody,
  RecommendedForYou,
} from "@/components/home";
import type { ActiveHomeFilters } from "@/components/home/FilterRow";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";
import { useHomeData } from "@/lib/useHomeData";
import { useLocation } from "@/components/location-provider";
import { MapPin } from "lucide-react";
import { Footer } from "@/components/explore-desktop/footer";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [activeFilters, setActiveFilters] = useState<ActiveHomeFilters>({});
  const { openLocationModal, defaultAddress } = useLocation();
  const homeData = useHomeData();

  // Dynamic Categories without fallback
  const categoryItems = useMemo(() => {
    if (!homeData.categories || homeData.categories.length === 0) return [];
    return homeData.categories.map((c) => ({
      id: c.id,
      name: c.name,
      image: c.image || "/images/categories/cat-food.png",
      emoji: c.emoji || "🍽️",
      route: c.route,
    }));
  }, [homeData.categories]);

  // Extract available cuisines from DB categories & items
  const availableCuisines = useMemo(() => {
    const set = new Set<string>();
    homeData.categories.forEach((c) => {
      if (c.id !== "food" && c.id !== "rooms" && c.name) {
        set.add(c.name);
      }
    });
    homeData.foodItems.forEach((f) => {
      if (f.categoryName) set.add(f.categoryName);
    });
    return Array.from(set);
  }, [homeData.categories, homeData.foodItems]);

  // Dynamic Kitchens / Places (and multi-dimensional filtering)
  const dynamicPlaces = useMemo(() => {
    if (!homeData.kitchens || homeData.kitchens.length === 0) {
      return [];
    }
    let list = homeData.kitchens;

    // 1. Category Bar Filter
    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      const catLower = selectedCategory.toLowerCase();
      const filtered = list.filter((k) =>
        k.category?.toLowerCase().includes(catLower) ||
        k.foodType?.toLowerCase().includes(catLower)
      );
      if (filtered.length > 0) list = filtered;
    }

    // 2. Dietary Filter
    if (activeFilters.dietary === "veg") {
      const filtered = list.filter((k) => k.foodType === "VEG" || k.category?.toLowerCase().includes("veg"));
      if (filtered.length > 0) list = filtered;
    } else if (activeFilters.dietary === "non_veg") {
      const filtered = list.filter((k) => k.foodType !== "VEG");
      if (filtered.length > 0) list = filtered;
    }

    // 3. Rating Filter (4.5+)
    if (activeFilters.minRating) {
      const filtered = list.filter((k) => (k.rating || 0) >= (activeFilters.minRating || 4.5));
      if (filtered.length > 0) list = filtered;
    }

    // 4. Fastest Delivery Filter (<30 min)
    if (activeFilters.fastest) {
      const filtered = list.filter((k) => {
        const num = parseInt(k.time) || 30;
        return num <= 25 || k.time.includes("15") || k.time.includes("20");
      });
      if (filtered.length > 0) list = filtered;
    }

    // 5. Cuisines Filter
    if (activeFilters.cuisines && activeFilters.cuisines.length > 0) {
      const filtered = list.filter((k) =>
        activeFilters.cuisines?.some((c) => k.category?.toLowerCase().includes(c.toLowerCase()))
      );
      if (filtered.length > 0) list = filtered;
    }

    return list.map((k) => ({
      id: k.id,
      name: k.name,
      rating: k.rating,
      time: k.time,
      imageUrl: k.imageUrl,
      category: k.category,
      kitchenId: k.trackingId || k.id,
      trackingId: k.trackingId,
      locality: k.locality,
      isOnline: k.isOnline !== false,
    }));
  }, [homeData.kitchens, selectedCategory, activeFilters]);

  // Dynamic Offers for PopularOrders derived strictly from active coupons & real food items
  const dynamicOffers = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0 || !homeData.coupons || homeData.coupons.length === 0) {
      return [];
    }

    let list = homeData.foodItems;

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      const catLower = selectedCategory.toLowerCase();
      const filtered = list.filter((f) =>
        f.categoryName?.toLowerCase().includes(catLower) ||
        f.name.toLowerCase().includes(catLower)
      );
      if (filtered.length > 0) list = filtered;
    }

    if (activeFilters.dietary === "veg") {
      const filtered = list.filter((f) => f.itemType === "VEG");
      if (filtered.length > 0) list = filtered;
    }

    // Pair active coupons with food items
    const offersList: any[] = [];
    homeData.coupons.forEach((cp, idx) => {
      const matchedItem = list[idx % list.length];
      if (matchedItem) {
        const discountText = cp.discountPercentage
          ? `${cp.discountPercentage}% OFF`
          : cp.discountAmount
          ? `FLAT ₹${cp.discountAmount} OFF`
          : "SPECIAL OFFER";

        offersList.push({
          id: `offer-${cp.id}-${matchedItem.id}`,
          foodItemId: matchedItem.id,
          discount: discountText,
          title: matchedItem.name,
          code: `Use code: ${cp.code}`,
          imageUrl: matchedItem.imageUrl || "/images/places/place-biryani.png",
          link: matchedItem.sellerTrackingId ? `/shop/${matchedItem.sellerTrackingId}` : `/explore-desktop?item=${matchedItem.id}`,
          price: matchedItem.price || 0,
          sellerId: matchedItem.sellerId || "",
          sellerName: matchedItem.sellerName || "Cloud Kitchen",
          sellerIsOnline: matchedItem.sellerIsOnline !== false,
          isAvailable: matchedItem.isAvailable !== false,
          itemType: matchedItem.itemType || "VEG",
        });
      }
    });

    return offersList.slice(0, 4);
  }, [homeData.foodItems, homeData.coupons, selectedCategory, activeFilters]);

  // Dynamic Dishes for BestPlaces
  const dynamicDishes = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return [];
    let list = homeData.foodItems;

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      const catLower = selectedCategory.toLowerCase();
      const filtered = list.filter((f) =>
        f.categoryName?.toLowerCase().includes(catLower) ||
        f.name.toLowerCase().includes(catLower)
      );
      if (filtered.length > 0) list = filtered;
    }

    if (activeFilters.dietary === "veg") {
      const filtered = list.filter((f) => f.itemType === "VEG");
      if (filtered.length > 0) list = filtered;
    }

    // Price tier filter
    if (activeFilters.priceTier === "under-150") {
      const filtered = list.filter((f) => f.price <= 150);
      if (filtered.length > 0) list = filtered;
    } else if (activeFilters.priceTier === "150-300") {
      const filtered = list.filter((f) => f.price > 150 && f.price <= 300);
      if (filtered.length > 0) list = filtered;
    } else if (activeFilters.priceTier === "300-plus") {
      const filtered = list.filter((f) => f.price > 300);
      if (filtered.length > 0) list = filtered;
    }

    return list.slice(0, 4).map((f) => ({
      id: f.id,
      name: f.name,
      rating: f.rating || 5.0,
      time: f.deliveryTime || "20-30 min",
      imageUrl: f.imageUrl || "/images/places/place-biryani.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop`,
      itemType: f.itemType || "VEG",
      sellerIsOnline: f.sellerIsOnline !== false,
      isAvailable: f.isAvailable !== false,
      distanceText: f.distanceText,
    }));
  }, [homeData.foodItems, selectedCategory, activeFilters]);

  // Dynamic Top Rated Items for DashboardBody
  const dynamicTopRated = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return [];
    let list = homeData.foodItems;

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      const catLower = selectedCategory.toLowerCase();
      const filtered = list.filter((f) =>
        f.categoryName?.toLowerCase().includes(catLower) ||
        f.name.toLowerCase().includes(catLower)
      );
      if (filtered.length > 0) list = filtered;
    }

    if (activeFilters.dietary === "veg") {
      const filtered = list.filter((f) => f.itemType === "VEG");
      if (filtered.length > 0) list = filtered;
    }

    if (activeFilters.minRating) {
      const filtered = list.filter((f) => (f.rating || 0) >= (activeFilters.minRating || 4.5));
      if (filtered.length > 0) list = filtered;
    }

    return list.slice(0, 6).map((f) => ({
      id: f.id,
      name: f.name,
      rating: f.rating || 5.0,
      category: f.categoryName || (f.itemType === "VEG" ? "Pure Veg" : "Non-Veg Special"),
      price: f.price || 0,
      time: f.deliveryTime || "20-30 min",
      imageUrl: f.imageUrl || "/images/places/place-pizza.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop`,
      itemType: f.itemType || "VEG",
      sellerIsOnline: f.sellerIsOnline !== false,
      isAvailable: f.isAvailable !== false,
      distanceText: f.distanceText,
    }));
  }, [homeData.foodItems, selectedCategory, activeFilters]);

  // Dynamic Recommended Dishes for RecommendedForYou
  const dynamicRecommended = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return [];
    let list = homeData.foodItems;

    if (selectedCategory && selectedCategory !== "food" && selectedCategory !== "rooms") {
      const catLower = selectedCategory.toLowerCase();
      const filtered = list.filter((f) =>
        f.categoryName?.toLowerCase().includes(catLower) ||
        f.name.toLowerCase().includes(catLower)
      );
      if (filtered.length > 0) list = filtered;
    }

    if (activeFilters.dietary === "veg") {
      const filtered = list.filter((f) => f.itemType === "VEG");
      if (filtered.length > 0) list = filtered;
    }

    const items = list.length > 4 ? [...list].reverse() : list;
    return items.slice(0, 4).map((f) => ({
      id: f.id,
      name: f.name,
      rating: f.rating || 5.0,
      time: `₹${f.price} • ${f.deliveryTime || "20-25 min"}`,
      imageUrl: f.imageUrl || "/images/places/place-biryani.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop?item=${f.id}`,
      itemType: f.itemType || "VEG",
      sellerIsOnline: f.sellerIsOnline !== false,
      isAvailable: f.isAvailable !== false,
    }));
  }, [homeData.foodItems, selectedCategory, activeFilters]);

  // Dynamic Promo Banner from active coupons or DB promo banners
  const promoProps = useMemo(() => {
    if (homeData.coupons && homeData.coupons.length > 0) {
      const cp = homeData.coupons[0];
      return {
        code: cp.code,
        titleHighlight: cp.discountPercentage ? `${cp.discountPercentage}% OFF` : `FLAT ₹${cp.discountAmount} OFF`,
        description: cp.description || "Limited time offer on all orders.",
      };
    }
    return undefined;
  }, [homeData.coupons]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FFF3E3 0%, #FFFBF7 35%, #FFFFFF 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowX: "hidden",
      }}
    >
      <PopupBannerDisplay />

      {/* 0. Top Navbar */}
      <Navbar
        hideSearch={true}
        selectedDiet={
          activeFilters.dietary === "non_veg"
            ? "non-veg"
            : activeFilters.dietary === "all"
            ? "all"
            : "veg"
        }
        onDietChange={(diet) => {
          setActiveFilters((prev) => ({
            ...prev,
            dietary:
              diet === "all"
                ? "all"
                : diet === "non-veg"
                ? "non_veg"
                : "veg",
          }));
        }}
      />

      {/* Main Canvas Container */}
      <main
        style={{
          width: "1440px",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
          padding: "40px 80px",
          boxSizing: "border-box",
        }}
        className="home-page-canvas"
      >
        {/* 1. Hero Section (Dynamic Search Autocomplete + Map Picker) */}
        <HeroSection
          availableItems={homeData.foodItems}
          availableKitchens={homeData.kitchens}
          availableRooms={homeData.rooms}
        />

        {/* 2. Category Bar */}
        {categoryItems.length > 0 && (
          <CategoryBar
            activeCategoryId={selectedCategory}
            onSelectCategory={(id) => setSelectedCategory(id)}
            items={categoryItems}
          />
        )}

        {/* 2.5 Multi-dimensional Filter Row */}
        <FilterRow
          activeFilters={activeFilters}
          onFilterChange={(newFilters) => setActiveFilters(newFilters)}
          availableCuisines={availableCuisines}
        />

        {/* Out of Service Area Alert Banner */}
        {homeData.activePincode && !homeData.isLoading && homeData.kitchens.length === 0 && (
          <div
            style={{
              width: "100%",
              backgroundColor: "#FFF8F2",
              border: "1.5px solid #FED7AA",
              borderRadius: "18px",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              boxShadow: "0 4px 16px rgba(249, 115, 22, 0.06)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: "#FFEADB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FF6B00",
                  flexShrink: 0,
                }}
              >
                <MapPin size={22} />
              </div>
              <div>
                <h3 style={{ margin: "0 0 2px 0", fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>
                  No Cloud Kitchens Delivering to PIN {homeData.activePincode}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B" }}>
                  We haven&apos;t expanded to this specific pincode yet. Choose a nearby area like Kothrud (411038), Baner (411045), or Aundh (411007) to explore delicious dishes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openLocationModal}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                backgroundColor: "#FF6B00",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "0.88rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255, 107, 0, 0.25)",
                whiteSpace: "nowrap",
              }}
            >
              Change Location
            </button>
          </div>
        )}

        {/* 3. Promo Banner Row (Dynamic Full-Graphic Banner) */}
        {homeData.promoBanners && homeData.promoBanners.length > 0 && (
          <PromoRow2 banners={homeData.promoBanners} {...promoProps} />
        )}

        {/* 4. Properties / Best Places Nearby */}
        <Properties places={dynamicPlaces} />

        {/* 6. Popular Orders / Today's Special Offers */}
        {dynamicOffers.length > 0 && <PopularOrders offers={dynamicOffers} />}

        {/* 7. Best Places / Popular Dishes */}
        {dynamicDishes.length > 0 && <BestPlaces dishes={dynamicDishes} />}

        {/* 8. Dashboard Body / Top Rated */}
        {dynamicTopRated.length > 0 && <DashboardBody items={dynamicTopRated} />}

        {/* 9. Recommended For You */}
        {dynamicRecommended.length > 0 && <RecommendedForYou items={dynamicRecommended} />}
      </main>

      {/* Footer */}
      <Footer />

      <style jsx>{`
        @media (max-width: 1024px) {
          .home-page-canvas {
            padding: 24px 20px !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 768px) {
          .home-page-canvas {
            padding-bottom: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .home-page-canvas {
            padding: 16px 12px 32px 12px !important;
            gap: 18px !important;
          }
        }
      `}</style>
      <style jsx global>{`
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
