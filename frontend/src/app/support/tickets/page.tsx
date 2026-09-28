"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SupportTickets } from "@/components/support-desktop/support-tickets";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "../SupportPage.module.css";
import { Loader2 } from "lucide-react";

export default function UserSupportTicketsPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Modular Settings Sidebar (hidden on mobile <=992px) */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="support-tickets" />
          </div>

          {/* Right Column: Support Tickets Content */}
          <div className={styles.contentWrapper}>
            <Suspense
              fallback={
                <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
                  <Loader2 className="animate-spin" color="#FF5500" size={32} />
                </div>
              }
            >
              <SupportTickets />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}
