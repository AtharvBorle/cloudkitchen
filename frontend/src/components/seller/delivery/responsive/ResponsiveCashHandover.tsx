"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, CheckCircle2, AlertTriangle, Bell } from "lucide-react";
import styles from "./ResponsiveCashHandover.module.css";

export interface CashOrderLine {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: string;
}

export interface ResponsiveCashHandoverProps {
  riderName?: string;
  riderInitials?: string;
  totalCash?: string;
  ordersCount?: number;
  orders?: CashOrderLine[];
  onConfirmReceipt?: () => void;
  onReportDiscrepancy?: () => void;
  onBack?: () => void;
}

const DEFAULT_ORDERS: CashOrderLine[] = [
  {
    id: "1",
    orderNumber: "#1234",
    customerName: "Priya Mehta",
    amount: "₹850",
  },
  {
    id: "2",
    orderNumber: "#1235",
    customerName: "Rahul Verma",
    amount: "₹850",
  },
];

export const ResponsiveCashHandover: React.FC<ResponsiveCashHandoverProps> = ({
  riderName = "Rahul Kumar",
  riderInitials = "RK",
  totalCash = "₹1,700",
  ordersCount = 3,
  orders = DEFAULT_ORDERS,
  onConfirmReceipt,
  onReportDiscrepancy,
  onBack,
}) => {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/delivery/riders");
    }
  };

  const handleConfirm = () => {
    if (!isChecked) return;
    if (onConfirmReceipt) {
      onConfirmReceipt();
    } else {
      showToast(`Receipt of ${totalCash} confirmed successfully!`);
      setTimeout(() => {
        router.push("/seller/delivery/riders");
      }, 1000);
    }
  };

  const handleReport = () => {
    if (onReportDiscrepancy) {
      onReportDiscrepancy();
    } else {
      setIsReporting(true);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <h1 className={styles.headerTitle}>Cash Handover</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/res/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
          </button>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Rider Card */}
          <section className={styles.riderCard}>
            <div className={styles.avatarCircle}>{riderInitials}</div>
            <div className={styles.riderInfo}>
              <h2 className={styles.riderName}>{riderName}</h2>
              <p className={styles.riderSubtext}>is handing over cash</p>
            </div>
          </section>

          {/* Highlight Cash Banner */}
          <section className={styles.highlightBanner}>
            <h3 className={styles.amountTitle}>{totalCash}</h3>
            <p className={styles.ordersCountText}>{ordersCount} Orders Total</p>
          </section>

          {/* Orders Breakdown */}
          <section className={styles.breakdownSection}>
            <h4 className={styles.sectionLabel}>ORDERS BREAKDOWN</h4>
            <div className={styles.breakdownList}>
              {orders.map((order) => (
                <div key={order.id} className={styles.breakdownRow}>
                  <span className={styles.orderText}>
                    <strong className={styles.orderNum}>{order.orderNumber}</strong>
                    <span className={styles.orderDot}>•</span>
                    <span className={styles.orderCust}>{order.customerName}</span>
                  </span>
                  <span className={styles.orderAmount}>{order.amount}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Confirmation Checkbox Card */}
          <div
            className={styles.checkboxCard}
            onClick={() => setIsChecked((prev) => !prev)}
            role="checkbox"
            aria-checked={isChecked}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsChecked((prev) => !prev);
              }
            }}
          >
            <div
              className={`${styles.checkboxBox} ${
                !isChecked ? styles.checkboxBoxUnchecked : ""
              }`}
            >
              {isChecked && <Check size={14} strokeWidth={3.2} />}
            </div>
            <span className={styles.checkboxLabel}>
              I confirm I have received {totalCash} in cash
            </span>
          </div>

          {/* Confirm Receipt Action */}
          <button
            type="button"
            className={styles.confirmReceiptBtn}
            disabled={!isChecked}
            onClick={handleConfirm}
          >
            Confirm Receipt
          </button>

          {/* Report Discrepancy */}
          <button
            type="button"
            className={styles.reportBtn}
            onClick={handleReport}
          >
            Report discrepancy
          </button>
        </main>

        {/* Report Discrepancy Modal */}
        {isReporting && (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsReporting(false)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <AlertTriangle size={24} color="#EF4444" />
                <h3 className={styles.modalTitle}>Report Discrepancy</h3>
              </div>
              <p className={styles.modalText}>
                Are you noticing a mismatch in cash collected vs expected amount for {riderName}?
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsReporting(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.modalReportBtn}
                  onClick={() => {
                    setIsReporting(false);
                    showToast("Discrepancy reported to operations desk.");
                  }}
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

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

export default ResponsiveCashHandover;

