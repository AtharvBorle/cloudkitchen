"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
import PopupBannerDisplay from "@/components/PopupBannerDisplay";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [selectedFilter, setSelectedFilter] = useState("fastest");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      <PopupBannerDisplay />

      {/* Header / Navbar */}
      <header className="navbar">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="navbar-brand" style={{ fontWeight: "800", color: "#FF5500", fontSize: "1.4rem" }}>
            Neo Cloud Kitchen
          </div>

          {/* Desktop Nav */}
          <nav className="navbar-links desktop-only" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/" style={{ color: "#18181B", fontWeight: "600" }}>Home</Link>
            <Link href="/explore/food" style={{ color: "#4B5563", fontWeight: "500" }}>Food</Link>
            <Link href="/explore/rooms" style={{ color: "#4B5563", fontWeight: "500" }}>Rooms</Link>
            <Link href="/explore/furniture" style={{ color: "#4B5563", fontWeight: "500" }}>Furniture</Link>
            <Link href="/user" style={{ color: "#4B5563", fontWeight: "500" }}>Login</Link>
            <Link href="/auth/register/user" style={{ color: "#4B5563", fontWeight: "500" }}>Sign Up</Link>
            <Link
              href="/auth/register"
              style={{
                backgroundColor: "#FF5500",
                color: "#FFFFFF",
                padding: "8px 18px",
                borderRadius: "8px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Become a Seller
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            className="mobile-only"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ color: "#FF5500", background: "none", border: "none", cursor: "pointer" }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        <div
          className={`mobile-nav-menu-backdrop ${isMenuOpen ? "open" : ""}`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div className={`mobile-nav-menu ${isMenuOpen ? "open" : ""}`}>
          <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link href="/explore/food" onClick={() => setIsMenuOpen(false)}>Food</Link>
          <Link href="/explore/rooms" onClick={() => setIsMenuOpen(false)}>Rooms</Link>
          <Link href="/explore/furniture" onClick={() => setIsMenuOpen(false)}>Furniture</Link>
          <Link href="/user" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link href="/auth/register/user" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
          <Link
            href="/auth/register"
            style={{
              backgroundColor: "#FF5500",
              color: "#FFFFFF",
              padding: "10px 16px",
              borderRadius: "8px",
              textAlign: "center",
              marginTop: "10px",
              fontWeight: "600",
            }}
            onClick={() => setIsMenuOpen(false)}
          >
            Become a Seller
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
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

        {/* 5. Properties / Best Places Nearby */}
        <Properties />

        {/* 6. Popular Orders / Today's Special Offers */}
        <PopularOrders />

        {/* 7. Best Places / Popular Dishes */}
        <BestPlaces />

        {/* 8. Dashboard Body / Top Rated */}
        <DashboardBody />

        {/* Features / Why Choose Us Section */}
        <div style={{ backgroundColor: "#FAFAFA", padding: "80px 20px", textAlign: "center" }}>
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
