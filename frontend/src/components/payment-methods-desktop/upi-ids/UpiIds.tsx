"use client";

import React, { useState } from "react";
import styles from "./UpiIds.module.css";
import { SmartphoneNfc, Trash2 } from "lucide-react";

export interface UpiItem {
  id: string;
  upiId: string;
  bankName: string;
}

const DEFAULT_UPI_ITEMS: UpiItem[] = [];

export const UpiIds: React.FC = () => {
  const [upiList, setUpiList] = useState<UpiItem[]>(DEFAULT_UPI_ITEMS);

  const handleDelete = (id: string) => {
    setUpiList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.sectionWrapper}>
      <h3 className={styles.sectionHeading}>UPI IDS</h3>

      <div className={styles.cardContainer}>
        {upiList.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
            No UPI IDs linked to this account.
          </div>
        ) : (
          <div className={styles.upiList}>
          {upiList.map((item) => (
            <div key={item.id} className={styles.upiRow}>
              <div className={styles.leftInfo}>
                <div className={styles.iconContainer}>
                  <SmartphoneNfc size={20} className={styles.icon} />
                </div>
                <div>
                  <h4 className={styles.upiTitle}>{item.upiId}</h4>
                  <p className={styles.upiSubtitle}>{item.bankName}</p>
                </div>
              </div>

              {/* Soft Red Delete Button with Red Trash Icon */}
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => handleDelete(item.id)}
                aria-label={`Delete UPI ID ${item.upiId}`}
              >
                <Trash2 size={16} strokeWidth={2.2} className={styles.trashIcon} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};