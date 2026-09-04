"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { NotificationsHeader } from "@/components/notifications-desktop/notifications-header";
import { PushNotifications } from "@/components/notifications-desktop/push-notifications";
import { EmailNotifications } from "@/components/notifications-desktop/email-notifications";
import { SmsNotifications } from "@/components/notifications-desktop/sms-notifications";

export default function NotificationsDesktopPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF4E6", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Desktop Navbar with Settings Active */}
      <Navbar
        navItems={["Home", "Explore", "Orders", "Rooms", "Settings"]}
        initialActiveItem="Settings"
      />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "32px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* Left Column: Shared Profile Sidebar with Notifications Active */}
          <SettingsSidebar activeTabId="notifications" />

          {/* Right Column: Notifications Content Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 2. Notifications Header */}
            <NotificationsHeader />

            {/* 3. Push Notifications Card */}
            <PushNotifications />

            {/* 4. Email Notifications Card */}
            <EmailNotifications />

            {/* 5. SMS Notifications Card */}
            <SmsNotifications />
          </div>
        </div>
      </main>
    </div>
  );
}