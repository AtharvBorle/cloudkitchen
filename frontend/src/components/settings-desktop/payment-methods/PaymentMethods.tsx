"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<string>("card-1");

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
    } else if (!session?.user) {
      router.push("/login?callbackUrl=/payment-methods-desktop");
    } else {
      router.push("/payment-methods-desktop");
    }
  };

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
          onClick={() => handleAction(onAddNewPayment)}
          aria-label="Add New Payment Method"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Add New Payment Method</span>
        </button>
      </div>

      {/* Payment Cards */}
      <div className={styles.paymentsGrid}>
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "36px 20px",
            textAlign: "center",
            color: "#64748B",
            backgroundColor: "#F8FAFC",
            borderRadius: "12px",
            border: "1.5px dashed #CBD5E1",
          }}
        >
          <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
            No saved payment methods
          </p>
          <p style={{ margin: 0, fontSize: "13px" }}>
            Add a credit card or UPI ID to easily pay for orders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
