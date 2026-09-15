"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./SubscriptionActions.module.css";

export interface SubscriptionActionsProps {
  onCancelSubscription?: () => void;
  onChangePlan?: () => void;
}

export const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
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

  return (
    <div className={styles.actionsContainer}>
      <button
        type="button"
        className={styles.cancelBtn}
        onClick={() => handleAction(onCancelSubscription)}
      >
        Cancel Subscription
      </button>

      <button
        type="button"
        className={styles.changePlanBtn}
        onClick={() => handleAction(onChangePlan)}
      >
        Change Plan
      </button>
    </div>
  );
};
