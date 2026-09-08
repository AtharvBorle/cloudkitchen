"use client";

import React, { useState } from "react";
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react";
import styles from "./PaymentMethods.module.css";

export interface PaymentMethodsProps {
  onAddNewPayment?: () => void;
  onEditPayment?: (id: string) => void;
  onDeletePayment?: (id: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  onAddNewPayment,
  onEditPayment,
  onDeletePayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("card-1");

  return (
    <div className={styles.sectionCard}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <CreditCard size={18} strokeWidth={2.4} />
          </div>
          <h2 className={styles.cardTitle}>Payment Methods</h2>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={onAddNewPayment}
          aria-label="Add New Payment Method"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Add New Payment Method</span>
        </button>
      </div>

      {/* 2 Payment Cards */}
      <div className={styles.paymentsGrid}>
        {/* Card 1: HDFC Credit Card */}
        <div
          className={styles.paymentBox}
          onClick={() => setSelectedMethod("card-1")}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className={styles.paymentTop}>
              <div className={styles.paymentTopLeft}>
                <span className={styles.visaBadge}>VISA</span>
                <div className={styles.paymentInfo}>
                  <h3 className={styles.paymentName}>HDFC Bank Credit Card</h3>
                  <p className={styles.cardNumber}>•••• •••• •••• 4523</p>
                </div>
              </div>

              <div
                className={
                  selectedMethod === "card-1"
                    ? styles.radioSelected
                    : styles.radioUnselected
                }
              />
            </div>
          </div>

          <div className={styles.paymentBottom}>
            <div className={styles.cardMetaGroup}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>CARD HOLDER</span>
                <p className={styles.metaValue}>Rahul Sharma</p>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>EXPIRES</span>
                <p className={styles.metaValue}>09/29</p>
              </div>
            </div>

            <div className={styles.actionIcons}>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPayment && onEditPayment("card-1");
                }}
                aria-label="Edit Credit Card"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePayment && onDeletePayment("card-1");
                }}
                aria-label="Delete Credit Card"
              >
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: UPI */}
        <div
          className={styles.paymentBox}
          onClick={() => setSelectedMethod("upi-1")}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className={styles.paymentTop}>
              <div className={styles.paymentTopLeft}>
                <span className={styles.upiBadge}>UPI</span>
                <div className={styles.paymentInfo}>
                  <h3 className={styles.paymentName}>rahul@okicici</h3>
                  <p className={styles.subText}>Linked via ICICI Bank</p>
                </div>
              </div>

              <div
                className={
                  selectedMethod === "upi-1"
                    ? styles.radioSelected
                    : styles.radioUnselected
                }
              />
            </div>
          </div>

          <div className={styles.paymentBottom}>
            <p className={styles.verifiedText}>Verified & Active</p>

            <div className={styles.actionIcons}>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPayment && onEditPayment("upi-1");
                }}
                aria-label="Edit UPI"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePayment && onDeletePayment("upi-1");
                }}
                aria-label="Delete UPI"
              >
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
