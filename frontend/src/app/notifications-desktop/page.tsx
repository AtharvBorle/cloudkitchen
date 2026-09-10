"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { NotificationsHeader } from "@/components/notifications-desktop/notifications-header";
import { PushNotifications } from "@/components/notifications-desktop/push-notifications";
import { EmailNotifications } from "@/components/notifications-desktop/email-notifications";
import { SmsNotifications } from "@/components/notifications-desktop/sms-notifications";
import styles from "./NotificationsPage.module.css";

export default function NotificationsDesktopPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. Shared Desktop Navbar with Settings Active (hidden on mobile <=768px) */}
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
            <SettingsSidebar activeTabId="notifications" />
          </div>

          {/* Right Column: Notifications Content Sections */}
          <div className={styles.contentWrapper}>
            {/* 2. Notifications Header with mobile hamburger */}
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