"use client";

import React from "react";
import styles from "./PrivacyContent.module.css";

export interface PrivacySection {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
}

export const PRIVACY_DATA: PrivacySection[] = [
  {
    id: "1",
    title: "1. Information We Collect",
    content:
      "We collect information you provide directly when you register an account, customize meal preferences, subscribe to food plans, book PG rooms, or save delivery addresses. This includes:",
    bullets: [
      "Contact Details: Full name, phone number, email address, and profile preferences.",
      "Delivery & Location: Street addresses, house/flat numbers, delivery instructions, and GPS coordinates for courier routing.",
      "Dietary & Nutritional Preferences: Veg, Non-Veg, Jain, Vegan tags, and allergies.",
      "Transaction Data: Order history, billing summary, payment method tokens (we never store raw CVV or banking passwords).",
    ],
  },
  {
    id: "2",
    title: "2. How We Use Your Information",
    content:
      "Your personal information is used exclusively to facilitate seamless kitchen and room hospitality operations, including:",
    bullets: [
      "Cooking, packing, and dispatching fresh meal subscriptions according to your selected time slots.",
      "Live order tracking and real-time delivery rider coordination.",
      "Managing PG accommodation reservations and verifying check-in credentials.",
      "Sending timely SMS/Email and WhatsApp alerts for order status, subscription renewal reminders, and payment receipts.",
    ],
  },
  {
    id: "3",
    title: "3. Payment Security & Encryption",
    content:
      "All digital transactions are encrypted via industry-standard SSL/TLS protocols and routed through RBI-compliant, PCI-DSS certified payment gateways (UPI, Credit/Debit cards, Net Banking). Neo Cloud Kitchen does not store your sensitive financial credentials.",
  },
  {
    id: "4",
    title: "4. Information Sharing & Third Parties",
    content:
      "We do not sell, rent, or trade your personal data to external advertisers or marketers. We only share essential operational information with:",
    bullets: [
      "Assigned Delivery Partners: Name, phone number, and delivery location to complete doorstep drop-offs.",
      "Kitchen Partners & Chefs: Meal dietary specifications and order items (without sensitive personal contact info).",
      "Room Hosts: Guest name and booking duration for confirmed room check-ins.",
    ],
  },
  {
    id: "5",
    title: "5. Cookies & Location Services",
    content:
      "We use session cookies and location permissions to detect your nearest cloud kitchen hub, calculate accurate delivery ETAs, and remember your dietary filter preferences across browsing sessions.",
  },
  {
    id: "6",
    title: "6. Your Privacy Rights & Data Control",
    content:
      "You have full control over your data. Through the Settings dashboard, you can update your contact profile, add or remove delivery addresses, manage notification preferences, pause meal subscriptions, or request complete account deletion at any time.",
  },
];

export const PrivacyContent: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.metaRow}>
          <div className={styles.lastUpdatedBadge}>
            <span className={styles.badgeDot} />
            <span>Effective: September 2026</span>
          </div>
        </div>

        <div className={styles.sectionsList}>
          {PRIVACY_DATA.map((section) => (
            <article key={section.id} className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>{section.title}</h2>
              <p className={styles.sectionParagraph}>{section.content}</p>
              {section.bullets && section.bullets.length > 0 && (
                <ul className={styles.bulletList}>
                  {section.bullets.map((bullet, idx) => (
                    <li key={idx} className={styles.bulletItem}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <div className={styles.contactBox}>
          <h3 className={styles.contactTitle}>Data Privacy & Grievance Support</h3>
          <p className={styles.contactText}>
            For any questions, data modification requests, or privacy concerns, reach out to our Data Protection Officer at <strong>privacy@neocloudbites.com</strong> or call our dedicated support team at <strong>+91 98765 43210</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyContent;
