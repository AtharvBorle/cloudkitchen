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

  const locations = ["Kothrud, Pune", "Baner, Pune", "Viman Nagar, Pune", "Wakad, Pune", "Hadapsar, Pune"];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery, selectedLocation);
    } else {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("query", searchQuery.trim());
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
        height: "480px",
        background: "linear-gradient(135deg, #FFF5EC 0%, #FFF9F4 50%, #FFF5E9 100%)",
        paddingTop: "56px",
        paddingBottom: "56px",
        paddingLeft: "0",
        paddingRight: "0",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        borderRadius: "24px",
      }}
      className="hero-section-container"
    >
      {/* HeroLeft (560px x 356px) */}
      <div
        style={{
          width: "560px",
          minWidth: "560px",
          minHeight: "356px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          zIndex: 2,
          boxSizing: "border-box",
          paddingLeft: "24px",
        }}
        className="hero-left-column"
      >
        {/* Eyebrow / Tag: (122px hug * 18px hug, gap 8px) */}
        <div
          style={{
            width: "fit-content",
            maxWidth: "122px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "2px",
              backgroundColor: "#FF5500",
              borderRadius: "1px",
            }}
          />
          <span
            style={{
              color: "#FF5500",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              lineHeight: "18px",
              whiteSpace: "nowrap",
            }}
          >
            GOOD FOOD
          </span>
        </div>

        {/* Heading: (560px fill * 124px hug, flow vertical, gap 4px) */}
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            minHeight: "124px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            margin: 0,
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "800",
              lineHeight: "58px",
              color: "#18181B",
              letterSpacing: "-0.5px",
              margin: 0,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            Delicious Meals,
          </h1>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "800",
              lineHeight: "58px",
              color: "#FF5500",
              letterSpacing: "-0.5px",
              margin: 0,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
          >
            At Your Doorstep
          </h1>
        </div>

        {/* Subtitle: width 440px, height 50px, Poppins 400 15px line-height 165% #64748B */}
        <p
          style={{
            width: "440px",
            maxWidth: "100%",
            minHeight: "50px",
            fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            fontWeight: 400,
            fontStyle: "normal",
            fontSize: "15px",
            lineHeight: "165%",
            letterSpacing: "0px",
            color: "#64748B",
            margin: 0,
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
            padding: "5px 6px 5px 18px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)",
            border: "1px solid #F1F5F9",
            position: "relative",
            margin: 0,
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
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search for restaurants, dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: "0.92rem",
                color: "#1E293B",
                backgroundColor: "transparent",
              }}
            />
          </div>

          {/* Vertical Divider */}
          <div
            style={{
              width: "1px",
              height: "24px",
              backgroundColor: "#E2E8F0",
              margin: "0 10px",
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
              padding: "6px 8px",
              cursor: "pointer",
              userSelect: "none",
            }}
            className="hero-location-picker"
            onClick={() => setIsLocationOpen(!isLocationOpen)}
          >
            <MapPin size={16} color="#FF5500" />
            <span
              style={{
                fontSize: "0.88rem",
                fontWeight: "600",
                color: "#1E293B",
                whiteSpace: "nowrap",
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
              fontSize: "0.92rem",
              padding: "10px 24px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              marginLeft: "6px",
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
            gap: "8px",
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
                  padding: "5px 12px",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: isSelected ? "600" : "500",
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
                <span style={{ fontSize: "0.9rem" }}>{tag.emoji}</span>
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HeroRight Image Column */}
      <div
        style={{
          flex: "1 1 500px",
          maxWidth: "560px",
          height: "100%",
          maxHeight: "368px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          paddingRight: "24px",
          boxSizing: "border-box",
        }}
        className="hero-right-column"
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "480px",
            height: "100%",
            maxHeight: "360px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/HeroRight.png"
            alt="Delicious Meals at Your Doorstep"
            width={480}
            height={360}
            priority
            style={{
              width: "auto",
              height: "100%",
              maxHeight: "360px",
              maxWidth: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.06))",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 992px) {
          .hero-section-container {
            flex-direction: column !important;
            height: auto !important;
            padding-top: 32px !important;
            padding-bottom: 32px !important;
            text-align: center;
          }
          .hero-left-column {
            width: 100% !important;
            min-width: 100% !important;
            padding-left: 0 !important;
            align-items: center;
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
