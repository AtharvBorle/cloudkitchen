"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { RoomBookingHeroBanner } from "@/components/room-booking-desktop/room-booking-herobanner";
import { RoomSearchFilter } from "@/components/room-booking-desktop/room-search-filter";
import { FeaturedColivings } from "@/components/room-booking-desktop/featured-colivings";
import { AllAvailableRooms } from "@/components/room-booking-desktop/all-available-rooms";
import { RoomBookingMobileView } from "@/components/room-booking-desktop/room-booking-mobile";
import styles from "./page.module.css";

function RoomBookingContent() {
  return (
    <div className={styles.pageContainer}>
      {/* 1. Desktop & Tablet View (>768px) */}
      <div className={styles.desktopOnly}>
        <Navbar initialActiveItem="Rooms" />
        <main className={styles.desktopMain}>
          <RoomBookingHeroBanner />
          <RoomSearchFilter />
          <FeaturedColivings />
          <AllAvailableRooms />
        </main>
      </div>

      {/* 2. Mobile View (<=768px) matching native mobile design */}
      <div className={styles.mobileOnly}>
        <RoomBookingMobileView />
      </div>
    </div>
  );
}

export default function RoomBookingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#FFF8F2", padding: "40px", textAlign: "center" }}>Loading rooms...</div>}>
      <RoomBookingContent />
    </Suspense>
  );
}
