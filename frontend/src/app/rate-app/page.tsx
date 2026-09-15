"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { RateAppHeader, RatingExperience } from "@/components/rate-app-desktop";
import styles from "./RateAppPage.module.css";

export default function RateAppPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

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
    </div>
  );
}
