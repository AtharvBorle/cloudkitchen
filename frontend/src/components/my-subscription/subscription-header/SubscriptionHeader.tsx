"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./SubscriptionHeader.module.css";

export interface SubscriptionHeaderProps {
  title?: string;
  subtitle?: string;
}

export const SubscriptionHeader: React.FC<SubscriptionHeaderProps> = ({
  title = "My Subscriptions",
  subtitle = "Manage your active daily meals, delivery schedule, and billing preferences.",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.headerContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="My Subscriptions"
      />

      <div className={styles.headerTopRow}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Open navigation menu"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} strokeWidth={2.2} />
        </button>

        <div className={styles.headerTitleCol}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionHeader;
