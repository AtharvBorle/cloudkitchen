import React from "react";
import styles from "./PrivacyHeader.module.css";

export interface PrivacyHeaderProps {
  title?: string;
  subtitle?: string;
}

export const PrivacyHeader: React.FC<PrivacyHeaderProps> = ({
  title = "Privacy Policy",
  subtitle = "Learn how Neo Cloud Kitchen protects your personal data, handles delivery locations, and secures payment transactions.",
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

export default PrivacyHeader;
