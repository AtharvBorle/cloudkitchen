"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { TermsHeader, TermsContent } from "@/components/terms-desktop";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "./TermsPage.module.css";

export default function TermsAndConditionsPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Modular Settings Sidebar (hidden on mobile <=992px) */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="terms" />
          </div>

          {/* Right Column: Terms & Conditions Content */}
          <div className={styles.contentWrapper}>
            {/* 2. Page Header */}
            <TermsHeader />

            {/* 3. Terms & Conditions Dedicated Sections */}
            <TermsContent />
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}
