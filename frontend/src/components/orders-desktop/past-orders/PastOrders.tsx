"use client";

import React from "react";
import Link from "next/link";
import styles from "./PastOrders.module.css";

export interface PastOrderItem {
  id: string;
  vendor: string;
  details: string;
  price: string;
  sellerTrackingId?: string;
  invoiceUrl?: string;
}

export interface PastOrdersProps {
  orders?: PastOrderItem[];
  onRenewPlan?: (order: PastOrderItem) => void;
}

export const PastOrders: React.FC<PastOrdersProps> = ({
  orders = [],
  onRenewPlan,
}) => {
  if (!orders || orders.length === 0) {
    return null;
  }

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
              {order.sellerTrackingId ? (
                <Link
                  href={`/shop/${order.sellerTrackingId}`}
                  className={styles.renewBtn}
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  Reorder
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.renewBtn}
                  onClick={() => onRenewPlan && onRenewPlan(order)}
                  aria-label={`Renew plan for ${order.vendor}`}
                >
                  Renew Plan
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PastOrders;

