"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SettingsHeader } from "@/components/settings-desktop/settings-header";
import { PersonalProfile } from "@/components/settings-desktop/personal-profile";
import { ActiveSubscriptionsNotifications } from "@/components/settings-desktop/active-subscriptions-notifications";
import { DeliveryAddresses } from "@/components/settings-desktop/delivery-addresses";
import { PaymentMethods } from "@/components/settings-desktop/payment-methods";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "./SettingsPage.module.css";

export default function SettingsDesktopPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar */}
      <div className={styles.desktopNavbar}>
        <Navbar />
      </div>

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Modular Settings Sidebar (hidden on mobile <=992px) */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar />
          </div>

          {/* Right Column: Modular Settings Content Sections */}
          <div className={styles.contentWrapper}>
            {/* 2. General Settings Header with mobile hamburger */}
            <SettingsHeader />

            {/* 3. Personal Profile Card */}
            <PersonalProfile />

            {/* 4. Active Subscriptions & Notifications Summary Grid */}
            <ActiveSubscriptionsNotifications />

            {/* 5. Delivery Addresses Section */}
            <DeliveryAddresses />

            {/* 
              6. PAYMENT METHODS SECTION (Disabled via comment - uncomment to re-enable in future)
            <PaymentMethods />
            */}
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}
