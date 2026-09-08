"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Star, Calendar } from "lucide-react";
import styles from "./ResponsiveCustomerReliability.module.css";

export interface CustomerReliabilityMetrics {
  ordersPlaced: number;
  delivered: number;
  cancelled: number;
  noShows: number;
  completionRate: string;
  avgOrderValue: string;
  rating: number | string;
  customerSince: string;
}

export interface ResponsiveCustomerReliabilityProps {
  orderId?: string;
  timeAgo?: string;
  customerName?: string;
  paymentType?: string;
  itemCount?: number;
  orderTotal?: string;
  metrics?: CustomerReliabilityMetrics;
  onAccept?: () => void;
  onDecline?: () => void;
  onBack?: () => void;
}

const DEFAULT_METRICS: CustomerReliabilityMetrics = {
  ordersPlaced: 32,
  delivered: 30,
  cancelled: 2,
  noShows: 0,
  completionRate: "94%",
  avgOrderValue: "\u20B9780",
  rating: "4.8",
  customerSince: "Sep 2024",
};

export const ResponsiveCustomerReliability: React.FC<
  ResponsiveCustomerReliabilityProps
> = ({
  orderId = "#1234",
  timeAgo = "12 min ago",
  customerName = "Priya Mehta",
  paymentType = "Prepaid",
  itemCount = 3,
  orderTotal = "\u20B9850",
  metrics = DEFAULT_METRICS,
  onAccept,
  onDecline,
  onBack,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/res/orders");
    }
  };

  const handleAcceptClick = () => {
    if (onAccept) {
      onAccept();
    } else {
      router.push("/seller/res/orders/assign-rider");
    }
  };

  const handleDeclineClick = () => {
    if (onDecline) {
      onDecline();
    } else {
      router.push("/seller/res/orders");
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Background Orders Layer */}
        <div className={styles.backgroundScreen}>
          <header className={styles.topBar}>
            <button
              type="button"
              onClick={handleBack}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className={styles.pageTitle}>Orders</h1>
            <Search size={20} color="#64748B" />
          </header>

          <div className={styles.filterTabs}>
            <span className={`${styles.tabPill} ${styles.tabPillActive}`}>
              New · 2
            </span>
            <span className={styles.tabPill}>Preparing</span>
            <span className={styles.tabPill}>Out</span>
          </div>

          <div className={styles.orderCardBack}>
            <div>
              <div className={styles.orderIdText}>
                {orderId} · {timeAgo}
              </div>
              <div className={styles.customerName}>{customerName}</div>
              <div className={styles.orderSubtitle}>
                {itemCount} items · {orderTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sheet / Reliability Card */}
        <section className={styles.bottomSheet}>
          <div className={styles.dragHandle} />

          {/* Header Row */}
          <div className={styles.orderMetaRow}>
            <div className={styles.orderMetaLeft}>
              <span className={styles.orderIdText}>
                {orderId} · {timeAgo}
              </span>
              <h2 className={styles.customerName}>{customerName}</h2>
              <p className={styles.orderSubtitle}>
                {itemCount} items · {orderTotal}
              </p>
            </div>

            <span className={styles.prepaidBadge}>{paymentType}</span>
          </div>

          {/* Customer Reliability Header */}
          <div className={styles.reliabilityHeader}>
            <h3 className={styles.reliabilityTitle}>Customer Reliability</h3>
            <div className={styles.ratingBadge}>
              <Star size={16} className={styles.starIcon} />
              <span>{metrics.rating}</span>
            </div>
          </div>

          {/* 2x3 Metric Grid */}
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>ORDERS PLACED</span>
              <span className={styles.metricValue}>{metrics.ordersPlaced}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>DELIVERED</span>
              <span className={`${styles.metricValue} ${styles.metricGreen}`}>
                {metrics.delivered}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>CANCELLED</span>
              <span className={`${styles.metricValue} ${styles.metricRed}`}>
                {metrics.cancelled}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>NO-SHOWS</span>
              <span className={styles.metricValue}>{metrics.noShows}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>COMPLETION RATE</span>
              <span className={styles.metricValue}>{metrics.completionRate}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>AVG ORDER VALUE</span>
              <span className={styles.metricValue}>{metrics.avgOrderValue}</span>
            </div>
          </div>

          {/* Customer Since */}
          <div className={styles.customerSince}>
            <Calendar size={14} />
            <span>Customer since {metrics.customerSince}</span>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.acceptButton}
              onClick={handleAcceptClick}
            >
              Accept Order
            </button>

            <button
              type="button"
              className={styles.declineButton}
              onClick={handleDeclineClick}
            >
              Decline
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResponsiveCustomerReliability;

