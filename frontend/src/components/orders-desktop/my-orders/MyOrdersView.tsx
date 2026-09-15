"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  CookingPot,
  Truck,
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
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./MyOrdersView.module.css";

export interface OrderItemData {
  id: string;
  orderId: string;
  vendorName: string;
  itemSummary: string;
  itemsDetail?: string;
  price: number;
  orderDate: string;
  status: "ONGOING" | "DELIVERED" | "CANCELLED";
  rawStatus: string;
  statusDisplay: string;
  deliveredLabel?: string;
  deliveredTime?: string;
  arrivingIn?: string;
  imageUrl: string;
  partner?: {
    name: string;
    avatar: string;
    rating: string;
    deliveries: number;
    phone?: string;
  };
  billBreakdown: {
    itemTotal: number;
    deliveryFee: number;
    platformFee: number;
    totalPaid: number;
  };
  rawItems: any[];
}

type FilterType = "ALL" | "ONGOING" | "COMPLETED" | "CANCELLED";

function getOrderStepIndex(rawStatus: string): number {
  const s = (rawStatus || "").toUpperCase();
  switch (s) {
    case "PENDING":
    case "PLACED":
      return 0; // Confirmed active
    case "ACCEPTED":
    case "CONFIRMED":
      return 1; // Preparing active
    case "PREPARING":
      return 1; // Preparing active
    case "PICKED_UP":
      return 2; // Picked Up done, On the way active
    case "OUT_FOR_DELIVERY":
      return 3; // On the way active
    case "DELIVERED":
      return 4; // Delivered done
    default:
      return 0;
  }
}

function parseOrderFromDb(o: any): OrderItemData {
  let parsedItems: any[] = [];
  try {
    const raw = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
    if (Array.isArray(raw)) {
      parsedItems = raw;
    }
  } catch (e) {
    parsedItems = [];
  }

  const firstItem = parsedItems[0] || {};
  const totalCount = parsedItems.reduce((acc, it) => acc + (it.quantity || it.qty || 1), 0);
  const itemSummary = firstItem.name
    ? `${firstItem.name} • ${totalCount} Item${totalCount > 1 ? "s" : ""}`
    : "Food Order • 1 Item";

  const itemsDetail = parsedItems.length > 0
    ? parsedItems.map((it) => `${it.quantity || it.qty || 1}x ${it.name}`).join(", ")
    : "Fresh culinary preparation";

  const rawStatus = (o.status || "PENDING").toUpperCase();
  let status: "ONGOING" | "DELIVERED" | "CANCELLED" = "ONGOING";
  let statusDisplay = "Out for Delivery";
  let arrivingIn = "15-20 min";

  if (rawStatus === "DELIVERED") {
    status = "DELIVERED";
    statusDisplay = "Delivered";
    arrivingIn = "Delivered";
  } else if (rawStatus === "CANCELLED" || rawStatus === "REJECTED") {
    status = "CANCELLED";
    statusDisplay = rawStatus === "REJECTED" ? "Rejected" : "Cancelled";
    arrivingIn = "Cancelled";
  } else {
    status = "ONGOING";
    if (rawStatus === "PENDING" || rawStatus === "PLACED") {
      statusDisplay = "Order Placed";
      arrivingIn = "25-35 min";
    } else if (rawStatus === "ACCEPTED" || rawStatus === "CONFIRMED") {
      statusDisplay = "Confirmed";
      arrivingIn = "20-30 min";
    } else if (rawStatus === "PREPARING") {
      statusDisplay = "Preparing Food";
      arrivingIn = "15-25 min";
    } else if (rawStatus === "PICKED_UP") {
      statusDisplay = "Picked Up";
      arrivingIn = "10-15 min";
    } else if (rawStatus === "OUT_FOR_DELIVERY") {
      statusDisplay = "Out for Delivery";
      arrivingIn = "8-12 min";
    }
  }

  const rawDate = o.createdAt ? new Date(o.createdAt) : new Date();
  const orderDate = `${rawDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })} • ${rawDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  const updatedDate = o.updatedAt ? new Date(o.updatedAt) : rawDate;
  const deliveredTime = `${updatedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}, ${updatedDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;

  const imageUrl =
    firstItem.image ||
    o.seller?.imageUrl ||
    "/images/places/place-biryani.png";

  const vendorName =
    o.seller?.businessName ||
    o.seller?.user?.name ||
    "Chef Anjali's Gourmet Kitchen";

  // Delivery partner details
  const dp = o.deliveryPerson;
  const partner = dp
    ? {
        name: dp.name || "Delivery Partner",
        avatar: dp.avatar || "/images/delivery-partner-rohit.jpg",
        rating: dp.rating ? String(dp.rating) : "4.9",
        deliveries: dp.deliveriesCount || 180,
        phone: dp.phone || "+91 98765 43210",
      }
    : {
        name: o.seller?.businessName ? `${o.seller.businessName} Express` : "Kitchen Valet",
        avatar: "/images/delivery-partner-rohit.jpg",
        rating: "4.8",
        deliveries: 120,
        phone: o.seller?.phone || "+91 98765 43210",
      };

  const itemTotal = parsedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || it.qty || 1), 0) || (o.totalAmount || 0);
  const deliveryFee = status === "CANCELLED" ? 0 : 35;
  const platformFee = status === "CANCELLED" ? 0 : 10;
  const totalPaid = o.totalAmount || (itemTotal + deliveryFee + platformFee);

  return {
    id: o.id,
    orderId: (o.id || "").slice(0, 8).toUpperCase(),
    vendorName,
    itemSummary,
    itemsDetail,
    price: o.totalAmount || itemTotal,
    orderDate,
    status,
    rawStatus,
    statusDisplay,
    deliveredLabel: status === "CANCELLED" ? "Order cancelled" : "Delivered",
    deliveredTime,
    arrivingIn,
    imageUrl,
    partner,
    billBreakdown: {
      itemTotal,
      deliveryFee,
      platformFee,
      totalPaid,
    },
    rawItems: parsedItems,
  };
}

