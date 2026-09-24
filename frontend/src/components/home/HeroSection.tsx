"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  ChevronDown,
  Navigation,
  Map as MapIcon,
  X,
  History,
  TrendingUp,
  Sparkles,
  Store,
  Utensils,
  BedDouble,
} from "lucide-react";
import { useLocation } from "@/components/location-provider";
import { useRecentSearches } from "@/lib/useRecentSearches";
import { HouseMapPicker } from "@/components/house-map-picker";
import { matchesSearchQuery } from "@/lib/dietary-filter";

interface SuggestionItem {
  id: string;
  title: string;
  type: "dish" | "kitchen" | "room" | "tag";
  subtitle?: string;
  link?: string;
}

interface HeroSectionProps {
  onSearch?: (query: string, location?: string) => void;
  availableItems?: Array<{ id: string; name: string; categoryName?: string; sellerTrackingId?: string }>;
  availableKitchens?: Array<{ id: string; name: string; category?: string; trackingId?: string }>;
  availableRooms?: Array<{ id: string; title: string; sellerCity?: string }>;
}

const QUICK_TAGS = [
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "lemon-rice", label: "Lemon Rice", emoji: "🍚" },
  { id: "burger", label: "Burger", emoji: "🍔" },
  { id: "thali", label: "Thali", emoji: "🍱" },
  { id: "biryani", label: "Biryani", emoji: "🍛" },
  { id: "cake", label: "Cake", emoji: "🎂" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
];

const PRESET_LOCATIONS = [
  { name: "Kothrud, Pune", pincode: "411038" },
  { name: "Baner, Pune", pincode: "411045" },
  { name: "Viman Nagar, Pune", pincode: "411014" },
  { name: "Wakad, Pune", pincode: "411057" },
  { name: "Aundh, Pune", pincode: "411007" },
  { name: "Hadapsar, Pune", pincode: "411028" },
  { name: "Kalyani Nagar, Pune", pincode: "411006" },
];

