import React from "react";
import styles from "./AddressesHeader.module.css";

export interface AddressesHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AddressesHeader: React.FC<AddressesHeaderProps> = ({
  title = "Delivery Addresses",
  subtitle = "Manage your delivery locations and specify the default address for your meal delivery subscriptions.",
}) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerTopRow}>
        <div className={styles.headerTitleCol}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};