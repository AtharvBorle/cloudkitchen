"use client";

import React from "react";
import styles from "./OtherPaymentMethods.module.css";
import { Building2, Wallet, DollarSign, ChevronRight } from "lucide-react";

export interface OtherPaymentOption {
  id: string;
  title: string;
  subtitle: string;
  iconType: "netbanking" | "wallets" | "cod";
}

const DEFAULT_OPTIONS: OtherPaymentOption[] = [
  {
    id: "netbanking",
    title: "Net Banking",
    subtitle: "All major Indian banks supported",
    iconType: "netbanking",
  },
  {
    id: "wallets",
    title: "Wallets",
    subtitle: "Paytm, PhonePe, Amazon Pay",
    iconType: "wallets",
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    subtitle: "Pay on delivery",
    iconType: "cod",
  },
];

export const OtherPaymentMethods: React.FC = () => {
  return (
    <div className={styles.sectionWrapper}>
      <h3 className={styles.sectionHeading}>OTHER PAYMENT METHODS</h3>

      <div className={styles.cardContainer}>
        <div className={styles.optionsList}>
          {DEFAULT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.optionRow}
              onClick={() => {}}
            >
              <div className={styles.leftInfo}>
                {option.iconType === "netbanking" && (
                  <div className={styles.greenIconContainer}>
                    <Building2 size={20} className={styles.greenIcon} />
                  </div>
                )}
                {option.iconType === "wallets" && (
                  <div className={styles.blueIconContainer}>
                    <Wallet size={20} className={styles.blueIcon} />
                  </div>
                )}
                {option.iconType === "cod" && (
                  <div className={styles.yellowIconContainer}>
                    <DollarSign size={20} className={styles.yellowIcon} />
                  </div>
                )}

                <div className={styles.textCol}>
                  <h4 className={styles.optionTitle}>{option.title}</h4>
                  <p className={styles.optionSubtitle}>{option.subtitle}</p>
                </div>
              </div>

              <ChevronRight size={18} className={styles.chevronIcon} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};