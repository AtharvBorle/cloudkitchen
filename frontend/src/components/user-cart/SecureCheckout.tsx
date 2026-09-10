"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/navbar";
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

const DEFAULT_SUMMARY_ITEMS: CheckoutSummaryItem[] = [
  {
    id: "item-1",
    name: "Gourmet Brick-Oven Margherita Pizza",
    variant: "Medium | Fresh Basil & Extra Mozzarella",
    qty: 1,
    price: 449,
    image: "/images/places/place-pizza.png",
  },
  {
    id: "item-2",
    name: "Avocado & Quinoa Power Bowl",
    variant: "Organic | Tahini Lime Dressing",
    qty: 2,
    price: 598,
    image: "/images/auth/salad-bowl.jpg",
  },
];

export const SecureCheckout: React.FC<SecureCheckoutProps> = ({
  defaultLocation = "Kothrud, Pune",
  initialName = "Rahul Sharma",
  initialPhone = "+91 98765 43210",
  initialAddress = "Flat 402, Golden Crest Apartments, Kothrud",
  initialCity = "Pune",
  initialPincode = "411038",
  items = DEFAULT_SUMMARY_ITEMS,
  onPlaceOrder,
}) => {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Form States
  const [fullName, setFullName] = useState<string>(initialName);
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhone);
  const [streetAddress, setStreetAddress] = useState<string>(initialAddress);
  const [city, setCity] = useState<string>(initialCity);
  const [postalCode, setPostalCode] = useState<string>(initialPincode);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");

  // Payment Method Selection ('UPI' | 'COD')
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");

  // Navbar Controls
  const [isVegOnly, setIsVegOnly] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("EN");

  // Promo Code State
  const [promoCode, setPromoCode] = useState<string>("NEOBITE20");
  const [isPromoApplied, setIsPromoApplied] = useState<boolean>(true);

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
        image: "/images/places/place-pizza.png",
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

  const handlePlaceOrderClick = () => {
    if (!fullName.trim() || !phoneNumber.trim() || !streetAddress.trim()) {
      showToast("Please complete your delivery address details");
      return;
    }

    if (onPlaceOrder) {
      onPlaceOrder();
    } else {
      showToast(`Order Placed Successfully! Paid with ${paymentMethod === "UPI" ? "Pay Now / UPI" : "COD"}`);
      clearCart();
      setTimeout(() => {
        router.push("/dashboard/user/orders");
      }, 1200);
    }
  };

  return (
    <div className={styles.secureCheckoutWrapper}>
      {/* Shared Desktop Navbar (matching Home page navbar) */}
      <Navbar />

      {/* =========================================================
          2. CHECKOUT LAYOUT CONTAINER (1440px x 888px)
          ========================================================= */}
      <main className={styles.checkoutLayoutContainer}>
        {/* Page Header */}
        <section className={styles.pageHeaderGroup}>
          <h1 className={styles.pageTitle}>Secure Checkout</h1>
          <p className={styles.pageSubtitle}>
            Complete your gourmet order in just a few simple steps.
          </p>
        </section>

        {/* 2-Column Main Content */}
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
                        placeholder="Enter phone number"
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Street Address */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="addressInput">
                    Street Address
                  </label>
                  <div className={styles.inputWrapper}>
                    <MapPin size={18} className={styles.fieldIcon} />
                    <input
                      id="addressInput"
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="Enter street address"
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                {/* Row 3: City & Postal Code / PIN */}
                <div className={styles.formRowTwoCol}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="cityInput">
                      City
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="cityInput"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="pincodeInput">
                      Postal Code / PIN
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="pincodeInput"
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="PIN Code"
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Delivery Instructions (Optional) */}
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
                      placeholder="e.g. Leave with security guard, Ring door bell"
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

              <div className={styles.paymentOptionsRow}>
                {/* Option 1: Pay Now / UPI */}
                <button
                  type="button"
                  className={`${styles.paymentOptionBtn} ${
                    paymentMethod === "UPI"
                      ? styles.paymentOptionActive
                      : styles.paymentOptionInactive
                  }`}
                  onClick={() => setPaymentMethod("UPI")}
                >
                  <CreditCard size={18} />
                  <span>Pay Now / UPI</span>
                </button>

                {/* Option 2: COD */}
                <button
                  type="button"
                  className={`${styles.paymentOptionBtn} ${
                    paymentMethod === "COD"
                      ? styles.paymentOptionActive
                      : styles.paymentOptionInactive
                  }`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <Banknote size={18} />
                  <span>COD</span>
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <aside className={styles.sidebarRight}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              {/* Mini Item List */}
              <div className={styles.miniItemsList}>
                {items.map((item) => (
                  <div key={item.id} className={styles.miniItemRow}>
                    <div className={styles.miniItemLeft}>
                      <div className={styles.miniItemImgWrapper}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={54}
                          height={54}
                          className={styles.miniItemImg}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/images/places/place-pizza.png";
                          }}
                        />
                      </div>
                      <div className={styles.miniItemInfo}>
                        <h3 className={styles.miniItemName}>{item.name}</h3>
                        <p className={styles.miniItemDesc}>{item.variant}</p>
                        <span className={styles.miniItemQtyBadge}>
                          QTY: {item.qty}
                        </span>
                      </div>
                    </div>
                    <span className={styles.miniItemPrice}>
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className={styles.promoSection}>
                <label className={styles.promoLabel} htmlFor="promoCodeInput">
                  Promo Code
                </label>
                <div className={styles.promoInputRow}>
                  <input
                    id="promoCodeInput"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter Promo Code"
                    className={styles.promoField}
                  />
                  <button
                    type="button"
                    className={styles.appliedBtn}
                    onClick={handleApplyToggle}
                  >
                    {isPromoApplied ? "Applied" : "Apply"}
                  </button>
                </div>
              </div>

              {/* Price Breakdown Table */}
              <div className={styles.pricingTable}>
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Subtotal</span>
                  <span className={styles.pricingValue}>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className={styles.pricingRow}>
                    <span className={styles.discountValue}>Discount (20%)</span>
                    <span className={styles.discountValue}>
                      - ₹{discountAmount.toLocaleString("en-IN")}
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
                className={styles.placeOrderButton}
                onClick={handlePlaceOrderClick}
              >
                <span>Place Order • ₹{grandTotal.toLocaleString("en-IN")}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </aside>
        </div>
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
