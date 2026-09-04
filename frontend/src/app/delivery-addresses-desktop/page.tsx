"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { AddressesHeader } from "@/components/delivery-addresses-desktop/addresses-header";
import { SavedAddresses } from "@/components/delivery-addresses-desktop/saved-addresses";
import { AddAddressButton } from "@/components/delivery-addresses-desktop/add-address-button";

export default function DeliveryAddressesDesktopPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Settings"
      />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* Left Column: Shared Profile Sidebar with Delivery Addresses Active */}
          <SettingsSidebar activeTabId="delivery-addresses" />

          {/* Right Column: Delivery Addresses Content Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>
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