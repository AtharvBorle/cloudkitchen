"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { PaymentHeader } from "@/components/payment-methods-desktop/payment-header";
import { SavedCards } from "@/components/payment-methods-desktop/saved-cards";
import { UpiIds } from "@/components/payment-methods-desktop/upi-ids";
import { OtherPaymentMethods } from "@/components/payment-methods-desktop/other-payment-methods";
import { AddPaymentButton } from "@/components/payment-methods-desktop/add-payment-button";
import { Footer } from "@/components/explore-desktop/footer";

import styles from "./PaymentMethodsPage.module.css";

export default function PaymentMethodsDesktopPage() {
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
          {/* Left Column: Shared Profile Sidebar with Payment Methods Active */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="payment-methods" />
          </div>

          {/* Right Column: Payment Methods Content Sections */}
          <div className={styles.contentWrapper}>
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

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}