"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SubscriptionHeader } from "@/components/my-subscription/subscription-header";
import { SubscriptionPlanCard } from "@/components/my-subscription/subscription-plan-card";
import { PauseSubscription } from "@/components/my-subscription/pause-subscription";
import { DeliveryTimes } from "@/components/my-subscription/delivery-times";
import { SubscriptionBenefits } from "@/components/my-subscription/subscription-benefits";
import { SubscriptionActions } from "@/components/my-subscription/subscription-actions";
import styles from "./MySubscriptionPage.module.css";

export default function MySubscriptionPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar with 'Settings' Active (hidden on mobile <=768px) */}
      <div className={styles.desktopNavbar}>
        <Navbar
          navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
          initialActiveItem="Settings"
        />
      </div>

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Shared Profile Sidebar (hidden on mobile <=992px) */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="my-subscriptions" />
          </div>

          {/* Right Column: My Subscriptions Content Sections */}
          <div className={styles.contentWrapper}>
            {/* 2. Page Header with mobile hamburger */}
            <SubscriptionHeader />

            {/* 3. Daily Meal Plan Card */}
            <SubscriptionPlanCard />

            {/* 4. Pause Subscription Section */}
            <PauseSubscription />

            {/* 5. Two-column grid: Daily Delivery Times & Subscription Benefits */}
            <div className={styles.detailsGrid}>
              <DeliveryTimes />
              <SubscriptionBenefits />
            </div>

            {/* 6. Action Buttons: Cancel Subscription & Change Plan */}
            <SubscriptionActions />
          </div>
        </div>
      </main>
    </div>
  );
}
