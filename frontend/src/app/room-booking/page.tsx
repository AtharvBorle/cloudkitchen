"use client";

import React from "react";
import { Navbar } from "@/components/room-booking-desktop/navbar";
import { RoomBookingHeroBanner } from "@/components/room-booking-desktop/room-booking-herobanner";
import { RoomSearchFilter } from "@/components/room-booking-desktop/room-search-filter";
import { FeaturedColivings } from "@/components/room-booking-desktop/featured-colivings";
import { AllAvailableRooms } from "@/components/room-booking-desktop/all-available-rooms";
import { RoomBookingMobileView } from "@/components/room-booking-desktop/room-booking-mobile";
import styles from "./page.module.css";

export default function RoomBookingPage() {
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

      {/* 2. Mobile View (<=768px) matching native mobile design (No bottom navigation bar) */}
      <div className={styles.mobileOnly}>
        <RoomBookingMobileView />
      </div>
    </div>
  );
}
