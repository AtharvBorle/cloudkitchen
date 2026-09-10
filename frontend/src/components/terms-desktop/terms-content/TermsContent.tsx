"use client";

import React from "react";
import styles from "./TermsContent.module.css";

export interface TermSection {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
}

export const TERMS_DATA: TermSection[] = [
  {
    id: "1",
    title: "1. Introduction",
    content:
      "Welcome to Neo Cloud Room & Kitchen. These Terms and Conditions govern your access to and use of our consumer food ordering, daily meal subscription, and room booking applications. By accessing or using our platform, you confirm that you have read, understood, and agree to be bound by these provisions in full.",
  },
  {
    id: "2",
    title: "2. User Obligations",
    content:
      "As a user, subscriber, or merchant partner, you maintain full responsibility for verifying the accuracy of your account credentials, selected food items, active meal delivery schedules, delivery address coordinates, and room booking requirements. Any transactional discrepancy, pricing error, or listing non-conformance must be addressed promptly through our customer support channels.",
  },
  {
    id: "3",
    title: "3. Data Collection",
    content:
      "We collect and process essential operational metrics to deliver premium cloud kitchen services, real-time rider tracking streams, subscription delivery automation, and secure payment settlement payouts. By utilizing this platform, you grant Neo Cloud Kitchen administrative rights to compile anonymized transactional volume statistics for ongoing service enhancements.",
  },
  {
    id: "4",
    title: "4. Meal Subscriptions & Delivery",
    content:
      "Subscription meal plans operate on recurring cycles (Daily, Weekly, or Monthly). You may pause or adjust your upcoming delivery slots up to 2 hours before the scheduled lunch or dinner delivery window. Orders placed for immediate on-demand delivery cannot be canceled once kitchen cooking preparation has commenced.",
  },
  {
    id: "5",
    title: "5. Payments, Settlement & Refunds",
    content:
      "All transactions processed through online payment modes (UPI, Credit/Debit Cards, Net Banking) are encrypted using PCI-DSS compliant protocols. For Cash on Delivery (COD), exact payments must be made directly to the delivery rider upon arrival. Approved refund claims for eligible failed orders or canceled pre-scheduled subscriptions will be credited to the original payment source within 5 to 7 business days.",
  },
  {
    id: "6",
    title: "6. Room Bookings & Accommodations",
    content:
      "Room and PG stay bookings made through our platform are subject to verified identity validation upon arrival. Guests are required to adhere to property guidelines, check-in/check-out timings, and safety regulations set by the accommodation provider.",
  },
  {
    id: "7",
    title: "7. Intellectual Property & Account Termination",
    content:
      "All brand assets, software interface designs, logos, culinary photographs, and content are the proprietary intellectual property of Neo Cloud Bites. We reserve the right to suspend or terminate accounts that engage in fraudulent actions, platform abuse, or violation of these terms.",
  },
];

export const TermsContent: React.FC = () => {
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
          {TERMS_DATA.map((section) => (
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
      </div>
    </div>
  );
};

export default TermsContent;
