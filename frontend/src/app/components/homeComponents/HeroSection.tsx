"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onSearch?: (query: string, location?: string) => void;
}

const QUICK_TAGS = [
  { id: "pizza", label: "Pizza", emoji: "🍕", active: true },
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

  const locations = ["Kothrud, Pune", "Baner, Pune", "Viman Nagar, Pune", "Wakad, Pune", "Hadapsar, Pune"];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery, selectedLocation);
    } else {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("query", searchQuery.trim());
      router.push(`/explore/food?${params.toString()}`);
    }
  };

  const handleTagClick = (tag: typeof QUICK_TAGS[0]) => {
    setActiveTag(tag.id);
    const params = new URLSearchParams();
    params.set("query", tag.label);
    router.push(`/explore/food?${params.toString()}`);
  };

  return (
    <section
      style={{
        width: "100%",
        background: "linear-gradient(135deg, #FFF5EC 0%, #FFF9F4 50%, #FFF5E9 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          minHeight: "480px",
          margin: "0 auto",
          padding: "56px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "40px",
          boxSizing: "border-box",
        }}
        className="hero-section-container"
      >
        {/* Left Content Column */}
        <div
          style={{
            flex: "1 1 580px",
            maxWidth: "620px",
            display: "flex",
            flexDirection: "column",
            zIndex: 2,
          }}
        >
          {/* Eyebrow / Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "3px",
                backgroundColor: "#FF5500",
                borderRadius: "2px",
              }}
            />
            <span
              style={{
                color: "#FF5500",
                fontSize: "0.85rem",
                fontWeight: "700",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
              }}
            >
              Good Food
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
              fontWeight: "800",
              lineHeight: 1.15,
              color: "#18181B",
              marginBottom: "16px",
              letterSpacing: "-0.5px",
            }}
          >
            Delicious Meals, <br />
            <span style={{ color: "#FF5500" }}>At Your Doorstep</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.5,
              color: "#64748B",
              marginBottom: "32px",
              maxWidth: "500px",
            }}
          >
            From local favorites to global cuisines, discover food that makes you happy.
          </p>

          {/* Search Pill Bar */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "9999px",
              padding: "6px 8px 6px 20px",
              display: "flex",
              alignItems: "center",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)",
              border: "1px solid #F1F5F9",
              marginBottom: "24px",
              position: "relative",
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: "1 1 auto",
                gap: "10px",
                minWidth: "160px",
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
                  fontSize: "0.95rem",
                  color: "#1E293B",
                  backgroundColor: "transparent",
                }}
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
                padding: "6px 10px",
                cursor: "pointer",
                userSelect: "none",
              }}
              className="hero-location-picker"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
            >
              <MapPin size={17} color="#FF5500" />
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#1E293B",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedLocation}
              </span>
              <ChevronDown size={15} color="#64748B" />

              {/* Location Dropdown */}
              {isLocationOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 14px)",
                    right: 0,
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                    borderRadius: "12px",
                    padding: "8px 0",
                    minWidth: "170px",
                    zIndex: 20,
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
                        padding: "8px 16px",
                        fontSize: "0.88rem",
                        color: selectedLocation === loc ? "#FF5500" : "#334155",
                        fontWeight: selectedLocation === loc ? "600" : "400",
                        backgroundColor: selectedLocation === loc ? "#FFF7ED" : "transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#FFF7ED";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          selectedLocation === loc ? "#FFF7ED" : "transparent";
                      }}
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search Submit Button */}
            <button
              type="submit"
              style={{
                backgroundColor: "#FF5500",
                color: "#FFFFFF",
                fontWeight: "600",
                fontSize: "0.95rem",
                padding: "12px 28px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                marginLeft: "8px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(255, 85, 0, 0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#E64D00";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#FF5500";
              }}
            >
              Search
            </button>
          </form>

          {/* Quick Tags / Chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
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
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor: isSelected ? "#FFF0E6" : "#FFFFFF",
                    border: isSelected ? "1px solid #FED7AA" : "1px solid #E2E8F0",
                    color: isSelected ? "#D9531E" : "#475569",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#CBD5E1";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFFFF";
                    }
                  }}
                >
                  <span style={{ fontSize: "0.95rem" }}>{tag.emoji}</span>
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Hero Image Column */}
        <div
          style={{
            flex: "1 1 500px",
            maxWidth: "560px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
          className="hero-right-column"
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "520px",
              height: "440px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/HeroRight.png"
              alt="Delicious Meals at Your Doorstep"
              width={520}
              height={440}
              priority
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "440px",
                objectFit: "contain",
                filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.06))",
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 992px) {
          .hero-section-container {
            flex-direction: column !important;
            height: auto !important;
            padding-top: 40px !important;
            padding-bottom: 40px !important;
            text-align: center;
          }
          .hero-right-column {
            width: 100% !important;
            max-width: 440px !important;
          }
        }
        @media (max-width: 640px) {
          .hero-search-divider,
          .hero-location-picker {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
