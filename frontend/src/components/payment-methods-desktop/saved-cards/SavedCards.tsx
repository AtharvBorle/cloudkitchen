"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

const DEFAULT_CARDS: CardItem[] = [];

export const SavedCards: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [cards] = useState<CardItem[]>(DEFAULT_CARDS);
  const [selectedCardId, setSelectedCardId] = useState<string>("");

  return (
    <div className={styles.sectionWrapper}>
      <h3 className={styles.sectionHeading}>SAVED CARDS</h3>

      {cards.length === 0 ? (
        <div style={{ padding: "36px 20px", textAlign: "center", color: "#64748B", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1.5px dashed #CBD5E1", fontSize: "14px" }}>
          No saved credit or debit cards found.
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {cards.map((card) => {
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
                    if (!session?.user) {
                      router.push("/login?callbackUrl=/payment-methods-desktop");
                    }
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