"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./PauseSubscription.module.css";
import { PauseCircle } from "lucide-react";

export interface PauseSubscriptionProps {
  initialPaused?: boolean;
  isPaused?: boolean;
  disabled?: boolean;
  onTogglePause?: (paused: boolean) => void;
}

export const PauseSubscription: React.FC<PauseSubscriptionProps> = ({
  initialPaused = false,
  isPaused: controlledPaused,
  disabled = false,
  onTogglePause,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [internalPaused, setInternalPaused] = useState<boolean>(
    controlledPaused !== undefined ? controlledPaused : initialPaused
  );

  useEffect(() => {
    if (controlledPaused !== undefined) {
      setInternalPaused(controlledPaused);
    }
  }, [controlledPaused]);

  const activePaused = controlledPaused !== undefined ? controlledPaused : internalPaused;

  const handleToggle = () => {
    if (disabled) return;
    if (!session?.user) {
      router.push("/login?callbackUrl=/my-subscriptions-desktop");
      return;
    }
    const nextState = !activePaused;
    setInternalPaused(nextState);
    if (onTogglePause) {
      onTogglePause(nextState);
    }
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabledContainer : ""}`}>
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
        aria-checked={activePaused}
        disabled={disabled}
        className={`${styles.toggleSwitch} ${activePaused ? styles.toggleActive : ""} ${
          disabled ? styles.toggleDisabled : ""
        }`}
        onClick={handleToggle}
        aria-label="Pause Subscription Switch"
      >
        <div className={styles.toggleThumb} />
      </button>
    </div>
  );
};
