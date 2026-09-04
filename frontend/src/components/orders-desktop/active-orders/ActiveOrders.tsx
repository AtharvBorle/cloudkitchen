"use client";

import React from "react";
import { Receipt, CookingPot, Bike, Package } from "lucide-react";
import styles from "./ActiveOrders.module.css";

export const ActiveOrders: React.FC = () => {
  return (
    <section className={styles.sectionContainer} aria-label="Active Orders">
      <h2 className={styles.sectionHeading}>Active Orders</h2>

      <div className={styles.cardsGrid}>
        {/* ================= CARD 1: FOOD ORDER (7/12 Kitchen) ================= */}
        <article className={styles.orderCard}>
          <div>
            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.titleWithAccent}>
                <div className={styles.orangeAccentBar} />
                <div className={styles.headerInfo}>
                  <h3 className={styles.vendorName}>7/12 Kitchen</h3>
                  <p className={styles.itemSummary}>1x Margherita Pizza, 1x Coke Zero</p>
                  <p className={styles.orderDate}>Oct 1, 2024 , 02:34 pm</p>
                </div>
              </div>
              <span className={styles.statusPreparing}>Preparing</span>
            </div>

            {/* 4-Step Timeline */}
            <div className={styles.timelineContainer}>
              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepActive}`}>
                  <Receipt size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabel}>Order Placed</span>
              </div>

              <div className={styles.dashedLineActive} />

              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepActive}`}>
                  <CookingPot size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabelActive}>Preparing</span>
              </div>

              <div className={styles.dashedLineInactive} />

              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepInactive}`}>
                  <Bike size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabel}>On the way</span>
              </div>

              <div className={styles.dashedLineInactive} />

              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepInactive}`}>
                  <Package size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabel}>Delivered</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <button type="button" className={styles.helpLink}>Need Help?</button>
            <button type="button" className={styles.actionBtn}>Track Order</button>
          </div>
        </article>

        {/* ================= CARD 2: STAY ORDER (Comfort Stay PG) ================= */}
        <article className={styles.orderCard}>
          <div>
            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.titleWithAccent}>
                <div className={styles.blueAccentBar} />
                <div className={styles.headerInfo}>
                  <h3 className={styles.vendorName}>Comfort Stay PG - Room 204</h3>
                  <p className={styles.itemSummary}>Monthly Rental Subscription</p>
                </div>
              </div>
              <span className={styles.statusConfirmed}>Confirmed</span>
            </div>

            {/* Middle Row */}
            <div className={styles.stayMiddleRow}>
              <p className={styles.rentalPeriodText}>Rental Period: Oct 1, 2024 – Nov 1, 2024</p>
              <button type="button" className={styles.rulesBtn}>View PG Rules</button>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <button type="button" className={styles.helpLink}>Need Help?</button>
            <button type="button" className={styles.actionBtn}>View Details</button>
          </div>
        </article>

        {/* ================= CARD 3: FOOD ORDER (7/12 Kitchen Repeat) ================= */}
        <article className={styles.orderCard}>
          <div>
            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.titleWithAccent}>
                <div className={styles.orangeAccentBar} />
                <div className={styles.headerInfo}>
                  <h3 className={styles.vendorName}>7/12 Kitchen</h3>
                  <p className={styles.itemSummary}>1x Margherita Pizza, 1x Coke Zero</p>
                  <p className={styles.orderDate}>Oct 1, 2024 , 02:34 pm</p>
                </div>
              </div>
              <span className={styles.statusPreparing}>Preparing</span>
            </div>

            {/* 4-Step Timeline */}
            <div className={styles.timelineContainer}>
              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepActive}`}>
                  <Receipt size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabel}>Order Placed</span>
              </div>

              <div className={styles.dashedLineActive} />

              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepActive}`}>
                  <CookingPot size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabelActive}>Preparing</span>
              </div>

              <div className={styles.dashedLineInactive} />

              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepInactive}`}>
                  <Bike size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabel}>On the way</span>
              </div>

              <div className={styles.dashedLineInactive} />

              <div className={styles.timelineStep}>
                <div className={`${styles.stepIconBox} ${styles.stepInactive}`}>
                  <Package size={18} strokeWidth={2.2} />
                </div>
                <span className={styles.stepLabel}>Delivered</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <button type="button" className={styles.helpLink}>Need Help?</button>
            <button type="button" className={styles.actionBtn}>Track Order</button>
          </div>
        </article>

        {/* ================= CARD 4: STAY ORDER (Comfort Stay PG Repeat) ================= */}
        <article className={styles.orderCard}>
          <div>
            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.titleWithAccent}>
                <div className={styles.blueAccentBar} />
                <div className={styles.headerInfo}>
                  <h3 className={styles.vendorName}>Comfort Stay PG - Room 204</h3>
                  <p className={styles.itemSummary}>Monthly Rental Subscription</p>
                </div>
              </div>
              <span className={styles.statusConfirmed}>Confirmed</span>
            </div>

            {/* Middle Row */}
            <div className={styles.stayMiddleRow}>
              <p className={styles.rentalPeriodText}>Rental Period: Oct 1, 2024 – Nov 1, 2024</p>
              <button type="button" className={styles.rulesBtn}>View PG Rules</button>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <button type="button" className={styles.helpLink}>Need Help?</button>
            <button type="button" className={styles.actionBtn}>View Details</button>
          </div>
        </article>
      </div>
    </section>
  );
};

export default ActiveOrders;
