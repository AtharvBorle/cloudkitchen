"use client";

import React from "react";
import styles from "./PastOrders.module.css";

export interface PastOrderItem {
  id: string;
  vendor: string;
  details: string;
  price: string;
}

const DEFAULT_PAST_ORDERS: PastOrderItem[] = [
  {
    id: "past-1",
    vendor: "Annapurna Mess",
    details: "Silver Weekly Thali Subscription • 12 Oct 2024",
    price: "₹499",
  },
  {
    id: "past-2",
    vendor: "Baker Delight",
    details: "6x Butter Croissants • 08 Oct 2024",
    price: "₹240",
  },
];

export interface PastOrdersProps {
  orders?: PastOrderItem[];
  onRenewPlan?: (order: PastOrderItem) => void;
}

export const PastOrders: React.FC<PastOrdersProps> = ({
  orders = DEFAULT_PAST_ORDERS,
  onRenewPlan,
}) => {
  return (
    <section className={styles.sectionContainer} aria-label="Past Orders">
      <h2 className={styles.sectionHeading}>Past Orders</h2>

      <div className={styles.ordersList}>
        {orders.map((order) => (
          <article key={order.id} className={styles.pastCard}>
            <div className={styles.cardLeft}>
              <h3 className={styles.vendorName}>{order.vendor}</h3>
              <p className={styles.orderDetails}>{order.details}</p>
            </div>

            <div className={styles.cardRight}>
              <span className={styles.priceText}>{order.price}</span>
              <button
                type="button"
                className={styles.renewBtn}
                onClick={() => onRenewPlan && onRenewPlan(order)}
                aria-label={`Renew plan for ${order.vendor}`}
              >
                Renew Plan
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PastOrders;
