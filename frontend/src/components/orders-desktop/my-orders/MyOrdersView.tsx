"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  CookingPot,
  Package,
  Truck,
  Bike,
  Home,
  Navigation,
  RotateCcw,
  Star,
  Phone,
  MessageSquare,
  Copy,
  Check,
  X,
  Bell,
  ChevronRight,
  Clock,
} from "lucide-react";
import styles from "./MyOrdersView.module.css";

export interface OrderItemData {
  id: string;
  vendorName: string;
  itemSummary: string;
  itemsDetail?: string;
  price: number;
  orderDate: string;
  status: "ONGOING" | "DELIVERED" | "CANCELLED";
  statusDisplay: string;
  deliveredLabel?: string;
  deliveredTime?: string;
  arrivingIn?: string;
  imageUrl: string;
  orderId: string;
  partner?: {
    name: string;
    avatar: string;
    rating: string;
    deliveries: number;
  };
  billBreakdown: {
    itemTotal: number;
    deliveryFee: number;
    platformFee: number;
    totalPaid: number;
  };
}

const SAMPLE_ORDERS: OrderItemData[] = [
  {
    id: "ord-1",
    orderId: "CB782346",
    vendorName: "Spice & Bites Restaurant",
    itemSummary: "Veg Power Bowl • 1 Item",
    itemsDetail: "Fresh vegetables, quinoa, avocado, sesame dressing",
    price: 249,
    orderDate: "12:18 PM • 12 Sep 2025",
    status: "ONGOING",
    statusDisplay: "Out for Delivery",
    arrivingIn: "8 min",
    imageUrl: "/images/veg-power-bowl.jpg",
    partner: {
      name: "Rohit Sharma",
      avatar: "/images/delivery-partner-rohit.jpg",
      rating: "4.8",
      deliveries: 320,
    },
    billBreakdown: {
      itemTotal: 249,
      deliveryFee: 35,
      platformFee: 10,
      totalPaid: 294,
    },
  },
  {
    id: "ord-2",
    orderId: "CB541092",
    vendorName: "Pizza Planet",
    itemSummary: "Margheritta Pizza • 1 Item",
    itemsDetail: "Classic mozzarella cheese and fresh basil tomato sauce",
    price: 349,
    orderDate: "7:42 PM • 10 Sep 2025",
    status: "DELIVERED",
    statusDisplay: "Delivered",
    deliveredLabel: "Delivered",
    deliveredTime: "10 Sep, 8:15 PM",
    imageUrl: "/images/pizza-planet.jpg",
    billBreakdown: {
      itemTotal: 349,
      deliveryFee: 30,
      platformFee: 10,
      totalPaid: 389,
    },
  },
  {
    id: "ord-3",
    orderId: "CB339104",
    vendorName: "The Tandoori House",
    itemSummary: "Paneer Butter Masala • 2 Items",
    itemsDetail: "Creamy cottage cheese cubes with 2 butter naan",
    price: 499,
    orderDate: "1:15 PM • 8 Sep 2025",
    status: "DELIVERED",
    statusDisplay: "Delivered",
    deliveredLabel: "Delivered",
    deliveredTime: "8 Sep, 1:58 PM",
    imageUrl: "/images/tandoori-house.jpg",
    billBreakdown: {
      itemTotal: 499,
      deliveryFee: 35,
      platformFee: 10,
      totalPaid: 544,
    },
  },
  {
    id: "ord-4",
    orderId: "CB890123",
    vendorName: "Burger Hub",
    itemSummary: "Classic Veg Burger • 1 Item",
    itemsDetail: "Crispy potato herb patty with secret thousand island spread",
    price: 199,
    orderDate: "9:20 PM • 5 Sep 2025",
    status: "CANCELLED",
    statusDisplay: "Cancelled",
    deliveredLabel: "Order cancelled",
    deliveredTime: "5 Sep, 9:35 PM",
    imageUrl: "/images/burger-hub.jpg",
    billBreakdown: {
      itemTotal: 199,
      deliveryFee: 0,
      platformFee: 0,
      totalPaid: 0,
    },
  },
  {
    id: "ord-5",
    orderId: "CB445210",
    vendorName: "Fresh Bowl Co.",
    itemSummary: "Quinoa Salad • 1 Item",
    itemsDetail: "Organic quinoa, cherry tomatoes, feta, olive oil dressing",
    price: 279,
    orderDate: "1:05 PM • 2 Sep 2025",
    status: "DELIVERED",
    statusDisplay: "Delivered",
    deliveredLabel: "Delivered",
    deliveredTime: "2 Sep, 2:12 PM",
    imageUrl: "/images/fresh-bowl.jpg",
    billBreakdown: {
      itemTotal: 279,
      deliveryFee: 30,
      platformFee: 10,
      totalPaid: 319,
    },
  },
];

