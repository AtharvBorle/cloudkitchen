"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { RoomBookingHeroBanner } from "@/components/room-booking-desktop/room-booking-herobanner";
import { RoomSearchFilter } from "@/components/room-booking-desktop/room-search-filter";
import { FeaturedColivings } from "@/components/room-booking-desktop/featured-colivings";
import { AllAvailableRooms } from "@/components/room-booking-desktop/all-available-rooms";
import { RoomBookingMobileView } from "@/components/room-booking-desktop/room-booking-mobile";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./page.module.css";

function RoomBookingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("query") || searchParams?.get("q") || "";
  const initialCity = searchParams?.get("city") || searchParams?.get("location") || "all";

  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialCity);
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  // Fetch all rooms from live database
  useEffect(() => {
    async function loadRooms() {
      setLoading(true);
      try {
        const res = await fetchApi("/api/public/rooms");
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json;
          if (Array.isArray(list)) {
            setAllRooms(list);
          }
        }
      } catch (err) {
        console.error("Failed to load rooms:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, []);

  // Derive unique locations dynamically from DB rooms
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    allRooms.forEach((r) => {
      if (r.sellerLocality) {
        // If locality is long, extract first part or main area name
        const clean = r.sellerLocality.split(",")[0].trim();
        if (clean.length < 30) locSet.add(clean);
      }
      if (r.sellerCity) locSet.add(r.sellerCity);
    });
    return Array.from(locSet);
  }, [allRooms]);

  // Dynamic multi-dimensional filtering
  const filteredRooms = useMemo(() => {
    return allRooms.filter((room) => {
      // 1. Location filter
      if (selectedLocation && selectedLocation !== "all") {
        const locLower = selectedLocation.toLowerCase();
        const matchesLoc =
          (room.sellerLocality && room.sellerLocality.toLowerCase().includes(locLower)) ||
          (room.sellerCity && room.sellerCity.toLowerCase().includes(locLower)) ||
          (room.sellerLandmark && room.sellerLandmark.toLowerCase().includes(locLower)) ||
          (room.sellerPincode && room.sellerPincode.includes(locLower)) ||
          (room.title && room.title.toLowerCase().includes(locLower));
        if (!matchesLoc) return false;
      }

      // 2. Budget filter
      if (selectedBudget && selectedBudget !== "all") {
        const price = Number(room.price) || 0;
        if (selectedBudget === "under-1000" && price > 1000) return false;
        if (selectedBudget === "1000-3000" && (price < 1000 || price > 3000)) return false;
        if (selectedBudget === "3000-6000" && (price < 3000 || price > 6000)) return false;
        if (selectedBudget === "6000-plus" && price < 6000) return false;
      }

      // 3. Room Type filter
      if (selectedRoomType && selectedRoomType !== "all") {
        const cap = Number(room.capacity) || 1;
        if (selectedRoomType === "1" && cap !== 1) return false;
        if (selectedRoomType === "2" && cap !== 2) return false;
        if (selectedRoomType === "3" && cap !== 3) return false;
        if (selectedRoomType === "4" && cap < 4) return false;
      }

      // 4. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ =
          (room.title && room.title.toLowerCase().includes(q)) ||
          (room.description && room.description.toLowerCase().includes(q)) ||
          (room.sellerName && room.sellerName.toLowerCase().includes(q)) ||
          (room.sellerLocality && room.sellerLocality.toLowerCase().includes(q)) ||
          (room.sellerCity && room.sellerCity.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }

      return true;
    });
  }, [allRooms, selectedLocation, selectedBudget, selectedRoomType, searchQuery]);

  const handleSearchAction = () => {
    const el = document.getElementById("available-rooms-grid");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleResetFilters = () => {
    setSelectedLocation("all");
    setSelectedBudget("all");
    setSelectedRoomType("all");
    setSearchQuery("");
  };

  return (
    <div className={styles.pageContainer}>
      {/* 1. Desktop & Tablet View (>768px) */}
      <div className={styles.desktopOnly}>
        <Navbar initialActiveItem="Rooms" />
        <main className={styles.desktopMain}>
          <RoomBookingHeroBanner />

          {/* Interactive Dynamic Search & Filter Bar */}
          <RoomSearchFilter
            location={selectedLocation}
            budget={selectedBudget}
            roomType={selectedRoomType}
            availableLocations={availableLocations}
            onLocationChange={(loc) => setSelectedLocation(loc)}
            onBudgetChange={(b) => setSelectedBudget(b)}
            onRoomTypeChange={(t) => setSelectedRoomType(t)}
            onSearch={handleSearchAction}
            onReset={handleResetFilters}
          />

          {/* Featured Top Colivings / Stays */}
          <FeaturedColivings rooms={allRooms} />

          {/* All Filtered Available Rooms Grid */}
          <AllAvailableRooms
            rooms={filteredRooms}
            searchQuery={searchQuery}
            activeLocation={selectedLocation}
            activeBudget={selectedBudget}
            activeRoomType={selectedRoomType}
            onReset={handleResetFilters}
          />
        </main>
      </div>

      {/* 2. Mobile View (<=768px) matching native mobile design */}
      <div className={styles.mobileOnly}>
        <RoomBookingMobileView rooms={filteredRooms} />
      </div>
    </div>
  );
}

export default function RoomBookingPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#FFF8F2",
            padding: "40px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
            color: "#64748B",
            fontWeight: "600",
          }}
        >
          Loading available rooms & stays...
        </div>
      }
    >
      <RoomBookingContent />
    </Suspense>
  );
}

