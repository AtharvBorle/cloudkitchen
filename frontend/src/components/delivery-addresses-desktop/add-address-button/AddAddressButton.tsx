"use client";

import React from "react";
import styles from "./AddAddressButton.module.css";
import { Plus } from "lucide-react";

export interface AddAddressButtonProps {
  onClick?: () => void;
}

export const AddAddressButton: React.FC<AddAddressButtonProps> = ({ onClick }) => {
  return (
    <div className={styles.buttonWrapper}>
      <button type="button" className={styles.addButton} onClick={onClick}>
        <Plus size={20} className={styles.plusIcon} strokeWidth={3} />
        <span>Add New Address</span>
      </button>
    </div>
  );
};