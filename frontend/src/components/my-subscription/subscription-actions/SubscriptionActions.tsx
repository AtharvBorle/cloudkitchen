"use client";

import React from "react";
import styles from "./SubscriptionActions.module.css";

export interface SubscriptionActionsProps {
  onCancelSubscription?: () => void;
  onChangePlan?: () => void;
}

export const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
  onCancelSubscription,
  onChangePlan,
}) => {
  return (
    <div className={styles.actionsContainer}>
      <button
        type="button"
        className={styles.cancelBtn}
        onClick={onCancelSubscription}
      >
        Cancel Subscription
      </button>

      <button
        type="button"
        className={styles.changePlanBtn}
        onClick={onChangePlan}
      >
        Change Plan
      </button>
    </div>
  );
};
