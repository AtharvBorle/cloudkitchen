"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  BedDouble,
  Utensils,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  ExternalLink,
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

export interface RoomBookingData {
  id: string;
  bookingRef: string;
  roomId: string;
  roomTitle: string;
  hostName: string;
  city: string;
  locality: string;
  checkInDate: string;
  checkOutDate: string;
  checkInFormatted: string;
  checkOutFormatted: string;
  nights: number;
  capacity: number;
  totalAmount: number;
  status: "CONFIRMED" | "PENDING" | "CANCELLED";
  rawStatus: string;
  isPaid: boolean;
  paymentMethod: string;
  imageUrl: string;
  hostPhone?: string;
  description?: string;
  createdAt: string;
}

type MainCategory = "FOODS" | "ROOMS";
type FoodFilterType = "ALL" | "ONGOING" | "COMPLETED" | "CANCELLED";
type RoomFilterType = "ALL" | "CONFIRMED" | "PENDING" | "CANCELLED";

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
    o.seller?.restaurantName ||
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
        name: o.seller?.restaurantName ? `${o.seller.restaurantName} Express` : "Kitchen Valet",
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

function parseBookingFromDb(b: any): RoomBookingData {
  const room = b.room || {};
  const seller = room.seller || {};
  const hostUser = seller.user || {};
  const hostName = seller.restaurantName || hostUser.name || "Property Host";
  const city = hostUser.city || "Pune";
  const locality = seller.addressLocality || "Kothrud";

  let imgUrl = "/images/places/place-biryani.png";
  if (room.images) {
    try {
      const parsed = typeof room.images === "string" ? JSON.parse(room.images) : room.images;
      if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
      else if (typeof room.images === "string" && room.images.startsWith("http")) imgUrl = room.images;
    } catch {
      if (typeof room.images === "string" && room.images.startsWith("http")) imgUrl = room.images;
    }
  }

  const sDate = b.startDate ? new Date(b.startDate) : new Date();
  const eDate = b.endDate ? new Date(b.endDate) : new Date(Date.now() + 86400000);
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / msPerDay));

  const checkInFormatted = sDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const checkOutFormatted = eDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const rawStatus = (b.status || "PENDING").toUpperCase();
  let status: "CONFIRMED" | "PENDING" | "CANCELLED" = "PENDING";
  if (rawStatus === "CONFIRMED" || rawStatus === "COMPLETED") status = "CONFIRMED";
  else if (rawStatus === "CANCELLED" || rawStatus === "REJECTED") status = "CANCELLED";

  return {
    id: b.id,
    bookingRef: `BK-${(b.id || "").slice(0, 6).toUpperCase()}`,
    roomId: b.roomId || room.id,
    roomTitle: room.title || "Deluxe Living Room",
    hostName,
    city,
    locality,
    checkInDate: b.startDate,
    checkOutDate: b.endDate,
    checkInFormatted,
    checkOutFormatted,
    nights,
    capacity: room.capacity || 1,
    totalAmount: Number(b.totalAmount || (room.price ? room.price * nights : 2500)),
    status,
    rawStatus,
    isPaid: Boolean(b.isPaid),
    paymentMethod: b.paymentMethod || "COD",
    imageUrl: imgUrl,
    hostPhone: hostUser.phone || seller.phone || "+91 98765 43210",
    description: room.description || "Comfortable accommodation with modern amenities.",
    createdAt: b.createdAt,
  };
}

