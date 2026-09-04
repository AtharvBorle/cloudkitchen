"use client";

import React from "react";
import { User, Pencil } from "lucide-react";
import styles from "./PersonalProfile.module.css";

export interface PersonalProfileProps {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  onEdit?: () => void;
}

export const PersonalProfile: React.FC<PersonalProfileProps> = ({
  fullName = "Rahul Sharma",
  email = "rahul.sharma@lumen.com",
  phone = "+91 98765 43210",
  dob = "15 / 08 / 1995",
  gender = "Male",
  onEdit,
}) => {
  return (
    <div className={styles.cardContainer}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <User size={18} strokeWidth={2.4} />
          </div>
          <h2 className={styles.cardTitle}>Personal Profile</h2>
        </div>

        <button
          type="button"
          className={styles.editBtn}
          onClick={onEdit}
          aria-label="Edit Details"
        >
          <Pencil size={13} strokeWidth={2.4} />
          <span>Edit Details</span>
        </button>
      </div>

      {/* Fields */}
      <div className={styles.fieldsGrid}>
        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>FULL NAME</span>
          <p className={styles.fieldValue}>{fullName}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>EMAIL ADDRESS</span>
          <p className={styles.fieldValue}>{email}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>PHONE NUMBER</span>
          <p className={styles.fieldValue}>{phone}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>DATE OF BIRTH</span>
          <p className={styles.fieldValue}>{dob}</p>
        </div>

        <div className={styles.fieldItem}>
          <span className={styles.fieldLabel}>GENDER</span>
          <p className={styles.fieldValue}>{gender}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalProfile;
