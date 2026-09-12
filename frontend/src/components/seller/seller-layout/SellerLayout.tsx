"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SellerSidebar } from "../seller-sidebar";
import { SellerNavbar } from "../seller-navbar";
import { SellerStepper } from "../seller-stepper";
import styles from "./SellerLayout.module.css";

import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface SellerLayoutProps {
  children: React.ReactNode;
  activeSidebarItem?: "registration" | "verification";
  pageTitle?: string;
  mobileTitle?: string;
  hideMobileHeader?: boolean;
  userName?: string;
  userRole?: string;
  userInitials?: string;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  backHref?: string;
}

const STEP_TITLES: Record<number, string> = {
  1: "Create account",
  2: "Business",
  3: "Documents",
  4: "Photos",
  5: "Review & submit",
};

export const SellerLayout: React.FC<SellerLayoutProps> = ({
  children,
  activeSidebarItem = "registration",
  pageTitle = "Neo Cloud Room Onboarding",
  mobileTitle,
  hideMobileHeader = false,
  userName,
  userRole,
  userInitials,
  currentStep,
  totalSteps = 5,
  onBack,
  backHref,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveUserName = userName && userName !== "John Doe" ? userName : seller.ownerName;
  const effectiveUserRole = userRole || seller.partnerRole;
  const effectiveUserInitials = userInitials && userInitials !== "JD" ? userInitials : seller.avatarInitials;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else if (currentStep && currentStep > 1) {
      router.back();
    } else {
      router.push("/seller/registration");
    }
  };

  const resolvedMobileTitle =
    mobileTitle || (currentStep ? STEP_TITLES[currentStep] || pageTitle : pageTitle);

  return (
    <div className={styles.layoutContainer}>
      {/* 1. LEFTSIDEBAR (Desktop only) */}
      <div className={styles.sidebarColumn}>
        <SellerSidebar activeItem={activeSidebarItem} />
      </div>

      {/* 2. RIGHT MAIN CONTENT COLUMN */}
      <div className={styles.mainColumn}>
        {/* Top Navbar (Desktop only) */}
        <div className={styles.desktopNavbar}>
          <SellerNavbar
            title={pageTitle}
            userName={effectiveUserName}
            userRole={effectiveUserRole}
            userInitials={effectiveUserInitials}
          />
        </div>


        {/* Mobile Top Header (Mobile only) */}
        {!hideMobileHeader && (
          <header className={styles.mobileTopBar}>
            <button
              type="button"
              onClick={handleBack}
              className={styles.mobileBackBtn}
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2.4} />
            </button>
            <h1 className={styles.mobilePageTitle}>{resolvedMobileTitle}</h1>
          </header>
        )}


        {/* Unified Centered Main Content Area */}
        <main className={styles.pageContent}>
          <div className={styles.contentInnerFrame}>
            {/* Desktop Stepper (Desktop only) */}
            {currentStep !== undefined && (
              <div className={styles.desktopStepperWrapper}>
                <SellerStepper currentStep={currentStep} />
              </div>
            )}


            {/* Mobile Dots Stepper (Mobile only) */}
            {currentStep !== undefined && (
              <div className={styles.mobileDotsStepper} aria-label={`Step ${currentStep} of ${totalSteps}`}>
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNum = index + 1;
                  const isActive = stepNum === currentStep;
                  const isCompleted = stepNum < currentStep;
                  return (
                    <span
                      key={stepNum}
                      className={
                        isActive
                          ? styles.dotActive
                          : isCompleted
                          ? styles.dotCompleted
                          : styles.dotInactive
                      }
                    />
                  );
                })}
              </div>
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
