"use client";

import React, { useState } from "react";
import styles from "./SavedCards.module.css";
import { Pencil } from "lucide-react";

export interface CardItem {
  id: string;
  type: "visa" | "mastercard";
  title: string;
  cardNumber: string;
  cardHolder: string;
  expires: string;
}

const DEFAULT_CARDS: CardItem[] = [
  {
    id: "hdfc-credit",
    type: "visa",
    title: "HDFC Bank Credit Card",
    cardNumber: "•••• •••• •••• 4523",
    cardHolder: "Rahul Sharma",
    expires: "09/29",
  },
  {
    id: "icici-debit",
    type: "mastercard",
    title: "ICICI Debit Card",
    cardNumber: "•••• •••• •••• 8891",
    cardHolder: "Rahul Sharma",
    expires: "12/27",
  },
];

export const SavedCards: React.FC = () => {
  const [selectedCardId, setSelectedCardId] = useState<string>("hdfc-credit");

  return (
    <div className={styles.sectionWrapper}>
      <h3 className={styles.sectionHeading}>SAVED CARDS</h3>

      <div className={styles.cardsGrid}>
        {DEFAULT_CARDS.map((card) => {
          const isSelected = selectedCardId === card.id;

          return (
            <div
              key={card.id}
              className={`${styles.cardContainer} ${
                isSelected ? styles.cardSelected : ""
              }`}
              onClick={() => setSelectedCardId(card.id)}
            >
              {/* Top Row: Brand Badge + Card Name & Number + Radio Selector */}
              <div className={styles.topRow}>
                <div className={styles.cardInfoLeft}>
                  {card.type === "visa" ? (
                    <div className={styles.visaBadge}>
                      <span>VISA</span>
                    </div>
                  ) : (
                    <div className={styles.mcBadge}>
                      <span>MC</span>
                    </div>
                  )}

                  <div>
                    <h4 className={styles.cardTitle}>{card.title}</h4>
                    <p className={styles.cardNumber}>{card.cardNumber}</p>
                  </div>
                </div>

                {/* Radio Button */}
                <div
                  className={`${styles.radioOuter} ${
                    isSelected ? styles.radioSelected : ""
                  }`}
                >
                  {isSelected && <div className={styles.radioInner} />}
                </div>
              </div>

              {/* Bottom Row: Card Holder, Expires, Edit Button */}
              <div className={styles.bottomRow}>
                <div className={styles.cardDetailsGroup}>
                  <div className={styles.detailCol}>
                    <span className={styles.detailLabel}>CARD HOLDER</span>
                    <span className={styles.detailValue}>{card.cardHolder}</span>
                  </div>

                  <div className={styles.detailCol}>
                    <span className={styles.detailLabel}>EXPIRES</span>
                    <span className={styles.detailValue}>{card.expires}</span>
                  </div>
                </div>

                {/* Edit Pencil Button in soft orange circle */}
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label={`Edit ${card.title}`}
                >
                  <Pencil size={14} strokeWidth={2.5} className={styles.pencilIcon} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};