"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onSearch?: (query: string, location?: string) => void;
}

const QUICK_TAGS = [
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "lemon-rice", label: "Lemon Rice", emoji: "🍚" },
  { id: "burger", label: "Burger", emoji: "🍔" },
  { id: "thali", label: "Thali", emoji: "🍱" },
  { id: "cake", label: "Cake", emoji: "🎂" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "healthy-meals", label: "Healthy Meals", emoji: "🍲" },
];

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Kothrud, Pune");
  const [activeTag, setActiveTag] = useState("pizza");
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const locations = [
    "Kothrud, Pune",
    "Baner, Pune",
    "Viman Nagar, Pune",
    "Wakad, Pune",
    "Hadapsar, Pune",
    "Aundh, Pune",
    "Kalyani Nagar, Pune",
  ];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery, selectedLocation);
    } else {
      const params = new URLSearchParams();
      if (selectedLocation) params.set("location", selectedLocation);
      router.push(`/explore-desktop?${params.toString()}`);
    }
  };

  const handleTagClick = (tag: typeof QUICK_TAGS[0]) => {
    setActiveTag(tag.id);
    const params = new URLSearchParams();
    params.set("query", tag.label);
    router.push(`/explore-desktop?${params.toString()}`);
  };

  return (
    <section
      style={{
        width: "100%",
        maxWidth: "1280px",
        minHeight: "480px",
        background: "linear-gradient(135deg, #FFF6EE 0%, #FFF9F4 50%, #FFF5EB 100%)",
        backgroundColor: "#FFF6EE",
        padding: "52px 56px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="hero-section-container"
    >
      {/* HeroLeft (Text, Search Bar & Quick Tags) */}
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          zIndex: 2,
          boxSizing: "border-box",
        }}
        className="hero-left-column"
      >
        {/* Eyebrow / Tag: "— GOOD FOOD" */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "fit-content",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "2.5px",
              backgroundColor: "#FF6B00",
              borderRadius: "2px",
            }}
          />
          <span
            style={{
              color: "#FF6B00",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            GOOD FOOD
          </span>
        </div>

        {/* Heading: "Delicious Meals, At Your Doorstep" */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            margin: 0,
          }}
        >
          <h1
            style={{
              fontSize: "52px",
              fontWeight: "800",
              lineHeight: "1.15",
              color: "#0F172A",
              letterSpacing: "-0.5px",
              margin: 0,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
            className="hero-title-dark"
          >
            Delicious Meals,
          </h1>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: "800",
              lineHeight: "1.15",
              color: "#FF6B00",
              letterSpacing: "-0.5px",
              margin: 0,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
            className="hero-title-orange"
          >
            At Your Doorstep
          </h1>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "16px",
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            fontWeight: "400",
            lineHeight: "1.6",
            color: "#64748B",
            margin: 0,
            maxWidth: "480px",
          }}
        >
          From local favorites to global cuisines, discover food that makes you happy.
        </p>

        {/* Search Pill Bar Container */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "27px",
            height: "54px",
            padding: "0 0 0 18px",
            display: "flex",
            alignItems: "center",
            boxShadow:
              "0 10px 30px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)",
            border: "1px solid #F1F5F9",
            position: "relative",
            margin: "4px 0 0 0",
            maxWidth: "540px",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
          className="hero-search-form"
        >
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: "1 1 auto",
              gap: "10px",
              minWidth: "160px",
              height: "100%",
            }}
          >
            <Search size={19} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search for restaurants, dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                height: "100%",
                fontSize: "14.5px",
                color: "#0F172A",
                backgroundColor: "transparent",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
              className="hero-search-input"
            />
          </div>

          {/* Vertical Divider */}
          <div
            style={{
              width: "1px",
              height: "26px",
              backgroundColor: "#E2E8F0",
              margin: "0 12px",
            }}
            className="hero-search-divider"
          />

          {/* Location Selector */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 10px 0 0",
              height: "100%",
              cursor: "pointer",
              userSelect: "none",
            }}
            className="hero-location-picker"
            onClick={() => setIsLocationOpen(!isLocationOpen)}
          >
            <MapPin size={17} color="#FF6B00" />
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#0F172A",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              {selectedLocation}
            </span>
            <ChevronDown size={14} color="#64748B" />

            {/* Location Dropdown */}
            {isLocationOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                  borderRadius: "14px",
                  padding: "8px 0",
                  minWidth: "190px",
                  zIndex: 25,
                  border: "1px solid #E2E8F0",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {locations.map((loc) => (
                  <div
                    key={loc}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setIsLocationOpen(false);
                    }}
                    style={{
                      padding: "9px 18px",
                      fontSize: "13.5px",
                      color: selectedLocation === loc ? "#FF6B00" : "#334155",
                      fontWeight: selectedLocation === loc ? "600" : "400",
                      backgroundColor:
                        selectedLocation === loc ? "#FFF3EB" : "transparent",
                      cursor: "pointer",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "#FFF3EB";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        selectedLocation === loc ? "#FFF3EB" : "transparent";
                    }}
                  >
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Submit Button (Exact Figma Spec: Width 103px, Height 54px, Right Radius 27px, #FF6B00) */}
          <button
            type="submit"
            style={{
              width: "103px",
              minWidth: "103px",
              height: "54px",
              backgroundColor: "#FF6B00",
              color: "#FFFFFF",
              fontWeight: "700",
              fontSize: "15px",
              border: "none",
              borderTopRightRadius: "27px",
              borderBottomRightRadius: "27px",
              borderTopLeftRadius: "0px",
              borderBottomLeftRadius: "0px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              whiteSpace: "nowrap",
              padding: 0,
              margin: 0,
            }}
            className="hero-search-submit-btn"
          >
            Search
          </button>
        </form>

        {/* Quick Filter Tags / Chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "2px",
          }}
          className="hero-tags-wrapper"
        >
          {QUICK_TAGS.map((tag) => {
            const isSelected = activeTag === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagClick(tag)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: isSelected ? "600" : "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: isSelected ? "#FFF3EB" : "#FFFFFF",
                  border: isSelected ? "1px solid #FFD8C2" : "1px solid #E2E8F0",
                  color: isSelected ? "#FF6B00" : "#475569",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
                className="hero-tag-btn"
              >
                <span style={{ fontSize: "14px" }}>{tag.emoji}</span>
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HeroRight Graphic Column (Illustrated food bowl with floating badges) */}
      <div
        style={{
          flex: "1 1 500px",
          maxWidth: "540px",
          height: "100%",
          minHeight: "380px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
        className="hero-right-column"
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            height: "100%",
            minHeight: "380px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/HeroRight.png"
            alt="Delicious Meals at Your Doorstep"
            width={520}
            height={390}
            priority
            style={{
              width: "auto",
              height: "auto",
              maxHeight: "390px",
              maxWidth: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 14px 32px rgba(0,0,0,0.06))",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .hero-search-submit-btn:hover {
          background-color: #E65F00 !important;
        }
        .hero-tag-btn:hover {
          border-color: #FFD8C2 !important;
          color: #FF6B00 !important;
          background-color: #FFF8F3 !important;
          transform: translateY(-1px);
        }
        @media (max-width: 1024px) {
          .hero-section-container {
            flex-direction: column !important;
            min-height: auto !important;
            padding: 40px 28px !important;
            text-align: center;
          }
          .hero-left-column {
            width: 100% !important;
            max-width: 100% !important;
            align-items: center;
          }
          .hero-title-dark,
          .hero-title-orange {
            font-size: 38px !important;
            line-height: 1.2 !important;
          }
          .hero-tags-wrapper {
            justify-content: center;
          }
          .hero-right-column {
            width: 100% !important;
            max-width: 440px !important;
            min-height: 300px !important;
            margin-top: 24px;
          }
        }
        @media (max-width: 640px) {
          .hero-search-form {
            flex-direction: column;
            border-radius: 20px !important;
            height: auto !important;
            padding: 14px !important;
            gap: 12px;
          }
          .hero-search-divider {
            display: none !important;
          }
          .hero-location-picker {
            width: 100%;
            justify-content: center;
            padding: 0;
          }
          .hero-search-submit-btn {
            width: 100% !important;
            height: 46px !important;
            border-radius: 12px !important;
          }
          .hero-title-dark,
          .hero-title-orange {
            font-size: 30px !important;
          }
        }
      `}</style>
    </section>
  );
}
