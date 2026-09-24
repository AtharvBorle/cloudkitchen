"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Bell, ArrowRight, UtensilsCrossed } from "lucide-react";
import styles from "./ActiveSubscriptionsNotifications.module.css";
import { fetchUserMealSubscriptions, UserActiveMealSubscription } from "@/lib/meal-subscriptions";

export const ActiveSubscriptionsNotifications: React.FC = () => {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<UserActiveMealSubscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifStates, setNotifStates] = useState<{ [key: string]: boolean }>({
    orderUpdates: true,
    promoOffers: false,
    newMenu: true,
    deliveryAlerts: true,
  });

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

  const toggleNotif = (key: string) => {
    setNotifStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.sectionContainer}>
      {/* 1. Left Card: Active Subscriptions */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <Calendar size={18} strokeWidth={2.4} />
            </div>
            <h2 className={styles.cardTitle}>Active Subscriptions</h2>
          </div>

          {subscriptions.length > 0 && (
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
              <span>View All</span>
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
        ) : subscriptions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {subscriptions.slice(0, 3).map((sub) => {
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
            <Link href="/explore-desktop" className={styles.exploreLink}>
              <span>Explore Meal Plans</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Right Card: Notifications Summary */}
      <div className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <Bell size={18} strokeWidth={2.4} />
            </div>
            <h2 className={styles.cardTitle}>Notifications Summary</h2>
          </div>
        </div>

        <div className={styles.notifList}>
          {/* Row 1: Order Updates */}
          <div className={styles.notifRow}>
            <div className={styles.notifInfo}>
              <h3 className={styles.notifTitle}>Order Updates</h3>
              <p className={styles.notifDesc}>Status tracking & dispatch alerts</p>
            </div>
            <div
              className={`${styles.switchTrack} ${
                notifStates.orderUpdates ? styles.switchTrackActive : ""
              }`}
              onClick={() => toggleNotif("orderUpdates")}
              role="switch"
              aria-checked={notifStates.orderUpdates}
              tabIndex={0}
            >
              <div
                className={`${styles.switchThumb} ${
                  notifStates.orderUpdates ? styles.switchThumbActive : ""
                }`}
              />
            </div>
          </div>

          {/* Row 2: Promotional Offers */}
          <div className={styles.notifRow}>
            <div className={styles.notifInfo}>
              <h3 className={styles.notifTitle}>Promotional Offers</h3>
              <p className={styles.notifDesc}>Flash sales & personalized discounts</p>
            </div>
            <div
              className={`${styles.switchTrack} ${
                notifStates.promoOffers ? styles.switchTrackActive : ""
              }`}
              onClick={() => toggleNotif("promoOffers")}
              role="switch"
              aria-checked={notifStates.promoOffers}
              tabIndex={0}
            >
              <div
                className={`${styles.switchThumb} ${
                  notifStates.promoOffers ? styles.switchThumbActive : ""
                }`}
              />
            </div>
          </div>

          {/* Row 3: New Menu Arrivals */}
          <div className={styles.notifRow}>
            <div className={styles.notifInfo}>
              <h3 className={styles.notifTitle}>New Menu Arrivals</h3>
              <p className={styles.notifDesc}>Instant notifications of new bakery items</p>
            </div>
            <div
              className={`${styles.switchTrack} ${
                notifStates.newMenu ? styles.switchTrackActive : ""
              }`}
              onClick={() => toggleNotif("newMenu")}
              role="switch"
              aria-checked={notifStates.newMenu}
              tabIndex={0}
            >
              <div
                className={`${styles.switchThumb} ${
                  notifStates.newMenu ? styles.switchThumbActive : ""
                }`}
              />
            </div>
          </div>

          {/* Row 4: Delivery Alerts */}
          <div className={styles.notifRow}>
            <div className={styles.notifInfo}>
              <h3 className={styles.notifTitle}>Delivery Alerts</h3>
              <p className={styles.notifDesc}>Alerts when agent is near your home</p>
            </div>
            <div
              className={`${styles.switchTrack} ${
                notifStates.deliveryAlerts ? styles.switchTrackActive : ""
              }`}
              onClick={() => toggleNotif("deliveryAlerts")}
              role="switch"
              aria-checked={notifStates.deliveryAlerts}
              tabIndex={0}
            >
              <div
                className={`${styles.switchThumb} ${
                  notifStates.deliveryAlerts ? styles.switchThumbActive : ""
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveSubscriptionsNotifications;
