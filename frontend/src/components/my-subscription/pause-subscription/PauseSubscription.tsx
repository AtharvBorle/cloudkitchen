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
  allowPause?: boolean;
  pausePolicyNote?: string;
  onTogglePause?: (paused: boolean) => void;
}

export const PauseSubscription: React.FC<PauseSubscriptionProps> = ({
  initialPaused = false,
  isPaused: controlledPaused,
  disabled = false,
  allowPause = true,
  pausePolicyNote,
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
  const isSwitchDisabled = disabled || !allowPause;

  const handleToggle = () => {
    if (isSwitchDisabled) return;
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

  if (allowPause === false) {
    return null;
  }

  return (
    <div className={`${styles.container} ${isSwitchDisabled ? styles.disabledContainer : ""}`}>
      <div className={styles.left}>
        <div className={styles.iconSquare}>
          <PauseCircle size={24} className={styles.icon} />
        </div>
        <div>
          <h3 className={styles.title}>Pause Subscription</h3>
          <p className={styles.subtitle}>
            {!allowPause
              ? (pausePolicyNote || "Pausing is disabled for this meal plan by the kitchen partner.")
              : "Pause your subscription if you're traveling. Your meals and billing will freeze automatically."}
          </p>
        </div>
      </div>

      {/* Interactive Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={activePaused}
        disabled={isSwitchDisabled}
        className={`${styles.toggleSwitch} ${activePaused ? styles.toggleActive : ""} ${
          isSwitchDisabled ? styles.toggleDisabled : ""
        }`}
        onClick={handleToggle}
        aria-label="Pause Subscription Switch"
        title={!allowPause ? "Pausing is disabled for this meal plan by the kitchen partner." : undefined}
      >
        <div className={styles.toggleThumb} />
      </button>
    </div>
  );
};
