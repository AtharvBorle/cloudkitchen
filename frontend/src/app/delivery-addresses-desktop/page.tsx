"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { AddressesHeader } from "@/components/delivery-addresses-desktop/addresses-header";
import { SavedAddresses } from "@/components/delivery-addresses-desktop/saved-addresses";
import { AddAddressButton } from "@/components/delivery-addresses-desktop/add-address-button";

import styles from "./DeliveryAddressesPage.module.css";

export default function DeliveryAddressesDesktopPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
      <div className={styles.desktopNavbar}>
        <Navbar
          navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
          initialActiveItem="Settings"
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
            {/* 2. Delivery Addresses Header */}
            <AddressesHeader />

            {/* 3. Saved Delivery Addresses Grid */}
            <SavedAddresses />

            {/* 4. Add New Address Button */}
            <AddAddressButton />
          </div>
        </div>
      </main>
    </div>
  );
}