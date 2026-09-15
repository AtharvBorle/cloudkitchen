"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { RateAppHeader, RatingExperience } from "@/components/rate-app-desktop";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "./RateAppPage.module.css";

export default function RateAppPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Top Navbar with Settings Active */}
      <div className={styles.desktopNavbar}>
        <Navbar
          navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
          initialActiveItem="Settings"
          hideSearch={true}
          hideVegToggle={true}
        />
      </div>

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Modular Settings Sidebar (hidden on mobile <=992px) */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="rate" />
          </div>

          {/* Right Column: Rate Our App Experience */}
          <div className={styles.contentWrapper}>
            {/* 2. Page Header */}
            <RateAppHeader />

            {/* 3. Interactive Rating & Review Form */}
            <RatingExperience />
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}
