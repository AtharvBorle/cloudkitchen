"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, CheckCircle2, AlertTriangle, Bell } from "lucide-react";
import styles from "./ResponsiveCashHandover.module.css";

export interface CashOrderLine {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: string;
}

export interface DiscrepancyRecord {
  id: string;
  ticketId: string;
  riderName: string;
  expectedAmount: string;
  actualAmount: string;
  shortageAmount: string;
  reason: string;
  note: string;
  status: "UNDER_REVIEW" | "RESOLVED" | "PENDING_VERIFICATION";
  createdAt: string;
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

const DEFAULT_ORDERS: CashOrderLine[] = [];

export const ResponsiveCashHandover: React.FC<ResponsiveCashHandoverProps> = ({
  riderName = "Rider",
  riderInitials = "RD",
  totalCash = "₹0",
  ordersCount = 0,
  orders = DEFAULT_ORDERS,
  onConfirmReceipt,
  onReportDiscrepancy,
  onBack,
}) => {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  // Discrepancy Form States
  const [discrepancyReason, setDiscrepancyReason] = useState("Cash shortage in handover");
  const [actualCashReceived, setActualCashReceived] = useState("");
  const [discrepancyNotes, setDiscrepancyNotes] = useState("");
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyRecord[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("seller_cash_discrepancies");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setDiscrepancies(parsed);
          }
        }
      } catch {}
    }
  }, []);

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
      setActualCashReceived("");
      setDiscrepancyNotes("");
      setIsReporting(true);
    }
  };

  const handleSubmitDiscrepancy = () => {
    const rawExpected = parseFloat(totalCash.replace(/[^0-9.]/g, "")) || 0;
    const rawActual = parseFloat(actualCashReceived.replace(/[^0-9.]/g, "")) || 0;
    const rawShortage = Math.max(0, rawExpected - rawActual);
    const ticketNum = `DISC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRecord: DiscrepancyRecord = {
      id: `disc-${Date.now()}`,
      ticketId: ticketNum,
      riderName,
      expectedAmount: totalCash,
      actualAmount: actualCashReceived ? `₹${rawActual.toLocaleString("en-IN")}` : "₹0",
      shortageAmount: `₹${rawShortage.toLocaleString("en-IN")}`,
      reason: discrepancyReason,
      note: discrepancyNotes.trim() || "Mismatch reported by seller during cash handover verification.",
      status: "UNDER_REVIEW",
      createdAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };

    const updated = [newRecord, ...discrepancies];
    setDiscrepancies(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("seller_cash_discrepancies", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("seller-discrepancy-submitted", { detail: newRecord }));
      } catch {}
    }

    setIsReporting(false);
    showToast(`Discrepancy ticket #${ticketNum} submitted & tracked.`);
  };

  const riderDiscrepancies = discrepancies.filter((d) => d.riderName === riderName || !d.riderName);

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
            onClick={() => router.push("/seller/notifications")}
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
              {orders.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", color: "#64748B", fontSize: "0.85rem" }}>
                  No pending cash orders for handover.
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className={styles.breakdownRow}>
                    <span className={styles.orderText}>
                      <strong className={styles.orderNum}>{order.orderNumber}</strong>
                      <span className={styles.orderDot}>•</span>
                      <span className={styles.orderCust}>{order.customerName}</span>
                    </span>
                    <span className={styles.orderAmount}>{order.amount}</span>
                  </div>
                ))
              )}
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

          {/* Tracked Discrepancy Records Section */}
          {riderDiscrepancies.length > 0 && (
            <section className={styles.discrepancySection}>
              <h4 className={styles.sectionLabel}>TRACKED DISCREPANCIES ({riderDiscrepancies.length})</h4>
              {riderDiscrepancies.map((disc) => (
                <div key={disc.id} className={styles.discrepancyCard}>
                  <div className={styles.discrepancyHeader}>
                    <span className={styles.ticketId}>#{disc.ticketId}</span>
                    <span className={disc.status === "RESOLVED" ? styles.statusBadgeResolved : styles.statusBadgeReview}>
                      {disc.status === "RESOLVED" ? "✓ Resolved" : "⏳ Under Review"}
                    </span>
                  </div>
                  <div className={styles.discrepancyRow}>
                    <span>Reason: <strong>{disc.reason}</strong></span>
                    <span className={styles.discrepancyAmount}>Shortage: {disc.shortageAmount}</span>
                  </div>
                  <div className={styles.discrepancyRow}>
                    <span>Expected: {disc.expectedAmount} | Received: {disc.actualAmount}</span>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>{disc.createdAt}</span>
                  </div>
                  {disc.note && (
                    <div className={styles.discrepancyNote}>
                      Note: &ldquo;{disc.note}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
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
                Record and track a mismatch in cash collected vs expected amount for <strong>{riderName}</strong>.
              </p>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Discrepancy Reason</label>
                <select
                  className={styles.selectInput}
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                >
                  <option value="Cash shortage in handover">Cash shortage in handover</option>
                  <option value="Damaged or counterfeit notes">Damaged or counterfeit notes</option>
                  <option value="Customer payment dispute">Customer payment dispute</option>
                  <option value="Order marked delivered but unpaid">Order marked delivered but unpaid</option>
                  <option value="Other">Other discrepancy</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Actual Cash Received (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  className={styles.textInput}
                  placeholder="e.g. 800"
                  value={actualCashReceived}
                  onChange={(e) => setActualCashReceived(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Notes / Explanation</label>
                <textarea
                  className={styles.textareaInput}
                  placeholder="Describe the discrepancy details for operations review..."
                  value={discrepancyNotes}
                  onChange={(e) => setDiscrepancyNotes(e.target.value)}
                  rows={2}
                />
              </div>

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
                  onClick={handleSubmitDiscrepancy}
                >
                  Submit &amp; Track Report
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