export default function MyOrdersView() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState<OrderItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderItemData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      setIsSidebarOpen(false);
    }
  }, []);

  const loadOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetchApi("/api/user/orders");
      if (res.ok) {
        const data = await res.json();
        const list = data.data || data || [];
        if (Array.isArray(list)) {
          const mapped = list.map(parseOrderFromDb);
          setOrders(mapped);
          setSelectedOrder((prev) => {
            if (!prev && mapped.length > 0) {
              const ongoing = mapped.find((m) => m.status === "ONGOING");
              return ongoing || mapped[0];
            }
            if (prev) {
              const updated = mapped.find((m) => m.id === prev.id);
              return updated || prev;
            }
            return null;
          });
        }
      }
    } catch (err) {
      console.error("Failed to load user orders:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadOrders(true);
      const interval = setInterval(() => {
        loadOrders(false);
      }, 4000);
      return () => clearInterval(interval);
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
      setOrders([]);
    }
  }, [authStatus, loadOrders]);

  const ongoingCount = useMemo(() => {
    return orders.filter((o) => o.status === "ONGOING").length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeFilter === "ALL") return true;
      if (activeFilter === "ONGOING") return order.status === "ONGOING";
      if (activeFilter === "COMPLETED") return order.status === "DELIVERED";
      if (activeFilter === "CANCELLED") return order.status === "CANCELLED";
      return true;
    });
  }, [orders, activeFilter]);

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

  const handleReorder = (order: OrderItemData) => {
    if (order.rawItems && order.rawItems.length > 0) {
      order.rawItems.forEach((item) => {
        addToCart({
          id: item.id || `reorder-${item.name}`,
          foodItemId: item.foodItemId || item.id,
          name: item.name || "Delicious Meal",
          price: item.price || 199,
          quantity: item.quantity || item.qty || 1,
          sellerId: item.sellerId || "k-1",
          sellerName: order.vendorName,
          image: item.image || order.imageUrl,
        });
      });
      router.push("/user/cart");
    } else {
      router.push("/explore-desktop");
    }
  };

  const handleRateOrder = (order: OrderItemData) => {
    router.push(`/rate-app?orderId=${order.id}`);
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

          {/* Orders Cards Stack / States */}
          {loading ? (
            <div className={styles.loaderBox}>
              <Loader2 className="animate-spin" size={32} color="#F97316" />
              <p>Loading your orders...</p>
            </div>
          ) : authStatus === "unauthenticated" ? (
            <div className={styles.emptyOrdersCard}>
              <ShoppingBag size={48} color="#EA580C" />
              <h2 className={styles.emptyStateTitle}>Please log in to view your orders</h2>
              <p className={styles.emptyStateSub}>
                Sign in to track your live food deliveries, view itemized receipts, and easily reorder meals.
              </p>
              <Link href="/login?callbackUrl=/orders-desktop" className={styles.exploreBtn}>
                Log In
              </Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.emptyOrdersCard}>
              <ShoppingBag size={48} color="#EA580C" />
              <h2 className={styles.emptyStateTitle}>
                {activeFilter === "ONGOING"
                  ? "No active orders right now"
                  : activeFilter === "COMPLETED"
                  ? "No completed orders yet"
                  : activeFilter === "CANCELLED"
                  ? "No cancelled orders"
                  : "You haven't placed any orders yet"}
              </h2>
              <p className={styles.emptyStateSub}>
                Hungry? Explore top chef kitchens and delicious fresh gourmet preparations!
              </p>
              <Link href="/explore-desktop" className={styles.exploreBtn}>
                Explore Menu
              </Link>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isOngoing = order.status === "ONGOING";
              const isDelivered = order.status === "DELIVERED";
              const isCancelled = order.status === "CANCELLED";
              const isSelected = selectedOrder?.id === order.id;

              if (isOngoing) {
                const currentStep = getOrderStepIndex(order.rawStatus);

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

                    {/* 5-Stage Dynamic Status Tracker */}
                    <div className={styles.stepperContainer}>
                      <div className={styles.stepperRow}>
                        {/* 1. Confirmed */}
                        <div className={styles.trackerStep}>
                          <div
                            className={
                              currentStep >= 1
                                ? styles.stepCircleFilledDone
                                : styles.stepCircleOutlineDone
                            }
                          >
                            <CheckCircle2 size={16} strokeWidth={2.4} />
                          </div>
                          <span className={currentStep >= 0 ? styles.stepTextDone : styles.stepTextPending}>
                            Confirmed
                          </span>
                        </div>

                        <div className={currentStep >= 1 ? styles.stepperLineDone : styles.stepperLinePending} />

                        {/* 2. Preparing */}
                        <div className={styles.trackerStep}>
                          <div
                            className={
                              currentStep > 1
                                ? styles.stepCircleFilledDone
                                : currentStep === 1
                                ? styles.stepCircleActiveNav
                                : styles.stepCirclePendingHome
                            }
                          >
                            <CookingPot size={15} strokeWidth={2.4} />
                          </div>
                          <span
                            className={
                              currentStep > 1
                                ? styles.stepTextDone
                                : currentStep === 1
                                ? styles.stepTextActiveNav
                                : styles.stepTextPending
                            }
                          >
                            Preparing
                          </span>
                        </div>

                        <div className={currentStep >= 2 ? styles.stepperLineDone : styles.stepperLinePending} />

                        {/* 3. Picked Up */}
                        <div className={styles.trackerStep}>
                          <div
                            className={
                              currentStep > 2
                                ? styles.stepCircleFilledDone
                                : currentStep === 2
                                ? styles.stepCircleActiveNav
                                : styles.stepCirclePendingHome
                            }
                          >
                            <Truck size={14} strokeWidth={2.4} />
                          </div>
                          <span
                            className={
                              currentStep > 2
                                ? styles.stepTextDone
                                : currentStep === 2
                                ? styles.stepTextActiveNav
                                : styles.stepTextPending
                            }
                          >
                            Picked Up
                          </span>
                        </div>

                        <div className={currentStep >= 3 ? styles.stepperLineDone : styles.stepperLinePending} />

                        {/* 4. On the way */}
                        <div className={styles.trackerStep}>
                          <div
                            className={
                              currentStep > 3
                                ? styles.stepCircleFilledDone
                                : currentStep === 3
                                ? styles.stepCircleActiveNav
                                : styles.stepCirclePendingHome
                            }
                          >
                            <Navigation size={14} strokeWidth={2.2} />
                          </div>
                          <span
                            className={
                              currentStep > 3
                                ? styles.stepTextDone
                                : currentStep === 3
                                ? styles.stepTextActiveNav
                                : styles.stepTextPending
                            }
                          >
                            On the way
                          </span>
                        </div>

                        <div className={currentStep >= 4 ? styles.stepperLineDone : styles.stepperLinePending} />

                        {/* 5. Delivered */}
                        <div className={styles.trackerStep}>
                          <div
                            className={
                              currentStep >= 4
                                ? styles.stepCircleFilledDone
                                : styles.stepCirclePendingHome
                            }
                          >
                            <Home size={15} strokeWidth={2} />
                          </div>
                          <span className={currentStep >= 4 ? styles.stepTextDone : styles.stepTextPending}>
                            Delivered
                          </span>
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
                            handleReorder(order);
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
            })
          )}
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
                <span className={selectedOrder.status === "CANCELLED" ? styles.statusPillRed : styles.statusPillGreen}>
                  {selectedOrder.status === "ONGOING" ? `• ${selectedOrder.statusDisplay}` : `• ${selectedOrder.statusDisplay}`}
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
                    <span>Order ID: #{selectedOrder.orderId}</span>
                    <button
                      type="button"
                      className={styles.copyIconBtn}
                      onClick={() => handleCopyOrderId(selectedOrder.id)}
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

              {/* Delivery Partner Details */}
              <div className={styles.deliveryPartnerBox}>
                <div className={styles.partnerLeft}>
                  <div className={styles.partnerAvatar}>
                    <Image
                      src={selectedOrder.partner?.avatar || "/images/delivery-partner-rohit.jpg"}
                      alt="Delivery partner"
                      width={44}
                      height={44}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.partnerInfo}>
                    <h4 className={styles.partnerName}>{selectedOrder.partner?.name || "Delivery Partner"}</h4>
                    <p className={styles.partnerRole}>Assigned delivery partner</p>
                    <span className={styles.partnerRating}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "3px" }} />
                      <strong style={{ color: "#0F172A" }}>{selectedOrder.partner?.rating || "4.8"}</strong>{" "}
                      <span style={{ color: "#94A3B8" }}>({selectedOrder.partner?.deliveries || 150} deliveries)</span>
                    </span>
                  </div>
                </div>

                <div className={styles.partnerActions}>
                  <a
                    href={`tel:${selectedOrder.partner?.phone || "+919876543210"}`}
                    className={styles.partnerActionBtn}
                    title="Call Delivery Partner"
                  >
                    <Phone size={15} />
                  </a>
                  <button
                    type="button"
                    className={styles.partnerActionBtn}
                    title="Message Delivery Partner"
                    onClick={() => alert(`Connecting with ${selectedOrder.partner?.name || "delivery partner"}...`)}
                  >
                    <MessageSquare size={15} />
                  </button>
                </div>
              </div>

              {/* Live Delivery Map Graphic */}
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
                    {selectedOrder.status === "DELIVERED"
                      ? "Order has been delivered successfully"
                      : selectedOrder.status === "CANCELLED"
                      ? "This order was cancelled"
                      : `${selectedOrder.partner?.name || "Partner"} is on the way to your address`}
                  </span>
                  <span className={styles.alertSubtitle}>
                    {selectedOrder.status === "DELIVERED"
                      ? `Delivered on ${selectedOrder.deliveredTime}`
                      : selectedOrder.status === "CANCELLED"
                      ? "Contact support if you need assistance"
                      : `Expected arrival in ${selectedOrder.arrivingIn || "8-12 minutes"}`}
                  </span>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className={styles.orderItemsSection}>
                <h4 className={styles.sectionHeaderTitle}>ORDER ITEMS</h4>
                {selectedOrder.rawItems && selectedOrder.rawItems.length > 0 ? (
                  selectedOrder.rawItems.map((item, idx) => (
                    <div key={idx} className={styles.sidebarItemCard} style={{ marginBottom: "8px" }}>
                      <div className={styles.sidebarItemThumb}>
                        <Image
                          src={item.image || selectedOrder.imageUrl}
                          alt={item.name || "Food"}
                          width={44}
                          height={44}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/places/place-pizza.png";
                          }}
                        />
                      </div>
                      <div className={styles.sidebarItemTextGroup}>
                        <span className={styles.sidebarItemName}>{item.name}</span>
                        <span className={styles.sidebarItemSub}>{item.variant ? `Variant: ${item.variant}` : "Fresh gourmet preparation"}</span>
                        <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 500, marginTop: "3px" }}>
                          {item.quantity || item.qty || 1} x &nbsp;<strong style={{ color: "#0F172A", fontWeight: 700 }}>₹{item.price || 0}</strong>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
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
                      <span className={styles.sidebarItemSub}>{selectedOrder.itemsDetail || "Fresh culinary preparation"}</span>
                      <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 500, marginTop: "3px" }}>
                        1 x &nbsp;<strong style={{ color: "#0F172A", fontWeight: 700 }}>₹{selectedOrder.billBreakdown.itemTotal}</strong>
                      </span>
                    </div>
                  </div>
                )}
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
                  onClick={() => handleReorder(selectedOrder)}
                >
                  <RotateCcw size={15} />
                  <span>Reorder</span>
                </button>

                <button
                  type="button"
                  className={styles.sidebarRateBtn}
                  onClick={() => handleRateOrder(selectedOrder)}
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

