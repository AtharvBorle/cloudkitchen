"use client";

import React from "react";
import styles from "./AddPaymentButton.module.css";
import { PlusCircle } from "lucide-react";

export interface AddPaymentButtonProps {
  onClick?: () => void;
}

export const AddPaymentButton: React.FC<AddPaymentButtonProps> = ({ onClick }) => {
  return (
    <button type="button" className={styles.addButton} onClick={onClick}>
      <PlusCircle size={22} className={styles.plusIcon} strokeWidth={2.4} />
      <span>Add New Payment Method</span>
    </button>
  );
};