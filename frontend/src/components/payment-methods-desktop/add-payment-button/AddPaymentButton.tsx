"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./AddPaymentButton.module.css";
import { PlusCircle } from "lucide-react";

export interface AddPaymentButtonProps {
  onClick?: () => void;
}

export const AddPaymentButton: React.FC<AddPaymentButtonProps> = ({ onClick }) => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!session?.user) {
      router.push("/login?callbackUrl=/payment-methods-desktop");
    }
  };

  return (
    <button type="button" className={styles.addButton} onClick={handleClick}>
      <PlusCircle size={22} className={styles.plusIcon} strokeWidth={2.4} />
      <span>Add New Payment Method</span>
    </button>
  );
};