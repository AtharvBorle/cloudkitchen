import React from "react";
import styles from "./RateAppHeader.module.css";

export interface RateAppHeaderProps {
  title?: string;
  subtitle?: string;
}

export const RateAppHeader: React.FC<RateAppHeaderProps> = ({
  title = "Rate Our App",
  subtitle = "Tell us about your experience with Neo Cloud Bites! Your ratings help us improve our food quality, delivery speed, and room booking service.",
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

export default RateAppHeader;
