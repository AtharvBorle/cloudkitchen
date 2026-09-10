"use client";

import React, { ReactNode } from "react";
import styles from "./SellerResponsiveWrapper.module.css";

export interface SellerResponsiveWrapperProps {
  desktop: ReactNode;
  mobile: ReactNode;
}

export default function SellerResponsiveWrapper({
  desktop,
  mobile,
}: SellerResponsiveWrapperProps) {
  return (
    <div className={styles.container}>
      <div className={styles.desktopView}>{desktop}</div>
      <div className={styles.mobileView}>{mobile}</div>
    </div>
  );
}
