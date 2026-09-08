"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";
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
    amount: "\u20B9850",
  },
  {
    id: "2",
    orderNumber: "#1235",
    customerName: "Rahul Verma",
    amount: "\u20B9850",
  },
];

export const ResponsiveCashHandover: React.FC<ResponsiveCashHandoverProps> = ({
  riderName = "Rahul Kumar",
  riderInitials = "RK",
  totalCash = "\u20B91,700",
  ordersCount = 3,
  orders = DEFAULT_ORDERS,
  onConfirmReceipt,
  onReportDiscrepancy,
  onBack,
}) => {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(true);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/res/delivery");
    }
  };

  const handleConfirm = () => {
    if (!isChecked) return;
    if (onConfirmReceipt) {
      onConfirmReceipt();
    } else {
      router.push("/seller/res/delivery");
    }
  };

  const handleReport = () => {
    if (onReportDiscrepancy) {
      onReportDiscrepancy();
    } else {
      router.push("/dashboard/support");
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
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
            <ChevronLeft size={24} />
          </button>

          <h1 className={styles.headerTitle}>Cash Handover</h1>

          <div className={styles.headerPlaceholder} />
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
          <section>
            <h4 className={styles.sectionLabel}>ORDERS BREAKDOWN</h4>
            <div className={styles.breakdownList}>
              {orders.map((order) => (
                <div key={order.id} className={styles.breakdownRow}>
                  <span className={styles.orderText}>
                    {order.orderNumber} · {order.customerName}
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
              {isChecked && <Check size={14} strokeWidth={3} />}
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
      </div>
    </div>
  );
};

export default ResponsiveCashHandover;

