"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  CreditCard,
  ChefHat,
  Bike,
  Sparkles,
  Compass,
  ArrowRight,
  Receipt,
} from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "./OrderConfirmation.module.css";

import { fetchApi } from "@/lib/fetch-api";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";

interface ConfirmedOrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  variant?: string;
  selectedAddons?: Array<{ id?: string; name: string; price: number }>;
  basePrice?: number;
  addonsTotal?: number;
  itemType?: "VEG" | "NON_VEG" | string;
}

interface ConfirmedOrderData {
  orderId: string;
  orderTime: string;
  status: string;
  estimatedDelivery: string;
  deliveryAddress: {
    fullName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    pincode: string;
  };
  paymentMethod: string;
  items: ConfirmedOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  taxes: number;
  grandTotal: number;
  sellerName?: string;
  deliveryPerson?: {
    id?: string;
    name?: string;
    phone?: string;
    vehicleType?: string;
    vehicleNumber?: string;
  } | null;
}

const DEFAULT_DEMO_ORDER: ConfirmedOrderData = {
  orderId: "NCB-" + Math.floor(100000 + Math.random() * 900000),
  orderTime: "Just now",
  status: "PENDING",
  estimatedDelivery: "25-35 mins",
  deliveryAddress: {
    fullName: "Aman Sharma",
    phoneNumber: "+91 98765 43210",
    streetAddress: "Flat 402, Sunshine Heights, Baner Road",
    city: "Pune",
    pincode: "411045",
  },
  paymentMethod: "Online Payment (Paid Online)",
  items: [
    {
      id: "1",
      name: "Hyderabadi Dum Biryani",
      price: 260,
      qty: 1,
      image: "/images/places/place-biryani.png",
      variant: "Family Pack (Serves 2)",
      itemType: "NON_VEG",
    },
  ],
  subtotal: 260,
  discount: 0,
  deliveryFee: 0,
  taxes: 0,
  grandTotal: 260,
  sellerName: "Chef Anjali's Gourmet Kitchen",
  deliveryPerson: null,
};

// Colors for the celebratory confetti
const CONFETTI_COLORS = ["#FF6B00", "#F97316", "#22C55E", "#EAB308", "#EC4899", "#3B82F6", "#A855F7"];

