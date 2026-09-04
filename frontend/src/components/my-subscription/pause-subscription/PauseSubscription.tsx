"use client";

import React, { useState } from "react";
import styles from "./PauseSubscription.module.css";
import { PauseCircle } from "lucide-react";

export interface PauseSubscriptionProps {
  initialPaused?: boolean;
  onTogglePause?: (paused: boolean) => void;
}

export const PauseSubscription: React.FC<PauseSubscriptionProps> = ({
  initialPaused = false,
  onTogglePause,
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(initialPaused);

  const handleToggle = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    if (onTogglePause) {
      onTogglePause(nextState);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.iconSquare}>
          <PauseCircle size={24} className={styles.icon} />
        </div>
        <div>
          <h3 className={styles.title}>Pause Subscription</h3>
          <p className={styles.subtitle}>
            Pause your subscription if you&apos;re traveling. Your meals and billing will freeze automatically.
          </p>
        </div>
      </div>

      {/* Interactive Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isPaused}
        className={`${styles.toggleSwitch} ${isPaused ? styles.toggleActive : ""}`}
        onClick={handleToggle}
        aria-label="Pause Subscription Switch"
      >
        <div className={styles.toggleThumb} />
      </button>
    </div>
  );
};
