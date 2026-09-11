"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SupportHeader, FaqAccordion } from "@/components/support-desktop";
import styles from "./SupportPage.module.css";

export default function HelpFaqPage() {
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
            <SettingsSidebar activeTabId="help-faq" />
          </div>

          {/* Right Column: Help & FAQ Content */}
          <div className={styles.contentWrapper}>
            {/* 2. Page Header */}
            <SupportHeader />

            {/* 3. Search & Interactive FAQ Accordion List */}
            <FaqAccordion />
          </div>
        </div>
      </main>
    </div>
  );
}
