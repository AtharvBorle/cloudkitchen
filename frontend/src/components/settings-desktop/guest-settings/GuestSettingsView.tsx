"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  FileText,
  HelpCircle,
  Star,
  LogIn,
  ChevronRight,
} from "lucide-react";
import styles from "./GuestSettingsView.module.css";

const LEGAL_PAGES = [
  {
    id: "privacy",
    title: "Privacy Policy",
    description:
      "Learn how we collect, handle, protect, and process your personal information, order details, and payment data.",
    icon: <Shield size={22} className={styles.cardIcon} />,
    iconBg: "#FEF2F2",
    iconColor: "#EF4444",
    href: "/privacy",
    badge: "Updated",
    btnText: "Read Policy",
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    description:
      "Review our customer terms of use, kitchen ordering policies, cancellation & refund guidelines, and agreements.",
    icon: <FileText size={22} className={styles.cardIcon} />,
    iconBg: "#EFF6FF",
    iconColor: "#3B82F6",
    href: "/terms",
    badge: "Legal",
    btnText: "Read Terms",
  },
  {
    id: "help-faq",
    title: "Help Center & FAQ",
    description:
      "Browse common questions about ordering food, booking rooms, managing meal subscriptions, and contacting support.",
    icon: <HelpCircle size={22} className={styles.cardIcon} />,
    iconBg: "#F0FDF4",
    iconColor: "#22C55E",
    href: "/support",
    badge: "Support",
    btnText: "Get Help",
  },
  {
    id: "rate",
    title: "Rate Our App",
    description:
      "Share your thoughts, review your ordering experience, and give suggestions to help us improve.",
    icon: <Star size={22} className={styles.cardIcon} />,
    iconBg: "#FFFBEB",
    iconColor: "#F59E0B",
    href: "/rate-app",
    badge: "Feedback",
    btnText: "Rate Now",
  },
];

export const GuestSettingsView: React.FC = () => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/login?callbackUrl=/settings-desktop");
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Section */}
      <div className={styles.header}>
        <div className={styles.headerBadge}>
          <Shield size={14} />
          <span>Legal &amp; Policies</span>
        </div>
        <h1 className={styles.title}>Settings &amp; Legal Policies</h1>
        <p className={styles.subtitle}>
          Read our privacy policy, terms of service, and support guides, or sign in to access your personal account settings.
        </p>
      </div>

      {/* 2. Legal Pages Cards List */}
      <div className={styles.cardsList}>
        {LEGAL_PAGES.map((page) => (
          <div
            key={page.id}
            className={styles.legalCard}
            onClick={() => router.push(page.href)}
            role="button"
            tabIndex={0}
            aria-label={`Open ${page.title}`}
          >
            <div className={styles.cardLeft}>
              <div
                className={styles.iconWrapper}
                style={{ backgroundColor: page.iconBg, color: page.iconColor }}
              >
                {page.icon}
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardTitleRow}>
                  <h2 className={styles.cardTitle}>{page.title}</h2>
                  <span className={styles.cardBadge}>{page.badge}</span>
                </div>
                <p className={styles.cardDesc}>{page.description}</p>
              </div>
            </div>

            <div className={styles.cardAction}>
              <Link
                href={page.href}
                className={styles.actionBtn}
                onClick={(e) => e.stopPropagation()}
              >
                <span>{page.btnText}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bottom Sign In Callout Card */}
      <div className={styles.signInCard}>
        <div className={styles.signInLeft}>
          <div className={styles.signInIconWrapper}>
            <LogIn size={26} color="#FF5500" strokeWidth={2.4} />
          </div>
          <div className={styles.signInText}>
            <h3 className={styles.signInTitle}>Looking for your account settings?</h3>
            <p className={styles.signInSubtitle}>
              Sign in to manage your saved delivery addresses, active meal subscriptions, live orders, and profile details.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          className={styles.signInBtn}
          aria-label="Sign In to Your Account"
        >
          <LogIn size={18} strokeWidth={2.4} />
          <span>Sign In to Account</span>
        </button>
      </div>
    </div>
  );
};

export default GuestSettingsView;
