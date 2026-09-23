"use client";

import React from "react";
import styles from "./OrderList.module.css";
import { ShoppingBag } from "lucide-react";

export interface OrderItemData {
  id: string;
  orderNumber: string;
  restaurantName: string;
  orderDate: string;
  status: "DELIVERED" | "CANCELLED" | "IN_PROGRESS";
  itemsOrdered: string;
  totalAmount: number;
  deliveryAddress: string;
  hasViewDetails?: boolean;
  rawItems?: any[];
  sellerId?: string;
  imageUrl?: string;
}

export interface OrderListProps {
  orders?: OrderItemData[];
  onViewDetails?: (orderId: string) => void;
  onReorderMeal?: (orderId: string) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders = [],
  onViewDetails,
  onReorderMeal,
}) => {
  if (!orders || orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "16px", border: "1px dashed #E2E8F0", marginTop: "20px" }}>
        <ShoppingBag size={48} color="#CBD5E0" style={{ marginBottom: "16px" }} />
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1E293B", marginBottom: "8px" }}>No orders found</h3>
        <p style={{ color: "#64748B", fontSize: "0.95rem" }}>No order history matches your selected filter criteria.</p>
      </div>
    );
  }

  return (
    <div className={styles.ordersContainer}>
      {orders.map((order) => (
        <div key={order.id} className={styles.orderCard}>
          {/* 1. Header Row */}
          <div className={styles.cardHeader}>
            <div className={styles.restaurantGroup}>
              <div className={styles.iconBox}>
                <ShoppingBag size={20} className={styles.bagIcon} strokeWidth={2.2} />
              </div>
              <div className={styles.restaurantInfo}>
                <h3 className={styles.restaurantName}>{order.restaurantName}</h3>
                <p className={styles.orderMeta}>
                  {order.orderNumber} • {order.orderDate}
                </p>
              </div>
            </div>

            <div className={styles.statusBadgeWrapper}>
              <span
                className={`${styles.statusBadge} ${
                  order.status === "DELIVERED"
                    ? styles.statusDelivered
                    : order.status === "CANCELLED"
                    ? styles.statusCancelled
                    : styles.statusInProgress
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* 2. Middle Section: Items & Total */}
          <div className={styles.cardBody}>
            <div className={styles.itemsColumn}>
              <span className={styles.sectionLabel}>ITEMS ORDERED</span>
              <p className={styles.itemsValue}>{order.itemsOrdered}</p>
            </div>

            <div className={styles.amountColumn}>
              <span className={styles.sectionLabel}>TOTAL AMOUNT</span>
              <p className={styles.amountValue}>₹{order.totalAmount}</p>
            </div>
          </div>

          {/* 3. Footer Row: Delivery Address & Actions */}
          <div className={styles.cardFooter}>
            <p className={styles.deliveryText}>{order.deliveryAddress}</p>

            <div className={styles.actionsGroup}>
              {order.hasViewDetails !== false && (
                <button
                  type="button"
                  className={styles.viewDetailsBtn}
                  onClick={() => onViewDetails && onViewDetails(order.id)}
                >
                  View Details
                </button>
              )}

              <button
                type="button"
                className={styles.reorderBtn}
                onClick={() => onReorderMeal && onReorderMeal(order.id)}
              >
                Reorder Meal
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


export default OrderList;
