"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Bell, ArrowRight, UtensilsCrossed } from "lucide-react";
import styles from "./ActiveSubscriptionsNotifications.module.css";
import { fetchUserMealSubscriptions, UserActiveMealSubscription } from "@/lib/meal-subscriptions";
import {
  getNotificationsSummaryPreferences,
  saveNotificationsSummaryPreferences,
  NotificationsSummaryPreferences,
  NOTIFICATION_PREFERENCES_EVENT,
} from "@/lib/user-notification-preferences";

export const ActiveSubscriptionsNotifications: React.FC = () => {
  const router = useRouter();
  const [activeSub, setActiveSub] = useState<UserActiveMealSubscription | null>(null);
  const [masterSubEnabled, setMasterSubEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifStates, setNotifStates] = useState<NotificationsSummaryPreferences>(() => {
    return getNotificationsSummaryPreferences();
  });

  // Sync with persistent storage on client mount and listen for updates
  useEffect(() => {
    setNotifStates(getNotificationsSummaryPreferences());

    const handlePrefChange = () => {
      setNotifStates(getNotificationsSummaryPreferences());
    };

    window.addEventListener(NOTIFICATION_PREFERENCES_EVENT, handlePrefChange);
    window.addEventListener("storage", handlePrefChange);

    return () => {
      window.removeEventListener(NOTIFICATION_PREFERENCES_EVENT, handlePrefChange);
      window.removeEventListener("storage", handlePrefChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadSubs() {
      try {
        setIsLoading(true);
        const subs = await fetchUserMealSubscriptions();
        if (isMounted) {
          if (subs && subs.length > 0) {
            const active = subs.find((s) => s.status === "ACTIVE") || subs[0];
            setActiveSub(active);
            setMasterSubEnabled(active.status === "ACTIVE" && !active.isPaused);
          } else {
            setActiveSub(null);
            setMasterSubEnabled(false);
          }
        }
      } catch (err) {
        console.error("Failed to load user subscriptions for settings overview:", err);
        if (isMounted) {
          setActiveSub(null);
          setMasterSubEnabled(false);
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

  const toggleNotif = (key: keyof NotificationsSummaryPreferences) => {
    setNotifStates((prev) => {
      const nextVal = !prev[key];
      const updated = { ...prev, [key]: nextVal };
      saveNotificationsSummaryPreferences({ [key]: nextVal });
      return updated;
    });
  };

  const planName = activeSub?.plan?.name || "Meal Plan";
  const sellerName = activeSub?.seller?.businessName || "Kitchen Partner";
  const subStatus = activeSub?.isPaused ? "PAUSED" : activeSub?.status || "ACTIVE";
  const renewalDateText = activeSub?.endDate
    ? `Renewal Date: ${new Date(activeSub.endDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`
    : "Renewal Date: Auto-renew";

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

          <div
            className={`${styles.switchTrack} ${
              masterSubEnabled ? styles.switchTrackActive : ""
            }`}
            onClick={() => router.push("/my-subscriptions-desktop")}
            role="button"
            title="Manage Subscriptions"
            tabIndex={0}
          >
            <div
              className={`${styles.switchThumb} ${
                masterSubEnabled ? styles.switchThumbActive : ""
              }`}
            />
          </div>
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
        ) : activeSub ? (
          <div
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
                  backgroundColor:
                    subStatus === "PAUSED"
                      ? "#fef9c3"
                      : subStatus === "CANCELLED"
                      ? "#fee2e2"
                      : "#dcfce7",
                  color:
                    subStatus === "PAUSED"
                      ? "#a16207"
                      : subStatus === "CANCELLED"
                      ? "#ef4444"
                      : "#22c55e",
                }}
              >
                {subStatus}
              </span>
            </div>
            <p className={styles.subPlanDetails}>
              Kitchen: {sellerName} • {activeSub.tier || activeSub.plan?.tier || "Standard"} Tier
            </p>
            <p className={styles.subPlanRenewal}>{renewalDateText}</p>

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.82rem",
                color: "#f97316",
                fontWeight: 700,
              }}
            >
              <span>Manage or Change Plan</span>
              <ArrowRight size={14} />
            </div>
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
              You do not have an active meal subscription plan.
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
