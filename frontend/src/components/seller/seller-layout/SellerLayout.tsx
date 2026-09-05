"use client";

import React from "react";
import { SellerSidebar } from "../seller-sidebar";
import { SellerNavbar } from "../seller-navbar";
import { SellerStepper } from "../seller-stepper";
import styles from "./SellerLayout.module.css";

export interface SellerLayoutProps {
  children: React.ReactNode;
  activeSidebarItem?: "registration" | "verification";
  pageTitle?: string;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  currentStep?: number; // Optional: when provided, renders stepper in the exact same spot on all pages
}

export const SellerLayout: React.FC<SellerLayoutProps> = ({
  children,
  activeSidebarItem = "registration",
  pageTitle = "Neo Cloud Room Onboarding",
  userName = "John Doe",
  userRole = "Owner Account",
  userInitials = "JD",
  currentStep,
}) => {
  return (
    <div
      className={styles.layoutContainer}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#f8fafc",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      {/* 1. LEFT SIDEBAR (Sticky full height) */}
      <div
        className={styles.sidebarColumn}
        style={{
          width: 260,
          minWidth: 260,
          maxWidth: 260,
          flexShrink: 0,
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          minHeight: "100vh",
        }}
      >
        <SellerSidebar activeItem={activeSidebarItem} />
      </div>

      {/* 2. RIGHT MAIN CONTENT COLUMN */}
      <div
        className={styles.mainColumn}
        style={{
          flex: "1 1 0%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
        }}
      >
        {/* Top Navbar */}
        <SellerNavbar
          title={pageTitle}
          userName={userName}
          userRole={userRole}
          userInitials={userInitials}
        />

        {/* Unified Centered Main Content Area */}
        <main
          className={styles.pageContent}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            padding: "48px 32px 48px 32px",
            boxSizing: "border-box",
          }}
        >
          {/* Centered 700px Content Frame */}
          <div
            style={{
              width: "100%",
              maxWidth: 700,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
            }}
          >
            {/* Automatic Stepper (Locks exact vertical & horizontal position across all steps) */}
            {currentStep !== undefined && (
              <SellerStepper currentStep={currentStep} />
            )}

            {/* Form Step Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
