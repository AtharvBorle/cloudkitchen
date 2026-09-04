import React from "react";
import styles from "./OrderHistoryHeader.module.css";

export interface OrderHistoryHeaderProps {
  title?: string;
  subtitle?: string;
}

export const OrderHistoryHeader: React.FC<OrderHistoryHeaderProps> = ({
  title = "Order History",
  subtitle = "Track your active food subscriptions, review previous home delivery orders, and reorder your favorite meals.",
}) => {
  return (
    <header className={styles.headerContainer}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
};

export default OrderHistoryHeader;
