"use client";

import React from "react";
import Link from "next/link";
import { Receipt, CookingPot, Bike, Package, AlertCircle } from "lucide-react";
import styles from "./ActiveOrders.module.css";

export interface DynamicActiveFoodOrder {
  id: string;
  vendorName: string;
  itemSummary: string;
  orderDate: string;
  status: "PENDING" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | string;
  totalAmount?: number | string;
  invoiceUrl?: string;
  trackingId?: string;
}

export interface DynamicActiveBooking {
  id: string;
  vendorName: string;
  roomName: string;
  rentalPeriod: string;
  status: string;
  totalAmount?: number | string;
}

export interface ActiveOrdersProps {
  foodOrders?: DynamicActiveFoodOrder[];
  roomBookings?: DynamicActiveBooking[];
  loading?: boolean;
}

export const ActiveOrders: React.FC<ActiveOrdersProps> = ({
  foodOrders,
  roomBookings,
  loading = false,
}) => {
  const hasDynamicData = (foodOrders && foodOrders.length > 0) || (roomBookings && roomBookings.length > 0);

  // Helper to map order status to step index (1: Placed, 2: Preparing, 3: On the way, 4: Delivered)
  const getStepIndex = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return 4;
    if (s === "OUT_FOR_DELIVERY" || s === "ON_THE_WAY") return 3;
    if (s === "PREPARING" || s === "CONFIRMED") return 2;
    return 1; // PENDING / Placed
  };

  const formatStatusDisplay = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "OUT_FOR_DELIVERY") return "On The Way";
    if (s === "PREPARING") return "Preparing";
    if (s === "DELIVERED") return "Delivered";
    if (s === "PENDING") return "Order Placed";
    if (s === "CONFIRMED") return "Confirmed";
    return status;
  };

  if (loading) {
    return (
      <section className={styles.sectionContainer} aria-label="Active Orders">
        <h2 className={styles.sectionHeading}>Active Orders</h2>
        <div style={{ padding: "32px 0", textAlign: "center", color: "#785E54" }}>
          Loading active orders...
        </div>
      </section>
    );
  }

  return (
    <section className={styles.sectionContainer} aria-label="Active Orders">
      <h2 className={styles.sectionHeading}>Active Orders</h2>

      <div className={styles.cardsGrid}>
        {hasDynamicData ? (
          <>
            {/* Dynamic Food Orders */}
            {foodOrders?.map((order) => {
              const stepIdx = getStepIndex(order.status);
              return (
                <article key={order.id} className={styles.orderCard}>
                  <div>
                    {/* Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.titleWithAccent}>
                        <div className={styles.orangeAccentBar} />
                        <div className={styles.headerInfo}>
                          <h3 className={styles.vendorName}>{order.vendorName}</h3>
                          <p className={styles.itemSummary}>{order.itemSummary}</p>
                          <p className={styles.orderDate}>{order.orderDate}</p>
                        </div>
                      </div>
                      <span className={styles.statusPreparing}>
                        {formatStatusDisplay(order.status)}
                      </span>
                    </div>

                    {/* 4-Step Timeline */}
                    <div className={styles.timelineContainer}>
                      {/* Step 1 */}
                      <div className={styles.timelineStep}>
                        <div className={`${styles.stepIconBox} ${stepIdx >= 1 ? styles.stepActive : styles.stepInactive}`}>
                          <Receipt size={18} strokeWidth={2.2} />
                        </div>
                        <span className={stepIdx === 1 ? styles.stepLabelActive : styles.stepLabel}>
                          Order Placed
                        </span>
                      </div>

                      <div className={stepIdx >= 2 ? styles.dashedLineActive : styles.dashedLineInactive} />

                      {/* Step 2 */}
                      <div className={styles.timelineStep}>
                        <div className={`${styles.stepIconBox} ${stepIdx >= 2 ? styles.stepActive : styles.stepInactive}`}>
                          <CookingPot size={18} strokeWidth={2.2} />
                        </div>
                        <span className={stepIdx === 2 ? styles.stepLabelActive : styles.stepLabel}>
                          Preparing
                        </span>
                      </div>

                      <div className={stepIdx >= 3 ? styles.dashedLineActive : styles.dashedLineInactive} />

                      {/* Step 3 */}
                      <div className={styles.timelineStep}>
                        <div className={`${styles.stepIconBox} ${stepIdx >= 3 ? styles.stepActive : styles.stepInactive}`}>
                          <Bike size={18} strokeWidth={2.2} />
                        </div>
                        <span className={stepIdx === 3 ? styles.stepLabelActive : styles.stepLabel}>
                          On the way
                        </span>
                      </div>

                      <div className={stepIdx >= 4 ? styles.dashedLineActive : styles.dashedLineInactive} />

                      {/* Step 4 */}
                      <div className={styles.timelineStep}>
                        <div className={`${styles.stepIconBox} ${stepIdx >= 4 ? styles.stepActive : styles.stepInactive}`}>
                          <Package size={18} strokeWidth={2.2} />
                        </div>
                        <span className={stepIdx === 4 ? styles.stepLabelActive : styles.stepLabel}>
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={styles.cardFooter}>
                    <Link href="/dashboard/user/support" className={styles.helpLink} style={{ textDecoration: "none" }}>
                      Need Help?
                    </Link>
                    {order.invoiceUrl ? (
                      <Link href={order.invoiceUrl} className={styles.actionBtn} style={{ textDecoration: "none" }}>
                        View Invoice
                      </Link>
                    ) : (
                      <Link href={`/orders-desktop?orderId=${order.id}`} className={styles.actionBtn} style={{ textDecoration: "none" }}>
                        Track Order
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}

            {/* Dynamic Room Bookings */}
            {roomBookings?.map((booking) => (
              <article key={booking.id} className={styles.orderCard}>
                <div>
                  {/* Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.titleWithAccent}>
                      <div className={styles.blueAccentBar} />
                      <div className={styles.headerInfo}>
                        <h3 className={styles.vendorName}>{booking.vendorName}</h3>
                        <p className={styles.itemSummary}>{booking.roomName}</p>
                      </div>
                    </div>
                    <span className={styles.statusConfirmed}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Middle Row */}
                  <div className={styles.stayMiddleRow}>
                    <p className={styles.rentalPeriodText}>Rental Period: {booking.rentalPeriod}</p>
                    <Link href="/room-booking" className={styles.rulesBtn} style={{ textDecoration: "none" }}>
                      View PG Rules
                    </Link>
                  </div>
                </div>

                {/* Footer */}
                <div className={styles.cardFooter}>
                  <Link href="/dashboard/user/support" className={styles.helpLink} style={{ textDecoration: "none" }}>
                    Need Help?
                  </Link>
                  <Link href={`/dashboard/user/bookings`} className={styles.actionBtn} style={{ textDecoration: "none" }}>
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </>
        ) : (
          /* ================= FALLBACK CARDS (When user has no active orders) ================= */
          <>
            <article className={styles.orderCard}>
              <div>
                <div className={styles.cardHeader}>
                  <div className={styles.titleWithAccent}>
                    <div className={styles.orangeAccentBar} />
                    <div className={styles.headerInfo}>
                      <h3 className={styles.vendorName}>7/12 Kitchen</h3>
                      <p className={styles.itemSummary}>1x Margherita Pizza, 1x Coke Zero</p>
                      <p className={styles.orderDate}>Recent Order</p>
                    </div>
                  </div>
                  <span className={styles.statusPreparing}>Preparing</span>
                </div>

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

              <div className={styles.cardFooter}>
                <Link href="/dashboard/user/support" className={styles.helpLink} style={{ textDecoration: "none" }}>
                  Need Help?
                </Link>
                <Link href="/explore-desktop" className={styles.actionBtn} style={{ textDecoration: "none" }}>
                  Explore Menu
                </Link>
              </div>
            </article>

            <article className={styles.orderCard}>
              <div>
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

                <div className={styles.stayMiddleRow}>
                  <p className={styles.rentalPeriodText}>Rental Period: Active</p>
                  <Link href="/room-booking" className={styles.rulesBtn} style={{ textDecoration: "none" }}>
                    View Rooms
                  </Link>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <Link href="/dashboard/user/support" className={styles.helpLink} style={{ textDecoration: "none" }}>
                  Need Help?
                </Link>
                <Link href="/room-booking" className={styles.actionBtn} style={{ textDecoration: "none" }}>
                  Book Room
                </Link>
              </div>
            </article>
          </>
        )}
      </div>
    </section>
  );
};

export default ActiveOrders;

