"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { PaymentHeader } from "@/components/payment-methods-desktop/payment-header";
import { SavedCards } from "@/components/payment-methods-desktop/saved-cards";
import { UpiIds } from "@/components/payment-methods-desktop/upi-ids";
import { OtherPaymentMethods } from "@/components/payment-methods-desktop/other-payment-methods";
import { AddPaymentButton } from "@/components/payment-methods-desktop/add-payment-button";
import { Footer } from "@/components/explore-desktop/footer";

import styles from "./PaymentMethodsPage.module.css";

export default function PaymentMethodsDesktopPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Shared Profile Sidebar with Payment Methods Active */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="payment-methods" />
          </div>

          {/* Right Column: Payment Methods Content Sections */}
          <div className={styles.contentWrapper}>
            {/* 
              PAYMENT METHODS CONTENT SECTIONS (Disabled via comment - uncomment to re-enable in future)
            <PaymentHeader />
            <SavedCards />
            <UpiIds />
            <OtherPaymentMethods />
            <AddPaymentButton />
            */}
          </div>
        </div>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}