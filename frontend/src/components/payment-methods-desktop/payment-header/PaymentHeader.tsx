import React, { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./PaymentHeader.module.css";

export interface PaymentHeaderProps {
  title?: string;
  subtitle?: string;
}

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({
  title = "Payment Methods",
  subtitle = "Select, edit, or append your default payment details for hassle-free subscription renewals.",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.headerContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Payment Methods"
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