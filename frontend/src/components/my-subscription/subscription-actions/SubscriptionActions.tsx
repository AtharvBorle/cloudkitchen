"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./SubscriptionActions.module.css";
import { RefreshCw, Ban, ShieldAlert } from "lucide-react";

export interface SubscriptionActionsProps {
  allowCancel?: boolean;
  status?: string;
  isLoading?: boolean;
  onCancelSubscription?: () => void;
  onChangePlan?: () => void;
}

export const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
  allowCancel = false,
  status = "ACTIVE",
  isLoading = false,
  onCancelSubscription,
  onChangePlan,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleAction = (cb?: () => void) => {
    if (cb) {
      cb();
    } else if (!session?.user) {
      router.push("/login?callbackUrl=/my-subscriptions-desktop");
    }
  };

  const isCancelled = status?.toUpperCase() === "CANCELLED";

  return (
    <div className={styles.actionsContainer}>
      {/* If seller disabled cancellation for this plan, display an informative note instead of the cancel button */}
      {!allowCancel && !isCancelled && (
        <div className={styles.cancellationNotice}>
          <ShieldAlert size={16} className={styles.noticeIcon} />
          <span>Self-service cancellation is not enabled for this meal plan by the kitchen partner.</span>
        </div>
      )}

      <div className={styles.buttonsGroup}>
        {/* Dynamic Cancel Subscription button - ONLY visible when allowCancel is true and not already cancelled */}
        {allowCancel && !isCancelled && (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => handleAction(onCancelSubscription)}
            disabled={isLoading}
          >
            <Ban size={16} className={styles.btnIcon} />
            <span>Cancel Subscription</span>
          </button>
        )}

        {/* Change Plan Button */}
        <button
          type="button"
          className={styles.changePlanBtn}
          onClick={() => handleAction(onChangePlan)}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={styles.btnIcon} />
          <span>{isCancelled ? "Browse & Re-Subscribe" : "Change Plan"}</span>
        </button>
      </div>
    </div>
  );
};
