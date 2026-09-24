"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SettingsHeader } from "@/components/settings-desktop/settings-header";
import { PersonalProfile } from "@/components/settings-desktop/personal-profile";
import { ActiveSubscriptionsNotifications } from "@/components/settings-desktop/active-subscriptions-notifications";
import { DeliveryAddresses } from "@/components/settings-desktop/delivery-addresses";
import { GuestSettingsView } from "@/components/settings-desktop/guest-settings";
import { PaymentMethods } from "@/components/settings-desktop/payment-methods";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "./SettingsPage.module.css";

export default function SettingsDesktopPage() {
  const { data: session } = useSession();

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar */}
      <div className={styles.desktopNavbar}>
        <Navbar initialActiveItem="Settings" />
      </div>

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Modular Settings Sidebar (hidden on mobile <=992px) */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="general-overview" />
          </div>

          {/* Right Column: Modular Settings Content Sections */}
          <div className={styles.contentWrapper}>
            {session?.user ? (
              <>
                {/* 2. General Settings Header with mobile hamburger */}
                <SettingsHeader />

                {/* 3. Personal Profile Card */}
                <PersonalProfile />

                {/* 4. Active Subscriptions & Notifications Summary Grid */}
                <ActiveSubscriptionsNotifications />

                {/* 5. Delivery Addresses Section */}
                <DeliveryAddresses />

                {/* 6. Payment Methods Section (Disabled via comment - uncomment to re-enable in future) */}
                {/* <PaymentMethods /> */}
              </>
            ) : (
              <GuestSettingsView />
            )}
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}