export default function MyOrdersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("category") === "rooms" || searchParams?.get("tab") === "rooms" ? "ROOMS" : "FOODS";

  const { data: session, status: authStatus } = useSession();
  const { addToCart } = useCart();

  const [mainCategory, setMainCategory] = useState<MainCategory>(initialTab);
  const [orders, setOrders] = useState<OrderItemData[]>([]);
  const [bookings, setBookings] = useState<RoomBookingData[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-filter states
  const [foodFilter, setFoodFilter] = useState<FoodFilterType>("ALL");
  const [roomFilter, setRoomFilter] = useState<RoomFilterType>("ALL");

  // Selected item states
  const [selectedOrder, setSelectedOrder] = useState<OrderItemData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<RoomBookingData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      setIsSidebarOpen(false);
    }
  }, []);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // 1. Fetch Food Orders
      const orderRes = await fetchApi("/api/user/orders");
      if (orderRes.ok) {
        const data = await orderRes.json();
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
            return mapped[0] || null;
          });
        }
      }

      // 2. Fetch Room Bookings
      const bookRes = await fetchApi("/api/user/bookings");
      if (bookRes.ok) {
        const bData = await bookRes.json();
        const bList = bData.data || bData || [];
        if (Array.isArray(bList)) {
          const mappedBookings = bList.map(parseBookingFromDb);
          setBookings(mappedBookings);
          setSelectedBooking((prev) => {
            if (!prev && mappedBookings.length > 0) {
              return mappedBookings[0];
            }
            if (prev) {
              const updated = mappedBookings.find((b) => b.id === prev.id);
              return updated || prev;
            }
            return mappedBookings[0] || null;
          });
        }
      }
    } catch (err) {
      console.error("Failed to load user orders & bookings:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadData(true);
      const interval = setInterval(() => {
        loadData(false);
      }, 4000);
      return () => clearInterval(interval);
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
      setOrders([]);
      setBookings([]);
    }
  }, [authStatus, loadData]);

  // Counts
  const ongoingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "ONGOING").length;
  }, [orders]);

  const activeBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING").length;
  }, [bookings]);

  // Filtered Food Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (foodFilter === "ALL") return true;
      if (foodFilter === "ONGOING") return order.status === "ONGOING";
      if (foodFilter === "COMPLETED") return order.status === "DELIVERED";
      if (foodFilter === "CANCELLED") return order.status === "CANCELLED";
      return true;
    });
  }, [orders, foodFilter]);

  // Filtered Room Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (roomFilter === "ALL") return true;
      if (roomFilter === "CONFIRMED") return booking.status === "CONFIRMED";
      if (roomFilter === "PENDING") return booking.status === "PENDING";
      if (roomFilter === "CANCELLED") return booking.status === "CANCELLED";
      return true;
    });
  }, [bookings, roomFilter]);

  const handleCopyId = (id: string) => {
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

  const handleSelectBooking = (booking: RoomBookingData) => {
    setSelectedBooking(booking);
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
        {/* Left Column: Header, Main Tabs, Sub-filters & Orders/Bookings List */}
        <div className={styles.ordersListColumn}>
          {/* Header Section */}
          <header className={styles.headerSection}>
            <h1 className={styles.pageTitle}>My Orders & Bookings</h1>
            <p className={styles.pageSubtitle}>
              Track your live deliveries, manage room reservations and view order history.
            </p>

            {/* Top-level Category Switcher: Foods vs Room Bookings */}
            <div className={styles.mainCategoryTabs} role="tablist" aria-label="Main Categories">
              <button
                type="button"
                className={`${styles.mainCategoryBtn} ${mainCategory === "FOODS" ? styles.mainCategoryBtnActive : ""}`}
                onClick={() => {
                  setMainCategory("FOODS");
                  if (!selectedOrder && orders.length > 0) setSelectedOrder(orders[0]);
                }}
              >
                <Utensils size={18} />
                <span>Foods</span>
                {ongoingOrdersCount > 0 && (
                  <span className={styles.mainCategoryBadge}>{ongoingOrdersCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`${styles.mainCategoryBtn} ${mainCategory === "ROOMS" ? styles.mainCategoryBtnActive : ""}`}
                onClick={() => {
                  setMainCategory("ROOMS");
                  if (!selectedBooking && bookings.length > 0) setSelectedBooking(bookings[0]);
                }}
              >
                <BedDouble size={18} />
                <span>Room Bookings</span>
                {activeBookingsCount > 0 && (
                  <span className={styles.mainCategoryBadge}>{activeBookingsCount}</span>
                )}
              </button>
            </div>

            {/* Sub-Filter Pills */}
            {mainCategory === "FOODS" ? (
              <div className={styles.filterPillsRow} role="tablist" aria-label="Filter Food Orders">
                <button
                  type="button"
                  className={`${styles.filterPill} ${foodFilter === "ALL" ? styles.filterPillActive : ""}`}
                  onClick={() => setFoodFilter("ALL")}
                >
                  All
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${foodFilter === "ONGOING" ? styles.filterPillActive : ""}`}
                  onClick={() => setFoodFilter("ONGOING")}
                >
                  <span>Ongoing</span>
                  {ongoingOrdersCount > 0 && <span className={styles.badgeCount}>{ongoingOrdersCount}</span>}
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${foodFilter === "COMPLETED" ? styles.filterPillActive : ""}`}
                  onClick={() => setFoodFilter("COMPLETED")}
                >
                  Completed
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${foodFilter === "CANCELLED" ? styles.filterPillActive : ""}`}
                  onClick={() => setFoodFilter("CANCELLED")}
                >
                  Cancelled
                </button>
              </div>
            ) : (
              <div className={styles.filterPillsRow} role="tablist" aria-label="Filter Room Bookings">
                <button
                  type="button"
                  className={`${styles.filterPill} ${roomFilter === "ALL" ? styles.filterPillActive : ""}`}
                  onClick={() => setRoomFilter("ALL")}
                >
                  All
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${roomFilter === "CONFIRMED" ? styles.filterPillActive : ""}`}
                  onClick={() => setRoomFilter("CONFIRMED")}
                >
                  <span>Confirmed</span>
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${roomFilter === "PENDING" ? styles.filterPillActive : ""}`}
                  onClick={() => setRoomFilter("PENDING")}
                >
                  <span>Pending</span>
                </button>

                <button
                  type="button"
                  className={`${styles.filterPill} ${roomFilter === "CANCELLED" ? styles.filterPillActive : ""}`}
                  onClick={() => setRoomFilter("CANCELLED")}
                >
                  Cancelled
                </button>
              </div>
            )}
          </header>

          {/* Cards Stack / States */}
          {loading ? (
            <div className={styles.loaderBox}>
              <Loader2 className="animate-spin" size={32} color="#F97316" />
              <p>Loading your {mainCategory === "FOODS" ? "orders" : "room bookings"}...</p>
            </div>
          ) : authStatus === "unauthenticated" ? (
            <div className={styles.emptyOrdersCard}>
              <ShoppingBag size={48} color="#EA580C" />
              <h2 className={styles.emptyStateTitle}>Please log in to view your {mainCategory === "FOODS" ? "orders" : "bookings"}</h2>
              <p className={styles.emptyStateSub}>
                Sign in to track your live orders, view itemized receipts, and manage bookings.
              </p>
              <Link href="/login?callbackUrl=/orders-desktop" className={styles.exploreBtn}>
                Log In
              </Link>
            </div>
          ) : mainCategory === "FOODS" ? (
            /* FOODS TAB CONTENT */
            filteredOrders.length === 0 ? (
              <div className={styles.emptyOrdersCard}>
                <ShoppingBag size={48} color="#EA580C" />
                <h2 className={styles.emptyStateTitle}>
                  {foodFilter === "ONGOING"
                    ? "No active food orders right now"
                    : foodFilter === "COMPLETED"
                    ? "No completed food orders yet"
                    : foodFilter === "CANCELLED"
                    ? "No cancelled orders"
                    : "You haven't placed any food orders yet"}
                </h2>
                <p className={styles.emptyStateSub}>
                  Hungry? Explore top chef kitchens and delicious fresh gourmet preparations!
                </p>
                <Link href="/explore-desktop" className={styles.exploreBtn}>
                  Explore Food Menu
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
            )
          ) : (
            /* ROOM BOOKINGS TAB CONTENT */
            filteredBookings.length === 0 ? (
              <div className={styles.emptyOrdersCard}>
                <BedDouble size={48} color="#EA580C" />
                <h2 className={styles.emptyStateTitle}>
                  {roomFilter === "CONFIRMED"
                    ? "No confirmed room bookings"
                    : roomFilter === "PENDING"
                    ? "No pending room bookings"
                    : roomFilter === "CANCELLED"
                    ? "No cancelled room bookings"
                    : "You haven't booked any rooms yet"}
                </h2>
                <p className={styles.emptyStateSub}>
                  Looking for a comfortable, budget-friendly stay? Explore verified room stays!
                </p>
                <Link href="/room-booking" className={styles.exploreBtn}>
                  Explore Rooms
                </Link>
              </div>
            ) : (
              filteredBookings.map((booking) => {
                const isSelected = selectedBooking?.id === booking.id;

                return (
                  <article
                    key={booking.id}
                    className={`${styles.roomBookingCard} ${isSelected ? styles.roomBookingCardSelected : ""}`}
                    onClick={() => handleSelectBooking(booking)}
                  >
                    {/* Top Row: Room info & Status badge */}
                    <div className={styles.roomCardTopRow}>
                      <div className={styles.pastCardTopLeft}>
                        <div className={styles.cardImageWrapper}>
                          <Image
                            src={booking.imageUrl}
                            alt={booking.roomTitle}
                            width={72}
                            height={72}
                            className={styles.cardImage}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/places/place-biryani.png";
                            }}
                          />
                        </div>
                        <div className={styles.cardMetaInfo}>
                          <h3 className={styles.vendorTitle}>{booking.roomTitle}</h3>
                          <p className={styles.itemSummaryText}>
                            <MapPin size={13} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }} />
                            {booking.locality}, {booking.city} • Host: {booking.hostName}
                          </p>
                          <span className={styles.dateSingleLine}>Ref: #{booking.bookingRef}</span>
                        </div>
                      </div>

                      <div>
                        {booking.status === "CONFIRMED" && (
                          <span className={styles.roomStatusConfirmed}>
                            <CheckCircle2 size={14} /> Confirmed
                          </span>
                        )}
                        {booking.status === "PENDING" && (
                          <span className={styles.roomStatusPending}>
                            <Clock size={14} /> Pending Host Confirmation
                          </span>
                        )}
                        {booking.status === "CANCELLED" && (
                          <span className={styles.roomStatusCancelled}>
                            <X size={14} /> Cancelled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Dates & Guests Pill */}
                    <div className={styles.roomCardMiddle}>
                      <div className={styles.roomDatesBox}>
                        <Calendar size={15} color="#EA580C" />
                        <span>{booking.checkInFormatted} &rarr; {booking.checkOutFormatted}</span>
                        <span className={styles.dotSeparator}>•</span>
                        <span>{booking.nights} {booking.nights === 1 ? "Night" : "Nights"}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.82rem", color: "#64748B", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Users size={14} /> Max {booking.capacity} {booking.capacity === 1 ? "Guest" : "Guests"}
                        </span>
                        <span className={`${styles.roomPaymentBadge} ${booking.isPaid ? styles.paymentPaid : styles.paymentPending}`}>
                          {booking.isPaid ? "Paid Online" : "Pay at Property"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row: Price and View Listing Button */}
                    <div className={styles.roomFooterRow}>
                      <div>
                        <span className={styles.roomPriceTotal}>₹{booking.totalAmount}</span>
                        <span className={styles.roomDurationLabel}>total for {booking.nights} {booking.nights === 1 ? "night" : "nights"}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Link
                          href={`/room-booking/${booking.roomId}`}
                          className={styles.viewRoomBtn}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                          <span>View Room</span>
                        </Link>
                        <div className={styles.chevronBtn}>
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )
          )}
        </div>

        {/* Right Column: Dynamic Sidebar (Foods vs Rooms) */}
        {isSidebarOpen && (
          <>
            <div
              className={styles.mobileBackdrop}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
            {mainCategory === "FOODS" && selectedOrder ? (
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
                        onClick={() => handleCopyId(selectedOrder.id)}
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
            ) : mainCategory === "ROOMS" && selectedBooking ? (
              <aside className={styles.trackingSidebar}>
                <div className={styles.mobileSheetHandle} aria-hidden="true" />

                {/* Header with status pill & close */}
                <div className={styles.sidebarHeaderRow}>
                  <span
                    className={
                      selectedBooking.status === "CONFIRMED"
                        ? styles.roomStatusConfirmed
                        : selectedBooking.status === "PENDING"
                        ? styles.roomStatusPending
                        : styles.roomStatusCancelled
                    }
                  >
                    • {selectedBooking.status === "CONFIRMED" ? "Confirmed Booking" : selectedBooking.status === "PENDING" ? "Pending Approval" : "Cancelled Booking"}
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

                {/* Room Title & Host */}
                <div className={styles.sidebarRestaurantRow}>
                  <div className={styles.sidebarRestaurantInfo}>
                    <h3 className={styles.sidebarVendorName}>{selectedBooking.roomTitle}</h3>
                    <p className={styles.sidebarItemDesc}>
                      <MapPin size={13} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "3px" }} />
                      {selectedBooking.locality}, {selectedBooking.city}
                    </p>
                    <div className={styles.orderIdRow}>
                      <span>Booking Ref: #{selectedBooking.bookingRef}</span>
                      <button
                        type="button"
                        className={styles.copyIconBtn}
                        onClick={() => handleCopyId(selectedBooking.id)}
                        title="Copy Booking Ref"
                      >
                        {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.sidebarThumbnail}>
                    <Image
                      src={selectedBooking.imageUrl}
                      alt={selectedBooking.roomTitle}
                      width={64}
                      height={64}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/places/place-biryani.png";
                      }}
                    />
                  </div>
                </div>

                {/* Host Details Box */}
                <div className={styles.deliveryPartnerBox}>
                  <div className={styles.partnerLeft}>
                    <div className={styles.partnerAvatar}>
                      <Image
                        src="/images/delivery-partner-rohit.jpg"
                        alt="Property Host"
                        width={44}
                        height={44}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div className={styles.partnerInfo}>
                      <h4 className={styles.partnerName}>{selectedBooking.hostName}</h4>
                      <p className={styles.partnerRole}>Verified Property Host</p>
                      <span className={styles.partnerRating}>
                        <ShieldCheck size={13} color="#059669" style={{ display: "inline-block", verticalAlign: "middle", marginRight: "3px" }} />
                        <strong style={{ color: "#059669" }}>Superhost Verified</strong>
                      </span>
                    </div>
                  </div>

                  <div className={styles.partnerActions}>
                    <a
                      href={`tel:${selectedBooking.hostPhone}`}
                      className={styles.partnerActionBtn}
                      title="Call Host"
                    >
                      <Phone size={15} />
                    </a>
                    <button
                      type="button"
                      className={styles.partnerActionBtn}
                      title="Message Host"
                      onClick={() => alert(`Connecting with host ${selectedBooking.hostName}...`)}
                    >
                      <MessageSquare size={15} />
                    </button>
                  </div>
                </div>

                {/* Stay Summary Grid */}
                <div className={styles.roomStayDetailsBox}>
                  <div className={styles.roomStayItem}>
                    <span className={styles.roomStayLabel}>CHECK-IN</span>
                    <span className={styles.roomStayVal}>{selectedBooking.checkInFormatted}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>From 12:00 PM</span>
                  </div>
                  <div className={styles.roomStayItem}>
                    <span className={styles.roomStayLabel}>CHECK-OUT</span>
                    <span className={styles.roomStayVal}>{selectedBooking.checkOutFormatted}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Until 11:00 AM</span>
                  </div>
                  <div className={styles.roomStayItem}>
                    <span className={styles.roomStayLabel}>DURATION</span>
                    <span className={styles.roomStayVal}>{selectedBooking.nights} {selectedBooking.nights === 1 ? "Night" : "Nights"}</span>
                  </div>
                  <div className={styles.roomStayItem}>
                    <span className={styles.roomStayLabel}>GUESTS</span>
                    <span className={styles.roomStayVal}>Up to {selectedBooking.capacity} {selectedBooking.capacity === 1 ? "Guest" : "Guests"}</span>
                  </div>
                </div>

                {/* Payment Status Alert */}
                <div className={styles.alertBox}>
                  <ShieldCheck size={18} color="#047857" style={{ flexShrink: 0 }} />
                  <div className={styles.alertText}>
                    <span className={styles.alertTitle}>
                      {selectedBooking.isPaid ? "Payment Verified" : "Pay at Property"}
                    </span>
                    <span className={styles.alertSubtitle}>
                      {selectedBooking.isPaid
                        ? "Full payment received online. Show booking ref at check-in."
                        : `Please pay ₹${selectedBooking.totalAmount} at the time of check-in (${selectedBooking.paymentMethod}).`}
                    </span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className={styles.billSummaryTable}>
                  <div className={styles.billRow}>
                    <span>Rate ({selectedBooking.nights} {selectedBooking.nights === 1 ? "night" : "nights"})</span>
                    <span>₹{selectedBooking.totalAmount}</span>
                  </div>
                  <div className={styles.billRow}>
                    <span>Taxes & Service Fees</span>
                    <span style={{ color: "#059669", fontWeight: 600 }}>Included</span>
                  </div>
                  <div className={styles.billTotalRow}>
                    <span>Total Amount</span>
                    <span>₹{selectedBooking.totalAmount}</span>
                  </div>
                </div>

                {/* Bottom CTA Buttons */}
                <div className={styles.sidebarActionsRow}>
                  <Link
                    href={`/room-booking/${selectedBooking.roomId}`}
                    className={styles.sidebarReorderBtn}
                    style={{ textDecoration: "none", textAlign: "center", justifyContent: "center" }}
                  >
                    <ExternalLink size={15} />
                    <span>View Listing</span>
                  </Link>

                  <a
                    href={`tel:${selectedBooking.hostPhone}`}
                    className={styles.sidebarRateBtn}
                    style={{ textDecoration: "none", textAlign: "center", justifyContent: "center" }}
                  >
                    <Phone size={15} />
                    <span>Contact Host</span>
                  </a>
                </div>
              </aside>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

