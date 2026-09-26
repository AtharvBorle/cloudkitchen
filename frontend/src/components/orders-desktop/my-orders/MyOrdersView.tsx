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
import { useCart, CartItem } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { ReorderModal, ReorderModalType, ReorderItemInfo } from "@/components/order-history-desktop/reorder-modal";
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
    avatar?: string;
    phone?: string;
    vehicleType?: string;
    vehicleNumber?: string;
  } | null;
  billBreakdown: {
    itemTotal: number;
    deliveryFee: number;
    platformFee: number;
    totalPaid: number;
  };
  rawItems: any[];
  review?: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt?: string;
    itemRatings?: Array<{
      id?: string;
      foodItemId: string;
      rating: number;
      comment?: string | null;
    }>;
  } | null;
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
      return 0; // Placed & Waiting for seller confirmation
    case "ACCEPTED":
    case "CONFIRMED":
    case "PREPARING":
      return 1; // Confirmed & Cooking active
    case "PICKED_UP":
      return 2; // Picked Up done
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
      statusDisplay = "Waiting for confirmation by seller";
      arrivingIn = "25-35 min";
    } else if (rawStatus === "ACCEPTED" || rawStatus === "CONFIRMED") {
      statusDisplay = "Order Confirmed";
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

  // Delivery partner details - strictly real data, no fake fallbacks
  const dp = o.deliveryPerson;
  const partner = dp
    ? {
        name: dp.name || "Delivery Partner",
        avatar: dp.avatar || "",
        phone: dp.phone || "",
        vehicleType: dp.vehicleType || "",
        vehicleNumber: dp.vehicleNumber || "",
      }
    : null;

  const itemTotal = parsedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || it.qty || 1), 0) || (o.totalAmount || 0);
  const deliveryFee = 0;
  const platformFee = 0;
  const totalPaid = o.totalAmount || itemTotal;

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
    review: o.review || null,
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
  const { cartItems, addToCart, addMultipleToCart } = useCart();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: ReorderModalType;
    sellerName?: string;
    sellerId?: string;
    currentCartSellerName?: string;
    availableItems?: ReorderItemInfo[];
    unavailableItems?: ReorderItemInfo[];
    rawAvailableItems?: CartItem[];
    errorMessage?: string;
  }>({
    isOpen: false,
    type: "ERROR",
  });

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
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
      setOrders([]);
      setBookings([]);
    }
  }, [authStatus, loadData]);

  // Real-time SSE stream replaces 4s auto-polling
  useRealtimeStream({
    url: "/api/user/orders/stream",
    enabled: authStatus === "authenticated",
    onOrder: () => {
      loadData(false);
    },
  });

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

  const handleReorder = async (order: OrderItemData) => {
    try {
      const res = await fetchApi("/api/user/orders/validate-reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const json = await res.json();
      const data = json.data !== undefined ? json.data : json;

      if (!res.ok || json.success === false) {
        setModalState({
          isOpen: true,
          type: "ERROR",
          errorMessage: data?.message || json?.error || "Unable to validate order for reorder. Please try again.",
        });
        return;
      }

      // Check 1: Kitchen offline
      if (data.sellerOnline === false) {
        setModalState({
          isOpen: true,
          type: "OFFLINE",
          sellerName: data.sellerName || order.vendorName,
          sellerId: data.sellerId,
        });
        return;
      }

      // Check 2: No items available
      if (!data.availableItems || data.availableItems.length === 0) {
        setModalState({
          isOpen: true,
          type: "ALL_UNAVAILABLE",
          sellerName: data.sellerName || order.vendorName,
          sellerId: data.sellerId,
          unavailableItems: data.unavailableItems || [],
        });
        return;
      }

      // Check 3: Partial items available
      if (data.unavailableItems && data.unavailableItems.length > 0) {
        setModalState({
          isOpen: true,
          type: "PARTIAL",
          sellerName: data.sellerName || order.vendorName,
          sellerId: data.sellerId,
          availableItems: data.availableItems,
          unavailableItems: data.unavailableItems,
          rawAvailableItems: data.availableItems,
        });
        return;
      }

      // Check 4: Full reorder available - check for cart kitchen conflict
      const targetSellerId = data.sellerId;
      if (cartItems.length > 0 && cartItems[0].sellerId && targetSellerId && cartItems[0].sellerId !== targetSellerId) {
        setModalState({
          isOpen: true,
          type: "CART_CONFLICT",
          sellerName: data.sellerName || order.vendorName,
          sellerId: data.sellerId,
          currentCartSellerName: cartItems[0].sellerName || "another kitchen",
          availableItems: data.availableItems,
          rawAvailableItems: data.availableItems,
        });
        return;
      }

      // Everything is clear: Add items to cart and redirect to /cart
      addMultipleToCart(data.availableItems, false);
      router.push("/cart");
    } catch (err: any) {
      console.error("Reorder error:", err);
      // Fallback
      if (order.rawItems && order.rawItems.length > 0) {
        addMultipleToCart(
          order.rawItems.map((item) => ({
            id: item.id || `reorder-${item.name}`,
            foodItemId: item.foodItemId || item.id,
            name: item.name || "Delicious Meal",
            price: item.price || 199,
            quantity: item.quantity || item.qty || 1,
            sellerId: item.sellerId || "k-1",
            sellerName: order.vendorName,
            image: item.imageUrl || item.image || order.imageUrl,
            imageUrl: item.imageUrl || item.image || order.imageUrl,
          })),
          false
        );
        router.push("/cart");
      } else {
        router.push("/explore-desktop");
      }
    }
  };

  const handleConfirmClearAndReorder = () => {
    if (modalState.rawAvailableItems && modalState.rawAvailableItems.length > 0) {
      addMultipleToCart(modalState.rawAvailableItems, true);
      setModalState((prev) => ({ ...prev, isOpen: false }));
      router.push("/cart");
    }
  };

  const handleConfirmPartialReorder = () => {
    if (!modalState.rawAvailableItems || modalState.rawAvailableItems.length === 0) return;

    const targetSellerId = modalState.sellerId;
    if (cartItems.length > 0 && cartItems[0].sellerId && targetSellerId && cartItems[0].sellerId !== targetSellerId) {
      setModalState((prev) => ({
        ...prev,
        type: "CART_CONFLICT",
        currentCartSellerName: cartItems[0].sellerName || "another kitchen",
      }));
      return;
    }

    addMultipleToCart(modalState.rawAvailableItems, false);
    setModalState((prev) => ({ ...prev, isOpen: false }));
    router.push("/cart");
  };

  const handleExploreOtherKitchens = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    router.push("/explore-desktop");
  };

  // Rating / Review Modal State
  const [ratingModalOrder, setRatingModalOrder] = useState<OrderItemData | null>(null);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverOverallRating, setHoverOverallRating] = useState<number>(0);
  const [overallComment, setOverallComment] = useState<string>("");
  const [itemRatings, setItemRatings] = useState<
    Record<string, { name: string; rating: number; hoverRating?: number; comment: string; image?: string; qty?: number }>
  >({});
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>("");
  const [existingReview, setExistingReview] = useState<any | null>(null);
  // Order Cancellation States
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderItemData | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCancelOrder = async (order: OrderItemData) => {
    setCancellingOrderId(order.id);
    setCancelError(null);
    try {
      const res = await fetchApi(`/api/user/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        setCancelError(json.message || json.error || "Failed to cancel order. Please try again.");
        return;
      }

      // Update state locally
      const updatedCancelledOrder: OrderItemData = {
        ...order,
        status: "CANCELLED",
        rawStatus: "CANCELLED",
        statusDisplay: "Cancelled",
        deliveredLabel: "Order cancelled",
        deliveredTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        arrivingIn: "Cancelled",
      };

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedCancelledOrder : o))
      );

      if (selectedOrder?.id === order.id) {
        setSelectedOrder(updatedCancelledOrder);
      }

      setCancelModalOrder(null);
      showToast("Your order has been cancelled successfully.");
    } catch (err: any) {
      console.error("Cancel order error:", err);
      setCancelError(err?.message || "An error occurred while cancelling the order.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleExploreSellerMenu = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.sellerId) {
      router.push(`/restaurant/${modalState.sellerId}`);
    } else {
      router.push("/explore-desktop");
    }
  };

  const handleRateOrder = async (order: OrderItemData) => {
    if (order.status !== "DELIVERED") {
      showToast("You can rate your order once it has been delivered.");
      return;
    }

    setRatingModalOrder(order);
    setOverallRating(order.review?.rating || 5);
    setHoverOverallRating(0);
    setOverallComment(order.review?.comment || "");
    setReviewError("");
    setIsReviewSuccess(false);

    // Populate item ratings
    const initialItemRatings: Record<string, { name: string; rating: number; hoverRating?: number; comment: string; image?: string; qty?: number }> = {};
    const rawItems = order.rawItems || [];
    rawItems.forEach((item: any) => {
      const itemId = item.foodItemId || item.id;
      if (itemId) {
        const existingItem = order.review?.itemRatings?.find((ir: any) => ir.foodItemId === itemId);
        initialItemRatings[itemId] = {
          name: item.name || "Food Item",
          rating: existingItem?.rating || 5,
          hoverRating: 0,
          comment: existingItem?.comment || "",
          image: item.imageUrl || item.image || "/images/places/place-pizza.png",
          qty: item.quantity || item.qty || 1,
        };
      }
    });
    setItemRatings(initialItemRatings);

    if (order.review) {
      setExistingReview(order.review);
    } else {
      setExistingReview(null);
      // Fetch latest review from backend if available
      try {
        const res = await fetchApi(`/api/user/orders/${order.id}/review`);
        if (res.ok) {
          const json = await res.json();
          const found = json.data?.review || json.review;
          if (found) {
            setExistingReview(found);
            setOverallRating(found.rating || 5);
            setOverallComment(found.comment || "");
            if (found.itemRatings && Array.isArray(found.itemRatings)) {
              setItemRatings((prev) => {
                const next = { ...prev };
                found.itemRatings.forEach((ir: any) => {
                  if (next[ir.foodItemId]) {
                    next[ir.foodItemId].rating = ir.rating;
                    next[ir.foodItemId].comment = ir.comment || "";
                  }
                });
                return next;
              });
            }
          }
        }
      } catch {
        // Silently continue
      }
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalOrder) return;

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      const itemsPayload = Object.keys(itemRatings).map((foodItemId) => ({
        foodItemId,
        rating: itemRatings[foodItemId].rating,
        comment: itemRatings[foodItemId].comment || null,
      }));

      const res = await fetchApi(`/api/user/orders/${ratingModalOrder.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: overallRating,
          comment: overallComment,
          itemRatings: itemsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.message || data.error || "Failed to submit review.");
        setIsSubmittingReview(false);
        return;
      }

      const savedReview = data.data?.review || data.review || data.data;

      // Update local orders list state
      setOrders((currentOrders) =>
        currentOrders.map((o) =>
          o.id === ratingModalOrder.id ? { ...o, review: savedReview } : o
        )
      );

      if (selectedOrder && selectedOrder.id === ratingModalOrder.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, review: savedReview } : null));
      }

      setExistingReview(savedReview);
      setIsReviewSuccess(true);
      showToast(`Thank you! Review for order #${ratingModalOrder.orderId} submitted.`);
      setTimeout(() => {
        setRatingModalOrder(null);
      }, 1600);
    } catch (err: any) {
      setReviewError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
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
                          <span
                            className={styles.statusPillGreen}
                            style={
                              order.rawStatus === "PENDING" || order.rawStatus === "PLACED"
                                ? { background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }
                                : {}
                            }
                          >
                            {order.statusDisplay}
                          </span>
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
                          {/* 1. Placed / Confirmed */}
                          <div className={styles.trackerStep}>
                            <div
                              className={
                                currentStep >= 1
                                  ? styles.stepCircleFilledDone
                                  : styles.stepCircleActiveNav
                              }
                            >
                              <CheckCircle2 size={16} strokeWidth={2.4} />
                            </div>
                            <span className={currentStep >= 1 ? styles.stepTextDone : styles.stepTextActiveNav}>
                              {currentStep >= 1 ? "Confirmed" : "Placed"}
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

                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          {(order.rawStatus === "PENDING" || order.rawStatus === "PLACED") && (
                            <button
                              type="button"
                              className={styles.cancelOrderBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelModalOrder(order);
                                setCancelError(null);
                              }}
                            >
                              <X size={14} strokeWidth={2.5} />
                              <span>Cancel Order</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.trackLiveBtn}
                            style={{ marginBottom: (order.rawStatus === "PENDING" || order.rawStatus === "PLACED") ? "14px" : undefined }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOrder(order);
                            }}
                          >
                            <Navigation size={14} strokeWidth={2.5} />
                            <span>Track Live</span>
                          </button>
                        </div>
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
                              handleRateOrder(order);
                            }}
                            style={
                              order.review
                                ? {
                                    backgroundColor: "#ECFDF5",
                                    color: "#059669",
                                    borderColor: "#A7F3D0",
                                  }
                                : {
                                    backgroundColor: "#FFF7ED",
                                    color: "#EA580C",
                                    borderColor: "#FFEDD5",
                                  }
                            }
                          >
                            <Star
                              size={14}
                              fill={order.review ? "#059669" : "none"}
                              color={order.review ? "#059669" : "#EA580C"}
                            />
                            <span>
                              {order.review
                                ? `Rated ${order.review.rating}★`
                                : "Rate Order"}
                            </span>
                          </button>
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
                  <span
                    className={
                      selectedOrder.status === "CANCELLED"
                        ? styles.statusPillRed
                        : selectedOrder.rawStatus === "PENDING" || selectedOrder.rawStatus === "PLACED"
                        ? styles.statusPillYellow || styles.statusPillGray
                        : styles.statusPillGreen
                    }
                    style={
                      selectedOrder.rawStatus === "PENDING" || selectedOrder.rawStatus === "PLACED"
                        ? { background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }
                        : {}
                    }
                  >
                    • {selectedOrder.statusDisplay}
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

                {/* Delivery Partner Details - Real DB Data or Informative Unassigned state */}
                {selectedOrder.partner ? (
                  <div className={styles.deliveryPartnerBox} style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <div className={styles.partnerLeft}>
                      <div className={styles.partnerAvatar} style={{ background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px" }}>
                        <Truck size={22} color="#16A34A" />
                      </div>
                      <div className={styles.partnerInfo}>
                        <h4 className={styles.partnerName} style={{ color: "#15803D" }}>{selectedOrder.partner.name}</h4>
                        <p className={styles.partnerRole} style={{ color: "#166534" }}>Assigned Delivery Partner</p>
                        {(selectedOrder.partner.vehicleType || selectedOrder.partner.vehicleNumber) && (
                          <span style={{ fontSize: "0.8rem", color: "#475569", display: "block", marginTop: "2px", fontWeight: 500 }}>
                            {selectedOrder.partner.vehicleType || "Delivery Vehicle"}
                            {selectedOrder.partner.vehicleNumber ? ` (${selectedOrder.partner.vehicleNumber})` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedOrder.partner.phone && (
                      <div className={styles.partnerActions}>
                        <a
                          href={`tel:${selectedOrder.partner.phone}`}
                          className={styles.partnerActionBtn}
                          style={{ background: "#FFFFFF", border: "1px solid #BBF7D0", color: "#16A34A" }}
                          title={`Call ${selectedOrder.partner.name}`}
                        >
                          <Phone size={15} />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.deliveryPartnerBox} style={{ background: "#FFFBEB", border: "1px solid #FEF3C7" }}>
                    <div className={styles.partnerLeft}>
                      <div className={styles.partnerAvatar} style={{ background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px" }}>
                        <Clock size={20} color="#D97706" />
                      </div>
                      <div className={styles.partnerInfo}>
                        <h4 className={styles.partnerName} style={{ color: "#92400E", fontSize: "0.92rem" }}>
                          Assigning Delivery Partner Shortly
                        </h4>
                        <p className={styles.partnerRole} style={{ color: "#B45309" }}>
                          The kitchen will assign a rider once food is being prepared.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                        : selectedOrder.rawStatus === "PENDING" || selectedOrder.rawStatus === "PLACED"
                        ? "Waiting for confirmation by seller"
                        : selectedOrder.partner?.name
                        ? `${selectedOrder.partner.name} is assigned to deliver your order`
                        : `${selectedOrder.statusDisplay} • Kitchen is preparing fresh`}
                    </span>
                    <span className={styles.alertSubtitle}>
                      {selectedOrder.status === "DELIVERED"
                        ? `Delivered on ${selectedOrder.deliveredTime}`
                        : selectedOrder.status === "CANCELLED"
                        ? "Contact support if you need assistance"
                        : selectedOrder.rawStatus === "PENDING" || selectedOrder.rawStatus === "PLACED"
                        ? "The seller will review and accept your order shortly"
                        : `Expected arrival in ${selectedOrder.arrivingIn || "15-25 minutes"}`}
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
                          {item.selectedAddons && item.selectedAddons.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "2px 0" }}>
                              {item.selectedAddons.map((a: any, aIdx: number) => (
                                <span
                                  key={aIdx}
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#C2410C",
                                    backgroundColor: "#FFF7ED",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                  }}
                                >
                                  + {a.name} (₹{a.price})
                                </span>
                              ))}
                            </div>
                          ) : item.variant ? (
                            <span className={styles.sidebarItemSub}>Variant: {item.variant}</span>
                          ) : (
                            <span className={styles.sidebarItemSub}>Fresh gourmet preparation</span>
                          )}
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
                  <div className={styles.billTotalRow}>
                    <span>Total Paid</span>
                    <span>₹{selectedOrder.billBreakdown.totalPaid}</span>
                  </div>
                </div>

                {/* Bottom CTA Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(selectedOrder.rawStatus === "PENDING" || selectedOrder.rawStatus === "PLACED") && (
                    <button
                      type="button"
                      className={styles.sidebarCancelBtn}
                      onClick={() => {
                        setCancelModalOrder(selectedOrder);
                        setCancelError(null);
                      }}
                    >
                      <X size={15} />
                      <span>Cancel Order</span>
                    </button>
                  )}

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
                      style={
                        selectedOrder.review
                          ? {
                              backgroundColor: "#ECFDF5",
                              color: "#059669",
                              borderColor: "#A7F3D0",
                            }
                          : undefined
                      }
                    >
                      <Star
                        size={15}
                        fill={selectedOrder.review ? "#059669" : "none"}
                      />
                      <span>
                        {selectedOrder.review
                          ? `Rated ${selectedOrder.review.rating}★`
                          : "Rate Order"}
                      </span>
                    </button>
                  </div>
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

      {/* Reorder Modal for Alerts, Out-of-Stock, Offline & Cart Conflict Handling */}
      <ReorderModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        sellerName={modalState.sellerName}
        sellerId={modalState.sellerId}
        currentCartSellerName={modalState.currentCartSellerName}
        availableItems={modalState.availableItems}
        unavailableItems={modalState.unavailableItems}
        errorMessage={modalState.errorMessage}
        onConfirmClearAndReorder={handleConfirmClearAndReorder}
        onConfirmPartialReorder={handleConfirmPartialReorder}
        onExploreOtherKitchens={handleExploreOtherKitchens}
        onExploreSellerMenu={handleExploreSellerMenu}
      />

      {/* Order Rating & Review Modal */}
      {ratingModalOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setRatingModalOrder(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    backgroundColor: "#FFF7ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#EA580C",
                  }}
                >
                  <Star size={22} fill="#EA580C" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}>
                    {existingReview ? "Order Rating & Feedback" : "Rate Your Order"}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748B" }}>
                    Order #{ratingModalOrder.orderId} • {ratingModalOrder.vendorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRatingModalOrder(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: "4px",
                  borderRadius: "8px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Message */}
            {reviewError && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#991B1B",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                }}
              >
                {reviewError}
              </div>
            )}

            {/* Success Banner */}
            {isReviewSuccess && (
              <div
                style={{
                  backgroundColor: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  color: "#065F46",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={18} color="#059669" />
                <span>Thank you! Your feedback has been submitted successfully.</span>
              </div>
            )}

            {/* Already Reviewed Banner */}
            {existingReview && !isReviewSuccess && (
              <div
                style={{
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="#16A34A" />
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#166534" }}>
                    You have already reviewed this order
                  </span>
                </div>
                <span style={{ fontSize: "0.78rem", color: "#15803D", fontWeight: 700 }}>
                  Rated {existingReview.rating}★
                </span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Overall Experience Section */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "14px",
                  padding: "16px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: "#1E293B", marginBottom: "8px" }}>
                  Overall Order Experience
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const activeRating = hoverOverallRating || overallRating;
                    const isFilled = starVal <= activeRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        disabled={!!existingReview}
                        onClick={() => setOverallRating(starVal)}
                        onMouseEnter={() => !existingReview && setHoverOverallRating(starVal)}
                        onMouseLeave={() => !existingReview && setHoverOverallRating(0)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: existingReview ? "default" : "pointer",
                          padding: "2px",
                          transition: "transform 0.15s ease",
                          transform: !existingReview && (hoverOverallRating === starVal || overallRating === starVal) ? "scale(1.15)" : "none",
                        }}
                      >
                        <Star
                          size={32}
                          fill={isFilled ? "#F59E0B" : "none"}
                          color={isFilled ? "#F59E0B" : "#CBD5E1"}
                          strokeWidth={2}
                        />
                      </button>
                    );
                  })}
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color:
                        overallRating >= 4
                          ? "#059669"
                          : overallRating === 3
                          ? "#D97706"
                          : "#DC2626",
                    }}
                  >
                    {overallRating === 5
                      ? "Excellent! 🌟"
                      : overallRating === 4
                      ? "Very Good 😊"
                      : overallRating === 3
                      ? "Good 🙂"
                      : overallRating === 2
                      ? "Fair 😐"
                      : "Poor 😞"}
                  </span>
                </div>

                <textarea
                  disabled={!!existingReview}
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  placeholder="Share your thoughts on the food taste, packaging quality, and delivery experience (optional)..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                    resize: "none",
                    boxSizing: "border-box",
                    backgroundColor: existingReview ? "#F1F5F9" : "#FFFFFF",
                    color: "#1E293B",
                    outline: "none",
                  }}
                />
              </div>

              {/* Individual Dishes Section */}
              {Object.keys(itemRatings).length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.88rem", fontWeight: 700, color: "#334155" }}>
                    Rate Ordered Dishes
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                    {Object.keys(itemRatings).map((itemId) => {
                      const item = itemRatings[itemId];
                      return (
                        <div
                          key={itemId}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            padding: "10px 12px",
                            backgroundColor: "#FAFAFA",
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0F172A" }}>
                              {item.name} {item.qty && item.qty > 1 ? `(x${item.qty})` : ""}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                              {[1, 2, 3, 4, 5].map((s) => {
                                const activeItemRating = item.hoverRating || item.rating;
                                const isFilled = s <= activeItemRating;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    disabled={!!existingReview}
                                    onClick={() =>
                                      setItemRatings((prev) => ({
                                        ...prev,
                                        [itemId]: { ...prev[itemId], rating: s },
                                      }))
                                    }
                                    onMouseEnter={() =>
                                      !existingReview &&
                                      setItemRatings((prev) => ({
                                        ...prev,
                                        [itemId]: { ...prev[itemId], hoverRating: s },
                                      }))
                                    }
                                    onMouseLeave={() =>
                                      !existingReview &&
                                      setItemRatings((prev) => ({
                                        ...prev,
                                        [itemId]: { ...prev[itemId], hoverRating: 0 },
                                      }))
                                    }
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: existingReview ? "default" : "pointer",
                                      padding: "1px",
                                    }}
                                  >
                                    <Star
                                      size={18}
                                      fill={isFilled ? "#F59E0B" : "none"}
                                      color={isFilled ? "#F59E0B" : "#CBD5E1"}
                                    />
                                  </button>
                                );
                              })}
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#F59E0B", marginLeft: "4px" }}>
                                {item.rating}/5
                              </span>
                            </div>
                          </div>

                          <input
                            type="text"
                            disabled={!!existingReview}
                            value={item.comment}
                            onChange={(e) =>
                              setItemRatings((prev) => ({
                                ...prev,
                                [itemId]: { ...prev[itemId], comment: e.target.value },
                              }))
                            }
                            placeholder={`Comment for ${item.name} (optional)...`}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid #CBD5E1",
                              fontSize: "0.8rem",
                              fontFamily: "inherit",
                              boxSizing: "border-box",
                              backgroundColor: existingReview ? "#F1F5F9" : "#FFFFFF",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setRatingModalOrder(null)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {existingReview ? "Close" : "Cancel"}
                </button>

                {!existingReview && (
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    style={{
                      flex: 1.5,
                      padding: "10px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#FF6B00",
                      border: "none",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: isSubmittingReview ? "not-allowed" : "pointer",
                      opacity: isSubmittingReview ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Star size={16} fill="#FFFFFF" />
                        <span>Submit Rating</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <div
          className={styles.cancelModalOverlay}
          onClick={() => {
            if (!cancellingOrderId) setCancelModalOrder(null);
          }}
        >
          <div
            className={styles.cancelModalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.cancelModalHeader}>
              <div className={styles.cancelModalTitleRow}>
                <div className={styles.cancelIconBadge}>
                  <X size={20} />
                </div>
                <h3 className={styles.cancelModalHeading}>Cancel Food Order?</h3>
              </div>
              <button
                type="button"
                className={styles.closeSidebarBtn}
                onClick={() => {
                  if (!cancellingOrderId) setCancelModalOrder(null);
                }}
                disabled={Boolean(cancellingOrderId)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.cancelModalOrderSummary}>
              <div className={styles.cancelModalVendor}>{cancelModalOrder.vendorName}</div>
              <div className={styles.cancelModalItems}>{cancelModalOrder.itemSummary}</div>
              <div className={styles.cancelModalAmount}>
                Order ID: #{cancelModalOrder.orderId} • Total: ₹{cancelModalOrder.price}
              </div>
            </div>

            <p className={styles.cancelModalNote}>
              Are you sure you want to cancel this order? Since the restaurant has not started preparing your food yet, your order can be cancelled and any amount paid will be refunded.
            </p>

            {cancelError && (
              <div className={styles.cancelModalError}>
                {cancelError}
              </div>
            )}

            <div className={styles.cancelModalActions}>
              <button
                type="button"
                className={styles.keepOrderBtn}
                onClick={() => setCancelModalOrder(null)}
                disabled={Boolean(cancellingOrderId)}
              >
                Keep Order
              </button>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={() => handleCancelOrder(cancelModalOrder)}
                disabled={Boolean(cancellingOrderId)}
              >
                {cancellingOrderId ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <X size={16} />
                    <span>Yes, Cancel Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Message */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
            fontWeight: 600,
            zIndex: 10000,
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}


