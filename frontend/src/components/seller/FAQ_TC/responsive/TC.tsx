"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell } from "lucide-react";
import styles from "./TC.module.css";

export type TCTab = "terms" | "privacy";

export interface TCSection {
  title: string;
  content: string;
}

export interface TCProps {
  initialTab?: TCTab;
  termsTitle?: string;
  privacyTitle?: string;
  termsSections?: TCSection[];
  privacySections?: TCSection[];
  onBack?: () => void;
  onNotificationClick?: () => void;
  onTabChange?: (tab: TCTab) => void;
}

const DEFAULT_TERMS_SECTIONS: TCSection[] = [
  {
    title: "1. Introduction",
    content:
      "Welcome to Neo Cloud Room. These Terms and Conditions govern your use of our merchant portal and administrative applications. By accessing or onboarding your business, you confirm your legal capacity to bind your establishment to these provisions in full.",
  },
  {
    title: "2. User Obligations",
    content:
      "As an owner, you maintain full responsibility for verifying accuracy in posted item pricing, inventory state, and room descriptors. Any transactional discrepancy, pricing error, or listing non-conformance must be resolved immediately to guarantee quality of customer interaction and support system integrity.",
  },
  {
    title: "3. Data Collection",
    content:
      "We collect and process essential operational metrics to deliver premium cloud room logistics, real-time tracking streams, and precise settlement payouts. By utilising this platform, you grant Neo Cloud Room administrative rights to compile anonymised transactional volume statistics for service improvements.",
  },
];

const DEFAULT_PRIVACY_SECTIONS: TCSection[] = [
  {
    title: "1. Information We Collect",
    content:
      "We collect business registration details, contact credentials, menu specifications, operational schedule parameters, and banking information necessary for merchant onboarding and daily settlement processing.",
  },
  {
    title: "2. How We Use Your Data",
    content:
      "Your information is utilized solely to facilitate kitchen operations, live customer orders, courier dispatch assignments, room reservation management, and accurate payment reconciliations.",
  },
  {
    title: "3. Data Security & Storage",
    content:
      "All merchant records are encrypted using industry-standard protocols and stored securely. We do not sell or disclose your proprietary business data to unauthorized third parties.",
  },
];

export const TC: React.FC<TCProps> = ({
  initialTab = "terms",
  termsTitle = "Terms & Conditions",
  privacyTitle = "Privacy Policy",
  termsSections = DEFAULT_TERMS_SECTIONS,
  privacySections = DEFAULT_PRIVACY_SECTIONS,
  onBack,
  onNotificationClick,
  onTabChange,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TCTab>(initialTab);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/res/dashboard");
    }
  };


  const handleTabSelect = (tab: TCTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const currentSections =
    activeTab === "terms" ? termsSections : privacySections;
  const currentHeaderTitle =
    activeTab === "terms" ? termsTitle : privacyTitle;

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleBackClick}
            aria-label="Go Back"
            title="Back"
          >
            <ChevronLeft size={24} />
          </button>

          <h1 className={styles.pageTitle}>{currentHeaderTitle}</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onNotificationClick}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
          </button>
        </header>

        {/* Tabs Header Strip */}
        <nav
          className={styles.tabsStrip}
          role="tablist"
          aria-label="Terms and Privacy Tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "terms"}
            className={`${styles.tabButton} ${
              activeTab === "terms" ? styles.tabButtonActive : ""
            }`}
            onClick={() => handleTabSelect("terms")}
          >
            Terms &amp; Conditions
            {activeTab === "terms" && (
              <span className={styles.activeIndicator} />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "privacy"}
            className={`${styles.tabButton} ${
              activeTab === "privacy" ? styles.tabButtonActive : ""
            }`}
            onClick={() => handleTabSelect("privacy")}
          >
            Privacy Policy
            {activeTab === "privacy" && (
              <span className={styles.activeIndicator} />
            )}
          </button>
        </nav>

        {/* Content Section */}
        <main className={styles.contentArea}>
          {currentSections.map((section) => (
            <article key={section.title} className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>{section.title}</h2>
              <p className={styles.sectionParagraph}>{section.content}</p>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
};

export default TC;

