"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock } from "lucide-react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import styles from "./OrderDefault.module.css";

export interface OrderItemRow {
  name: string;
  qty: number;
  price: string;
}

export interface OrderDetailsData {
  orderId: string;
  placedTime: string;
  status: "Preparing" | "Pending" | "Out for Delivery" | "Completed" | "Cancelled";
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItemRow[];
  subtotal: string;
  deliveryFee: string;
  taxes: string;
  total: string;
  paymentMethod: string;
}

const DEFAULT_ORDER_DATA: OrderDetailsData = {
  orderId: "#NCR-8291",
  placedTime: "Today at 02:45 PM",
  status: "Preparing",
  customerName: "Rahul Sharma",
  customerPhone: "+91 98765 43210",
  deliveryAddress: "Room 204, Tower B, Neo Cloud Suites, Bangalore",
  items: [
    { name: "Paneer Butter Masala", qty: 2, price: "₹440" },
    { name: "Butter Roti", qty: 4, price: "₹120" },
    { name: "Sweet Lassi", qty: 2, price: "₹120" },
  ],
  subtotal: "₹680",
  deliveryFee: "₹0",
  taxes: "₹34",
  total: "₹714",
  paymentMethod: "UPI (Prepaid)",
};

export interface OrderDefaultProps {
  orderData?: OrderDetailsData;
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onAcceptOrder?: () => void;
  onRejectOrder?: () => void;
}

export const OrderDefault: React.FC<OrderDefaultProps> = ({
  orderData = DEFAULT_ORDER_DATA,
  ownerName: initialOwnerName,
  partnerRole: initialPartnerRole,
  avatarInitials: initialAvatarInitials,
  onSearch,
  onNotificationClick,
  onAcceptOrder,
  onRejectOrder,
}) => {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const ownerName = initialOwnerName || seller.ownerName;
  const partnerRole = initialPartnerRole || seller.partnerRole;
  const avatarInitials = initialAvatarInitials || seller.avatarInitials;

  return (
    <div className={styles.container}>
      {/* 1. Left Sidebar with active Orders tab */}
      <ConsoleSidebar
        activeItemId="orders"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Right Content Section */}
      <div className={styles.rightSection}>
        {/* Top Navbar */}
        <Topbar
          title="Owner Operations Console"
          ownerName={ownerName}
          partnerRole={partnerRole}
          avatarInitials={avatarInitials}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Top Nav Row: Back button + Order ID Header */}
          <div className={styles.topNavRow}>
            <Link href="/seller/orders" className={styles.backBtn} title="Back to Orders">
              <ArrowLeft size={18} />
            </Link>
            <div className={styles.headerGroup}>
              <h1 className={styles.orderTitle}>Order {orderData.orderId}</h1>
              <p className={styles.orderSubtitle}>{orderData.placedTime}</p>
            </div>
          </div>

          {/* 2-Column Details Grid */}
          <div className={styles.detailGrid}>
            {/* Left Column: Resident Info + Ordered Items */}
            <div className={styles.leftColumn}>
              {/* Resident Information Card */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Resident Information</h3>
                <div className={styles.residentMetaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>NAME</span>
                    <span className={styles.metaValue}>{orderData.customerName}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>ROOM ASSIGNED</span>
                    <span className={styles.metaValue}>{orderData.roomAssigned}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>CONTACT</span>
                    <span className={styles.metaValue}>{orderData.contactNumber}</span>
                  </div>
                </div>
              </div>

              {/* Ordered Items Card */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Ordered Items</h3>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>ITEM</th>
                      <th>PRICE</th>
                      <th>QTY</th>
                      <th>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.price}</td>
                        <td>{item.qty}</td>
                        <td>{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Price Calculation Summary */}
                <div className={styles.priceSummary}>
                  <div className={styles.priceRow}>
                    <span className={styles.priceRowLabel}>Subtotal:</span>
                    <span className={styles.priceRowValue}>{orderData.subtotal}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span className={styles.priceRowLabel}>Service Fee & Room Delivery:</span>
                    <span className={styles.freeBadge}>{orderData.serviceFee}</span>
                  </div>
                  <div className={styles.grandTotalRow}>
                    <span className={styles.grandTotalLabel}>Grand Total:</span>
                    <span className={styles.grandTotalValue}>{orderData.grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Delivery Lifecycle & Action Buttons */}
            <div className={styles.rightCard}>
              <h3 className={styles.cardTitle}>Order Delivery Lifecycle</h3>

              {/* Timeline list */}
              <div className={styles.timeline}>
                {/* Step 1: Completed */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div className={`${styles.nodeCircle} ${styles.nodeCompleted}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div className={`${styles.connectingLine} ${styles.lineCompleted}`} />
                  </div>
                  <div className={styles.timelineText}>
                    <h4 className={styles.stepTitle}>Order Placed</h4>
                    <span className={styles.stepSubtitle}>01:24 PM</span>
                  </div>
                </div>

                {/* Step 2: Active Preparing */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div className={`${styles.nodeCircle} ${styles.nodeActive}`}>
                      <Clock size={13} strokeWidth={2.5} />
                    </div>
                    <div className={styles.connectingLine} />
                  </div>
                  <div className={styles.timelineText}>
                    <h4 className={`${styles.stepTitle} ${styles.stepTitleActive}`}>Preparing Food</h4>
                    <span className={`${styles.stepSubtitle} ${styles.stepSubtitleActive}`}>
                      In Kitchen (Active)
                    </span>
                  </div>
                </div>

                {/* Step 3: Upcoming */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div className={`${styles.nodeCircle} ${styles.nodeUpcoming}`}>3</div>
                    <div className={styles.connectingLine} />
                  </div>
                  <div className={styles.timelineText}>
                    <h4 className={`${styles.stepTitle} ${styles.stepTitleUpcoming}`}>Out for Delivery</h4>
                    <span className={`${styles.stepSubtitle} ${styles.stepSubtitleUpcoming}`}>
                      Not dispatched
                    </span>
                  </div>
                </div>

                {/* Step 4: Upcoming */}
                <div className={styles.timelineItem}>
                  <div className={styles.timelineNode}>
                    <div className={`${styles.nodeCircle} ${styles.nodeUpcoming}`}>4</div>
                  </div>
                  <div className={styles.timelineText}>
                    <h4 className={`${styles.stepTitle} ${styles.stepTitleUpcoming}`}>Delivered & Closed</h4>
                  </div>
                </div>
              </div>

              <div className={styles.actionDivider} />

              {/* Action Buttons */}
              <div className={styles.actionButtonGroup}>
                <button
                  type="button"
                  className={styles.acceptBtn}
                  onClick={onAcceptOrder}
                >
                  Accept Order
                </button>
                <button
                  type="button"
                  className={styles.rejectBtn}
                  onClick={onRejectOrder}
                >
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDefault;
