"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./OrderHistoryHeader.module.css";

export interface OrderHistoryHeaderProps {
  title?: string;
  subtitle?: string;
}

export const OrderHistoryHeader: React.FC<OrderHistoryHeaderProps> = ({
  title = "Order History",
  subtitle = "Track your active food subscriptions, review previous home delivery orders, and reorder your favorite meals.",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className={styles.headerContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Order History"
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
    </header>
  );
};

export default OrderHistoryHeader;
