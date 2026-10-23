"use client";

import React from "react";
import Image from "next/image";
import styles from "./OutOfServiceLocation.module.css";

interface OutOfServiceLocationProps {
  onOpenLocationModal?: () => void;
}

export const OutOfServiceLocation: React.FC<OutOfServiceLocationProps> = ({
  onOpenLocationModal,
}) => {
  return (
    <div className={styles.outOfServiceWrapper}>
      <div className={styles.outOfServiceCard}>
        {/* 3D Delivery Rider Illustration */}
        <div className={styles.imageContainer}>
          <Image
            src="/images/out-of-service-rider.png"
            alt="We'll Be Serving You Soon"
            width={340}
            height={300}
            priority
            className={styles.riderImage}
          />
        </div>

        {/* Heading */}
        <h1 className={styles.title}>We&apos;ll Be Serving You Soon!</h1>

        {/* Subheading */}
        <p className={styles.subtitle}>
          &ldquo;We&apos;re not serving your area yet. Stay tuned for delicious updates!&rdquo;
        </p>

        {/* Action Button: Opens direct location selector modal */}
        <button
          type="button"
          onClick={onOpenLocationModal}
          className={styles.changeLocationBtn}
        >
          Try Changing Location
        </button>
      </div>
    </div>
  );
};

export default OutOfServiceLocation;
