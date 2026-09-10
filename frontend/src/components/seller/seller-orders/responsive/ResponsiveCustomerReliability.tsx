"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Star, Calendar, CheckCircle2 } from "lucide-react";
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
  avgOrderValue: "₹780",
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
  orderTotal = "₹850",
  metrics = DEFAULT_METRICS,
  onAccept,
  onDecline,
  onBack,
}) => {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/orders");
    }
  };

  const handleAcceptClick = () => {
    showToast(`Order ${orderId} accepted!`);
    if (onAccept) {
      onAccept();
    } else {
      setTimeout(() => {
        router.push("/seller/orders/assign-rider");
      }, 800);
    }
  };

  const handleDeclineClick = () => {
    showToast(`Order ${orderId} declined.`);
    if (onDecline) {
      onDecline();
    } else {
      setTimeout(() => {
        router.push("/seller/res/orders");
      }, 800);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Background Orders Screen */}
        <div className={styles.backgroundScreen}>
          <header className={styles.topBar}>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
              aria-label="Back"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <h1 className={styles.pageTitle}>Orders</h1>
            <div className={styles.searchButton}>
              <Search size={20} color="#0F172A" />
            </div>
          </header>

          <div className={styles.filterTabs}>
            <span className={`${styles.tabPill} ${styles.tabPillActive}`}>
              New • 2
            </span>
            <span className={styles.tabPill}>Preparing</span>
            <span className={styles.tabPill}>Out</span>
          </div>

          <div className={styles.orderCardBack}>
            <div className={styles.cardBackLeft}>
              <div className={styles.cardBackMeta}>
                {orderId} • {timeAgo}
              </div>
              <div className={styles.cardBackName}>{customerName}</div>
              <div className={styles.cardBackDetails}>
                {itemCount} items • {orderTotal}
              </div>
            </div>
            <ChevronLeft size={20} className={styles.cardBackChevron} />
          </div>
        </div>

        {/* Modal Backdrop Layer */}
        <div className={styles.sheetBackdrop} onClick={handleBack} />

        {/* Bottom Sheet / Reliability Card */}
        <section className={styles.bottomSheet}>
          <div className={styles.dragHandle} />

          {/* Header Row */}
          <div className={styles.orderMetaRow}>
            <div className={styles.orderMetaLeft}>
              <span className={styles.orderIdText}>
                {orderId} • {timeAgo}
              </span>
              <h2 className={styles.customerName}>{customerName}</h2>
              <p className={styles.orderSubtitle}>
                {itemCount} items • {orderTotal}
              </p>
            </div>

            <span className={styles.prepaidBadge}>{paymentType}</span>
          </div>

          {/* Customer Reliability Section */}
          <div className={styles.reliabilityHeader}>
            <h3 className={styles.reliabilityTitle}>Customer Reliability</h3>
            <div className={styles.ratingBadge}>
              <Star size={16} className={styles.starIcon} fill="#F97316" color="#F97316" />
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
            <Calendar size={14} color="#64748B" />
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

        {/* Toast Notification */}
        {toastMessage && (
          <div className={styles.toastNotification}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveCustomerReliability;

