"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowRight, UtensilsCrossed } from "lucide-react";
import styles from "./ActiveSubscriptionsNotifications.module.css";
import { fetchUserMealSubscriptions, UserActiveMealSubscription } from "@/lib/meal-subscriptions";

export const ActiveSubscriptionsNotifications: React.FC = () => {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<UserActiveMealSubscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSubs() {
      try {
        setIsLoading(true);
        const subs = await fetchUserMealSubscriptions();
        if (isMounted) {
          if (subs && subs.length > 0) {
            setSubscriptions(subs);
          } else {
            setSubscriptions([]);
          }
        }
      } catch (err) {
        console.error("Failed to load user subscriptions for settings overview:", err);
        if (isMounted) {
          setSubscriptions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadSubs();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE");

  return (
    <div className={styles.sectionContainer}>
      {/* Active Subscriptions Card */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <Calendar size={18} strokeWidth={2.4} />
            </div>
            <h2 className={styles.cardTitle}>Active Subscriptions</h2>
          </div>

          {activeSubscriptions.length > 0 && (
            <Link
              href="/my-subscriptions-desktop"
              style={{
                fontSize: "0.82rem",
                color: "#f97316",
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>View All ({activeSubscriptions.length})</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              color: "#94A3B8",
              fontSize: "0.85rem",
              backgroundColor: "#F8FAFC",
              borderRadius: "14px",
            }}
          >
            Loading subscriptions...
          </div>
        ) : activeSubscriptions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeSubscriptions.slice(0, 3).map((sub) => {
              const planName = sub.plan?.name || "Meal Plan";
              const sellerName = sub.seller?.businessName || "Kitchen Partner";
              const isPaused = sub.isPaused || sub.status === "PAUSED";
              const isCancelled = sub.status === "CANCELLED";
              const isExpired = sub.status === "EXPIRED";
              const statusText = isPaused ? "PAUSED" : isCancelled ? "CANCELLED" : isExpired ? "EXPIRED" : "ACTIVE";

              const statusBg = isPaused ? "#FEF9C3" : isCancelled || isExpired ? "#FEE2E2" : "#DCFCE7";
              const statusColor = isPaused ? "#A16207" : isCancelled || isExpired ? "#EF4444" : "#16A34A";

              const renewalDateText = sub.endDate
                ? `Renewal Date: ${new Date(sub.endDate).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : "Renewal Date: Auto-renew";

              return (
                <div
                  key={sub.id}
                  className={styles.subInnerCard}
                  onClick={() => router.push("/my-subscriptions-desktop")}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.subInnerHeader}>
                    <h3 className={styles.subPlanName}>{planName}</h3>
                    <span
                      className={styles.activeBadge}
                      style={{
                        backgroundColor: statusBg,
                        color: statusColor,
                      }}
                    >
                      {statusText}
                    </span>
                  </div>
                  <p className={styles.subPlanDetails}>
                    Kitchen: {sellerName} • {sub.tier || sub.plan?.tier || "Standard"} Tier ({sub.cycle || "Monthly"})
                  </p>
                  <p className={styles.subPlanRenewal}>{renewalDateText}</p>

                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.82rem",
                      color: "#f97316",
                      fontWeight: 700,
                    }}
                  >
                    <span>Manage Plan</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptySubCard}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: "#FFF7ED",
                color: "#F97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UtensilsCrossed size={18} />
            </div>
            <h3 className={styles.emptySubTitle}>No Active Subscription</h3>
            <p className={styles.emptySubText}>
              You do not have any meal subscription plans yet.
            </p>
            <Link href="/my-subscriptions-desktop?tab=plans" className={styles.exploreLink}>
              <span>Explore Meal Plans</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSubscriptionsNotifications;