type FilterType = "ALL" | "ONGOING" | "COMPLETED" | "CANCELLED";

export default function MyOrdersView() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderItemData>(SAMPLE_ORDERS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      setIsSidebarOpen(false);
    }
  }, []);

  const ongoingCount = SAMPLE_ORDERS.filter((o) => o.status === "ONGOING").length;

  const filteredOrders = SAMPLE_ORDERS.filter((order) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "ONGOING") return order.status === "ONGOING";
    if (activeFilter === "COMPLETED") return order.status === "DELIVERED";
    if (activeFilter === "CANCELLED") return order.status === "CANCELLED";
    return true;
  });

  const handleCopyOrderId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectOrder = (order: OrderItemData) => {
    setSelectedOrder(order);
    setIsSidebarOpen(true);
  };

  return (
    <div className={styles.pageContainer}>
      {/* 2-Column Main Layout */}
      <div className={styles.contentGrid}>
        {/* Left Column: Header & Orders List */}
        <div className={styles.ordersListColumn}>
          {/* Header Section */}
          <header className={styles.headerSection}>
            <h1 className={styles.pageTitle}>My Orders</h1>
            <p className={styles.pageSubtitle}>
              Track your orders, re-order your favourites and view past orders.
            </p>

            {/* Filter Pills */}
            <div className={styles.filterPillsRow} role="tablist" aria-label="Filter Orders">
              <button
                type="button"
                className={`${styles.filterPill} ${activeFilter === "ALL" ? styles.filterPillActive : ""}`}
                onClick={() => setActiveFilter("ALL")}
              >
                All
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${activeFilter === "ONGOING" ? styles.filterPillActive : ""}`}
                onClick={() => setActiveFilter("ONGOING")}
              >
                <span>Ongoing</span>
                {ongoingCount > 0 && <span className={styles.badgeCount}>{ongoingCount}</span>}
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${activeFilter === "COMPLETED" ? styles.filterPillActive : ""}`}
                onClick={() => setActiveFilter("COMPLETED")}
              >
                Completed
              </button>

              <button
                type="button"
                className={`${styles.filterPill} ${activeFilter === "CANCELLED" ? styles.filterPillActive : ""}`}
                onClick={() => setActiveFilter("CANCELLED")}
              >
                Cancelled
              </button>
            </div>
          </header>

          {/* Orders Cards Stack */}
          {filteredOrders.map((order) => {
            const isOngoing = order.status === "ONGOING";
            const isDelivered = order.status === "DELIVERED";
            const isCancelled = order.status === "CANCELLED";
            const isSelected = selectedOrder?.id === order.id;

            if (isOngoing) {
              return (
                <article
                  key={order.id}
                  className={`${styles.activeOrderCard} ${isSelected ? styles.orderCardSelected : ""}`}
                  onClick={() => handleSelectOrder(order)}
                >
                  {/* Top Details */}
                  <div className={styles.activeCardTopRow}>
                    <div className={styles.activeCardTopLeft}>
                      <div className={styles.cardImageWrapper}>
                        <Image
                          src={order.imageUrl}
                          alt={order.vendorName}
                          width={64}
                          height={64}
                          className={styles.cardImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/places/place-pizza.png";
                          }}
                        />
                      </div>
                      <div className={styles.cardMetaInfo}>
                        <h3 className={styles.vendorTitle}>{order.vendorName}</h3>
                        <p className={styles.itemSummaryText}>{order.itemSummary}</p>
                        <span className={styles.priceHighlight}>₹{order.price}</span>
                        <span className={styles.dateSingleLine}>{order.orderDate}</span>
                      </div>
                    </div>

                    <div className={styles.activeCardTopRight}>
                      <span className={styles.statusPillGreen}>{order.statusDisplay}</span>
                      <div className={styles.arrivingBox}>
                        <span className={styles.arrivingLabel}>Arriving in</span>
                        <span className={styles.arrivingTime}>{order.arrivingIn}</span>
                      </div>
                      <div className={styles.chevronBtn}>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>

                  {/* 5-Stage Live Status Tracker Container */}
                  <div className={styles.stepperContainer}>
                    <div className={styles.stepperRow}>
                      {/* 1. Confirmed */}
                      <div className={styles.trackerStep}>
                        <div className={styles.stepCircleOutlineDone}>
                          <CheckCircle2 size={18} strokeWidth={2.4} />
                        </div>
                        <span className={styles.stepTextDone}>Confirmed</span>
                      </div>

                      <div className={styles.stepperLineDone} />

                      {/* 2. Preparing */}
                      <div className={styles.trackerStep}>
                        <div className={styles.stepCircleFilledDone}>
                          <CookingPot size={15} strokeWidth={2.4} />
                        </div>
                        <span className={styles.stepTextDone}>Preparing</span>
                      </div>

                      <div className={styles.stepperLineDone} />

                      {/* 3. Picked Up */}
                      <div className={styles.trackerStep}>
                        <div className={styles.stepCircleFilledDone}>
                          <Truck size={14} strokeWidth={2.4} />
                        </div>
                        <span className={styles.stepTextDone}>Picked Up</span>
                      </div>

                      <div className={styles.stepperLinePending} />

                      {/* 4. On the way */}
                      <div className={styles.trackerStep}>
                        <div className={styles.stepCircleActiveNav}>
                          <Navigation size={14} strokeWidth={2.2} />
                        </div>
                        <span className={styles.stepTextActiveNav}>On the way</span>
                      </div>

                      <div className={styles.stepperLinePending} />

                      {/* 5. Delivered */}
                      <div className={styles.trackerStep}>
                        <div className={styles.stepCirclePendingHome}>
                          <Home size={15} strokeWidth={2} />
                        </div>
                        <span className={styles.stepTextPending}>Delivered</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.trackLiveBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOrder(order);
                      }}
                    >
                      <Navigation size={14} strokeWidth={2.5} />
                      <span>Track Live</span>
                    </button>
                  </div>
                </article>
              );
            }

            // Past / Completed or Cancelled Order Card
            return (
              <article
                key={order.id}
                className={`${styles.pastOrderCard} ${isSelected ? styles.orderCardSelected : ""}`}
                onClick={() => handleSelectOrder(order)}
              >
                <div className={styles.pastCardTopLeft}>
                  <div className={styles.cardImageWrapper}>
                    <Image
                      src={order.imageUrl}
                      alt={order.vendorName}
                      width={72}
                      height={72}
                      className={styles.cardImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/places/place-pizza.png";
                      }}
                    />
                  </div>
                  <div className={styles.cardMetaInfo}>
                    <h3 className={styles.vendorTitle}>{order.vendorName}</h3>
                    <p className={styles.itemSummaryText}>{order.itemSummary}</p>
                    <span className={styles.priceSingleLine}>₹{order.price}</span>
                    <span className={styles.dateSingleLine}>{order.orderDate}</span>
                  </div>
                </div>

                <div className={styles.pastCardActionRow}>
                  {isDelivered && (
                    <>
                      <span className={styles.statusPillGray}>{order.statusDisplay}</span>
                      <div className={styles.deliveredInfo}>
                        <span className={styles.deliveredLabel}>{order.deliveredLabel || "Delivered"}</span>
                        <span className={styles.deliveredDateText}>{order.deliveredTime}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.reorderBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Reordering ${order.itemSummary} from ${order.vendorName}!`);
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Reorder</span>
                      </button>
                    </>
                  )}

                  {isCancelled && (
                    <>
                      <span className={styles.statusPillRed}>{order.statusDisplay}</span>
                      <div className={styles.deliveredInfo}>
                        <span className={styles.deliveredLabel}>{order.deliveredLabel || "Order cancelled"}</span>
                        <span className={styles.deliveredDateText}>{order.deliveredTime}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.viewDetailsBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOrder(order);
                        }}
                      >
                        <span>View Details</span>
                      </button>
                    </>
                  )}

                  <div className={styles.chevronBtn}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right Column: Live Tracking Sidebar Details */}
        {isSidebarOpen && selectedOrder && (
          <>
            <div
              className={styles.mobileBackdrop}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className={styles.trackingSidebar}>
              <div className={styles.mobileSheetHandle} aria-hidden="true" />

              {/* Header with status pill & close */}
              <div className={styles.sidebarHeaderRow}>
                <span className={styles.statusPillGreen}>
                  {selectedOrder.status === "ONGOING" ? "• Out for Delivery" : `• ${selectedOrder.statusDisplay}`}
                </span>
                <button
                  type="button"
                  className={styles.closeSidebarBtn}
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close details"
                >
                  <X size={16} />
                </button>
              </div>

            {/* Restaurant Meta */}
            <div className={styles.sidebarRestaurantRow}>
              <div className={styles.sidebarRestaurantInfo}>
                <h3 className={styles.sidebarVendorName}>{selectedOrder.vendorName}</h3>
                <p className={styles.sidebarItemDesc}>{selectedOrder.itemSummary} • ₹{selectedOrder.price}</p>
                <p className={styles.sidebarTime}>
                  <Clock size={13} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }} />
                  <span>{selectedOrder.orderDate}</span>
                </p>
                <div className={styles.orderIdRow}>
                  <span>Order ID: {selectedOrder.orderId}</span>
                  <button
                    type="button"
                    className={styles.copyIconBtn}
                    onClick={() => handleCopyOrderId(selectedOrder.orderId)}
                    title="Copy Order ID"
                  >
                    {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <div className={styles.sidebarThumbnail}>
                <Image
                  src={selectedOrder.imageUrl}
                  alt={selectedOrder.vendorName}
                  width={64}
                  height={64}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/places/place-pizza.png";
                  }}
                />
              </div>
            </div>

            {/* Delivery Partner Details (Rohit Sharma) */}
            <div className={styles.deliveryPartnerBox}>
              <div className={styles.partnerLeft}>
                <div className={styles.partnerAvatar}>
                  <Image
                    src={selectedOrder.partner?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
                    alt="Delivery partner"
                    width={44}
                    height={44}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className={styles.partnerInfo}>
                  <h4 className={styles.partnerName}>{selectedOrder.partner?.name || "Rohit Sharma"}</h4>
                  <p className={styles.partnerRole}>Your delivery partner</p>
                  <span className={styles.partnerRating}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "3px" }} />
                    <strong style={{ color: "#0F172A" }}>{selectedOrder.partner?.rating || "4.8"}</strong>{" "}
                    <span style={{ color: "#94A3B8" }}>({selectedOrder.partner?.deliveries || 320} deliveries)</span>
                  </span>
                </div>
              </div>

              <div className={styles.partnerActions}>
                <a
                  href="tel:+919876543210"
                  className={styles.partnerActionBtn}
                  title="Call Delivery Partner"
                >
                  <Phone size={15} />
                </a>
                <button
                  type="button"
                  className={styles.partnerActionBtn}
                  title="Message Delivery Partner"
                  onClick={() => alert(`Opening chat with ${selectedOrder.partner?.name || "Rohit Sharma"}`)}
                >
                  <MessageSquare size={15} />
                </button>
              </div>
            </div>

            {/* Live Interactive Delivery Map Graphic */}
            <div className={styles.mapCard}>
              <Image
                src="/images/live-delivery-map.png"
                alt="Live Delivery Map"
                width={340}
                height={170}
                className={styles.mapImage}
                priority
              />
            </div>

            {/* Notification Alert Banner */}
            <div className={styles.alertBox}>
              <Bell size={18} color="#047857" style={{ flexShrink: 0 }} />
              <div className={styles.alertText}>
                <span className={styles.alertTitle}>
                  {selectedOrder.partner?.name || "Rohit"} is on the way to your location
                </span>
                <span className={styles.alertSubtitle}>
                  Expected arrival in {selectedOrder.arrivingIn || "8 minutes"}
                </span>
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className={styles.orderItemsSection}>
              <h4 className={styles.sectionHeaderTitle}>ORDER ITEMS</h4>
              <div className={styles.sidebarItemCard}>
                <div className={styles.sidebarItemThumb}>
                  <Image
                    src={selectedOrder.imageUrl}
                    alt={selectedOrder.itemSummary}
                    width={44}
                    height={44}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/places/place-pizza.png";
                    }}
                  />
                </div>
                <div className={styles.sidebarItemTextGroup}>
                  <span className={styles.sidebarItemName}>{selectedOrder.itemSummary.split("•")[0]?.trim()}</span>
                  <span className={styles.sidebarItemSub}>{selectedOrder.itemsDetail || "Fresh vegetables, quinoa, avocado, sesame dressing"}</span>
                  <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 500, marginTop: "3px" }}>
                    1 x &nbsp;<strong style={{ color: "#0F172A", fontWeight: 700 }}>₹{selectedOrder.billBreakdown.itemTotal}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className={styles.billSummaryTable}>
              <div className={styles.billRow}>
                <span>Item Total</span>
                <span>₹{selectedOrder.billBreakdown.itemTotal}</span>
              </div>
              <div className={styles.billRow}>
                <span>Delivery Fee</span>
                <span>₹{selectedOrder.billBreakdown.deliveryFee}</span>
              </div>
              <div className={styles.billRow}>
                <span>Platform Fee</span>
                <span>₹{selectedOrder.billBreakdown.platformFee}</span>
              </div>
              <div className={styles.billTotalRow}>
                <span>Total Paid</span>
                <span>₹{selectedOrder.billBreakdown.totalPaid}</span>
              </div>
            </div>

            {/* Bottom CTA Buttons */}
            <div className={styles.sidebarActionsRow}>
              <button
                type="button"
                className={styles.sidebarReorderBtn}
                onClick={() => alert(`Reordering from ${selectedOrder.vendorName}!`)}
              >
                <RotateCcw size={15} />
                <span>Reorder</span>
              </button>

              <button
                type="button"
                className={styles.sidebarRateBtn}
                onClick={() => alert(`Rate your experience with ${selectedOrder.vendorName}`)}
              >
                <Star size={15} />
                <span>Rate Order</span>
              </button>
            </div>
          </aside>
          </>
        )}
      </div>
    </div>
  );
}
