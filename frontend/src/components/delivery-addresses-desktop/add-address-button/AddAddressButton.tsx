"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./AddAddressButton.module.css";
import { Plus } from "lucide-react";

export interface AddAddressButtonProps {
  onClick?: () => void;
}

export const AddAddressButton: React.FC<AddAddressButtonProps> = ({ onClick }) => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!session?.user) {
      router.push("/login?callbackUrl=/delivery-addresses-desktop");
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button type="button" className={styles.addButton} onClick={handleClick}>
        <Plus size={20} className={styles.plusIcon} strokeWidth={3} />
        <span>Add New Address</span>
      </button>
    </div>
  );
};