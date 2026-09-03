"use client";

import React, { useState } from "react";
import {
  HeroSection,
  CategoryBar,
  PromoRow,
  FilterRow,
  Properties,
  PopularOrders,
  BestPlaces,
  DashboardBody,
} from "@/app/components/homeComponents";

export default function NewHomePage() {
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [selectedFilter, setSelectedFilter] = useState("fastest");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", overflowX: "hidden" }}>
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Category Bar */}
      <CategoryBar
        activeCategoryId={selectedCategory}
        onSelectCategory={(id) => setSelectedCategory(id)}
      />

      {/* 3. Promo Banner Row */}
      <PromoRow />

      {/* 4. Filter Row */}
      <FilterRow
        activeFilterId={selectedFilter}
        onFilterChange={(id) => setSelectedFilter(id)}
      />

      {/* 5. Properties / Best Places Nearby with Sidebar Filters */}
      <Properties />

      {/* 6. Popular Orders / Today's Special Offers */}
      <PopularOrders />

      {/* 7. Best Places / Popular Dishes Row */}
      <BestPlaces />

      {/* 8. Dashboard Body / Top Rated */}
      <DashboardBody />
    </div>
  );
}
