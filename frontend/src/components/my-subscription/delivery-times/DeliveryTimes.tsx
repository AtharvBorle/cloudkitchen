"use client";

import React from "react";
import styles from "./DeliveryTimes.module.css";

export interface DeliverySlot {
  id: string;
  name: string;
  timeRange: string;
  icon: string;
}

export interface DeliveryTimesProps {
  slots?: DeliverySlot[];
}

const DEFAULT_SLOTS: DeliverySlot[] = [
  {
    id: "breakfast",
    name: "Breakfast Delivery",
    timeRange: "8:00 AM – 9:30 AM",
    icon: "🍳",
  },
  {
    id: "lunch",
    name: "Lunch Delivery",
    timeRange: "1:00 PM – 2:30 PM",
    icon: "🍲",
  },
  {
    id: "dinner",
    name: "Dinner Delivery",
    timeRange: "8:00 PM – 9:30 PM",
    icon: "🍱",
  },
];

export const DeliveryTimes: React.FC<DeliveryTimesProps> = ({
  slots = DEFAULT_SLOTS,
}) => {
  return (
    <div className={styles.cardContainer}>
      <h3 className={styles.cardHeading}>Daily Delivery Times</h3>

      <div className={styles.slotsList}>
        {slots.map((slot) => (
          <div key={slot.id} className={styles.slotRow}>
            <div className={styles.slotNameCol}>
              <span className={styles.slotIcon}>{slot.icon}</span>
              <span className={styles.slotName}>{slot.name}</span>
            </div>
            <span className={styles.slotTime}>{slot.timeRange}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
