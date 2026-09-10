import React, { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./AddressesHeader.module.css";

export interface AddressesHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AddressesHeader: React.FC<AddressesHeaderProps> = ({
  title = "Delivery Addresses",
  subtitle = "Manage your delivery locations and specify the default address for your meal delivery subscriptions.",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.headerContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Delivery Addresses"
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