export default function OrderConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");

  const [orderData, setOrderData] = useState<ConfirmedOrderData>(DEFAULT_DEMO_ORDER);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // Generate randomized confetti pieces once on mount
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.8 + Math.random() * 2).toFixed(1)}%`,
      bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${(Math.random() * 2.2).toFixed(2)}s`,
      size: `${8 + Math.floor(Math.random() * 8)}px`,
    }));
  }, []);

  const parseAndSetOrder = (data: any) => {
    if (!data) return;
    const rawOrder = data.data || data;
    if (!rawOrder || !rawOrder.id) return;

    let parsedItems: ConfirmedOrderItem[] = [];
    if (typeof rawOrder.items === "string") {
      try {
        const arr = JSON.parse(rawOrder.items);
        if (Array.isArray(arr)) {
          parsedItems = arr.map((item: any) => ({
            id: item.id || String(Math.random()),
            name: item.name || "Food Item",
            price: item.price || 0,
            basePrice: item.basePrice,
            addonsTotal: item.addonsTotal,
            selectedAddons: item.selectedAddons,
            qty: item.quantity || item.qty || 1,
            image: item.image || "/images/places/place-pizza.png",
            variant: item.variant,
            itemType: item.itemType || "VEG",
          }));
        }
      } catch (e) {
        console.error("Failed to parse order items:", e);
      }
    } else if (Array.isArray(rawOrder.items)) {
      parsedItems = rawOrder.items.map((item: any) => ({
        id: item.id || String(Math.random()),
        name: item.name || "Food Item",
        price: item.price || 0,
        basePrice: item.basePrice,
        addonsTotal: item.addonsTotal,
        selectedAddons: item.selectedAddons,
        qty: item.quantity || item.qty || 1,
        image: item.image || "/images/places/place-pizza.png",
        variant: item.variant,
        itemType: item.itemType || "VEG",
      }));
    }

    const dateStr = rawOrder.createdAt
      ? new Date(rawOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : "Just now";

    let computedItemsSubtotal = 0;
    if (parsedItems.length > 0) {
      computedItemsSubtotal = parsedItems.reduce((acc, it) => acc + (it.price * it.qty), 0);
    }
    const finalTotal = Number(rawOrder.totalAmount) || computedItemsSubtotal;
    const computedDiscount = Math.max(0, computedItemsSubtotal - finalTotal);

    setOrderData({
      orderId: rawOrder.id,
      orderTime: dateStr,
      status: (rawOrder.status || "PENDING").toUpperCase(),
      estimatedDelivery: rawOrder.status === "DELIVERED" ? "Delivered" : "25-35 mins",
      deliveryAddress: {
        fullName: rawOrder.user?.name || "Customer",
        phoneNumber: rawOrder.customerPhone || rawOrder.user?.phone || "",
        streetAddress: rawOrder.deliveryAddress || rawOrder.address || "Your Delivery Address",
        city: "",
        pincode: "",
      },
      paymentMethod: `${rawOrder.paymentMethod === "ONLINE" ? "Online Payment" : (rawOrder.paymentMethod || "COD")} ${rawOrder.isPaid ? "(Paid Online)" : "(Pay on Delivery)"}`,
      items: parsedItems,
      subtotal: computedItemsSubtotal || finalTotal,
      discount: computedDiscount,
      deliveryFee: 0,
      taxes: 0,
      grandTotal: finalTotal,
      sellerName: rawOrder.seller?.restaurantName || rawOrder.seller?.businessName,
      deliveryPerson: rawOrder.deliveryPerson,
    });
  };

  useEffect(() => {
    let isMounted = true;

    // First check sessionStorage for immediate render
    if (typeof window !== "undefined") {
      try {
        const storedOrder = sessionStorage.getItem("latestConfirmedOrder");
        if (storedOrder) {
          const parsed = JSON.parse(storedOrder);
          if (parsed && parsed.orderId) {
            setOrderData(parsed);
          }
        }
      } catch (err) {
        console.error("Error reading confirmed order data:", err);
      }
    }

    const orderIdToFetch = queryOrderId || (typeof window !== "undefined" ? (() => {
      try {
        const s = sessionStorage.getItem("latestConfirmedOrder");
        return s ? JSON.parse(s)?.orderId : null;
      } catch { return null; }
    })() : null);

    async function fetchLiveOrder() {
      if (!orderIdToFetch) return;
      try {
        const res = await fetchApi(`/api/user/orders/${orderIdToFetch}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          parseAndSetOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch live order details:", err);
      }
    }

    fetchLiveOrder();

    // Auto fade confetti after 6 seconds
    const timer = setTimeout(() => {
      if (isMounted) setShowConfetti(false);
    }, 6000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [queryOrderId]);

  // Real-time SSE stream replaces 4s auto-polling
  useRealtimeStream({
    url: "/api/user/orders/stream",
    onOrder: (payload) => {
      const orderIdToFetch = queryOrderId || (typeof window !== "undefined" ? (() => {
        try {
          const s = sessionStorage.getItem("latestConfirmedOrder");
          return s ? JSON.parse(s)?.orderId : null;
        } catch { return null; }
      })() : null);

      if (!orderIdToFetch) return;
      if (!payload.orderId || payload.orderId === orderIdToFetch || payload.orderId === orderData.orderId.replace("#NCR-", "")) {
        fetchApi(`/api/user/orders/${orderIdToFetch}`)
          .then((res) => res.ok && res.json())
          .then((data) => data && parseAndSetOrder(data))
          .catch(() => {});
      }
    },
  });

  const handleCopyOrderId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderData.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const status = (orderData.status || "PENDING").toUpperCase();
  const isPending = status === "PENDING";
  const isPreparing = status === "PREPARING";
  const isOutForDelivery = status === "OUT_FOR_DELIVERY";
  const isDelivered = status === "DELIVERED";
  const isCancelled = status === "CANCELLED";

  const timelineSteps = [
    {
      id: 1,
      title: "Order Placed",
      time: orderData.orderTime || "Just now",
      desc: "Order received and submitted to the seller.",
      icon: CheckCircle2,
      status: "done",
    },
    {
      id: 2,
      title: "Store Confirmation",
      time: isPending ? "Waiting for Store ⏳" : (isCancelled ? "Cancelled" : "Confirmed ✅"),
      desc: isPending
        ? `Awaiting confirmation from ${orderData.sellerName || "the kitchen"}.`
        : isCancelled
        ? "Order was not confirmed or cancelled."
        : `Accepted & confirmed by ${orderData.sellerName || "the kitchen"}.`,
      icon: CheckCircle2,
      status: isCancelled ? "pending" : (isPending ? "active" : "done"),
    },
    {
      id: 3,
      title: "Kitchen Preparation",
      time: isPreparing ? "In Progress 🍳" : (isOutForDelivery || isDelivered ? "Completed" : "Waiting"),
      desc: isPreparing
        ? "Fresh ingredients are currently being cooked with high hygiene standards."
        : (isOutForDelivery || isDelivered ? "Food preparation was freshly completed." : "Kitchen will begin cooking once confirmed."),
      icon: ChefHat,
      status: isCancelled ? "pending" : (isPreparing ? "active" : isOutForDelivery || isDelivered ? "done" : "pending"),
    },
    {
      id: 4,
      title: orderData.deliveryPerson?.name ? `Rider ${orderData.deliveryPerson.name}` : "Delivery Partner Assignment",
      time: isOutForDelivery ? "On The Way 🛵" : (isDelivered ? "Delivered" : (orderData.deliveryPerson ? "Assigned" : "Assigning shortly")),
      desc: orderData.deliveryPerson
        ? `${orderData.deliveryPerson.name}${orderData.deliveryPerson.vehicleType ? ` (${orderData.deliveryPerson.vehicleType}${orderData.deliveryPerson.vehicleNumber ? ` - ${orderData.deliveryPerson.vehicleNumber}` : ""})` : ""} is assigned for delivery.`
        : "A delivery partner will be assigned shortly once food preparation starts.",
      icon: Bike,
      status: isCancelled ? "pending" : (isOutForDelivery ? "active" : isDelivered ? "done" : (orderData.deliveryPerson ? "done" : "pending")),
    },
    {
      id: 5,
      title: "Delivered to Doorstep",
      time: isDelivered ? "Delivered 🎉" : `Est. ${orderData.estimatedDelivery}`,
      desc: isDelivered
        ? `Handover completed at ${orderData.deliveryAddress.streetAddress}.`
        : `Will be delivered to ${orderData.deliveryAddress.streetAddress}.`,
      icon: MapPin,
      status: isCancelled ? "pending" : (isDelivered ? "done" : "pending"),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* 0. Top Navbar */}
      <Navbar />

      {/* Celebratory Floating Confetti */}
      {showConfetti && (
        <div className={styles.confettiCanvas} aria-hidden="true">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className={styles.confettiPiece}
              style={{
                left: piece.left,
                backgroundColor: piece.bg,
                animationDelay: piece.delay,
                width: piece.size,
                height: piece.size,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content Container */}
      <main className={styles.mainContainer}>
        {/* 1. Stepper Progress Header */}
        <section className={styles.stepperRow} aria-label="Checkout Progress">
          <div className={styles.stepPillDone}>
            <Check size={14} strokeWidth={3} />
            <span>1. Cart</span>
          </div>

          <div className={styles.stepperLineDone} />

          <div className={styles.stepPillDone}>
            <Check size={14} strokeWidth={3} />
            <span>2. Checkout</span>
          </div>

          <div className={styles.stepperLineDone} />

          <div className={styles.stepPillActive}>
            <Sparkles size={15} color="#EA580C" />
            <span>
              {isCancelled
                ? "3. Order Cancelled"
                : isPending
                ? "3. Waiting for Confirmation"
                : "3. Order Confirmed"}
            </span>
          </div>
        </section>

        {/* 2. Hero Celebration Card */}
        <section className={styles.heroCard}>
          <div className={styles.heroBackgroundGlow} />

          {/* Animated Success Checkmark Ring */}
          <div className={styles.successIconWrapper}>
            <div className={styles.pulsingRing} />
            <CheckCircle2 size={54} strokeWidth={2.4} color={isCancelled ? "#EF4444" : isPending ? "#F59E0B" : "#22C55E"} />
          </div>

          <h1 className={styles.heroTitle}>
            {isCancelled
              ? "Order Cancelled"
              : isDelivered
              ? "Order Delivered!"
              : isOutForDelivery
              ? "Your Food is on the Way!"
              : isPreparing
              ? "Order Confirmed & Kitchen Preparing"
              : isPending
              ? "Waiting for Confirmation by Seller"
              : "Woohoo! Order Confirmed"}
          </h1>
          <p className={styles.heroSubtitle}>
            {isCancelled
              ? "This order was cancelled. Any online payment has been submitted for instant refund processing."
              : isDelivered
              ? "Your meal has been successfully delivered to your doorstep. Bon Appétit!"
              : isOutForDelivery
              ? orderData.deliveryPerson?.name
                ? `${orderData.deliveryPerson.name} has picked up your order and is rushing towards your address!`
                : "Our delivery valet has picked up your order and is rushing towards your address!"
              : isPreparing
              ? `The chefs at ${orderData.sellerName || "the kitchen"} have accepted your order and are cooking freshly!`
              : isPending
              ? `Your order has been placed. Waiting for ${orderData.sellerName || "the kitchen"} to confirm and start cooking.`
              : "Your order has been placed and transmitted to the kitchen. Sit back and relax!"}
          </p>

          {/* Quick Meta Pills */}
          <div className={styles.orderMetaBar}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Order ID:</span>
              <button
                type="button"
                className={styles.copyIdBtn}
                onClick={handleCopyOrderId}
                title="Click to copy order ID"
              >
                <span>#{orderData.orderId}</span>
                {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
              </button>
            </div>

            <div className={styles.metaDivider} />

            <div className={styles.metaItem}>
              <Clock size={16} color="#EA580C" />
              <span className={styles.metaLabel}>Est. Delivery:</span>
              <span className={styles.metaValue}>{orderData.estimatedDelivery}</span>
            </div>

            <div className={styles.metaDivider} />

            <div className={styles.metaItem}>
              <CreditCard size={16} color="#16A34A" />
              <span className={styles.metaLabel}>Payment:</span>
              <span className={styles.metaValue}>{orderData.paymentMethod}</span>
            </div>
          </div>
        </section>

        {/* 3. Two-Column Details Grid */}
        <div className={styles.contentGrid}>
          {/* Left Column: Live Status Timeline */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardIconBox}>
                  <ChefHat size={22} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Live Order Status</h2>
                </div>
              </div>
              <div className={styles.estimatedBadge}>
                <Clock size={14} />
                <span>On Time • {orderData.estimatedDelivery}</span>
              </div>
            </div>

            <div className={styles.timelineContainer}>
              {timelineSteps.map((step, idx) => {
                const isDone = step.status === "done";
                const isActive = step.status === "active";
                const isPending = step.status === "pending";
                const isLast = idx === timelineSteps.length - 1;

                const IconComponent = step.icon;

                return (
                  <div key={step.id} className={styles.timelineItem}>
                    <div className={styles.timelineLeft}>
                      <div
                        className={`${styles.timelineDot} ${
                          isDone
                            ? styles.timelineDotDone
                            : isActive
                            ? styles.timelineDotActive
                            : styles.timelineDotPending
                        }`}
                      >
                        <IconComponent size={20} strokeWidth={isActive ? 2.4 : 2} />
                      </div>

                      {!isLast && (
                        <div
                          className={`${styles.timelineConnector} ${
                            isDone
                              ? styles.timelineConnectorDone
                              : isActive
                              ? styles.timelineConnectorActive
                              : ""
                          }`}
                        />
                      )}
                    </div>

                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitleRow}>
                        <h3
                          className={`${styles.timelineTitle} ${
                            isActive ? styles.timelineTitleActive : ""
                          }`}
                        >
                          {step.title}
                        </h3>
                        <span className={styles.timelineTime}>{step.time}</span>
                      </div>
                      <p className={styles.timelineDesc}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Order Items & Delivery Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Items Summary Card */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <div className={styles.cardIconBox}>
                    <ShoppingBag size={20} />
                  </div>
                  <h2 className={styles.cardTitle}>Order Summary ({orderData.items.length} items)</h2>
                </div>
              </div>

              <div className={styles.itemsList}>
                {orderData.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemImageWrapper}>
                        <Image
                          src={item.image || "/images/places/place-pizza.png"}
                          alt={item.name}
                          width={52}
                          height={52}
                          className={styles.itemImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/places/place-pizza.png";
                          }}
                        />
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemNameRow}>
                          {item.itemType === "VEG" ? (
                            <div className={styles.dietSymbolVeg} title="Pure Veg">
                              <span className={styles.dietDotVeg} />
                            </div>
                          ) : (
                            <div className={styles.dietSymbolNonVeg} title="Non Veg">
                              <span className={styles.dietDotNonVeg} />
                            </div>
                          )}
                          <h4 className={styles.itemName}>{item.name}</h4>
                        </div>
                        {item.selectedAddons && item.selectedAddons.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "2px 0" }}>
                            {item.selectedAddons.map((a, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#C2410C",
                                  backgroundColor: "#FFF7ED",
                                  border: "1px solid #FFEDD5",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  fontWeight: "600",
                                }}
                              >
                                + {a.name} (₹{a.price})
                              </span>
                            ))}
                          </div>
                        ) : item.variant ? (
                          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>• {item.variant}</span>
                        ) : null}
                        <span className={styles.itemQtyText}>
                          Qty: {item.qty}
                        </span>
                      </div>
                    </div>
                    <span className={styles.itemPrice}>
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className={styles.pricingTable}>
                <div className={styles.pricingRow}>
                  <span>Item Subtotal</span>
                  <span>₹{orderData.subtotal.toLocaleString("en-IN")}</span>
                </div>

                {orderData.discount > 0 && (
                  <div className={styles.pricingRow}>
                    <span className={styles.discountValue}>Welcome Discount (Applied)</span>
                    <span className={styles.discountValue}>
                      - ₹{orderData.discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className={styles.pricingTotalRow}>
                  <div>
                    <span>Total Paid</span>
                    <span className={styles.paidBadge}>PAID</span>
                  </div>
                  <span>₹{orderData.grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </section>

            {/* Delivery Details Card */}
            <section className={styles.card}>
              <div className={styles.infoStack}>
                <div className={styles.infoBox}>
                  <div className={styles.infoIconBox}>
                    <MapPin size={18} />
                  </div>
                  <div className={styles.infoContent}>
                    <h4 className={styles.infoTitle}>Delivery Destination</h4>
                    <p className={styles.infoText}>
                      {orderData.deliveryAddress.fullName} • {orderData.deliveryAddress.phoneNumber}
                    </p>
                    <p className={styles.infoText}>
                      {orderData.deliveryAddress.streetAddress}{orderData.deliveryAddress.city ? `, ${orderData.deliveryAddress.city}` : ""}{orderData.deliveryAddress.pincode ? ` - ${orderData.deliveryAddress.pincode}` : ""}
                    </p>
                  </div>
                </div>

                {/* Delivery Partner Status Box */}
                {orderData.deliveryPerson ? (
                  <div className={styles.infoBox} style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                    <div className={styles.infoIconBox} style={{ background: "#dcfce7", color: "#16a34a" }}>
                      <Bike size={18} />
                    </div>
                    <div className={styles.infoContent} style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 className={styles.infoTitle} style={{ color: "#15803d" }}>Delivery Partner Assigned</h4>
                        {orderData.deliveryPerson.phone && (
                          <a
                            href={`tel:${orderData.deliveryPerson.phone}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#ffffff",
                              color: "#16a34a",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                      <p className={styles.infoText} style={{ fontWeight: 700, color: "#0f172a" }}>
                        {orderData.deliveryPerson.name}
                      </p>
                      <p className={styles.infoText}>
                        {orderData.deliveryPerson.vehicleType || "Delivery Vehicle"}
                        {orderData.deliveryPerson.vehicleNumber ? ` (${orderData.deliveryPerson.vehicleNumber})` : ""}
                        {orderData.deliveryPerson.phone ? ` • ${orderData.deliveryPerson.phone}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.infoBox} style={{ background: "#fffbeb", borderColor: "#fef3c7" }}>
                    <div className={styles.infoIconBox} style={{ background: "#fef3c7", color: "#d97706" }}>
                      <Clock size={18} />
                    </div>
                    <div className={styles.infoContent}>
                      <h4 className={styles.infoTitle} style={{ color: "#92400e" }}>
                        Assigning Delivery Partner Shortly
                      </h4>
                      <p className={styles.infoText} style={{ color: "#b45309" }}>
                        The kitchen is assigning a delivery partner for your order. Live contact and vehicle details will appear here once assigned.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* 4. Action CTA Buttons */}
        <section className={styles.actionButtonsRow}>
          {/* Primary Track Order Button */}
          <Link href="/orders-desktop" className={styles.trackOrderBtn}>
            <Bike size={20} />
            <span>Track Order in My Orders</span>
            <ArrowRight size={18} />
          </Link>

          {/* Secondary Continue Exploring Button */}
          <Link href="/explore" className={styles.exploreBtn}>
            <Compass size={18} color="#EA580C" />
            <span>Explore More Dishes</span>
          </Link>
        </section>
      </main>

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
}
