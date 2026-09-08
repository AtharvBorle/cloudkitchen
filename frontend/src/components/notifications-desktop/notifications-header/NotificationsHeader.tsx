"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./NotificationsHeader.module.css";

export interface NotificationsHeaderProps {
  title?: string;
  subtitle?: string;
}

export const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({
  title = "Notifications",
  subtitle = "Manage how and when you receive order updates, menu alerts, and promotional newsletters.",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.headerContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Notifications"
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

export default NotificationsHeader;