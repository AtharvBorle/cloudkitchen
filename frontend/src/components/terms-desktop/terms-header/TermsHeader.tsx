import React from "react";
import styles from "./TermsHeader.module.css";

export interface TermsHeaderProps {
  title?: string;
  subtitle?: string;
}

export const TermsHeader: React.FC<TermsHeaderProps> = ({
  title = "Terms & Conditions",
  subtitle = "Please read these terms and conditions carefully before using the Neo Cloud Kitchen platform.",
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

export default TermsHeader;
