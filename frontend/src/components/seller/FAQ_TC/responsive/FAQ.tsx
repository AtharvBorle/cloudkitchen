"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell, Search, ChevronDown, ChevronRight } from "lucide-react";
import styles from "./FAQ.module.css";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FAQProps {
  title?: string;
  faqList?: FAQItem[];
  defaultExpandedId?: string;
  onBack?: () => void;
  onNotificationClick?: () => void;
  onContactSupport?: () => void;
}

const DEFAULT_FAQ_LIST: FAQItem[] = [
  {
    id: "1",
    question: "How do I add menu items?",
    answer:
      "Go to the Menu tab in the bottom bar, tap the floating orange plus icon at the bottom, enter item details (photo, price, tags), and tap \x27Publish\x27.",
  },
  {
    id: "2",
    question: "How does COD settlement work?",
    answer:
      "COD payments collected by assigned riders are reconciled daily. Once confirmed by your delivery lead, the settlement balance is transferred directly to your registered bank account.",
  },
  {
    id: "3",
    question: "How to upgrade my plan?",
    answer:
      "Visit the Subscription section from the menu, select your preferred plan (Basic, Pro, or Enterprise), and complete the payment using UPI, Credit Card, or Net Banking.",
  },
  {
    id: "4",
    question: "How do I manage bookings?",
    answer:
      "Navigate to the Bookings tab to review incoming reservation requests. You can confirm or decline requests with a single tap, track stay duration, and view payment details.",
  },
  {
    id: "5",
    question: "What are the delivery zones?",
    answer:
      "Delivery zones are configured based on a 5km to 15km operational radius around your kitchen. You can customize active delivery geofences from the Delivery & Riders settings.",
  },
];

export const FAQ: React.FC<FAQProps> = ({
  title = "Help & FAQ",
  faqList = DEFAULT_FAQ_LIST,
  defaultExpandedId = "1",
  onBack,
  onNotificationClick,
  onContactSupport,
}) => {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/dashboard");
    }
  };


  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSupportClick = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      router.push("/dashboard/support");
    }
  };

  const filteredFaqList = faqList.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query)
    );
  });

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

          <h1 className={styles.pageTitle}>{title}</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              if (onNotificationClick) {
                onNotificationClick();
              } else {
                router.push("/seller/res/notifications");
              }
            }}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
          </button>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Search Input */}
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search help articles"
            />
          </div>

          {/* FAQ Accordion List */}
          {filteredFaqList.length > 0 ? (
            <div className={styles.faqList}>
              {filteredFaqList.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <article key={item.id} className={styles.faqCard}>
                    <button
                      type="button"
                      className={styles.faqHeader}
                      onClick={() => handleToggle(item.id)}
                      aria-expanded={isExpanded}
                    >
                      <h2 className={styles.faqQuestion}>{item.question}</h2>
                      {isExpanded ? (
                        <ChevronDown size={20} className={styles.chevron} />
                      ) : (
                        <ChevronRight size={20} className={styles.chevron} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className={styles.faqBody}>
                        <p className={styles.faqAnswer}>{item.answer}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>
                No help articles matching &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}

          {/* Bottom Action: Contact Support Button */}
          <button
            type="button"
            className={styles.contactSupportBtn}
            onClick={handleSupportClick}
          >
            Contact support
          </button>
        </main>
      </div>
    </div>
  );
};

export default FAQ;

