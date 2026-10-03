"use client";

import React, { useState, useMemo } from "react";
import styles from "./OrderList.module.css";
import { ShoppingBag, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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
  reorderingOrderId?: string | null;
}

const PAGE_SIZE = 5;

export const OrderList: React.FC<OrderListProps> = ({
  orders = [],
  onViewDetails,
  onReorderMeal,
  reorderingOrderId = null,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, currentPage]);

  if (!orders || orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: "16px", border: "1px dashed #E2E8F0", marginTop: "20px" }}>
        <ShoppingBag size={48} color="#CBD5E0" style={{ marginBottom: "16px" }} />
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1E293B", marginBottom: "8px" }}>No orders found</h3>
        <p style={{ color: "#64748B", fontSize: "0.95rem" }}>No order history matches your selected filter criteria.</p>
      </div>
    );
  }

  const startIdx = (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(currentPage * PAGE_SIZE, orders.length);

  return (
    <div className={styles.ordersContainer}>
      {paginatedOrders.map((order) => {
        const isReorderingThis = reorderingOrderId === order.id;

        return (
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

                {order.status === "DELIVERED" && (
                  <button
                    type="button"
                    className={`${styles.reorderBtn} ${isReorderingThis ? styles.reorderBtnLoading : ""}`}
                    disabled={isReorderingThis}
                    onClick={() => onReorderMeal && onReorderMeal(order.id)}
                  >
                    {isReorderingThis ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Verifying...</span>
                      </span>
                    ) : (
                      "Reorder Meal"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination Bar */}
      {orders.length > PAGE_SIZE && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Showing <span className={styles.paginationHighlight}>{startIdx}–{endIdx}</span> of{" "}
            <span className={styles.paginationHighlight}>{orders.length}</span> orders
          </div>

          <div className={styles.paginationControls}>
            <button
              type="button"
              className={`${styles.pageNavBtn} ${currentPage === 1 ? styles.pageNavBtnDisabled : ""}`}
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage((p) => p - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            <div className={styles.pageNumbersList}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.pageNumberBtn} ${p === currentPage ? styles.pageNumberBtnActive : ""}`}
                  onClick={() => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-current={p === currentPage ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={`${styles.pageNavBtn} ${currentPage === totalPages ? styles.pageNavBtnDisabled : ""}`}
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
