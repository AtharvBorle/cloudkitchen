"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SettingsHeader } from "@/components/settings-desktop/settings-header";
import { PersonalProfile } from "@/components/settings-desktop/personal-profile";
import { ActiveSubscriptionsNotifications } from "@/components/settings-desktop/active-subscriptions-notifications";
import { DeliveryAddresses } from "@/components/settings-desktop/delivery-addresses";
import { PaymentMethods } from "@/components/settings-desktop/payment-methods";

export default function SettingsDesktopPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Desktop Navbar with 'Settings' Active */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Settings"
      />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* Left Column: Modular Settings Sidebar */}
          <SettingsSidebar />

          {/* Right Column: Modular Settings Content Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 2. General Settings Header */}
            <SettingsHeader />

            {/* 3. Personal Profile Card */}
            <PersonalProfile />

            {/* 4. Active Subscriptions & Notifications Summary Grid */}
            <ActiveSubscriptionsNotifications />

            {/* 5. Delivery Addresses Section */}
            <DeliveryAddresses />

            {/* 6. Payment Methods Section */}
            <PaymentMethods />
          </div>
        </div>
      </main>
    </div>
  );
}
