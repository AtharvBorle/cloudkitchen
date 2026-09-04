"use client";

import React, { useState } from "react";
import { Calendar, Bell } from "lucide-react";
import styles from "./ActiveSubscriptionsNotifications.module.css";

export const ActiveSubscriptionsNotifications: React.FC = () => {
  const [masterSubEnabled, setMasterSubEnabled] = useState<boolean>(true);
  const [notifStates, setNotifStates] = useState<{ [key: string]: boolean }>({
    orderUpdates: true,
    promoOffers: false,
    newMenu: true,
    deliveryAlerts: true,
  });

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

          <div
            className={`${styles.switchTrack} ${
              masterSubEnabled ? styles.switchTrackActive : ""
            }`}
            onClick={() => setMasterSubEnabled((prev) => !prev)}
            role="switch"
            aria-checked={masterSubEnabled}
            tabIndex={0}
          >
            <div
              className={`${styles.switchThumb} ${
                masterSubEnabled ? styles.switchThumbActive : ""
              }`}
            />
          </div>
        </div>

        <div className={styles.subInnerCard}>
          <div className={styles.subInnerHeader}>
            <h3 className={styles.subPlanName}>Mess Service Plan</h3>
            <span className={styles.activeBadge}>ACTIVE</span>
          </div>
          <p className={styles.subPlanDetails}>Daily meal plan (Lunch & Dinner)</p>
          <p className={styles.subPlanRenewal}>Renewal Date: 28th October 2026 • 24 days remaining</p>
        </div>
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
