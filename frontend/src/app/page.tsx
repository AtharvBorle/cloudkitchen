"use client";

import React, { useState } from "react";
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
  MobileBottomNav,
} from "@/components/home";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [selectedFilter, setSelectedFilter] = useState("fastest");

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
      <Navbar />

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
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Category Bar */}
        <CategoryBar
          activeCategoryId={selectedCategory}
          onSelectCategory={(id) => setSelectedCategory(id)}
        />

        {/* 3. Promo Banner Row (New Full-Width Single Banner) */}
        <PromoRow2 />

        {/* 4. Filter Row */}
        <FilterRow
          activeFilterId={selectedFilter}
          onFilterChange={(id) => setSelectedFilter(id)}
        />

        {/* 5. Properties / Best Places Nearby */}
        <Properties />

        {/* 6. Popular Orders / Today's Special Offers */}
        <PopularOrders />

        {/* 7. Best Places / Popular Dishes */}
        <BestPlaces />

        {/* 8. Dashboard Body / Top Rated */}
        <DashboardBody />

        {/* 9. Recommended For You */}
        <RecommendedForYou />
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav />

      <style jsx>{`
        @media (max-width: 1024px) {
          .home-page-canvas {
            padding: 24px 20px !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 768px) {
          .home-page-canvas {
            padding-bottom: 80px !important;
          }
        }
        @media (max-width: 640px) {
          .home-page-canvas {
            padding: 16px 12px 85px 12px !important;
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
