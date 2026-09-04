"use client";

import React, { useState } from "react";
import Navbar from "@/components/navbar/Navbar";
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
    <div
      style={{
        width: "100%",
        minHeight: "1024px",
        background: "linear-gradient(180deg, #FFF3E3 0%, #FFFBF7 35%, #FFFFFF 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflowX: "hidden",
      }}
    >
      {/* 0. Top Navbar */}
      <Navbar />

      <div
        style={{
          width: "1440px",
          maxWidth: "100%",
          height: "3230px",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
          padding: "40px 80px",
          boxSizing: "border-box",
        }}
        className="home-page-canvas"
      >
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

      <style jsx>{`
        @media (max-width: 1024px) {
          .home-page-canvas {
            height: auto !important;
            padding: 32px 24px !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .home-page-canvas {
            height: auto !important;
            padding: 24px 16px !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
