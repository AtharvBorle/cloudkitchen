"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { PrivacyHeader, PrivacyContent } from "@/components/privacy-desktop";
import styles from "./PrivacyPage.module.css";

export default function PrivacyPolicyPage() {
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
            <SettingsSidebar activeTabId="privacy" />
          </div>

          {/* Right Column: Privacy Policy Content */}
          <div className={styles.contentWrapper}>
            {/* 2. Page Header */}
            <PrivacyHeader />

            {/* 3. Privacy Policy Detailed Sections */}
            <PrivacyContent />
          </div>
        </div>
      </main>
    </div>
  );
}
