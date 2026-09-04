"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { PaymentHeader } from "@/components/payment-methods-desktop/payment-header";
import { SavedCards } from "@/components/payment-methods-desktop/saved-cards";
import { UpiIds } from "@/components/payment-methods-desktop/upi-ids";
import { OtherPaymentMethods } from "@/components/payment-methods-desktop/other-payment-methods";
import { AddPaymentButton } from "@/components/payment-methods-desktop/add-payment-button";

export default function PaymentMethodsDesktopPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Settings"
      />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* Left Column: Shared Profile Sidebar with Payment Methods Active */}
          <SettingsSidebar activeTabId="payment-methods" />

          {/* Right Column: Payment Methods Content Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 2. Payment Methods Header */}
            <PaymentHeader />

            {/* 3. Saved Cards Section */}
            <SavedCards />

            {/* 4. UPI IDs Section */}
            <UpiIds />

            {/* 5. Other Payment Methods Section */}
            <OtherPaymentMethods />

            {/* 6. Add New Payment Method Full Width Button */}
            <AddPaymentButton />
          </div>
        </div>
      </main>
    </div>
  );
}