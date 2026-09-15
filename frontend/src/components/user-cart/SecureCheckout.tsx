"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MapPin,
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/navbar";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./SecureCheckout.module.css";

export interface CheckoutSummaryItem {
  id: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
  image: string;
}

export interface SecureCheckoutProps {
  defaultLocation?: string;
  initialName?: string;
  initialPhone?: string;
  initialAddress?: string;
  initialCity?: string;
  initialPincode?: string;
  items?: CheckoutSummaryItem[];
  onPlaceOrder?: () => void;
}

export const SecureCheckout: React.FC<SecureCheckoutProps> = ({
  defaultLocation = "Powai, Mumbai",
  initialName = "",
  initialPhone = "",
  initialAddress = "",
  initialCity = "",
  initialPincode = "",
  items = [],
  onPlaceOrder,
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Authentication redirect guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
    }
  }, [status, router]);

  // Form States
  const [fullName, setFullName] = useState<string>(initialName || session?.user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhone);
  const [streetAddress, setStreetAddress] = useState<string>(initialAddress);
  const [city, setCity] = useState<string>(initialCity);
  const [postalCode, setPostalCode] = useState<string>(initialPincode);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");

  useEffect(() => {
    if (session?.user) {
      if (!fullName && session.user.name) setFullName(session.user.name);
    }
  }, [session, fullName]);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await fetchApi("/api/user/profile");
        if (res.ok) {
          const json = await res.json();
          const user = json.data?.user || json.user || json.data || json;
          if (user) {
            if (user.name) setFullName((prev) => prev || user.name);
            if (user.phone) setPhoneNumber((prev) => prev || user.phone);
            if (user.city) setCity((prev) => prev || user.city);
            if (user.pincode) setPostalCode((prev) => prev || user.pincode);
          }
        }
      } catch (e) {
        // Silently continue
      }
    }

    if (status === "authenticated") {
      loadUserProfile();
    }
  }, [status]);

  // Payment Method Selection ('UPI' | 'COD')
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");

  // Navbar Controls
  const [isVegOnly, setIsVegOnly] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("EN");

  // Promo Code State
  const [promoCode, setPromoCode] = useState<string>("NEOBITE20");
  const [isPromoApplied, setIsPromoApplied] = useState<boolean>(true);

  // Order Placement States
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Active items derived from CartContext if present
  const checkoutItems: CheckoutSummaryItem[] = cartItems.length > 0
    ? cartItems.map((ci) => ({
        id: ci.id,
        name: ci.name,
        variant: ci.sellerName ? `From ${ci.sellerName}` : "Fresh gourmet preparation",
        qty: ci.quantity,
        price: ci.price * ci.quantity,
        image: ci.image || "/images/places/place-pizza.png",
      }))
    : items;

  // Pricing calculations
  const subtotal = checkoutItems.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = isPromoApplied && subtotal > 0 ? Math.round((subtotal * 20) / 100) : 0;
  const deliveryFee = subtotal > 0 ? 49 : 0;
  const taxesAndCharges = subtotal > 0 ? 38 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + taxesAndCharges);

  const handleApplyToggle = () => {
    if (isPromoApplied) {
      setIsPromoApplied(false);
      showToast("Promo code removed");
    } else {
      if (!promoCode.trim()) {
        showToast("Please enter a promo code");
        return;
      }
      setIsPromoApplied(true);
      showToast(`Promo code "${promoCode}" applied! (20% Off)`);
    }
  };

  const handlePlaceOrderClick = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !streetAddress.trim()) {
      showToast("Please complete your delivery address details");
      return;
    }

    if (onPlaceOrder) {
      onPlaceOrder();
      return;
    }

    setIsSubmitting(true);
    try {
      let sellerId = cartItems.find((ci) => ci.sellerId)?.sellerId;

      // If sellerId is missing or default, resolve an active seller
      if (!sellerId) {
        try {
          const expRes = await fetchApi("/api/public/explore");
          if (expRes.ok) {
            const expData = await expRes.json();
            const sellers = expData.data?.sellers || expData.sellers || [];
            if (sellers.length > 0) {
              sellerId = sellers[0].id || sellers[0].trackingId;
            }
          }
        } catch {
          // Continue
        }
      }

      const rawItems = cartItems.length > 0 ? cartItems : items;
      const orderItems = rawItems.map((ci: any) => ({
        id: ci.foodItemId || ci.id,
        name: ci.name,
        price: ci.price,
        quantity: ci.quantity || ci.qty || 1,
        image: ci.image || ci.imageUrl,
        variant: ci.variantName || ci.variant,
      }));

      const fullDeliveryAddress = `${streetAddress}, ${city} - ${postalCode}${
        deliveryInstructions ? ` (Note: ${deliveryInstructions})` : ""
      }`;

      const res = await fetchApi("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: sellerId || "seller",
          items: orderItems,
          totalAmount: grandTotal,
          deliveryAddress: fullDeliveryAddress,
          customerPhone: phoneNumber,
          paymentMethod: paymentMethod === "UPI" ? "ONLINE" : "COD",
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = resData.message || resData.error || "Failed to place order. Please try again.";
        showToast(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const createdOrder = resData.data?.order || resData.order || resData.data;
      const finalOrderId = createdOrder?.id || resData.data?.id || resData.id || ("NCR-" + Math.floor(100000 + Math.random() * 900000));

      setPlacedOrderNumber(finalOrderId);

      const confirmedOrderPayload = {
        orderId: finalOrderId,
        orderTime: "Just now",
        estimatedDelivery: "25-35 mins",
        deliveryAddress: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          streetAddress: streetAddress.trim(),
          city: city.trim() || "Kothrud, Pune",
          pincode: postalCode.trim() || "411038",
        },
        paymentMethod: paymentMethod === "UPI" ? "UPI (Paid Online)" : "Cash on Delivery",
        items: checkoutItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          variant: item.variant,
          itemType: "VEG",
        })),
        subtotal,
        discount: discountAmount,
        deliveryFee,
        taxes: taxesAndCharges,
        grandTotal,
      };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("latestConfirmedOrder", JSON.stringify(confirmedOrderPayload));
        } catch (e) {
          console.error("Failed to save confirmed order to session storage:", e);
        }
      }

      setIsOrderPlaced(true);
      clearCart();
      showToast("Order Placed Successfully!");

      setTimeout(() => {
        router.push(`/order-confirmation?orderId=${encodeURIComponent(finalOrderId)}`);
      }, 700);
    } catch (err: any) {
      console.error("Error placing order:", err);
      showToast(err?.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.secureCheckoutWrapper}>
      {/* Shared Desktop Navbar */}
      <Navbar />

      {/* =========================================================
          CHECKOUT LAYOUT CONTAINER
          ========================================================= */}
      <main className={styles.checkoutLayoutContainer}>
        {/* Stepper Progress Bar */}
        <section className={styles.stepperRow} aria-label="Checkout Progress">
          {/* Step 1: Cart */}
          <Link href="/cart" style={{ textDecoration: "none" }}>
            <div className={styles.stepPillInactive} title="Back to Cart">
              <span className={styles.inactiveDot} />
              <span>Cart</span>
            </div>
          </Link>

          <div className={styles.stepperLine} />

          {/* Step 2: Checkout */}
          <div className={!isOrderPlaced ? styles.stepPillActive : styles.stepPillInactive}>
            <span className={!isOrderPlaced ? styles.activeDot : styles.inactiveDot} />
            <span>Checkout</span>
          </div>

          <div className={styles.stepperLine} />

          {/* Step 3: Confirmation */}
          <div className={isOrderPlaced ? styles.stepPillActive : styles.stepPillInactive}>
            <span className={isOrderPlaced ? styles.activeDot : styles.inactiveDot} />
            <span>Confirmation</span>
          </div>
        </section>

        {/* Page Header & Breadcrumbs */}
        <section className={styles.pageHeaderGroup}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span>/</span>
            <Link href="/cart" className={styles.breadcrumbLink}>
              Cart
            </Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>Checkout</span>
          </div>
          <h1 className={styles.pageTitle}>
            {isOrderPlaced ? "Order Confirmed" : "Secure Checkout"}
          </h1>
          <p className={styles.pageSubtitle}>
            {isOrderPlaced
              ? "Your delicious meal has been ordered and is on its way!"
              : "Complete your gourmet order in just a few simple steps."}
          </p>
        </section>

        {isOrderPlaced ? (
          /* Step 3: Order Confirmation Card */
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "40px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 8px 28px rgba(0, 0, 0, 0.04)",
              textAlign: "center",
              maxWidth: "680px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={40} color="#10B981" />
            </div>

            <div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0" }}>
                Order Placed Successfully!
              </h2>
              <p style={{ color: "#64748B", fontSize: "0.95rem", margin: 0 }}>
                Thank you, <strong style={{ color: "#1E293B" }}>{fullName}</strong>. Your food order has been confirmed.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: "14px",
                padding: "16px 24px",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                textAlign: "left",
                fontSize: "0.88rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Order Reference:</span>
                <strong style={{ color: "#0F172A" }}>#{placedOrderNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Payment Method:</span>
                <strong style={{ color: "#0F172A" }}>{paymentMethod === "UPI" ? "Pay Now (UPI / Card)" : "Cash on Delivery (COD)"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Total Paid:</span>
                <strong style={{ color: "#FF6B00" }}>₹{grandTotal.toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Delivery Address:</span>
                <span style={{ color: "#0F172A", maxWidth: "60%", textAlign: "right" }}>{streetAddress}, {city}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: "600", marginTop: "4px" }}>
                <Clock size={16} />
                <span>Estimated Delivery: 25 - 35 mins</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "14px", width: "100%", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => router.push("/orders-desktop")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  backgroundColor: "#FF6B00",
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
                }}
              >
                <ShoppingBag size={18} />
                <span>View in My Orders</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/explore")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  backgroundColor: "#F1F5F9",
                  color: "#334155",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Explore More Food
              </button>
            </div>
          </div>
        ) : (
          /* 2-Column Main Content */
          <div className={styles.mainContent}>
            {/* Left Column: Form Cards */}
            <div className={styles.leftFormsColumn}>
              {/* Card 1: Delivery Address */}
              <section className={styles.formCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.headerIconBox}>
                    <MapPin size={20} />
                  </div>
                  <h2 className={styles.cardTitle}>Delivery Address</h2>
                </div>

                <div className={styles.formFieldsStack}>
                  {/* Row 1: Full Name & Phone Number */}
                  <div className={styles.formRowTwoCol}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="fullNameInput">
                        Full Name
                      </label>
                      <div className={styles.inputWrapper}>
                        <User size={18} className={styles.fieldIcon} />
                        <input
                          id="fullNameInput"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter full name"
                          className={styles.fieldInput}
                        />
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="phoneInput">
                        Phone Number
                      </label>
                      <div className={styles.inputWrapper}>
                        <Phone size={18} className={styles.fieldIcon} />
                        <input
                          id="phoneInput"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className={styles.fieldInput}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Complete Street Address */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="streetInput">
                      Complete Street Address
                    </label>
                    <div className={styles.inputWrapper}>
                      <MapPin size={18} className={styles.fieldIcon} />
                      <input
                        id="streetInput"
                        type="text"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="House / Flat No., Building Name, Street"
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>

                  {/* Row 3: City & Postal Code */}
                  <div className={styles.formRowTwoCol}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="cityInput">
                        City
                      </label>
                      <input
                        id="cityInput"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Pune"
                        className={styles.fieldInputNoIcon}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="postalInput">
                        Postal Code
                      </label>
                      <input
                        id="postalInput"
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="6-digit PIN"
                        className={styles.fieldInputNoIcon}
                      />
                    </div>
                  </div>

                  {/* Row 4: Delivery Instructions */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="instructionsInput">
                      Delivery Instructions (Optional)
                    </label>
                    <div className={styles.inputWrapper}>
                      <MessageSquare size={18} className={styles.fieldIcon} />
                      <input
                        id="instructionsInput"
                        type="text"
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="Leave at door, ring bell, gate passcode..."
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 2: Payment Method */}
              <section className={styles.formCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.headerIconBox}>
                    <CreditCard size={20} />
                  </div>
                  <h2 className={styles.cardTitle}>Payment Method</h2>
                </div>

                <div className={styles.paymentMethodsStack}>
                  {/* Option 1: UPI / Online Payment */}
                  <div
                    className={`${styles.paymentOptionCard} ${
                      paymentMethod === "UPI" ? styles.paymentOptionActive : ""
                    }`}
                    onClick={() => setPaymentMethod("UPI")}
                  >
                    <div className={styles.paymentRadioOuter}>
                      {paymentMethod === "UPI" && (
                        <div className={styles.paymentRadioInner} />
                      )}
                    </div>
                    <div className={styles.paymentIconBubble}>
                      <CreditCard size={20} />
                    </div>
                    <div className={styles.paymentOptionDetails}>
                      <div className={styles.paymentTitleRow}>
                        <span className={styles.paymentOptionTitle}>
                          Pay Now (Instant Delivery)
                        </span>
                        <span className={styles.recommendedBadge}>FASTEST</span>
                      </div>
                      <span className={styles.paymentOptionSubtitle}>
                        UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery */}
                  <div
                    className={`${styles.paymentOptionCard} ${
                      paymentMethod === "COD" ? styles.paymentOptionActive : ""
                    }`}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <div className={styles.paymentRadioOuter}>
                      {paymentMethod === "COD" && (
                        <div className={styles.paymentRadioInner} />
                      )}
                    </div>
                    <div className={styles.paymentIconBubble}>
                      <Banknote size={20} />
                    </div>
                    <div className={styles.paymentOptionDetails}>
                      <span className={styles.paymentOptionTitle}>
                        Cash on Delivery
                      </span>
                      <span className={styles.paymentOptionSubtitle}>
                        Pay with cash or scan delivery partner&apos;s QR code upon arrival
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary Card */}
            <aside className={styles.rightSummaryColumn}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Order Summary</h3>

                {/* Items List */}
                <div className={styles.itemsList}>
                  {checkoutItems.map((item) => (
                    <div key={item.id} className={styles.summaryItemRow}>
                      <div className={styles.itemImageWrapper}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="60px"
                          className={styles.itemImg}
                        />
                      </div>
                      <div className={styles.itemInfoCol}>
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemVariant}>{item.variant}</span>
                        <span className={styles.itemQtyPrice}>
                          Qty: {item.qty} × ₹
                          {Math.round(item.price / (item.qty || 1)).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className={styles.itemPriceCol}>
                        <span className={styles.itemTotalPrice}>
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.divider} />

                {/* Promo Code Input Row */}
                <div className={styles.promoGroup}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className={styles.promoInput}
                  />
                  <button
                    type="button"
                    className={
                      isPromoApplied
                        ? styles.promoBtnApplied
                        : styles.promoBtnApply
                    }
                    onClick={handleApplyToggle}
                  >
                    {isPromoApplied ? "Remove" : "Apply"}
                  </button>
                </div>

                <div className={styles.divider} />

                {/* Pricing Breakdown */}
                <div className={styles.pricingBreakdown}>
                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>Subtotal</span>
                    <span className={styles.pricingValue}>
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {isPromoApplied && discountAmount > 0 && (
                    <div className={styles.pricingRowDiscount}>
                      <span className={styles.discountLabel}>Promo Discount (20%)</span>
                      <span className={styles.discountValue}>
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>Delivery Fee</span>
                    <span className={styles.pricingValue}>
                      ₹{deliveryFee.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>Taxes &amp; charges</span>
                    <span className={styles.pricingValue}>
                      ₹{taxesAndCharges.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className={styles.divider} />

                  {/* Grand Total */}
                  <div className={styles.grandTotalRow}>
                    <span className={styles.grandTotalLabel}>Grand Total</span>
                    <span className={styles.grandTotalAmount}>
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={styles.placeOrderButton}
                  onClick={handlePlaceOrderClick}
                >
                  <span>
                    {isSubmitting
                      ? "Placing Order..."
                      : `Place Order • ₹${grandTotal.toLocaleString("en-IN")}`}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className={styles.toastMessage}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SecureCheckout;
