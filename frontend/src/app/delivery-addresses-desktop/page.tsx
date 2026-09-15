"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { DeliveryAddresses } from "@/components/settings-desktop/delivery-addresses";

import styles from "./DeliveryAddressesPage.module.css";

export default function DeliveryAddressesDesktopPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
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
          {/* Left Column: Shared Profile Sidebar with Delivery Addresses Active */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="delivery-addresses" />
          </div>

          {/* Right Column: Delivery Addresses Content Sections */}
          <div className={styles.contentWrapper}>
            <DeliveryAddresses />
          </div>
        </div>
      </main>
    </div>
  );
}