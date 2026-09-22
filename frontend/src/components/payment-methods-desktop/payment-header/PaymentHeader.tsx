import React from "react";
import styles from "./PaymentHeader.module.css";

export interface PaymentHeaderProps {
  title?: string;
  subtitle?: string;
}

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({
  title = "Payment Methods",
  subtitle = "Select, edit, or append your default payment details for hassle-free subscription renewals.",
}) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerTopRow}>
        <div className={styles.headerTitleCol}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};