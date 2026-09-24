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
import { useLocation } from "@/components/location-provider";
import {
  calculateDistanceKm,
  formatDistance,
  getPincodeCoordinates,
} from "@/lib/geo-distance";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "./page.module.css";

function RoomBookingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("query") || searchParams?.get("q") || "";
  const initialCity = searchParams?.get("city") || searchParams?.get("location") || "all";

  const { defaultAddress } = useLocation();
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialCity);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string>("all");
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  // Initialize selected location/coordinates from LocationProvider if not explicitly selected
  useEffect(() => {
    if (defaultAddress && (!selectedLocation || selectedLocation === "all") && !selectedCoords) {
      if (defaultAddress.latitude && defaultAddress.longitude) {
        setSelectedCoords({
          lat: Number(defaultAddress.latitude),
          lng: Number(defaultAddress.longitude),
        });
      } else if (defaultAddress.pincode) {
        const pinCoords = getPincodeCoordinates(defaultAddress.pincode);
        if (pinCoords) {
          setSelectedCoords({ lat: pinCoords.lat, lng: pinCoords.lng });
        }
      }
    }
  }, [defaultAddress, selectedLocation, selectedCoords]);

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

  // Derive unique locations dynamically from DB rooms with live room counts
  const availableLocations = useMemo(() => {
    const locMap = new Map<string, number>();
    allRooms.forEach((r) => {
      const candidates: string[] = [];
      if (r.sellerLocality) {
        const clean = r.sellerLocality.split(",")[0].trim();
        if (clean.length < 30) candidates.push(clean);
      }
      if (r.sellerCity) candidates.push(r.sellerCity);
      if (r.sellerPincode) candidates.push(`PIN: ${r.sellerPincode}`);

      candidates.forEach((name) => {
        locMap.set(name, (locMap.get(name) || 0) + 1);
      });
    });

    return Array.from(locMap.entries()).map(([name, count]) => ({
      name,
      count,
      label: count > 1 ? `${name} (${count} stays)` : `${name} (1 stay)`,
    }));
  }, [allRooms]);

  // Dynamic multi-dimensional filtering & nearest distance calculation
  const filteredRooms = useMemo(() => {
    // 1. Resolve coordinates for distance calculation
    let activeLat = selectedCoords?.lat ?? null;
    let activeLng = selectedCoords?.lng ?? null;

    if (activeLat === null || activeLng === null) {
      if (selectedLocation && selectedLocation !== "all") {
        const pinMatch = selectedLocation.match(/\b\d{6}\b/);
        if (pinMatch) {
          const pinCoords = getPincodeCoordinates(pinMatch[0]);
          if (pinCoords) {
            activeLat = pinCoords.lat;
            activeLng = pinCoords.lng;
          }
        }
      } else if (defaultAddress?.latitude && defaultAddress?.longitude) {
        activeLat = Number(defaultAddress.latitude);
        activeLng = Number(defaultAddress.longitude);
      }
    }

    const hasCoords = activeLat !== null && activeLng !== null;

    // 2. Enrich rooms with distance
    const enriched = allRooms.map((room) => {
      let roomLat = room.sellerLatitude ?? room.latitude ?? null;
      let roomLng = room.sellerLongitude ?? room.longitude ?? null;
      if ((roomLat === null || roomLng === null) && room.sellerPincode) {
        const pinCoords = getPincodeCoordinates(room.sellerPincode);
        if (pinCoords) {
          roomLat = pinCoords.lat;
          roomLng = pinCoords.lng;
        }
      }

      if (hasCoords && roomLat !== null && roomLng !== null) {
        const dist = calculateDistanceKm(activeLat!, activeLng!, Number(roomLat), Number(roomLng));
        return {
          ...room,
          distanceKm: dist,
          distanceText: `${formatDistance(dist)} away`,
        };
      }
      return room;
    });

    // 3. Filter rooms by location, budget, roomType, and query
    const results = enriched.filter((room) => {
      // 1. Location filter
      if (selectedLocation && selectedLocation !== "all") {
        const locLower = selectedLocation.toLowerCase().trim();
        const matchesLoc =
          (room.sellerLocality && room.sellerLocality.toLowerCase().includes(locLower)) ||
          (room.sellerCity && room.sellerCity.toLowerCase().includes(locLower)) ||
          (room.sellerLandmark && room.sellerLandmark.toLowerCase().includes(locLower)) ||
          (room.sellerPincode && room.sellerPincode.includes(locLower)) ||
          (room.title && room.title.toLowerCase().includes(locLower)) ||
          (room.distanceKm !== undefined && room.distanceKm <= 35);
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

    // 4. Sort results by nearest distance first when coords are available
    if (hasCoords) {
      results.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return 0;
      });
    }

    return results;
  }, [allRooms, selectedLocation, selectedCoords, defaultAddress, selectedBudget, selectedRoomType, searchQuery]);

  const handleSearchAction = () => {
    const el = document.getElementById("available-rooms-grid");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleResetFilters = () => {
    setSelectedLocation("all");
    setSelectedCoords(null);
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

          {/* Interactive Dynamic Search & Filter Bar with OpenStreetMap Picker */}
          <RoomSearchFilter
            location={selectedLocation}
            budget={selectedBudget}
            roomType={selectedRoomType}
            availableLocations={availableLocations}
            onLocationChange={(loc, coords) => {
              setSelectedLocation(loc);
              if (coords !== undefined) {
                setSelectedCoords(coords);
              }
            }}
            onBudgetChange={(b) => setSelectedBudget(b)}
            onRoomTypeChange={(t) => setSelectedRoomType(t)}
            onSearch={handleSearchAction}
            onReset={handleResetFilters}
          />

          {/* Featured Top Colivings / Stays */}
          <FeaturedColivings rooms={filteredRooms.length > 0 ? filteredRooms : allRooms} />

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
        <Footer />
      </div>

      {/* 2. Mobile View (<=768px) matching native mobile design */}
      <div className={styles.mobileOnly}>
        <RoomBookingMobileView rooms={filteredRooms} />
        <Footer />
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
