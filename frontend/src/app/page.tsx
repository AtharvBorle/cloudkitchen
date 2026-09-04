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

        {/* Features / Why Choose Us Section */}
        <div style={{ backgroundColor: "#FAFAFA", padding: "60px 20px", borderRadius: "24px", textAlign: "center", marginTop: "10px" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "800", color: "#18181B", marginBottom: "48px" }}>
            Why Choose Us?
          </h2>
          <div className="features-grid">
            <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: "hidden" }} className="hover-lift">
              <div style={{ height: "180px", overflow: "hidden" }}>
                <img src="/images/authentic.png" alt="Authentic Taste" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "10px", color: "#18181B" }}>Authentic Taste</h3>
                <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Food prepared by verified home chefs with love, hygiene, and traditional recipes.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: "hidden" }} className="hover-lift">
              <div style={{ height: "180px", overflow: "hidden" }}>
                <img src="/images/verified.png" alt="Verified Sellers" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "10px", color: "#18181B" }}>Verified Sellers</h3>
                <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  All our sellers and rooms are physically verified by our local agents for your safety.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", overflow: "hidden" }} className="hover-lift">
              <div style={{ height: "180px", overflow: "hidden" }}>
                <img src="/images/furniture_rental_feature.png" alt="Premium Furniture" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "10px", color: "#18181B" }}>Premium Furniture</h3>
                <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Rent high-quality furniture to make your stay feel like a real home instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 1024px) {
          .home-page-canvas {
            padding: 32px 24px !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .home-page-canvas {
            padding: 24px 16px !important;
            gap: 24px !important;
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
