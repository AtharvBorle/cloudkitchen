"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import styles from "./FaqAccordion.module.css";

export interface FAQItem {
  id: string;
  category: "all" | "general" | "orders" | "subscriptions" | "rooms" | "payments";
  question: string;
  answer: string;
}

const FAQ_CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "orders", label: "Food & Orders" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "rooms", label: "Room Bookings" },
  { id: "payments", label: "Payments & COD" },
  { id: "general", label: "General & Account" },
];

export const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    category: "general",
    question: "How do I add menu items?",
    answer:
      "Go to the Menu tab in the bottom bar, tap the floating orange plus icon at the bottom, enter item details (photo, price, tags), and tap 'Publish'.",
  },
  {
    id: "2",
    category: "payments",
    question: "How does COD settlement work?",
    answer:
      "For Cash on Delivery orders, delivery partners collect payment upon arrival. Settled balances are reconciled daily and credited directly to your registered bank account or wallet within 24-48 business hours.",
  },
  {
    id: "3",
    category: "subscriptions",
    question: "How to upgrade my plan?",
    answer:
      "Visit Settings > My Subscriptions from your profile menu. Choose your active plan and tap 'Change Plan' to upgrade between Daily, Weekly, or Monthly tiers using UPI, Credit/Debit Card, or Net Banking.",
  },
  {
    id: "4",
    category: "rooms",
    question: "How do I manage bookings?",
    answer:
      "Navigate to the Rooms tab or My Orders to review your active PG and room stay reservations. You can extend your stay duration, check check-in instructions, and view verified property amenities.",
  },
  {
    id: "5",
    category: "orders",
    question: "What are the delivery zones?",
    answer:
      "Delivery zones cover all prime localities within a 12 km operational radius around our cloud kitchen hubs. Meals are packed fresh and delivered hot within 30 to 45 minutes.",
  },
  {
    id: "6",
    category: "subscriptions",
    question: "Can I pause or skip a daily subscription meal?",
    answer:
      "Yes! You can pause daily meal deliveries up to 2 hours before the scheduled lunch or dinner delivery slot right from the My Subscriptions dashboard.",
  },
  {
    id: "7",
    category: "payments",
    question: "What payment methods are supported?",
    answer:
      "We accept UPI (Google Pay, PhonePe, Paytm), all major Credit/Debit cards (Visa, MasterCard, RuPay), Net Banking, and Cash on Delivery (COD).",
  },
  {
    id: "8",
    category: "orders",
    question: "How do I track my active food order?",
    answer:
      "Head over to the My Orders tab to view real-time cooking updates and live delivery tracking with your assigned rider's contact details.",
  },
];

export interface FaqAccordionProps {
  onContactSupport?: () => void;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ onContactSupport }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>("1");

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSupportClick = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("open-chatbot"));
      }
      router.push("/dashboard/user/support");
    }
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.container}>
      {/* 1. Search Bar */}
      <div className={styles.searchWrapper}>
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

      {/* 2. Category Filter Pills */}
      <div className={styles.categoryTabs}>
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.categoryTab} ${
              selectedCategory === cat.id ? styles.categoryTabActive : ""
            }`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. FAQ Accordion Cards */}
      {filteredFaqs.length > 0 ? (
        <div className={styles.faqList}>
          {filteredFaqs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <article
                key={item.id}
                className={`${styles.faqCard} ${
                  isExpanded ? styles.faqCardExpanded : ""
                }`}
              >
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
            No help articles found matching &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      )}

      {/* 4. Bottom Contact Support Button */}
      <button
        type="button"
        className={styles.contactSupportBtn}
        onClick={handleSupportClick}
      >
        <MessageCircle size={18} />
        <span>Contact support</span>
      </button>
    </div>
  );
};

export default FaqAccordion;