export default function HeroSection({
  onSearch,
  availableItems = [],
  availableKitchens = [],
  availableRooms = [],
}: HeroSectionProps) {
  const router = useRouter();
  const { defaultAddress, setGuestLocation, openLocationModal } = useLocation();
  const { recentSearches, addSearch, removeSearch, clearSearches, trendingSearches } = useRecentSearches();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Select Location");
  const [activeTag, setActiveTag] = useState("pizza");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: 18.5074,
    lng: 73.8077,
  });
  const [pickedAddressDetails, setPickedAddressDetails] = useState<any>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const locationBoxRef = useRef<HTMLDivElement>(null);

  // Sync selected location with LocationProvider
  useEffect(() => {
    if (defaultAddress) {
      const locStr = defaultAddress.locality || defaultAddress.city
        ? `${defaultAddress.locality ? defaultAddress.locality + ", " : ""}${defaultAddress.city || ""}`.trim()
        : defaultAddress.pincode
        ? `PIN: ${defaultAddress.pincode}`
        : "Select Location";
      setSelectedLocation(locStr || "Select Location");
    } else {
      setSelectedLocation("Select Location");
    }
  }, [defaultAddress]);

  // Click outside listener to dismiss popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (locationBoxRef.current && !locationBoxRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute live match suggestions as user types (kitchens, dishes, rooms, and tags)
  const liveSuggestions = React.useMemo<SuggestionItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const suggestions: SuggestionItem[] = [];
    const seen = new Set<string>();

    // 1. Check available kitchen names (e.g. "Yash's Kitchen", "7/12 Cloud Kitchen", "Maa Ki Rasoi")
    if (availableKitchens && availableKitchens.length > 0) {
      availableKitchens.forEach((k) => {
        if (k.name && matchesSearchQuery(k.name, searchQuery)) {
          const key = `kitchen-${k.name.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({
              id: `kitchen-${k.id}`,
              title: k.name,
              type: "kitchen",
              subtitle: k.category || "Cloud Kitchen",
              link: `/shop/${k.trackingId || k.id}`,
            });
          }
        }
      });
    }

    // 2. Check available items / dishes
    availableItems.forEach((item) => {
      if (item.name && matchesSearchQuery(item.name, searchQuery)) {
        const key = `dish-${item.name.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: `food-${item.id}`,
            title: item.name,
            type: "dish",
            subtitle: item.categoryName || "Dish",
            link: item.sellerTrackingId ? `/shop/${item.sellerTrackingId}` : undefined,
          });
        }
      }
    });

    // 3. Check available rooms
    if (availableRooms && availableRooms.length > 0) {
      availableRooms.forEach((r) => {
        if (r.title && matchesSearchQuery(r.title, searchQuery)) {
          const key = `room-${r.title.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({
              id: `room-${r.id}`,
              title: r.title,
              type: "room",
              subtitle: r.sellerCity || "Room / Stay",
              link: `/room-booking/${r.id}`,
            });
          }
        }
      });
    }

    // 4. Check quick tags & presets
    QUICK_TAGS.forEach((tag) => {
      if (matchesSearchQuery(tag.label, searchQuery)) {
        const key = `tag-${tag.label.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: `tag-${tag.id}`,
            title: tag.label,
            type: "tag",
            subtitle: "Popular Search",
          });
        }
      }
    });

    return suggestions.slice(0, 7);
  }, [searchQuery, availableItems, availableKitchens, availableRooms]);

  const executeSearch = (query: string, location?: string) => {
    const finalQuery = query.trim();
    if (finalQuery) {
      addSearch(finalQuery);
    }
    setIsSearchFocused(false);

    // 1. Check if user typed or searched a 6-digit pincode
    const pinMatch = finalQuery.match(/\b\d{6}\b/);
    if (pinMatch) {
      const pin = pinMatch[0];
      setGuestLocation(pin);
      setSelectedLocation(`PIN: ${pin}`);
      if (onSearch) {
        onSearch(finalQuery, location || `PIN: ${pin}`);
      }
      if (typeof window !== "undefined") {
        const el = document.getElementById("places-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    // 2. If onSearch handler is provided (e.g. Home Page), invoke it and scroll in-place
    if (onSearch) {
      onSearch(finalQuery, location || selectedLocation);
      if (typeof window !== "undefined") {
        const el = document.getElementById("places-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      const params = new URLSearchParams();
      if (finalQuery) params.set("query", finalQuery);
      if (location || selectedLocation) params.set("location", location || selectedLocation);
      router.push(`/explore-desktop?${params.toString()}`);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleTagClick = (tag: typeof QUICK_TAGS[0]) => {
    setActiveTag(tag.id);
    setSearchQuery(tag.label);
    executeSearch(tag.label);
  };

  // GPS Current Location Detection
  const handleDetectGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCoords({ lat, lng });

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            const suburb = address.suburb || address.neighbourhood || address.residential || address.city_district || "";
            const city = address.city || address.town || address.state_district || "Pune";
            const postcode = address.postcode || "411038";

            const formatted = suburb ? `${suburb}, ${city}` : `${city} (${postcode})`;
            setSelectedLocation(formatted);
            setGuestLocation(postcode);
          }
        } catch {
          setSelectedLocation("Current GPS Location");
        } finally {
          setIsDetectingLocation(false);
          setIsLocationOpen(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        alert("Unable to retrieve your location. Please select from the list or pick on map.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Confirm Location Picked from Map Modal
  const handleConfirmMapLocation = () => {
    if (pickedAddressDetails) {
      const { street, landmark, pincode } = pickedAddressDetails;
      const formatted = street || landmark
        ? `${street || landmark}, Pune`
        : pincode
        ? `PIN: ${pincode}`
        : "Selected Location";
      setSelectedLocation(formatted);
      if (pincode) {
        setGuestLocation(pincode);
      }
    }
    setIsMapModalOpen(false);
    setIsLocationOpen(false);
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
          From local cloud kitchens to authentic tiffins, discover freshly cooked meals near you.
        </p>

        {/* Search Pill Bar & Floating Autocomplete Popover Container */}
        <div ref={searchBoxRef} style={{ position: "relative", width: "100%", maxWidth: "540px" }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "27px",
              height: "54px",
              padding: "0 0 0 18px",
              display: "flex",
              alignItems: "center",
              boxShadow: isSearchFocused
                ? "0 14px 36px rgba(255, 107, 0, 0.18), 0 2px 10px rgba(0,0,0,0.04)"
                : "0 10px 30px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)",
              border: isSearchFocused ? "1.5px solid #FF6B00" : "1px solid #F1F5F9",
              position: "relative",
              margin: "4px 0 0 0",
              width: "100%",
              boxSizing: "border-box",
              transition: "all 0.2s ease",
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
              <Search size={19} color={isSearchFocused ? "#FF6B00" : "#94A3B8"} />
              <input
                type="text"
                placeholder="Search for dishes, kitchens, tiffins..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
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
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "#94A3B8",
                  }}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
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
              ref={locationBoxRef}
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
              onClick={() => openLocationModal()}
            >
              <MapPin size={17} color="#FF6B00" />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#0F172A",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  maxWidth: "130px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={selectedLocation}
              >
                {selectedLocation}
              </span>
              <ChevronDown size={14} color="#64748B" />

              {/* Location Dropdown with Map & Geolocation Actions */}
              {isLocationOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.16)",
                    borderRadius: "16px",
                    padding: "10px 0",
                    minWidth: "240px",
                    zIndex: 35,
                    border: "1px solid #E2E8F0",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Action 1: GPS Geolocation */}
                  <div
                    onClick={handleDetectGPSLocation}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 18px",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      color: "#FF6B00",
                      backgroundColor: "#FFF5EC",
                      cursor: "pointer",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <Navigation size={16} />
                    <span>{isDetectingLocation ? "Detecting GPS..." : "Use Current Location"}</span>
                  </div>

                  {/* Action 2: Choose on Map */}
                  <div
                    onClick={() => {
                      setIsLocationOpen(false);
                      setIsMapModalOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 18px",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      color: "#334155",
                      cursor: "pointer",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <MapIcon size={16} color="#64748B" />
                    <span>Choose Location on Map</span>
                  </div>

                  {/* Popular Areas Header */}
                  <div style={{ padding: "8px 18px 4px", fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>
                    Popular Areas
                  </div>

                  {/* Presets List */}
                  {PRESET_LOCATIONS.map((loc) => {
                    const isSelected = selectedLocation.includes(loc.name);
                    return (
                      <div
                        key={loc.name}
                        onClick={() => {
                          setSelectedLocation(loc.name);
                          setGuestLocation(loc.pincode);
                          setIsLocationOpen(false);
                        }}
                        style={{
                          padding: "8px 18px",
                          fontSize: "13.5px",
                          color: isSelected ? "#FF6B00" : "#334155",
                          fontWeight: isSelected ? "700" : "400",
                          backgroundColor: isSelected ? "#FFF3EB" : "transparent",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#FFF3EB";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "#FFF3EB" : "transparent";
                        }}
                      >
                        <span>{loc.name}</span>
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>{loc.pincode}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Submit Button */}
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

          {/* Autocomplete & Recent Searches Floating Panel */}
          {isSearchFocused && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: 0,
                right: 0,
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                boxShadow: "0 18px 40px rgba(0, 0, 0, 0.14)",
                border: "1px solid #E2E8F0",
                padding: "18px",
                zIndex: 40,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* 1. Live Match Suggestions (if typing) */}
              {liveSuggestions.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "8px" }}>
                    <Sparkles size={13} color="#FF6B00" />
                    <span>SUGGESTED DISHES, RESTAURANTS &amp; ROOMS</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {liveSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.link) {
                            setIsSearchFocused(false);
                            router.push(item.link);
                          } else {
                            setSearchQuery(item.title);
                            executeSearch(item.title);
                          }
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#0F172A",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF5EE")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {item.type === "kitchen" ? (
                            <Store size={15} color="#FF6B00" />
                          ) : item.type === "room" ? (
                            <BedDouble size={15} color="#3B82F6" />
                          ) : item.type === "dish" ? (
                            <Utensils size={15} color="#10B981" />
                          ) : (
                            <Search size={14} color="#94A3B8" />
                          )}
                          <span>{item.title}</span>
                        </div>
                        {item.subtitle && (
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: "600",
                              color:
                                item.type === "kitchen"
                                  ? "#EA580C"
                                  : item.type === "room"
                                  ? "#2563EB"
                                  : "#64748B",
                              backgroundColor:
                                item.type === "kitchen"
                                  ? "#FFF7ED"
                                  : item.type === "room"
                                  ? "#EFF6FF"
                                  : "#F1F5F9",
                              padding: "2px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Recent Searches History */}
              {recentSearches.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#64748B" }}>
                      <History size={13} color="#94A3B8" />
                      <span>RECENT SEARCHES</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearSearches}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94A3B8",
                        fontSize: "11.5px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: "20px",
                          padding: "4px 12px",
                          fontSize: "12.5px",
                          color: "#334155",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSearchQuery(term);
                          executeSearch(term);
                        }}
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearch(term);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: "#94A3B8",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Trending Searches */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "8px" }}>
                  <TrendingUp size={13} color="#FF6B00" />
                  <span>POPULAR TRENDING</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {trendingSearches.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        executeSearch(tag);
                      }}
                      style={{
                        backgroundColor: "#FFF5EE",
                        border: "1px solid #FFE4D3",
                        borderRadius: "20px",
                        padding: "4px 12px",
                        fontSize: "12.5px",
                        color: "#FF6B00",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

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

      {/* HeroRight Graphic Column */}
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

      {/* Map Picker Modal */}
      {isMapModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setIsMapModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "600px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={22} color="#FF6B00" />
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                  Select Delivery Location on Map
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.88rem", color: "#64748B", margin: 0 }}>
              Drag the pin or click on the map to select your address. Available cloud kitchens will update automatically.
            </p>

            <div style={{ height: "300px", borderRadius: "16px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
              <HouseMapPicker
                latitude={mapCoords.lat}
                longitude={mapCoords.lng}
                onChange={(lat, lng, details) => {
                  setMapCoords({ lat, lng });
                  if (details) {
                    setPickedAddressDetails(details);
                  }
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  color: "#475569",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMapLocation}
                style={{
                  padding: "10px 22px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "#FF6B00",
                  color: "#FFFFFF",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Set This Location
              </button>
            </div>
          </div>
        </div>
      )}

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
            padding: 28px 18px !important;
            text-align: center;
            gap: 16px !important;
          }
          .hero-left-column {
            width: 100% !important;
            max-width: 100% !important;
            align-items: center;
            gap: 14px !important;
          }
          .hero-title-dark,
          .hero-title-orange {
            font-size: 34px !important;
            line-height: 1.2 !important;
          }
          .hero-tags-wrapper {
            justify-content: center;
          }
          .hero-right-column {
            width: 100% !important;
            max-width: 320px !important;
            min-height: auto !important;
            height: auto !important;
            margin: 0 auto !important;
          }
          .hero-right-column > div {
            min-height: auto !important;
            height: auto !important;
          }
          .hero-right-column img {
            max-height: 240px !important;
            width: auto !important;
          }
        }
        @media (max-width: 768px) {
          .hero-section-container {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .hero-section-container {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
