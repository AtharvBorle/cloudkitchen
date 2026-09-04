"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { RoomBookingHeroBanner } from "@/components/room-booking-desktop/room-booking-herobanner";
import { RoomSearchFilter } from "@/components/room-booking-desktop/room-search-filter";
import { FeaturedColivings } from "@/components/room-booking-desktop/featured-colivings";
import { AllAvailableRooms } from "@/components/room-booking-desktop/all-available-rooms";

export default function RoomBookingPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Navbar with Rooms Active */}
      <Navbar initialActiveItem="Rooms" />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "24px 32px 64px 32px", boxSizing: "border-box" }}>
        {/* 2. Room Booking Hero Banner */}
        <RoomBookingHeroBanner />

        {/* 3. Room Search Filter */}
        <RoomSearchFilter />

        {/* 4. Featured Premium Co-livings */}
        <FeaturedColivings />

        {/* 5. All Available Rooms */}
        <AllAvailableRooms />
      </main>
    </div>
  );
}
