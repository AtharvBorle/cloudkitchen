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
import styles from "./OrderConfirmation.module.css";

interface ConfirmedOrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  variant?: string;
  itemType?: "VEG" | "NON_VEG" | string;
}

interface ConfirmedOrderData {
  orderId: string;
  orderTime: string;
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
}

const DEFAULT_DEMO_ORDER: ConfirmedOrderData = {
  orderId: "NCB-" + Math.floor(100000 + Math.random() * 900000),
  orderTime: "Just now",
  estimatedDelivery: "25-35 mins",
  deliveryAddress: {
    fullName: "Yash Borle",
    phoneNumber: "+91 98765 43210",
    streetAddress: "Flat 402, Sunshine Heights, Paud Road",
    city: "Kothrud, Pune",
    pincode: "411038",
  },
  paymentMethod: "UPI (Paid Online)",
  items: [
    {
      id: "demo-1",
      name: "Paneer Butter Masala & Garlic Naan",
      price: 249,
      qty: 1,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80",
      variant: "Serves 1 • Rich Gravy",
      itemType: "VEG",
    },
    {
      id: "demo-2",
      name: "Hyderabadi Dum Biryani",
      price: 299,
      qty: 1,
      image: "/images/places/place-biryani.png",
      variant: "With Raita & Salan",
      itemType: "NON_VEG",
    },
  ],
  subtotal: 548,
  discount: 109,
  deliveryFee: 30,
  taxes: 28,
  grandTotal: 497,
};

// Colors for the celebratory confetti
const CONFETTI_COLORS = ["#FF6B00", "#F97316", "#22C55E", "#EAB308", "#EC4899", "#3B82F6", "#A855F7"];

export default function OrderConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");

  const [orderData, setOrderData] = useState<ConfirmedOrderData>(DEFAULT_DEMO_ORDER);
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(2); // Step 2 = Kitchen preparing
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

  useEffect(() => {
    // Read from sessionStorage if passed from SecureCheckout
    if (typeof window !== "undefined") {
      try {
        const storedOrder = sessionStorage.getItem("latestConfirmedOrder");
        if (storedOrder) {
          const parsed = JSON.parse(storedOrder);
          if (parsed && parsed.orderId) {
            setOrderData(parsed);
          }
        } else if (queryOrderId) {
          setOrderData((prev) => ({
            ...prev,
            orderId: queryOrderId,
          }));
        }
      } catch (err) {
        console.error("Error reading confirmed order data:", err);
      }
    }

    // Auto fade confetti after 6 seconds to keep UI clean
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, [queryOrderId]);

  const handleCopyOrderId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderData.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const timelineSteps = [
    {
      id: 1,
      title: "Order Placed & Confirmed",
      time: orderData.orderTime || "Just now",
      desc: "Your order has been received and verified by Neo Cloud Bites.",
      icon: CheckCircle2,
      status: "done",
    },
    {
      id: 2,
      title: "Kitchen is Preparing Your Food",
      time: "In Progress",
      desc: "Fresh ingredients are being cooked with care & hygiene.",
      icon: ChefHat,
      status: "active",
    },
    {
      id: 3,
      title: "Delivery Partner Assignment",
      time: "Next Step",
      desc: "A nearby delivery valet will pick up your hot meal package.",
      icon: Bike,
      status: "pending",
    },
    {
      id: 4,
      title: "Delivered to Your Doorstep",
      time: `Expected in ${orderData.estimatedDelivery}`,
      desc: `Handover at ${orderData.deliveryAddress.streetAddress}, ${orderData.deliveryAddress.city}`,
      icon: MapPin,
      status: "pending",
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
            <span>3. Order Confirmed</span>
          </div>
        </section>

        {/* 2. Hero Celebration Card */}
        <section className={styles.heroCard}>
          <div className={styles.heroBackgroundGlow} />

          {/* Animated Success Checkmark Ring */}
          <div className={styles.successIconWrapper}>
            <div className={styles.pulsingRing} />
            <CheckCircle2 size={54} strokeWidth={2.4} />
          </div>

          <h1 className={styles.heroTitle}>Woohoo! Order Confirmed</h1>
          <p className={styles.heroSubtitle}>
            Your delicious meal is now cooking in the cloud kitchen. Sit back, relax, and track your food live!
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
                        <span className={styles.itemQtyText}>
                          Qty: {item.qty} {item.variant ? `• ${item.variant}` : ""}
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

                <div className={styles.pricingRow}>
                  <span>Delivery Fee</span>
                  <span>₹{orderData.deliveryFee.toLocaleString("en-IN")}</span>
                </div>

                <div className={styles.pricingRow}>
                  <span>Taxes &amp; Restaurant Charges</span>
                  <span>₹{orderData.taxes.toLocaleString("en-IN")}</span>
                </div>

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
                      {orderData.deliveryAddress.streetAddress}, {orderData.deliveryAddress.city} - {orderData.deliveryAddress.pincode}
                    </p>
                  </div>
                </div>
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
          <Link href="/explore-desktop" className={styles.exploreBtn}>
            <Compass size={18} color="#EA580C" />
            <span>Explore More Dishes</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
