"use client";

import React from "react";
import { Clock } from "lucide-react";
import styles from "./DeliveryTimes.module.css";

export interface DeliverySlot {
  id: string;
  name: string;
  timeRange: string;
  icon?: string;
}

export interface DeliveryTimesProps {
  slots?: DeliverySlot[];
}

export const DeliveryTimes: React.FC<DeliveryTimesProps> = ({
  slots,
}) => {
  const displaySlots = Array.isArray(slots) ? slots : [];

  return (
    <div className={styles.cardContainer}>
      <h3 className={styles.cardHeading}>Daily Delivery Times</h3>

      {displaySlots.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B", lineHeight: "1.4" }}>
          Delivery timings will be provided as scheduled by your kitchen partner.
        </p>
      ) : (
        <div className={styles.slotsList}>
          {displaySlots.map((slot) => (
            <div key={slot.id} className={styles.slotRow}>
              <div className={styles.slotNameCol}>
                <Clock size={16} color="#FF5500" style={{ flexShrink: 0 }} />
                <span className={styles.slotName}>{slot.name}</span>
              </div>
              <span className={styles.slotTime}>{slot.timeRange}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
