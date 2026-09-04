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

export default function MySubscriptionPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Desktop Navbar with 'Settings' Active */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Settings"
      />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* Left Column: Shared Profile Sidebar with 'My Subscriptions' Active */}
          <SettingsSidebar activeTabId="my-subscriptions" />

          {/* Right Column: My Subscriptions Content Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 2. Page Header */}
            <SubscriptionHeader />

            {/* 3. Daily Meal Plan Card (Active status, Started On, Renewal Date, Plan Price) */}
            <SubscriptionPlanCard />

            {/* 4. Pause Subscription Section */}
            <PauseSubscription />

            {/* 5. Two-column grid: Daily Delivery Times & Subscription Benefits */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
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
