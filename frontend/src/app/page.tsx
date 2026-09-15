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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [activeFilters, setActiveFilters] = useState<ActiveHomeFilters>({});
  const homeData = useHomeData();

  // Dynamic Categories with fallback
  const categoryItems = useMemo(() => {
    if (!homeData.categories || homeData.categories.length === 0) return undefined;
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

  // Dynamic Kitchens / Places with fallback (and multi-dimensional filtering)
  const dynamicPlaces = useMemo(() => {
    if (!homeData.kitchens || homeData.kitchens.length === 0) return undefined;
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
    }));
  }, [homeData.kitchens, selectedCategory, activeFilters]);

  // Dynamic Offers for PopularOrders with fallback
  const dynamicOffers = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return undefined;
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

    return list.slice(0, 4).map((f, idx) => ({
      id: f.id,
      foodItemId: f.id,
      discount: idx % 2 === 0 ? "25% OFF" : "30% OFF",
      title: f.name,
      code: `Use code: FOOD${idx + 1}0`,
      imageUrl: f.imageUrl || "/images/places/place-biryani.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop?item=${f.id}`,
      price: f.price || 199,
      sellerId: f.sellerId || "k-1",
      sellerName: f.sellerName || "Verified Cloud Kitchen",
    }));
  }, [homeData.foodItems, selectedCategory, activeFilters]);

  // Dynamic Dishes for BestPlaces with fallback
  const dynamicDishes = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return undefined;
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
      rating: f.rating || 4.8,
      time: f.deliveryTime || "20-30 min",
      imageUrl: f.imageUrl || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop`,
    }));
  }, [homeData.foodItems, selectedCategory, activeFilters]);

  // Dynamic Top Rated Items for DashboardBody with fallback
  const dynamicTopRated = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return undefined;
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
      rating: f.rating || 4.9,
      category: f.categoryName || (f.itemType === "VEG" ? "Pure Veg" : "Non-Veg Special"),
      price: f.price || 199,
      time: f.deliveryTime || "20-30 min",
      imageUrl: f.imageUrl || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop`,
    }));
  }, [homeData.foodItems, selectedCategory, activeFilters]);

  // Dynamic Recommended Dishes for RecommendedForYou with fallback
  const dynamicRecommended = useMemo(() => {
    if (!homeData.foodItems || homeData.foodItems.length === 0) return undefined;
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
      time: `₹${f.price} • ${f.deliveryTime || "20-25 min"}`,
      imageUrl: f.imageUrl || "/images/places/place-biryani.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop?item=${f.id}`,
    }));
  }, [homeData.foodItems, selectedCategory, activeFilters]);

  // Dynamic Promo Banner with fallback
  const promoProps = useMemo(() => {
    if (homeData.coupons && homeData.coupons.length > 0) {
      const cp = homeData.coupons[0];
      return {
        code: cp.code,
        titleHighlight: cp.discountPercentage ? `${cp.discountPercentage}% OFF` : `FLAT ₹${cp.discountAmount} OFF`,
        description: cp.description || "Kickstart your meal plan with premium ingredients & fast delivery.",
      };
    }
    return {};
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
        <HeroSection availableItems={homeData.foodItems} />

        {/* 2. Category Bar */}
        <CategoryBar
          activeCategoryId={selectedCategory}
          onSelectCategory={(id) => setSelectedCategory(id)}
          items={categoryItems}
        />

        {/* 2.5 Multi-dimensional Filter Row */}
        <FilterRow
          activeFilters={activeFilters}
          onFilterChange={(newFilters) => setActiveFilters(newFilters)}
          availableCuisines={availableCuisines}
        />

        {/* 3. Promo Banner Row (Dynamic Full-Graphic Banner with Fallback) */}
        <PromoRow2 banners={homeData.promoBanners} {...promoProps} />

        {/* 4. Properties / Best Places Nearby */}
        <Properties places={dynamicPlaces} />

        {/* 6. Popular Orders / Today's Special Offers */}
        <PopularOrders offers={dynamicOffers} />

        {/* 7. Best Places / Popular Dishes */}
        <BestPlaces dishes={dynamicDishes} />

        {/* 8. Dashboard Body / Top Rated */}
        <DashboardBody items={dynamicTopRated} />

        {/* 9. Recommended For You */}
        <RecommendedForYou items={dynamicRecommended} />
      </main>

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
