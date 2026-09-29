"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./SubscriptionActions.module.css";
import { RefreshCw } from "lucide-react";

export interface SubscriptionActionsProps {
  status?: string;
  isLoading?: boolean;
  onChangePlan?: () => void;
}

export const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({
  status = "ACTIVE",
  isLoading = false,
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
      <div className={styles.buttonsGroup}>
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
